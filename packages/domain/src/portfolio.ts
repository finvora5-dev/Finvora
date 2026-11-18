// Practice portfolio tabs (client review, 17 Nov 2026): Holdings is the source, and Insights, Dividends and Crisis are worked
// out from it. Kobo everywhere. Dividend facts and scenario moves are simulated, for learning only.
import { divRoundHalfUp } from "./money";

/** Dividend withholding tax, 10% (as on the practice dividend screen). Taken once, when a dividend is worked out. */
export const DIVIDEND_TAX_BPS = 1000;
export const YEAR_DAYS = 250;
export const QUARTER_DAYS = 63;

export interface DividendFacts {
  /** Payments a year, each of perShareKobo. */
  paymentsPerYear: number; perShareKobo: number;
  /** First qualification day (simulator day) and the trading days from qualifying to being paid. */
  firstQualDay: number; payLagDays: number;
  /** Latest year: earnings a share, cash from operations and dividends paid (all kobo). */
  epsKobo: number; operatingCashKobo: number; dividendsPaidKobo: number;
}
const NAIRA_BILLION = 100_000_000_000; // ₦1 billion in kobo
/** Simulated dividend facts for the practice companies. */
export const DIVIDEND_FACTS: Record<string, DividendFacts> = {
  ZENITHBANK: { paymentsPerYear: 2, perShareKobo: 200, firstQualDay: 20, payLagDays: 10, epsKobo: 3323, operatingCashKobo: 880 * NAIRA_BILLION, dividendsPaidKobo: 157 * NAIRA_BILLION },
  GTCO: { paymentsPerYear: 2, perShareKobo: 140, firstQualDay: 45, payLagDays: 10, epsKobo: 3502, operatingCashKobo: 600 * NAIRA_BILLION, dividendsPaidKobo: 110 * NAIRA_BILLION },
  MTNN: { paymentsPerYear: 2, perShareKobo: 350, firstQualDay: 70, payLagDays: 12, epsKobo: 900, operatingCashKobo: 1200 * NAIRA_BILLION, dividendsPaidKobo: 300 * NAIRA_BILLION },
  DANGCEM: { paymentsPerYear: 1, perShareKobo: 3000, firstQualDay: 95, payLagDays: 15, epsKobo: 3500, operatingCashKobo: 900 * NAIRA_BILLION, dividendsPaidKobo: 510 * NAIRA_BILLION },
  NESTLE: { paymentsPerYear: 1, perShareKobo: 5000, firstQualDay: 110, payLagDays: 15, epsKobo: 4000, operatingCashKobo: 120 * NAIRA_BILLION, dividendsPaidKobo: 40 * NAIRA_BILLION },
  AIRTELAFRI: { paymentsPerYear: 2, perShareKobo: 400, firstQualDay: 30, payLagDays: 12, epsKobo: 1000, operatingCashKobo: 1500 * NAIRA_BILLION, dividendsPaidKobo: 400 * NAIRA_BILLION },
  SEPLAT: { paymentsPerYear: 2, perShareKobo: 5000, firstQualDay: 60, payLagDays: 12, epsKobo: 30000, operatingCashKobo: 700 * NAIRA_BILLION, dividendsPaidKobo: 90 * NAIRA_BILLION },
};

export interface TradeLite { ticker: string; side: "buy" | "sell"; quantity: number; day: number }
export interface DividendRecord { id: string; ticker: string; qualDay: number; payDay: number; shares: number; grossKobo: number; taxKobo: number; netKobo: number }
export interface AccountLite { cashKobo: number; holdings: { ticker: string; quantity: number; costBasisKobo?: number }[]; trades: TradeLite[]; dividends?: DividendRecord[] }

/** Gross, tax and net for one payment. The only place tax is taken. */
export function withholding(grossKobo: number) {
  const taxKobo = divRoundHalfUp(grossKobo * DIVIDEND_TAX_BPS, 10_000);
  return { grossKobo, taxKobo, netKobo: grossKobo - taxKobo };
}

/** Shares held at the close of a day. */
export function sharesAtClose(trades: TradeLite[], ticker: string, day: number): number {
  return trades.filter((t) => t.ticker === ticker && t.day <= day).reduce((s, t) => s + (t.side === "buy" ? t.quantity : -t.quantity), 0);
}

