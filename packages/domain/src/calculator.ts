// Historical "what if I had invested" calculator (proposal §7.6), on demo prices.
import type { Kobo } from "./money";

export interface CalcResult {
  shares: number;
  investedKobo: Kobo;
  leftoverKobo: Kobo;
  endValueKobo: Kobo;
  gainKobo: Kobo;
  returnPct: number;
  /** Annualised return %, only for periods of at least 365 days. */
  cagrPct: number | null;
}

export type CalcError = "amount-required" | "amount-too-small" | "bad-period";

export function historicalReturn(amountKobo: Kobo, startPriceKobo: Kobo, endPriceKobo: Kobo, days: number): { ok: true; result: CalcResult } | { ok: false; error: CalcError } {
  if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) return { ok: false, error: "amount-required" };
  if (!Number.isFinite(days) || days <= 0) return { ok: false, error: "bad-period" };
  const shares = Math.floor(amountKobo / startPriceKobo);
  if (shares === 0) return { ok: false, error: "amount-too-small" };
  const invested = shares * startPriceKobo;
  const leftover = amountKobo - invested;
  const endValue = shares * endPriceKobo + leftover;
  const gain = endValue - amountKobo;
  const returnPct = Math.round((gain / amountKobo) * 1000) / 10;
  const cagrPct = days >= 365 ? Math.round((Math.pow(endValue / amountKobo, 365 / days) - 1) * 1000) / 10 : null;
  return { ok: true, result: { shares, investedKobo: invested, leftoverKobo: leftover, endValueKobo: endValue, gainKobo: gain, returnPct, cagrPct } };
}

/** Compound interest for the savings calculator: monthly compounding, kobo rounded at the end. */
export function compound(principalKobo: Kobo, monthlyKobo: Kobo, annualRatePct: number, years: number): { totalKobo: Kobo; contributedKobo: Kobo; interestKobo: Kobo } {
  const r = annualRatePct / 100 / 12;
  let bal = principalKobo;
  const months = Math.round(years * 12);
  for (let m = 0; m < months; m++) bal = bal * (1 + r) + monthlyKobo;
  const total = Math.round(bal);
  const contributed = principalKobo + monthlyKobo * months;
  return { totalKobo: total, contributedKobo: contributed, interestKobo: total - contributed };
}
