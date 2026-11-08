import { describe, expect, it } from "vitest";
import {
  CONFIG, feeFor, quoteByAmount, newAccount, executeTrade, valuePortfolio, replay, formatNaira, parseNairaToKobo,
  entitlements, nextForYou, emptyLearning, startLesson, completeLesson, streak, isUnlocked,
  answerQuestion, isAdviceRequest, canAsk, recordAsk, suggestedPrompts, scoreAll, countsTowardLimit, ASK, type AskSources,
  createOrder, applyCheck, retry, canStartPurchase, effectivePlan, addPeriod,
  historicalReturn, compound, parseStored, serialise, isObject, search, suggest, shouldShow, DEFAULT_PROMPTS, priceSeries,
  type TradeRequest,
} from "./index";
import { ASK_CASES } from "./askfin.cases";
import { SCRIPTED_ANSWERS, ARTICLES, askCompanies } from "../../sample-data/src/index";

const N = 100; // kobo per naira
const fees = { bps: 150, minKobo: 50 * N };
const req = (o: Partial<TradeRequest>): TradeRequest => ({ side: "buy", ticker: "ABC", quantity: 1, quotedPriceKobo: 1000 * N, currentPriceKobo: 1000 * N, idempotencyKey: "k1", day: 0, at: "2026-11-03T10:00:00Z", tradeId: "t1", ...o });

describe("money", () => {
  it("formats and parses naira as integer kobo", () => {
    expect(formatNaira(123450)).toBe("₦1,234.50");
    expect(formatNaira(100000)).toBe("₦1,000");
    expect(formatNaira(-500, {})).toBe("−₦5");
    expect(formatNaira(500, { sign: true })).toBe("+₦5");
    expect(parseNairaToKobo("₦1,500")).toBe(150000);
    expect(parseNairaToKobo("12.5")).toBe(1250);
    expect(parseNairaToKobo("abc")).toBeNull();
    expect(parseNairaToKobo("-5")).toBeNull();
  });
});

describe("fees", () => {
  it("applies bps with half-up rounding and a minimum", () => {
    expect(feeFor(0, fees)).toBe(0);
    expect(feeFor(1000 * N, fees)).toBe(50 * N); // 1.5% = ₦15 < min ₦50
    expect(feeFor(10_000 * N, fees)).toBe(150 * N);
    expect(feeFor(1_000_033, fees)).toBe(15000); // 15000.495 -> 15000
    expect(feeFor(1_000_034, fees)).toBe(15001); // 15000.51 -> 15001
  });
});

describe("quoteByAmount (amount-first trading)", () => {
  it("buys whole shares within the amount including fees", () => {
    const q = quoteByAmount(10_000 * N, 1000 * N, 100_000 * N, fees);
    expect(q.status).toBe("ok");
    if (q.status !== "ok") return;
    expect(q.shares).toBe(9); // 10 shares + fee would exceed ₦10,000
    expect(q.reducedForFees).toBe(true);
    expect(q.totalKobo).toBeLessThanOrEqual(10_000 * N);
    expect(q.leftoverKobo).toBe(100_000 * N - q.totalKobo);
  });
  it("says when the amount buys zero shares and gives the cheapest total", () => {
    const q = quoteByAmount(500 * N, 1000 * N, 100_000 * N, fees);
    expect(q).toEqual({ status: "too-small", cheapestKobo: 1050 * N });
  });
  it("caps to cash and says so", () => {
    const q = quoteByAmount(50_000 * N, 1000 * N, 5_000 * N, fees);
    expect(q.status).toBe("ok");
    if (q.status === "ok") { expect(q.cappedToCash).toBe(true); expect(q.totalKobo).toBeLessThanOrEqual(5_000 * N); }
  });
  it("reports no cash when even one share is unaffordable", () => {
    expect(quoteByAmount(10_000 * N, 1000 * N, 1000 * N, fees).status).toBe("no-cash");
  });
  it("rejects non-integer money", () => {
    expect(() => quoteByAmount(10.5, 100, 1000, fees)).toThrow();
  });
});

