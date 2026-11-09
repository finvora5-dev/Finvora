// Plus learning tools (design Part 4, docs/designs/plus-features.md). Pure, tested, kobo everywhere.
// Nothing here rates a company or tells anyone what to do with money; adviceCheck guards the wording.

export interface PracticeYear { year: number; revenueKobo: number; profitKobo: number; dividendPerShareKobo: number; debtKobo: number; equityKobo: number }
export interface PracticeCompany {
  ticker: string; name: string; sector: string; label: string; basePriceKobo: number; color: string;
  /** Simulator day of the year (0 to 249) the yearly dividend is paid on; 0 when it pays none. */
  payDay: number;
  about: string; sharesInIssue: number; learnSlug: string; years: PracticeYear[];
}

/** Round half to even, for every multiplication of kobo by a rate. */
export function roundHalfEven(x: number): number {
  const f = Math.floor(x), d = x - f;
  if (Math.abs(d - 0.5) < 1e-9) return f % 2 === 0 ? f : f + 1;
  return Math.round(x);
}

const latest = (c: PracticeCompany) => c.years[c.years.length - 1]!;

// ---- Compare over time
export function companyHistory(c: PracticeCompany) {
  return c.years.map((y) => ({ year: y.year, revenueKobo: y.revenueKobo, profitKobo: y.profitKobo, dividendPerShareKobo: y.dividendPerShareKobo }));
}

// ---- What this number means
export type Position = "highest of the five" | "in the middle" | "lowest of the five" | "not applicable";
export interface Measures { pe: number | null; debtToEquity: number; swingPct: number; dividendCover: number | null }

/** priceKobo: today's price. recent: the last 30 trading days of prices, oldest first. */
export function measures(c: PracticeCompany, priceKobo: number, recent: number[]): Measures {
  const y = latest(c), eps = y.profitKobo / c.sharesInIssue;
  const hi = Math.max(...recent), lo = Math.min(...recent);
  return {
    pe: eps > 0 ? Math.round((priceKobo / eps) * 10) / 10 : null,
    debtToEquity: Math.round((y.debtKobo / y.equityKobo) * 10) / 10,
    swingPct: lo > 0 ? Math.round(((hi - lo) / lo) * 100) : 0,
    dividendCover: y.dividendPerShareKobo > 0 && eps > 0 ? Math.round((eps / y.dividendPerShareKobo) * 10) / 10 : null,
  };
}

/** Where one value sits among all five companies' values. Never good or bad. */
export function positionOf(value: number | null, all: (number | null)[]): Position {
  if (value === null) return "not applicable";
  const v = all.filter((x): x is number => x !== null);
  if (value >= Math.max(...v)) return "highest of the five";
  if (value <= Math.min(...v)) return "lowest of the five";
  return "in the middle";
}

// ---- Your practice portfolio
interface TradeLike { ticker: string; side: "buy" | "sell"; quantity: number; feesKobo: number; day: number }
interface AccountLike { cashKobo: number; holdings: { ticker: string; quantity: number }[]; trades: TradeLike[] }

export function portfolioMix(account: AccountLike, companies: PracticeCompany[], priceOf: (t: string) => number) {
  const rows = account.holdings.filter((h) => h.quantity > 0).map((h) => {
    const c = companies.find((x) => x.ticker === h.ticker);
    return { ticker: h.ticker, sector: c ? c.label : h.ticker, valueKobo: h.quantity * priceOf(h.ticker) };
  });
  const investedKobo = rows.reduce((s, r) => s + r.valueKobo, 0);
  const bySector: Record<string, number> = {};
  for (const r of rows) bySector[r.sector] = (bySector[r.sector] || 0) + r.valueKobo;
  const biggest = rows.reduce((m, r) => (r.valueKobo > m.valueKobo ? r : m), { ticker: "", sector: "", valueKobo: 0 });
  return {
    investedKobo, cashKobo: account.cashKobo, companyCount: rows.length,
    sectors: Object.entries(bySector).map(([label, valueKobo]) => ({ label, valueKobo, pct: investedKobo ? Math.round((valueKobo / investedKobo) * 100) : 0 })).sort((a, b) => b.valueKobo - a.valueKobo),
    biggest: biggest.ticker ? { ticker: biggest.ticker, pct: Math.round((biggest.valueKobo / investedKobo) * 100) } : null,
    feesKobo: account.trades.reduce((s, t) => s + t.feesKobo, 0),
  };
}

