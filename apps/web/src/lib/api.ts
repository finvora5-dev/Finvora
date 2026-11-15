"use client";
// FinvoraApi: the only way screens reach data (build plan §2). MockFinvoraApi uses
// sample data, localStorage and a scripted AI. Phase 2 swaps in an HTTP implementation.
import type { Article, Lesson, World } from "@finvora/engine";
import { lagosDay } from "@finvora/engine";
import {
  answerQuestion, canAsk, recordAsk, entitlements, effectivePlan, executeTrade, priceSeries, createOrder, applyCheck, retry as retryOrder,
  addPeriod, canStartPurchase, newAccount, valuePortfolio, search as searchItems, suggest, CONFIG,
  type AskContext, type AskResponse, type Entitlements, type TradeRequest, type TradeResult, type Order, type BillingPeriod, type SearchItem, type Valuation,
} from "@finvora/domain";
import { ARTICLES, LESSONS, WORLDS, COMPANIES, SIM_COMPANIES, SCRIPTED_ANSWERS, DAILY_QUESTION, TOPICS, DEMO_USERS, DEMO_ORDERS, SEED_FEEDBACK, SEED_ASK_REVIEW, type Company, type SimCompany } from "@finvora/sample-data";
import { read, update, write, newId, resetAll, SIM_START_DAY, type Session } from "./store";

export type { Company, SimCompany };

export class ApiError extends Error {
  constructor(public code: "network" | "limit" | "unknown", message: string) { super(message); }
}

const SERIES_DAYS = 600;
const seriesCache = new Map<string, number[]>();
function series(ticker: string): number[] {
  let s = seriesCache.get(ticker);
  if (!s) {
    const sim = SIM_COMPANIES.find((c) => c.ticker === ticker);
    const co = COMPANIES.find((c) => c.ticker === ticker);
    s = priceSeries(ticker, sim?.basePriceKobo ?? co?.demoBasePriceKobo ?? 100_00, SERIES_DAYS, sim?.volatility ?? 0.016);
    seriesCache.set(ticker, s);
  }
  return s;
}

function delay(): Promise<void> {
  const dev = read("dev");
  const ms = dev.latency ? 200 + Math.floor(Math.random() * 600) : 0;
  return new Promise((r) => setTimeout(r, ms));
}
async function call<T>(fn: () => T): Promise<T> {
  await delay();
  const dev = read("dev");
  if (dev.failNextRequest) {
    write("dev", { ...dev, failNextRequest: false });
    throw new ApiError("network", "We couldn't reach Finvora. Check your connection and try again.");
  }
  return fn();
}

export function today(): string { return lagosDay(new Date().toISOString()); }

function audit(area: string, change: string) {
  const who = read("session")?.email ?? "unknown";
  update("admin", (a) => ({ ...a, audit: [{ id: newId("au"), when: new Date().toISOString(), who, area, change }, ...a.audit] }));
}