describe("simulator trades", () => {
  it("buys, values and sells with weighted-average cost and keeps invariants", () => {
    let a = newAccount("a", "2026-11-03T00:00:00Z", 100_000 * N);
    const b1 = executeTrade(a, req({ quantity: 10 }), fees);
    expect(b1.ok).toBe(true); if (!b1.ok) return;
    a = b1.account;
    expect(a.cashKobo).toBe(100_000 * N - (10_000 * N + 150 * N));
    const b2 = executeTrade(a, req({ quantity: 10, quotedPriceKobo: 1200 * N, currentPriceKobo: 1200 * N, idempotencyKey: "k2", tradeId: "t2" }), fees);
    if (!b2.ok) throw new Error(); a = b2.account;
    expect(a.holdings[0]!.quantity).toBe(20);
    const v = valuePortfolio(a, () => 1100 * N, () => 1000 * N);
    expect(v.totalKobo).toBe(a.cashKobo + 20 * 1100 * N);
    expect(v.dayChangeKobo).toBe(20 * 100 * N);
    const s = executeTrade(a, req({ side: "sell", quantity: 5, quotedPriceKobo: 1100 * N, currentPriceKobo: 1100 * N, idempotencyKey: "k3", tradeId: "t3" }), fees);
    if (!s.ok) throw new Error(); a = s.account;
    expect(a.holdings[0]!.quantity).toBe(15);
    const r = replay(a);
    expect(r.cashKobo).toBe(a.cashKobo);
    expect(r.shares).toEqual({ ABC: 15 });
    expect(a.cashKobo).toBeGreaterThanOrEqual(0);
  });
  it("blocks insufficient cash and overselling", () => {
    const a = newAccount("a", "x", 1000 * N);
    const r = executeTrade(a, req({ quantity: 1 }), fees);
    expect(r).toMatchObject({ ok: false, error: { code: "insufficient-cash" } });
    expect(executeTrade(a, req({ side: "sell" }), fees)).toMatchObject({ ok: false, error: { code: "insufficient-shares", held: 0 } });
  });
  it("treats a double tap (same idempotency key) as one trade", () => {
    const a = newAccount("a", "x");
    const first = executeTrade(a, req({}), fees); if (!first.ok) throw new Error();
    const second = executeTrade(first.account, req({ tradeId: "t-other" }), fees);
    expect(second.ok && second.duplicate).toBe(true);
    if (second.ok) expect(second.account.trades).toHaveLength(1);
  });
  it("asks to re-confirm when the price moved", () => {
    const a = newAccount("a", "x");
    expect(executeTrade(a, req({ currentPriceKobo: 1001 * N }), fees)).toMatchObject({ ok: false, error: { code: "stale-price" } });
  });
  it("rejects zero or fractional quantities", () => {
    const a = newAccount("a", "x");
    expect(executeTrade(a, req({ quantity: 0 }), fees)).toMatchObject({ ok: false });
    expect(executeTrade(a, req({ quantity: 1.5 }), fees)).toMatchObject({ ok: false });
  });
  it("selling everything realises P/L against full cost", () => {
    const a0 = newAccount("a", "x");
    const b = executeTrade(a0, req({ quantity: 3 }), fees); if (!b.ok) throw new Error();
    const s = executeTrade(b.account, req({ side: "sell", quantity: 3, idempotencyKey: "k9" }), fees); if (!s.ok) throw new Error();
    expect(s.account.holdings).toHaveLength(0);
    expect(s.trade.realizedPlKobo).toBe(s.trade.netKobo - b.trade.netKobo);
  });
});

describe("synthetic prices", () => {
  it("are deterministic and within the ±10% daily limit", () => {
    const a = priceSeries("XYZ", 5000, 200), b = priceSeries("XYZ", 5000, 200);
    expect(a).toEqual(b);
    for (let i = 1; i < a.length; i++) expect(Math.abs(a[i]! / a[i - 1]! - 1)).toBeLessThanOrEqual(0.1001);
    expect(a.every(Number.isInteger)).toBe(true);
  });
});

describe("entitlements", () => {
  it("drives locks from the plan", () => {
    expect(entitlements("free").askFinDailyLimit).toBe(CONFIG.ASK_FIN_FREE_DAILY_LIMIT);
    expect(entitlements("plus").askFinDailyLimit).toBeNull();
    expect(entitlements("free").compare).toBe(false);
    expect(entitlements("plus").allWorlds).toBe(true);
  });
});

