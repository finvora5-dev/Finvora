// Deterministic synthetic prices (ADR D3). Same seed → same prices. Never real quotes.
import type { Kobo } from "./money";

/** mulberry32 PRNG. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Daily closes for `days` days ending at index days-1, starting from basePriceKobo.
 * Daily move capped at ±10% (NGX limit, to be confirmed). Prices rounded to 1 kobo, minimum 1 kobo.
 */
export function priceSeries(ticker: string, basePriceKobo: Kobo, days: number, volatility = 0.02, drift = 0.0004): Kobo[] {
  const r = rng(hashSeed(ticker));
  const out: Kobo[] = [basePriceKobo];
  for (let i = 1; i < days; i++) {
    const shock = (r() + r() + r() - 1.5) * volatility * 2;
    const move = Math.max(-0.1, Math.min(0.1, drift + shock));
    out.push(Math.max(1, Math.round(out[i - 1]! * (1 + move))));
  }
  return out;
}

/** Simple clock: the simulator's "today" is a day index into the series. */
export interface MarketClock {
  day: number;
}