export const api = {
  // Content (static sample data)
  worlds: (): World[] => WORLDS,
  lessons: (): Lesson[] => LESSONS,
  lesson: (id: string) => LESSONS.find((l) => l.id === id),
  lessonOrder: (): string[] => WORLDS.filter((w) => w.available).flatMap((w) => [...w.lessonIds, ...(w.bossId ? [w.bossId] : [])]),
  daily: () => DAILY_QUESTION,
  articles: (): Article[] => ARTICLES,
  article: (slug: string) => ARTICLES.find((a) => a.slug === slug),
  topics: () => TOPICS,
  companies: (): Company[] => COMPANIES,
  company: (t: string) => COMPANIES.find((c) => c.ticker === t),
  simCompanies: (): SimCompany[] => SIM_COMPANIES,
  simCompany: (t: string) => SIM_COMPANIES.find((c) => c.ticker === t),

  // Demo prices (synthetic, deterministic). `day` is the simulator market day.
  priceOn: (ticker: string, day: number) => series(ticker)[Math.min(day, SERIES_DAYS - 1)]!,
  priceHistory: (ticker: string, day: number, n: number) => series(ticker).slice(Math.max(0, day - n + 1), day + 1),
  marketDay: () => read("sim").day,

  searchIndex(): SearchItem[] {
    return [
      ...COMPANIES.map((c) => ({ kind: "company" as const, id: c.ticker, title: c.name, subtitle: `${c.ticker} · ${c.sector}`, href: `/companies/${c.ticker}/`, keywords: c.about })),
      ...LESSONS.map((l) => ({ kind: "lesson" as const, id: l.id, title: l.title, subtitle: l.kind === "boss" ? "Challenge" : `Lesson · ${l.minutes} min`, href: `/learn/${l.id}/`, keywords: l.objective + " " + l.concepts.join(" ") })),
      ...ARTICLES.map((a) => ({ kind: "article" as const, id: a.slug, title: a.title, subtitle: a.category, href: `/library/${a.slug}/`, keywords: a.definition })),
    ];
  },
  search(q: string) { const idx = this.searchIndex(); return { results: searchItems(idx, q), didYouMean: suggest(idx, q) }; },

  // Session (simulated; no real authentication)
  async requestCode(email: string): Promise<void> {
    return call(() => { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError("unknown", "Enter a valid email address, like ada@example.com."); });
  },
  async verifyCode(email: string, code: string): Promise<{ ok: true; session: Session } | { ok: false; reason: "wrong" | "expired" }> {
    return call(() => {
      if (code === "000000") return { ok: false as const, reason: "wrong" as const };
      if (code === "111111") return { ok: false as const, reason: "expired" as const };
      return { ok: true as const, session: this.signInAs(email) };
    });
  },
  signInAs(email: string): Session {
    const lower = email.trim().toLowerCase();
    const role = lower === "admin@demo.finvora.test" ? "admin" : "learner";
    const name = lower.startsWith("premium@") ? "Tunde" : lower.startsWith("admin@") ? "Admin" : lower.split("@")[0]!.replace(/^\w/, (c) => c.toUpperCase());
    const session: Session = { email: lower, role, name: lower.startsWith("free@") ? "Ada" : name };
    write("session", session);
    if (lower === "premium@demo.finvora.test") write("billing", { sub: { plan: "plus", period: "monthly", renewsOn: addPeriod(today(), "monthly") }, orders: [] });
    return session;
  },
  signOut() { write("session", null); },
  resetDemo() { resetAll(true); seriesCache.clear(); },

  entitlements(): Entitlements { return entitlements(effectivePlan(read("billing").sub, today())); },

  // Ask Fin (scripted; same response shape as Phase 2)
  askStatus() { return canAsk(read("ask").usage, today(), this.entitlements().askFinDailyLimit); },
  async ask(question: string, context: AskContext): Promise<AskResponse> {
    const status = this.askStatus();
    if (!status.allowed) throw new ApiError("limit", "Daily limit reached");
    const r = await call(() => answerQuestion(question, context, SCRIPTED_ANSWERS, (s) => ARTICLES.find((a) => a.slug === s)?.title));
    update("ask", (a) => ({ usage: recordAsk(a.usage, today()), history: [...a.history, { q: question, r, at: new Date().toISOString() }].slice(-50) }));
    return r;
  },

  // Simulator (virtual money)
  valuation(): Valuation {
    const s = read("sim");
    return valuePortfolio(s.account, (t) => this.priceOn(t, s.day), (t) => this.priceOn(t, Math.max(0, s.day - 1)));
  },
  async trade(req: Omit<TradeRequest, "day" | "at" | "tradeId" | "currentPriceKobo">): Promise<TradeResult> {
    return call(() => {
      const s = read("sim");
      const result = executeTrade(s.account, { ...req, currentPriceKobo: this.priceOn(req.ticker, s.day), day: s.day, at: new Date().toISOString(), tradeId: newId("tr") });
      if (result.ok && !result.duplicate) write("sim", { ...s, account: result.account });
      return result;
    });
  },
  advanceDay() { update("sim", (s) => ({ ...s, day: Math.min(s.day + 1, SERIES_DAYS - 1) })); },
  markPortfolioSeen() { update("sim", (s) => ({ ...s, lastSeenDay: s.day })); },
  resetSim() { update("sim", (s) => ({ account: newAccount(newId("acc"), new Date().toISOString()), day: SIM_START_DAY, lastSeenDay: SIM_START_DAY, archived: [s.account, ...s.archived].slice(0, 10) })); },

  // Plans and simulated checkout (no card data, no real payment)
  priceFor: (p: BillingPeriod) => CONFIG.PLUS_PRICE_KOBO[p],
  startCheckout(period: BillingPeriod): { ok: true; orderId: string } | { ok: false; reason: "already-plus" | "pending"; orderId?: string } {
    const b = read("billing");
    const can = canStartPurchase({ ...b.sub, plan: effectivePlan(b.sub, today()) }, b.orders);
    if (!can.ok) return can;
    const order = createOrder(newId("ord"), period, this.priceFor(period), new Date().toISOString());
    write("billing", { ...b, orders: [order, ...b.orders] });
    return { ok: true, orderId: order.id };
  },
  order: (id: string): Order | undefined => read("billing").orders.find((o) => o.id === id),
  /** Our "server" checks the order with the payment provider. Dev panel picks the outcome. */
  async checkOrder(id: string): Promise<Order> {
    const outcome = read("dev").checkoutOutcome;
    await delay();
    if (outcome === "offline") throw new ApiError("network", "You're offline");
    const b = read("billing");
    const o = b.orders.find((x) => x.id === id);
    if (!o) throw new ApiError("unknown", "Order not found");
    const next = applyCheck(o, outcome === "slow" ? "pending" : outcome, new Date().toISOString());
    const sub = next.status === "confirmedSuccess" && o.status !== "confirmedSuccess" ? { plan: "plus" as const, period: o.period, renewsOn: addPeriod(today(), o.period) } : b.sub;
    write("billing", { sub, orders: b.orders.map((x) => (x.id === id ? next : x)) });
    return next;
  },
  retryOrder(id: string): Order {
    const b = read("billing");
    const o = b.orders.find((x) => x.id === id)!;
    const next = retryOrder(o, new Date().toISOString());
    write("billing", { ...b, orders: b.orders.map((x) => (x.id === id ? next : x)) });
    return next;
  },
  cancelPlus() { update("billing", (b) => ({ ...b, sub: { ...b.sub, cancelled: true } })); },
  resumePlus() { update("billing", (b) => ({ ...b, sub: { ...b.sub, cancelled: false } })); },

  // Feedback (admin-controlled prompts)
  submitFeedback(kind: string, where: string, text: string) {
    update("feedback", (f) => ({ ...f, submissions: [{ id: newId("fb"), kind, where, text, at: today(), status: "new" as const }, ...f.submissions] }));
  },

  // Admin (demonstration only; UI gate, not security)
  admin: {
    users: () => DEMO_USERS,
    orders: () => DEMO_ORDERS,
    seedFeedback: () => SEED_FEEDBACK,
    askReviewQueue: () => SEED_ASK_REVIEW,
    audit,
  },
};