// ---- Dividend tracker
export const SIM_YEAR_DAYS = 250;

/** Shares held at the start of a simulator day, from the trade list. */
export function sharesOn(trades: TradeLike[], ticker: string, day: number): number {
  return trades.filter((t) => t.ticker === ticker && t.day < day).reduce((s, t) => s + (t.side === "buy" ? t.quantity : -t.quantity), 0);
}

export function dividendCalendar(account: AccountLike, companies: PracticeCompany[], today: number) {
  return companies.filter((c) => account.holdings.some((h) => h.ticker === c.ticker && h.quantity > 0) || account.trades.some((t) => t.ticker === c.ticker)).map((c) => {
    const dps = latest(c).dividendPerShareKobo, held = account.holdings.find((h) => h.ticker === c.ticker)?.quantity || 0;
    if (!dps || !c.payDay) return { ticker: c.ticker, name: c.name, pays: false, nextDay: null, perShareKobo: 0, nextKobo: 0, receivedKobo: 0 };
    let received = 0;
    for (let d = c.payDay; d <= today; d += SIM_YEAR_DAYS) received += sharesOn(account.trades, c.ticker, d) * dps;
    const yearStart = Math.floor(today / SIM_YEAR_DAYS) * SIM_YEAR_DAYS;
    const next = yearStart + c.payDay > today ? yearStart + c.payDay : yearStart + SIM_YEAR_DAYS + c.payDay;
    return { ticker: c.ticker, name: c.name, pays: true, nextDay: next, perShareKobo: dps, nextKobo: held * dps, receivedKobo: received };
  });
}

// ---- Crisis practice
export type CrisisChoice = "keep" | "cash" | "add";
export interface Crisis { id: string; title: string; style: string; history: string; steps: { text: string; moveBps: Record<string, number> }[]; end: string }

export const CRISES: Crisis[] = [
  { id: "oil", title: "Oil price shock", style: "2016 style", history: "In 2016 oil prices fell sharply, Nigeria's economy shrank and many share prices fell for months.", steps: [
    { text: "Oil prices fall by a third. Transport and energy companies feel it first.", moveBps: { Energy: -1800, Transport: -1500, Banking: -600, Food: -300, Telecoms: -300 } },
    { text: "Oil keeps falling. Banks worry about loans to oil firms.", moveBps: { Energy: -1000, Transport: -800, Banking: -1200, Food: -400, Telecoms: -200 } },
    { text: "Prices of imported goods rise. Shoppers cut back.", moveBps: { Energy: -300, Transport: -500, Banking: -300, Food: -700, Telecoms: -200 } },
    { text: "Oil steadies. Some prices stop falling.", moveBps: { Energy: 600, Transport: 400, Banking: 300, Food: 200, Telecoms: 300 } },
    { text: "A slow recovery starts, unevenly.", moveBps: { Energy: 900, Transport: 700, Banking: 600, Food: 500, Telecoms: 500 } },
  ], end: "Shocks hit some sectors much harder than others. Recoveries are slow and uneven, and nobody knows in advance how long a fall lasts." },
  { id: "bank", title: "Bank scare", style: "2009 style", history: "In 2009 several Nigerian banks were rescued after bad loans, and bank shares fell steeply.", steps: [
    { text: "News that some banks made risky loans. Bank shares drop.", moveBps: { Banking: -2200, Energy: -500, Transport: -500, Food: -300, Telecoms: -300 } },
    { text: "People worry about their deposits. Lending slows.", moveBps: { Banking: -1500, Energy: -700, Transport: -700, Food: -300, Telecoms: -400 } },
    { text: "The central bank steps in to support the banks.", moveBps: { Banking: 500, Energy: 100, Transport: 100, Food: 100, Telecoms: 200 } },
    { text: "Banks raise new money. Old shareholders own a smaller part.", moveBps: { Banking: -400, Energy: 300, Transport: 200, Food: 300, Telecoms: 300 } },
    { text: "Confidence returns slowly.", moveBps: { Banking: 800, Energy: 500, Transport: 400, Food: 400, Telecoms: 500 } },
  ], end: "When one sector has a crisis, owning companies in different sectors can soften the fall. It does not remove the risk." },
  { id: "pandemic", title: "Pandemic shock", style: "2020 style", history: "In early 2020 markets around the world fell fast as countries locked down, then recovered at different speeds.", steps: [
    { text: "Lockdowns begin. Almost everything falls at once.", moveBps: { Banking: -1500, Energy: -1800, Transport: -2500, Food: -800, Telecoms: -700 } },
    { text: "People stay home. Data use jumps; travel stops.", moveBps: { Banking: -500, Energy: -600, Transport: -1200, Food: 200, Telecoms: 800 } },
    { text: "Shops reopen for food and essentials.", moveBps: { Banking: 300, Energy: 200, Transport: -200, Food: 600, Telecoms: 400 } },
    { text: "Lockdowns ease. Some sectors bounce back.", moveBps: { Banking: 900, Energy: 1000, Transport: 1200, Food: 400, Telecoms: 300 } },
    { text: "Most prices recover; travel stays weaker.", moveBps: { Banking: 800, Energy: 900, Transport: 900, Food: 300, Telecoms: 400 } },
  ], end: "Falls can be fast and recoveries uneven. Selling after a big fall locks in the loss; adding more costs cash you may need. Both have trade-offs." },
];