describe("learning and Next for you", () => {
  const order = ["l1", "l2", "l3"];
  const base = { lessonOrder: order, today: "2026-11-03", simUsed: false, marketMovedSinceVisit: false };
  it("starts with the first lesson", () => {
    expect(nextForYou({ ...base, learning: emptyLearning() })).toEqual({ kind: "start-first", lessonId: "l1" });
  });
  it("resumes a lesson in progress at the saved step", () => {
    const l = { ...startLesson(emptyLearning(), "l2"), lessons: { l2: { step: 3, status: "inProgress" as const } }, lastLessonId: "l2" };
    expect(nextForYou({ ...base, learning: l })).toEqual({ kind: "resume", lessonId: "l2", step: 3 });
  });
  it("offers the daily question, then portfolio review, then the next lesson", () => {
    const done = completeLesson(emptyLearning(), "l1", "lesson", 4, 4, "2026-11-03").state;
    expect(nextForYou({ ...base, learning: done }).kind).toBe("daily");
    const daily = { ...done, dailyDoneOn: "2026-11-03" };
    expect(nextForYou({ ...base, learning: daily, simUsed: true, marketMovedSinceVisit: true }).kind).toBe("review-portfolio");
    expect(nextForYou({ ...base, learning: daily })).toEqual({ kind: "next-lesson", lessonId: "l2" });
  });
  it("awards XP once, practice XP on replay, and boss needs 80%", () => {
    const r1 = completeLesson(emptyLearning(), "l1", "lesson", 4, 4, "2026-11-03");
    expect(r1.xpGained).toBe(15);
    const r2 = completeLesson(r1.state, "l1", "lesson", 4, 4, "2026-11-04");
    expect(r2.xpGained).toBe(2);
    expect(completeLesson(emptyLearning(), "b", "boss", 3, 5, "d").passed).toBe(false);
    expect(completeLesson(emptyLearning(), "b", "boss", 4, 5, "d").passed).toBe(true);
  });
  it("unlocks lessons in order", () => {
    const s = completeLesson(emptyLearning(), "l1", "lesson", 1, 1, "d").state;
    expect(isUnlocked(s, order, "l2")).toBe(true);
    expect(isUnlocked(s, order, "l3")).toBe(false);
  });
  it("counts streaks on Lagos days and resets after a gap", () => {
    expect(streak(["2026-11-01", "2026-11-02", "2026-11-03"], "2026-11-03")).toBe(3);
    expect(streak(["2026-11-01", "2026-11-02"], "2026-11-03")).toBe(2);
    expect(streak(["2026-11-01"], "2026-11-03")).toBe(0);
  });
});

