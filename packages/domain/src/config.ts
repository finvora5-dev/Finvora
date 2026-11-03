// Every configurable business value lives here. Values marked PENDING are not
// client decisions yet; see docs/PHASE1_STATUS.md. Money is integer kobo (₦1 = 100).

export const NAIRA = 100;

export const CONFIG = {
  /** ADR 0001 D4: ₦100,000 starting virtual cash. */
  SIM_STARTING_CASH_KOBO: 100_000 * NAIRA,
  /** ADR 0001 D5: approximate fees in basis points of the trade value. PENDING exact NGX components. */
  SIM_FEE_BPS: 150,
  /** Minimum fee per trade, kobo. PENDING (approximation). */
  SIM_MIN_FEE_KOBO: 50 * NAIRA,
  /** Amount presets on the trade sheet (build plan §4.5). */
  SIM_AMOUNT_PRESETS_KOBO: [1_000, 5_000, 10_000, 20_000].map((n) => n * NAIRA),
  /** NGX trading hours, Lagos time. PENDING: unverified against NGX. */
  MARKET_OPEN: "10:00",
  MARKET_CLOSE: "14:30",
  /** PENDING client decision: designs show 5, open-questions #4 says 10. */
  ASK_FIN_FREE_DAILY_LIMIT: 5,
  /** PENDING client decision: placeholder figures from the designs. */
  PLUS_PRICE_KOBO: { monthly: 2_500 * NAIRA, yearly: 25_000 * NAIRA },
  PLUS_PRICE_IS_PLACEHOLDER: true,
  /** Seconds before a pending checkout shows the "taking longer" state. */
  CHECKOUT_SLOW_AFTER_MS: 6_000,
  UNDO_MS: 5_000,
  CALC_AMOUNT_PRESETS_KOBO: [10_000, 50_000, 100_000].map((n) => n * NAIRA),
  CALC_PERIOD_PRESETS_DAYS: [30, 90, 180, 365],
} as const;
