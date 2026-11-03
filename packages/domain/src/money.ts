import { NAIRA } from "./config";

export type Kobo = number;

export function assertKobo(n: number, name = "amount"): void {
  if (!Number.isSafeInteger(n)) throw new Error(`${name} must be an integer number of kobo`);
}

/** Integer division rounding half up (for non-negative inputs). */
export function divRoundHalfUp(numerator: number, denominator: number): number {
  return Math.floor((numerator * 2 + denominator) / (denominator * 2));
}

/** ₦1,234.50 style. Drops ".00". */
export function formatNaira(kobo: Kobo, opts: { sign?: boolean } = {}): string {
  const neg = kobo < 0;
  const abs = Math.abs(kobo);
  const whole = Math.floor(abs / NAIRA);
  const frac = abs % NAIRA;
  const body = whole.toLocaleString("en-NG") + (frac ? "." + String(frac).padStart(2, "0") : "");
  const sign = neg ? "−" : opts.sign && kobo > 0 ? "+" : "";
  return `${sign}₦${body}`;
}

/** Parse "₦1,500", "1500.5" into kobo. Returns null if unreadable or negative. */
export function parseNairaToKobo(raw: string): Kobo | null {
  const cleaned = raw.replace(/[₦,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [w, f = ""] = cleaned.split(".");
  const kobo = Number(w) * NAIRA + Number((f + "00").slice(0, 2));
  return Number.isSafeInteger(kobo) ? kobo : null;
}

/** Basis points to a percentage string, e.g. 150 -> "1.5%". */
export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toString()}%`;
}

/** Percent change with one decimal, as a string with sign, from two kobo values. */
export function percentChange(from: Kobo, to: Kobo): number {
  if (from === 0) return 0;
  return Math.round(((to - from) / from) * 1000) / 10;
}
