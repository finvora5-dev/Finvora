// Virtual-money simulator (proposal §7, ADR D3–D5). Pure functions; the
// caller persists the returned account. Money is integer kobo, shares are integers.
import { CONFIG } from "./config";
import { assertKobo, divRoundHalfUp, type Kobo } from "./money";

export interface FeeSchedule {
  bps: number;
  minKobo: Kobo;
}
export const DEFAULT_FEES: FeeSchedule = { bps: CONFIG.SIM_FEE_BPS, minKobo: CONFIG.SIM_MIN_FEE_KOBO };

export interface Holding {
  ticker: string;
  quantity: number;
  /** Total cost paid including fees, kobo (weighted-average basis). */
  costBasisKobo: Kobo;
}

export interface Trade {
  id: string;
  idempotencyKey: string;
  ticker: string;
  side: "buy" | "sell";
  quantity: number;
  priceKobo: Kobo;
  feesKobo: Kobo;
  /** Buy: total paid. Sell: proceeds received. */
  netKobo: Kobo;
  realizedPlKobo: Kobo;
  /** Market day index when executed. */
  day: number;
  at: string;
}

export interface SimAccount {
  id: string;
  startingCashKobo: Kobo;
  cashKobo: Kobo;
  holdings: Holding[];
  trades: Trade[];
  createdAt: string;
}

export function newAccount(id: string, at: string, startingCashKobo: Kobo = CONFIG.SIM_STARTING_CASH_KOBO): SimAccount {
  assertKobo(startingCashKobo);
  return { id, startingCashKobo, cashKobo: startingCashKobo, holdings: [], trades: [], createdAt: at };
}

/** Fee for a gross trade value: bps, rounded half up, with a minimum. Zero for zero value. */
export function feeFor(grossKobo: Kobo, fees: FeeSchedule = DEFAULT_FEES): Kobo {
  if (grossKobo <= 0) return 0;
  return Math.max(fees.minKobo, divRoundHalfUp(grossKobo * fees.bps, 10_000));
}

export interface BuyQuote {
  shares: number;
  grossKobo: Kobo;
  feesKobo: Kobo;
  totalKobo: Kobo;
  leftoverKobo: Kobo;
}

export function quoteShares(shares: number, priceKobo: Kobo, cashKobo: Kobo, fees: FeeSchedule = DEFAULT_FEES): BuyQuote {
  const grossKobo = shares * priceKobo;
  const feesKobo = feeFor(grossKobo, fees);
  const totalKobo = grossKobo + feesKobo;
  return { shares, grossKobo, feesKobo, totalKobo, leftoverKobo: cashKobo - totalKobo };
}

export type AmountQuote =
  | ({ status: "ok"; cappedToCash: boolean; reducedForFees: boolean } & BuyQuote)
  | { status: "too-small"; cheapestKobo: Kobo }
  | { status: "no-cash"; cheapestKobo: Kobo };

/**
 * Amount-first trading (build plan §4.5): how many whole shares an amount buys,
 * fees included. The amount is capped to cash; shares are reduced until total ≤ budget.
 */
export function quoteByAmount(amountKobo: Kobo, priceKobo: Kobo, cashKobo: Kobo, fees: FeeSchedule = DEFAULT_FEES): AmountQuote {
  assertKobo(amountKobo);
  assertKobo(priceKobo, "price");
  if (priceKobo <= 0) throw new Error("price must be positive");
  const cheapestKobo = quoteShares(1, priceKobo, cashKobo, fees).totalKobo;
  const cappedToCash = amountKobo > cashKobo;
  const budget = Math.min(amountKobo, cashKobo);
  let shares = Math.floor(budget / priceKobo);
  let reducedForFees = false;
  while (shares > 0 && quoteShares(shares, priceKobo, cashKobo, fees).totalKobo > budget) {
    shares -= 1;
    reducedForFees = true;
  }
  if (shares === 0) return cashKobo < cheapestKobo ? { status: "no-cash", cheapestKobo } : { status: "too-small", cheapestKobo };
  return { status: "ok", cappedToCash, reducedForFees, ...quoteShares(shares, priceKobo, cashKobo, fees) };
}

export type TradeError =
  | { code: "invalid-quantity" }
  | { code: "insufficient-cash"; neededKobo: Kobo; cashKobo: Kobo }
  | { code: "insufficient-shares"; held: number }
  | { code: "stale-price"; currentKobo: Kobo };

export type TradeResult = { ok: true; account: SimAccount; trade: Trade; duplicate: boolean } | { ok: false; error: TradeError };

export interface TradeRequest {
  side: "buy" | "sell";
  ticker: string;
  quantity: number;
  /** Price the user saw on the confirmation. */
  quotedPriceKobo: Kobo;
  /** Price now. If different, the user must re-confirm. */
  currentPriceKobo: Kobo;
  idempotencyKey: string;
  day: number;
  at: string;
  tradeId: string;
}