/** Dividend events whose payment day falls in (fromDay, toDay]. cutBps reduces the amount a share (a scenario's dividend cut). */
export function dividendEvents(ticker: string, fromDay: number, toDay: number, cutBps = 0, facts = DIVIDEND_FACTS) {
  const f = facts[ticker]; if (!f) return [];
  const gap = Math.floor(YEAR_DAYS / f.paymentsPerYear), per = divRoundHalfUp(f.perShareKobo * (10_000 - cutBps), 10_000), out: { ticker: string; qualDay: number; payDay: number; perShareKobo: number }[] = [];
  for (let q = f.firstQualDay; q + f.payLagDays <= toDay; q += gap) { const pay = q + f.payLagDays; if (pay > fromDay) out.push({ ticker, qualDay: q, payDay: pay, perShareKobo: per }); }
  return out;
}

const tickersOf = (a: AccountLite) => [...new Set([...a.holdings.map((h) => h.ticker), ...a.trades.map((t) => t.ticker)])];

/** Credits dividends paid up to today into cash, once each. Cash goes up by the net amount only: tax is not taken again. */
export function settleDividends<A extends AccountLite>(account: A, today: number, facts = DIVIDEND_FACTS): { account: A; credited: DividendRecord[] } {
  const have = new Set((account.dividends || []).map((d) => d.id)), credited: DividendRecord[] = [];
  const firstDay = account.trades.length ? Math.min(...account.trades.map((t) => t.day)) : Infinity;
  for (const t of tickersOf(account)) for (const e of dividendEvents(t, firstDay - 1, today, 0, facts)) {
    const id = t + "@" + e.qualDay; if (have.has(id) || e.qualDay < firstDay) continue;
    const shares = sharesAtClose(account.trades, t, e.qualDay); if (shares <= 0) continue;
    credited.push({ id, ticker: t, qualDay: e.qualDay, payDay: e.payDay, shares, ...withholding(shares * e.perShareKobo) });
  }
  if (!credited.length) return { account, credited };
  return { account: { ...account, cashKobo: account.cashKobo + credited.reduce((s, d) => s + d.netKobo, 0), dividends: [...(account.dividends || []), ...credited] }, credited };
}

/** Dividends due to be paid in the next `horizon` days. Already qualified payments use the shares held then. */
export function expectedDividends(account: AccountLite, today: number, horizon = QUARTER_DAYS, cutBpsOf: (t: string) => number = () => 0, facts = DIVIDEND_FACTS) {
  const items: (ReturnType<typeof dividendEvents>[number] & { shares: number; qualified: boolean; grossKobo: number; taxKobo: number; netKobo: number })[] = [];
  for (const t of tickersOf(account)) for (const e0 of dividendEvents(t, today, today + horizon, 0, facts)) {
    // A payment already qualified for is not cut by a scenario: a declared dividend is still paid.
    const qualified = e0.qualDay <= today, e = qualified ? e0 : { ...e0, perShareKobo: divRoundHalfUp(e0.perShareKobo * (10_000 - cutBpsOf(t)), 10_000) };
    const shares = qualified ? sharesAtClose(account.trades, t, e.qualDay) : (account.holdings.find((h) => h.ticker === t)?.quantity || 0);
    if (shares > 0) items.push({ ...e, shares, qualified, ...withholding(shares * e.perShareKobo) });
  }
  items.sort((a, b) => a.payDay - b.payDay);
  const sum = (k: "grossKobo" | "taxKobo" | "netKobo") => items.reduce((s, i) => s + i[k], 0);
  return { items, grossKobo: sum("grossKobo"), taxKobo: sum("taxKobo"), netKobo: sum("netKobo") };
}

/** This simulator year: received so far, still expected, and the total. */
export function dividendYear(account: AccountLite, today: number, cutBpsOf: (t: string) => number = () => 0, facts = DIVIDEND_FACTS) {
  const start = Math.floor(today / YEAR_DAYS) * YEAR_DAYS;
  const received = (account.dividends || []).filter((d) => d.payDay > start && d.payDay <= today).reduce((s, d) => s + d.netKobo, 0);
  const still = expectedDividends(account, today, start + YEAR_DAYS - today, cutBpsOf, facts).netKobo;
  return { receivedKobo: received, stillExpectedKobo: still, totalKobo: received + still };
}

