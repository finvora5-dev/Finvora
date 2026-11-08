// Practice market hours in Lagos time (D3, D12). Lagos is UTC+1 all year (no daylight saving),
// so the answers are the same whatever the phone's own time zone is.
import { CONFIG } from "./config";

const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function minutes(hm: string): number { const [h, m] = hm.split(":").map(Number); return (h ?? 0) * 60 + (m ?? 0); }

/** The Lagos calendar day (YYYY-MM-DD), weekday (0 = Sunday) and minutes past midnight for a moment. */
export function lagosParts(ms: number): { day: string; weekday: number; minute: number } {
  const t = new Date(ms + LAGOS_OFFSET_MS);
  return { day: t.toISOString().slice(0, 10), weekday: t.getUTCDay(), minute: t.getUTCHours() * 60 + t.getUTCMinutes() };
}

/** True when the practice market is open: weekdays from MARKET_OPEN up to (not including) MARKET_CLOSE. */
export function isMarketOpen(ms: number, open: string = CONFIG.MARKET_OPEN, close: string = CONFIG.MARKET_CLOSE): boolean {
  const p = lagosParts(ms);
  return p.weekday >= 1 && p.weekday <= 5 && p.minute >= minutes(open) && p.minute < minutes(close);
}

/** The next moment the market opens (now if it is open), with a short label such as "Mon 10:00". */
export function nextMarketOpen(ms: number, open: string = CONFIG.MARKET_OPEN, close: string = CONFIG.MARKET_CLOSE): { ms: number; label: string; today: boolean } {
  if (isMarketOpen(ms, open, close)) return { ms, label: "now", today: true };
  const start = lagosParts(ms), o = minutes(open);
  for (let i = 0; i < 8; i++) {
    const dayStartUtc = Date.parse(start.day + "T00:00:00Z") - LAGOS_OFFSET_MS + i * DAY_MS, at = dayStartUtc + o * 60000;
    const wd = lagosParts(at).weekday;
    if (wd >= 1 && wd <= 5 && at > ms) return { ms: at, label: (i === 0 ? "today" : i === 1 ? "tomorrow" : DAY_NAMES[wd]) + " " + open, today: i === 0 };
  }
  return { ms, label: open, today: false };
}

/** Weekdays from `fromDay` (exclusive) to `toDay` (inclusive), both YYYY-MM-DD. Prices move once per trading day. */
export function tradingDaysBetween(fromDay: string, toDay: string): number {
  const a = Date.parse(fromDay + "T00:00:00Z"), b = Date.parse(toDay + "T00:00:00Z");
  if (!(b > a)) return 0;
  const days = Math.round((b - a) / DAY_MS);
  let n = 0;
  for (let i = 1; i <= days; i++) { const wd = new Date(a + i * DAY_MS).getUTCDay(); if (wd >= 1 && wd <= 5) n++; }
  return n;
}