describe("Ask Fin (grounded answers, design Part 3)", () => {
  const sources = { scripts: SCRIPTED_ANSWERS, articles: ARTICLES, companies: askCompanies() };
  const run = (q: string, src: AskSources = sources) => answerQuestion(q, null, src);
  const idOf = (q: string, r: ReturnType<typeof run>) => {
    if (r.kind !== "answer") return undefined;
    const s = SCRIPTED_ANSWERS.find((x) => x.answer === r.answer);
    return s ? s.id : r.citations[0]?.articleSlug;
  };
  for (const c of ASK_CASES) {
    it(`${c.set}: "${c.q}" gives ${c.expect}${c.id ? " from " + c.id : ""}`, () => {
      const r = run(c.q);
      expect(r.kind).toBe(c.expect);
      if (c.id) expect([idOf(c.q, r), ...r.citations.map((x) => x.articleSlug)]).toContain(c.id);
    });
  }
  it("keeps a gap between in-scope and off-topic scores", () => {
    const top = (q: string) => scoreAll(q, sources)[0]?.score ?? 0;
    const inScope = ASK_CASES.filter((c) => c.set === "tune" && c.expect === "answer" && !/Zenith|MTN|GTBank|Okeke|Dangote|Airtel/.test(c.q)).map((c) => top(c.q));
    const off = ASK_CASES.filter((c) => c.set === "tune" && c.expect === "decline").map((c) => top(c.q));
    expect(Math.min(...inScope)).toBeGreaterThanOrEqual(ASK.SCORE_HIGH + 0.03);
    expect(Math.max(...off)).toBeLessThanOrEqual(ASK.SCORE_LOW - 0.03);
  });
  it("still gives the held-out results with one more article published", () => {
    const extra = { slug: "x-new", title: "Pension basics", definition: "Money saved for when you stop working.", explanation: ["You and your employer pay in each month."] };
    const more = { ...sources, articles: [...ARTICLES, extra] };
    for (const c of ASK_CASES.filter((x) => x.set === "held")) expect(run(c.q, more).kind).toBe(c.expect);
  });
  it("only cites articles that exist and never gives figures for companies", () => {
    for (const c of ASK_CASES) for (const cit of run(c.q).citations) expect(ARTICLES.some((a) => a.slug === cit.articleSlug)).toBe(true);
    expect(run("What was Zenith Bank's profit last year?").answer).not.toMatch(/₦|\d/);
  });
  it("offers 'did you mean' for near matches", () => {
    const r = run("tell me about growth");
    if (r.kind === "didyoumean") expect(r.choices?.length).toBeGreaterThan(0);
  });
  it("only real answers use up a free question", () => {
    expect(countsTowardLimit("answer")).toBe(true);
    for (const k of ["didyoumean", "insufficient", "decline", "refusal"] as const) expect(countsTowardLimit(k)).toBe(false);
    expect(isAdviceRequest("What is a share?")).toBe(false);
  });
  it("counts daily usage per Lagos day", () => {
    let u = recordAsk(undefined, "d1");
    for (let i = 0; i < 4; i++) u = recordAsk(u, "d1");
    expect(canAsk(u, "d1", 5)).toEqual({ allowed: false, used: 5, remaining: 0 });
    expect(canAsk(u, "d2", 5).allowed).toBe(true);
    expect(canAsk(u, "d1", null).allowed).toBe(true);
  });
  it("suggests prompts from context", () => {
    expect(suggestedPrompts({ type: "company", id: "MTNN", label: "MTN Nigeria" })[0]).toContain("MTN Nigeria");
  });
});

describe("checkout (B5 rules)", () => {
  it("only the server check moves an order out of pending", () => {
    const o = createOrder("o1", "monthly", CONFIG.PLUS_PRICE_KOBO.monthly, "t");
    expect(applyCheck(o, "offline", "t").status).toBe("pending");
    expect(applyCheck(o, "pending", "t").status).toBe("pending");
    const f = applyCheck(o, "failed", "t");
    expect(f.status).toBe("confirmedFailed");
    expect(applyCheck(f, "success", "t").status).toBe("confirmedFailed");
  });
  it("retries on the same order only after a confirmed failure", () => {
    const o = createOrder("o1", "monthly", 1, "t");
    expect(() => retry(o, "t")).toThrow();
    const r = retry(applyCheck(o, "failed", "t"), "t2");
    expect(r).toMatchObject({ id: "o1", status: "pending", attempts: 2 });
  });
  it("blocks a second purchase while pending or already on Plus", () => {
    const o = createOrder("o1", "monthly", 1, "t");
    expect(canStartPurchase({ plan: "free" }, [o])).toEqual({ ok: false, reason: "pending", orderId: "o1" });
    expect(canStartPurchase({ plan: "plus" }, [])).toEqual({ ok: false, reason: "already-plus" });
  });
  it("keeps Plus after cancelling until the period ends", () => {
    const sub = { plan: "plus" as const, period: "monthly" as const, renewsOn: addPeriod("2026-11-03", "monthly"), cancelled: true };
    expect(sub.renewsOn).toBe("2026-12-03");
    expect(effectivePlan(sub, "2026-11-20")).toBe("plus");
    expect(effectivePlan(sub, "2026-12-03")).toBe("free");
  });
});