/** Execute a market order. Same idempotency key → the original trade is returned, nothing changes. */
export function executeTrade(account: SimAccount, req: TradeRequest, fees: FeeSchedule = DEFAULT_FEES): TradeResult {
  const existing = account.trades.find((t) => t.idempotencyKey === req.idempotencyKey);
  if (existing) return { ok: true, account, trade: existing, duplicate: true };
  if (!Number.isSafeInteger(req.quantity) || req.quantity <= 0) return { ok: false, error: { code: "invalid-quantity" } };
  if (req.quotedPriceKobo !== req.currentPriceKobo) return { ok: false, error: { code: "stale-price", currentKobo: req.currentPriceKobo } };
  const price = req.currentPriceKobo;
  const gross = req.quantity * price;
  const feesKobo = feeFor(gross, fees);
  const held = account.holdings.find((h) => h.ticker === req.ticker);

  if (req.side === "buy") {
    const total = gross + feesKobo;
    if (total > account.cashKobo) return { ok: false, error: { code: "insufficient-cash", neededKobo: total, cashKobo: account.cashKobo } };
    const holdings = held
      ? account.holdings.map((h) => (h === held ? { ...h, quantity: h.quantity + req.quantity, costBasisKobo: h.costBasisKobo + total } : h))
      : [...account.holdings, { ticker: req.ticker, quantity: req.quantity, costBasisKobo: total }];
    const trade: Trade = { id: req.tradeId, idempotencyKey: req.idempotencyKey, ticker: req.ticker, side: "buy", quantity: req.quantity, priceKobo: price, feesKobo, netKobo: total, realizedPlKobo: 0, day: req.day, at: req.at };
    return { ok: true, duplicate: false, trade, account: { ...account, cashKobo: account.cashKobo - total, holdings, trades: [...account.trades, trade] } };
  }

  const have = held?.quantity ?? 0;
  if (!held || req.quantity > have) return { ok: false, error: { code: "insufficient-shares", held: have } };
  const proceeds = gross - feesKobo;
  // Cost removed is proportional to shares sold (weighted average), rounded half up.
  const costRemoved = req.quantity === have ? held.costBasisKobo : divRoundHalfUp(held.costBasisKobo * req.quantity, have);
  const realized = proceeds - costRemoved;
  const remaining = have - req.quantity;
  const holdings = remaining === 0
    ? account.holdings.filter((h) => h !== held)
    : account.holdings.map((h) => (h === held ? { ...h, quantity: remaining, costBasisKobo: h.costBasisKobo - costRemoved } : h));
  const trade: Trade = { id: req.tradeId, idempotencyKey: req.idempotencyKey, ticker: req.ticker, side: "sell", quantity: req.quantity, priceKobo: price, feesKobo, netKobo: proceeds, realizedPlKobo: realized, day: req.day, at: req.at };
  return { ok: true, duplicate: false, trade, account: { ...account, cashKobo: account.cashKobo + proceeds, holdings, trades: [...account.trades, trade] } };
}

export interface Valuation {
  cashKobo: Kobo;
  holdingsValueKobo: Kobo;
  totalKobo: Kobo;
  /** Total value minus starting cash. */
  totalPlKobo: Kobo;
  dayChangeKobo: Kobo;
  positions: { ticker: string; quantity: number; valueKobo: Kobo; costBasisKobo: Kobo; unrealizedPlKobo: Kobo; avgCostKobo: Kobo }[];
}

export function valuePortfolio(account: SimAccount, price: (t: string) => Kobo, prevClose: (t: string) => Kobo): Valuation {
  const positions = account.holdings.map((h) => {
    const valueKobo = h.quantity * price(h.ticker);
    return { ticker: h.ticker, quantity: h.quantity, valueKobo, costBasisKobo: h.costBasisKobo, unrealizedPlKobo: valueKobo - h.costBasisKobo, avgCostKobo: divRoundHalfUp(h.costBasisKobo, h.quantity) };
  });
  const holdingsValueKobo = positions.reduce((s, p) => s + p.valueKobo, 0);
  const dayChangeKobo = account.holdings.reduce((s, h) => s + h.quantity * (price(h.ticker) - prevClose(h.ticker)), 0);
  const totalKobo = account.cashKobo + holdingsValueKobo;
  return { cashKobo: account.cashKobo, holdingsValueKobo, totalKobo, totalPlKobo: totalKobo - account.startingCashKobo, dayChangeKobo, positions };
}

/** Invariant check used in tests: replaying trades from scratch gives the same cash and holdings. */
export function replay(account: SimAccount): { cashKobo: Kobo; shares: Record<string, number> } {
  let cash = account.startingCashKobo;
  const shares: Record<string, number> = {};
  for (const t of account.trades) {
    if (t.side === "buy") { cash -= t.netKobo; shares[t.ticker] = (shares[t.ticker] ?? 0) + t.quantity; }
    else { cash += t.netKobo; shares[t.ticker] = (shares[t.ticker] ?? 0) - t.quantity; }
  }
  for (const k of Object.keys(shares)) if (shares[k] === 0) delete shares[k];
  return { cashKobo: cash, shares };
}
