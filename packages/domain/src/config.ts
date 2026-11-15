// Every configurable business value lives here. Values marked PENDING are not
// client decisions yet; decided values cite docs/open-questions.md (D1 to D21). Money is integer kobo (₦1 = 100).

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
  /** NGX trading hours, Lagos time (D3: the practice market follows them; every weekday counts, no holiday calendar). */
  MARKET_OPEN: "10:00",
  MARKET_CLOSE: "14:30",
  /** D2: free learners get 5 Ask Fin questions a day. */
  ASK_FIN_FREE_DAILY_LIMIT: 5,
  /** D1: Plus is ₦5,999 a month; yearly is one month free (11 × monthly). */
  PLUS_PRICE_KOBO: { monthly: 5_999 * NAIRA, yearly: 65_989 * NAIRA },
  PLUS_PRICE_IS_PLACEHOLDER: false,
  /** Seconds before a pending checkout shows the "taking longer" state. */
  CHECKOUT_SLOW_AFTER_MS: 6_000,
  UNDO_MS: 5_000,
  CALC_AMOUNT_PRESETS_KOBO: [10_000, 50_000, 100_000].map((n) => n * NAIRA),
  CALC_PERIOD_PRESETS_DAYS: [30, 90, 180, 365],
} as const;

/** D5, D17: the words every screen uses to mark simulated content, in one place. */
export const LABELS = {
  PRACTICE_MARKET: "Practice Market",
  PRACTICE_MARKET_LINE: "Made-up companies, virtual naira, no money at risk.",
  EXAMPLE_ANSWER: "Example answer from the Finvora Library",
  MADE_UP_FIGURES: "Made-up figures",
} as const;

/** Ask Fin word lists and score bands (design Part 3, docs/designs/ask-fin-grounded-answers.md). */
export const ASK = {
  /** Score bands, 0 to 1. At or above HIGH: answer. Between: "Did you mean". Below LOW: not enough information or decline. Tuned on askfin.cases.ts. */
  SCORE_HIGH: 0.26,
  SCORE_LOW: 0.22,
  /** A hand-written answer's score is multiplied by this, so common questions keep their tuned wording. */
  SCRIPT_BOOST: 1.1,
  FINANCE_WORDS: ["money", "naira", "kobo", "save", "saving", "savings", "invest", "investment", "investor", "stock", "dividend", "profit", "loss", "inflation", "bank", "budget", "market", "ngx", "loan", "debt", "price", "income", "salary", "spend", "tax", "pension", "fund", "bond", "bill", "treasury", "fee", "cost", "return", "risk", "scam", "crypto", "bitcoin", "capital", "revenue", "earning", "earnings", "asset", "wealth", "rich", "afford", "pay", "cash", "credit", "rent", "economy", "exchange", "broker", "portfolio", "expensive", "costly", "cheap", "finance", "financial", "company", "business", "dollar"],
  STOP_WORDS: ["a", "an", "the", "is", "are", "was", "were", "be", "been", "am", "do", "does", "did", "i", "me", "my", "you", "your", "we", "our", "it", "its", "this", "that", "these", "those", "what", "which", "who", "whom", "how", "why", "when", "where", "can", "could", "should", "would", "will", "of", "to", "in", "on", "for", "with", "at", "by", "from", "about", "as", "and", "or", "but", "if", "so", "than", "then", "there", "here", "tell", "explain", "mean", "means", "meaning", "please", "work", "works", "get", "some", "any", "all", "much", "many", "more", "most", "very", "just", "like", "kind", "thing", "things", "know", "want", "need", "fin", "hi", "hello", "hey", "thanks", "ok", "okay", "something", "everything", "keep", "go", "going", "up", "down", "now", "these", "days", "day", "use", "used", "make", "makes", "making", "last", "year", "years", "yearly", "ago"],
  /** Words left whole by the ending trimmer. */
  KEEP_WORDS: ["trading", "savings", "earnings", "news", "less", "always", "series", "business", "bus", "tax", "loss", "process"],
} as const;