/** Next year's net income from each holding, biggest first, with its share of the total. */
export function incomeByHolding(account: AccountLite, today: number, cutBpsOf: (t: string) => number = () => 0, facts = DIVIDEND_FACTS) {
  const by: Record<string, number> = {};
  for (const i of expectedDividends(account, today, YEAR_DAYS, cutBpsOf, facts).items) by[i.ticker] = (by[i.ticker] || 0) + i.netKobo;
  const total = Object.values(by).reduce((s, v) => s + v, 0);
  return { totalKobo: total, rows: Object.entries(by).map(([ticker, netKobo]) => ({ ticker, netKobo, pct: total ? Math.round((netKobo / total) * 100) : 0 })).sort((a, b) => b.netKobo - a.netKobo) };
}

/** Can the company keep paying? Payout from profit and cover from cash, explained. Never a view on the share. */
export function dividendSustainability(ticker: string, cutBps = 0, facts = DIVIDEND_FACTS) {
  const f = facts[ticker]; if (!f) return null;
  const yearly = divRoundHalfUp(f.perShareKobo * f.paymentsPerYear * (10_000 - cutBps), 10_000);
  const payoutPct = f.epsKobo > 0 ? Math.round((yearly / f.epsKobo) * 100) : null;
  const coverX = f.dividendsPaidKobo > 0 ? Math.round((f.operatingCashKobo / f.dividendsPaidKobo) * 10) / 10 : null;
  const level = payoutPct === null || payoutPct > 100 || (coverX !== null && coverX < 1) ? "Hard to keep up" : payoutPct > 60 || (coverX !== null && coverX < 2) ? "Stretched" : "Well covered";
  const lines = [
    payoutPct === null ? "It made no profit last year, so the dividend is paid from savings or borrowing." : "It pays out " + payoutPct + "% of its profit as dividends" + (payoutPct > 100 ? ", more than it earned." : payoutPct > 60 ? ", leaving little to fall back on." : ", keeping the rest to run and grow the business."),
    coverX === null ? "" : "Cash from its operations covered the dividends " + coverX + " times" + (coverX < 1 ? ": it paid out more cash than it brought in." : coverX < 2 ? ": not much room if cash falls." : "."),
  ].filter(Boolean);
  return { ticker, yearlyPerShareKobo: yearly, payoutPct, coverX, level, lines };
}

// ---- Insights: about this portfolio, from the holdings
export interface PositionLite { ticker: string; quantity: number; valueKobo: number; costBasisKobo: number; unrealizedPlKobo: number }
export function portfolioInsights(positions: PositionLite[], cashKobo: number, sectorOf: (t: string) => string, nameOf: (t: string) => string, income: { totalKobo: number; rows: { ticker: string; netKobo: number; pct: number }[] }) {
  const invested = positions.reduce((s, p) => s + p.valueKobo, 0), total = invested + cashKobo;
  const bySector: Record<string, number> = {};
  for (const p of positions) bySector[sectorOf(p.ticker)] = (bySector[sectorOf(p.ticker)] || 0) + p.valueKobo;
  const sectors = Object.entries(bySector).map(([label, valueKobo]) => ({ label, valueKobo, pct: total ? Math.round((valueKobo / total) * 100) : 0 })).sort((a, b) => b.valueKobo - a.valueKobo);
  const cashPct = total ? Math.round((cashKobo / total) * 100) : 0;
  const top = positions.slice().sort((a, b) => b.valueKobo - a.valueKobo)[0];
  const pl = positions.reduce((s, p) => s + p.unrealizedPlKobo, 0);
  const drivers = positions.map((p) => ({ ticker: p.ticker, plKobo: p.unrealizedPlKobo })).sort((a, b) => Math.abs(b.plKobo) - Math.abs(a.plKobo));
  const notes: string[] = [];
  if (sectors[0] && sectors[0].pct >= 35) notes.push(sectors[0].label + " is " + sectors[0].pct + "% of your money. A bad year for " + sectors[0].label.toLowerCase() + " companies would hit you hard.");
  if (top && invested && top.valueKobo / invested >= 0.5 && positions.length > 1) notes.push(nameOf(top.ticker) + " is " + Math.round((top.valueKobo / invested) * 100) + "% of what you have invested, so its price moves most of your portfolio.");
  if (income.rows[0] && income.rows[0].pct >= 50) notes.push(income.rows.length === 1 ? "All your dividend income comes from " + nameOf(income.rows[0].ticker) + ". If it cut its dividend, your income would stop." : nameOf(income.rows[0].ticker) + " gives " + income.rows[0].pct + "% of your dividend income. A cut there would hit your income most.");
  if (drivers[0] && pl !== 0) { const d = drivers[0], share = Math.round((Math.abs(d.plKobo) / positions.reduce((s, p) => s + Math.abs(p.unrealizedPlKobo), 0)) * 100); notes.push(nameOf(d.ticker) + (d.plKobo >= 0 ? " is behind most of your gain" : " is behind most of your loss") + " (" + share + "% of the change in your holdings)."); }
  if (cashPct >= 40) notes.push(cashPct + "% of your portfolio is cash. It is safe from price falls, but earns nothing and loses buying power to inflation.");
  if (positions.length === 1) notes.push("You own one company. Owning a few in different sectors spreads the risk.");
  return { investedKobo: invested, totalKobo: total, cashPct, sectors, unrealizedPlKobo: pl, drivers, notes };
}