describe("calculators", () => {
  it("computes historical return with leftover cash", () => {
    const r = historicalReturn(10_000 * N, 3_000 * N, 3_600 * N, 365);
    expect(r).toMatchObject({ ok: true, result: { shares: 3, leftoverKobo: 1_000 * N, endValueKobo: 11_800 * N, gainKobo: 1_800 * N, returnPct: 18, cagrPct: 18 } });
    expect(historicalReturn(0, 1, 1, 30)).toEqual({ ok: false, error: "amount-required" });
    expect(historicalReturn(100, 1000, 1, 30)).toEqual({ ok: false, error: "amount-too-small" });
    const short = historicalReturn(10_000 * N, 1000 * N, 1000 * N, 30);
    expect(short.ok && short.result.cagrPct).toBeNull();
  });
  it("compounds monthly", () => {
    const c = compound(100_000 * N, 0, 12, 1);
    expect(c.totalKobo).toBe(Math.round(100_000 * N * Math.pow(1.01, 12)));
    expect(c.contributedKobo).toBe(100_000 * N);
  });
});

describe("storage parsing", () => {
  const fb = () => ({ n: 0 });
  const ok = (d: unknown): d is { n: number } => isObject(d) && typeof d.n === "number";
  it("falls back on malformed, missing, wrong-version or invalid data", () => {
    expect(parseStored(null, 1, fb, ok)).toEqual({ n: 0 });
    expect(parseStored("{not json", 1, fb, ok)).toEqual({ n: 0 });
    expect(parseStored(serialise(2, { n: 5 }), 1, fb, ok)).toEqual({ n: 0 });
    expect(parseStored(serialise(1, { n: "x" }), 1, fb, ok)).toEqual({ n: 0 });
    expect(parseStored(serialise(1, { n: 5 }), 1, fb, ok)).toEqual({ n: 5 });
  });
});

describe("search", () => {
  const items = [
    { kind: "company" as const, id: "MTNN", title: "MTN Nigeria", subtitle: "Telecoms", href: "", keywords: "phone data" },
    { kind: "article" as const, id: "inflation", title: "Inflation", subtitle: "Money basics", href: "", keywords: "prices" },
  ];
  it("ranks and suggests", () => {
    expect(search(items, "mtn")[0]!.id).toBe("MTNN");
    expect(search(items, "telecoms")[0]!.id).toBe("MTNN");
    expect(search(items, "")).toEqual([]);
    expect(suggest(items, "inflaton")).toBe("inflation");
  });
});

describe("feedback prompts", () => {
  it("never shows when off, respects frequency and cooldown", () => {
    expect(shouldShow({ ...DEFAULT_PROMPTS.rateLesson, enabled: false }, {}, "2026-11-03", 0)).toBe(false);
    expect(shouldShow({ ...DEFAULT_PROMPTS.rateLesson, frequencyOneIn: 4 }, {}, "2026-11-03", 0.3)).toBe(false);
    expect(shouldShow({ ...DEFAULT_PROMPTS.rateLesson, frequencyOneIn: 4 }, {}, "2026-11-03", 0.2)).toBe(true);
    expect(shouldShow(DEFAULT_PROMPTS.appReview, { lastShownDay: "2026-10-01" }, "2026-11-03", 0)).toBe(false);
    expect(shouldShow(DEFAULT_PROMPTS.appReview, { declinedForever: true }, "2027-11-03", 0)).toBe(false);
  });
});

import { isMarketOpen, nextMarketOpen, tradingDaysBetween, lagosParts } from "./markethours";
import { LABELS } from "./config";