export interface CrisisPosition { cashKobo: number; values: Record<string, number> }

/** One step on a copy: moves each sector by its basis points, then applies the learner's choice. Never touches the real account. */
export function crisisStep(pos: CrisisPosition, sectorOf: (t: string) => string, step: Crisis["steps"][number], choice: CrisisChoice): CrisisPosition {
  const values: Record<string, number> = {};
  for (const [t, v] of Object.entries(pos.values)) values[t] = roundHalfEven((v * (10_000 + (step.moveBps[sectorOf(t)] || 0))) / 10_000);
  let cash = pos.cashKobo;
  if (choice === "cash") for (const t of Object.keys(values)) { const out = roundHalfEven(values[t]! / 4); values[t] = values[t]! - out; cash += out; }
  if (choice === "add") { const add = roundHalfEven(cash / 4), keys = Object.keys(values); if (keys.length) { const each = Math.floor(add / keys.length); for (const t of keys) values[t] = values[t]! + each; cash -= each * keys.length; } }
  return { cashKobo: cash, values };
}

export const totalOf = (p: CrisisPosition) => p.cashKobo + Object.values(p.values).reduce((s, v) => s + v, 0);

// ---- Money scenarios
export function salarySplit(salaryKobo: number, needsBps: number, wantsBps: number) {
  const needs = roundHalfEven((salaryKobo * needsBps) / 10_000), wants = roundHalfEven((salaryKobo * wantsBps) / 10_000);
  return { needsKobo: needs, wantsKobo: wants, savingsKobo: salaryKobo - needs - wants };
}
/** Surprise bill: from savings, or borrowed at a monthly rate for a number of months. */
export function surpriseBill(billKobo: number, savingsKobo: number, monthlyRateBps: number, months: number) {
  const fromSavings = Math.min(billKobo, savingsKobo), borrowed = billKobo - fromSavings;
  let owed = borrowed;
  for (let m = 0; m < months; m++) owed = roundHalfEven((owed * (10_000 + monthlyRateBps)) / 10_000);
  return { fromSavingsKobo: fromSavings, borrowedKobo: borrowed, repayKobo: owed, extraCostKobo: owed - borrowed };
}
/** Prices rising: what savings buy after some years of inflation, in today's naira. */
export function buyingPower(savingsKobo: number, inflationBps: number, years: number): number {
  let v = savingsKobo;
  for (let y = 0; y < years; y++) v = roundHalfEven((v * 10_000) / (10_000 + inflationBps));
  return v;
}

// ---- Advice check (D13)
const ADVICE_WORDS = ["buy", "sell", "avoid", "rating", "rated", "signal", "recommend", "recommendation", "score", "rank", "ranked", "outperform", "underperform", "undervalued", "overvalued", "good investment", "bad investment"];

/** Blocked words found in a piece of text: whole words, any case. */
export function adviceCheck(text: string): string[] {
  const t = " " + text.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ") + " ";
  return ADVICE_WORDS.filter((w) => t.includes(" " + w + " "));
}