// ---- Crisis scenarios, run on a copy of the portfolio
export interface Scenario { id: string; title: string; story: string; sectorBps: Record<string, number>; dividendCutBps: Record<string, number>; cashBuyingPowerBps: number; lessons: string[] }
export const SCENARIOS: Scenario[] = [
  { id: "crash", title: "Stock market crash", story: "Panic selling sweeps the NGX. Almost every share falls, banks hardest, and some companies cut their dividends to save cash.",
    sectorBps: { Banking: -3500, Telecoms: -2500, "Industrial goods": -3000, "Consumer goods": -2000, "Oil and gas": -3000 }, dividendCutBps: { Banking: 5000, "Industrial goods": 3000 }, cashBuyingPowerBps: 0,
    lessons: ["In a crash almost everything falls together, so spreading across sectors softens the fall but does not stop it.", "Cash does not fall in a crash. It is what lets you wait, or invest later.", "Dividend cuts often come with price falls, so income and value can drop at the same time."] },
  { id: "inflation", title: "Inflation surge", story: "Prices in shops jump. Households cut back, companies' costs rise, and money in the bank buys less.",
    sectorBps: { Banking: 500, Telecoms: -500, "Industrial goods": -1000, "Consumer goods": -1500, "Oil and gas": 500 }, dividendCutBps: { "Consumer goods": 3000 }, cashBuyingPowerBps: -2000,
    lessons: ["Inflation quietly shrinks cash: the same naira buys less.", "Companies that can raise their prices cope better than those squeezed by costs.", "A share price that holds steady can still lose value once inflation is counted."] },
  { id: "naira", title: "Naira depreciation", story: "The naira loses a third of its value against the dollar. Imports cost more; companies that earn dollars gain.",
    sectorBps: { Banking: 300, Telecoms: -1000, "Industrial goods": -800, "Consumer goods": -2000, "Oil and gas": 2500 }, dividendCutBps: { Telecoms: 5000, "Consumer goods": 5000 }, cashBuyingPowerBps: -1500,
    lessons: ["A weaker naira helps companies that earn in dollars and hurts those that pay for imports.", "Companies with dollar debts can see profits wiped out by exchange losses, and pause dividends.", "Holding only naira assets means your wealth falls in dollar terms."] },
  { id: "rates", title: "Interest rate increase", story: "The central bank raises interest rates sharply to fight inflation. Borrowing costs more; savings earn more.",
    sectorBps: { Banking: 800, Telecoms: -1200, "Industrial goods": -1500, "Consumer goods": -1500, "Oil and gas": -800 }, dividendCutBps: { "Industrial goods": 2000 }, cashBuyingPowerBps: 0,
    lessons: ["Higher rates make borrowing dearer, which squeezes companies with big loans.", "Banks can earn more on loans when rates rise.", "When savings pay more, some investors move money out of shares, pulling prices down."] },
];
export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id) || null;
/** A price under a scenario. */
export function scenarioPrice(priceKobo: number, sector: string, s: Scenario | null): number {
  return s ? divRoundHalfUp(priceKobo * (10_000 + (s.sectorBps[sector] || 0)), 10_000) : priceKobo;
}
export const scenarioCut = (s: Scenario | null, sector: string) => (s ? s.dividendCutBps[sector] || 0 : 0);