describe("Part 1 settings (D1, D2, D3, D12)", () => {
  // Lagos is UTC+1: 10:00 Lagos = 09:00Z. 2026-11-06 is a Friday.
  const lagos = (iso: string) => Date.parse(iso + "+01:00");
  it("Plus price is N5,999 a month and N65,989 a year, one month free", () => {
    expect(CONFIG.PLUS_PRICE_KOBO.monthly).toBe(599900);
    expect(CONFIG.PLUS_PRICE_KOBO.yearly).toBe(6598900);
    expect(CONFIG.PLUS_PRICE_KOBO.yearly).toBe(CONFIG.PLUS_PRICE_KOBO.monthly * 11);
    expect(CONFIG.PLUS_PRICE_IS_PLACEHOLDER).toBe(false);
  });
  it("free learners get exactly 5 Ask Fin questions a day", () => {
    expect(CONFIG.ASK_FIN_FREE_DAILY_LIMIT).toBe(5);
    expect(entitlements("free").askFinDailyLimit).toBe(5);
  });
  it("market is open on weekdays from 10:00 up to 14:30 Lagos time", () => {
    expect(isMarketOpen(lagos("2026-11-06T09:59:00"))).toBe(false);
    expect(isMarketOpen(lagos("2026-11-06T10:00:00"))).toBe(true);
    expect(isMarketOpen(lagos("2026-11-06T14:29:00"))).toBe(true);
    expect(isMarketOpen(lagos("2026-11-06T14:30:00"))).toBe(false);
    expect(isMarketOpen(lagos("2026-11-07T11:00:00"))).toBe(false);
    expect(isMarketOpen(lagos("2026-11-08T11:00:00"))).toBe(false);
  });
  it("gives the next opening time", () => {
    expect(nextMarketOpen(lagos("2026-11-06T15:00:00")).label).toBe("Mon 10:00");
    expect(nextMarketOpen(lagos("2026-11-05T15:00:00")).label).toBe("tomorrow 10:00");
    expect(nextMarketOpen(lagos("2026-11-05T08:00:00")).label).toBe("today 10:00");
    expect(nextMarketOpen(lagos("2026-11-06T11:00:00")).label).toBe("now");
    expect(nextMarketOpen(lagos("2026-11-08T11:00:00")).ms).toBe(lagos("2026-11-09T10:00:00"));
  });
  it("works out Lagos time whatever the phone's time zone", () => {
    expect(lagosParts(Date.parse("2026-11-06T23:30:00Z")).day).toBe("2026-11-07");
  });
  it("counts only trading days", () => {
    expect(tradingDaysBetween("2026-11-06", "2026-11-09")).toBe(1);
    expect(tradingDaysBetween("2026-11-02", "2026-11-09")).toBe(5);
    expect(tradingDaysBetween("2026-11-09", "2026-11-09")).toBe(0);
  });
  it("keeps the label words in one place", () => {
    expect(LABELS.PRACTICE_MARKET).toBe("Practice Market");
    expect(LABELS.EXAMPLE_ANSWER).toBe("Example answer from the Finvora Library");
  });
});

import { recordMisses, planReview, applyReview, reviewReward, REVIEW_XP } from "./review";
import { XP } from "@finvora/engine";

describe("Review what I missed (Part 2)", () => {
  const flow = ["info", "myth", "choice", "order", "match", "scenario", "calc"];
  it("records first-try misses with the answer, and clears steps answered right", () => {
    const m = recordMisses(undefined, { choice: true, order: false, calc: false }, { order: "B, A, C", calc: "250" });
    expect(m).toEqual({ order: "B, A, C", calc: "250" });
    expect(recordMisses(m, { order: true, calc: false }, { calc: "300" })).toEqual({ calc: "300" });
  });
  it("plans a review of missed steps in lesson order, never explainers", () => {
    expect(planReview(flow, { calc: "x", order: "y" })).toEqual(["order", "calc"]);
    expect(planReview(flow, {})).toEqual([]);
  });
  it("clears fixed steps and keeps the rest", () => {
    const r = applyReview({ order: "y", calc: "x" }, { order: true, calc: false });
    expect(r.remaining).toEqual({ calc: "x" }); expect(r.fixed).toEqual(["order"]); expect(r.lastFixed).toBe(false);
    expect(applyReview(r.remaining, { calc: true }).lastFixed).toBe(true);
  });
  it("pays the bonus once ever and the practice reward once a day", () => {
    expect(reviewReward({ lastFixed: true, bonusPaidBefore: false, practicePaidToday: false })).toEqual({ practice: 2, bonus: 5 });
    expect(reviewReward({ lastFixed: true, bonusPaidBefore: true, practicePaidToday: true })).toEqual({ practice: 0, bonus: 0 });
  });
  it("uses the game rules' amounts", () => {
    expect(REVIEW_XP.allFixed).toBe(XP.improvement);
    expect(REVIEW_XP.practice).toBe(XP.lessonPractice);
  });
});
