// Seeded demo data for the admin console. Everything here is fictional.
export const DEMO_USERS = [
  { id: "u1", email: "free@demo.finvora.test", plan: "free", joined: "2026-10-12", lessons: 3 },
  { id: "u2", email: "premium@demo.finvora.test", plan: "plus", joined: "2026-10-12", lessons: 7 },
  { id: "u3", email: "ada@demo.finvora.test", plan: "free", joined: "2026-10-20", lessons: 1 },
  { id: "u4", email: "tunde@demo.finvora.test", plan: "plus", joined: "2026-10-25", lessons: 5 },
] as const;

export const DEMO_ORDERS = [
  { id: "ord_1001", email: "premium@demo.finvora.test", amountKobo: 250000, status: "confirmedSuccess", at: "2026-10-12" },
  { id: "ord_1002", email: "tunde@demo.finvora.test", amountKobo: 2500000, status: "confirmedSuccess", at: "2026-10-25" },
  { id: "ord_1003", email: "ada@demo.finvora.test", amountKobo: 250000, status: "confirmedFailed", at: "2026-10-28" },
] as const;

export const SEED_FEEDBACK = [
  { id: "fb1", kind: "report", where: "Lesson: Why prices go up", text: "The rice example could use a 2026 price.", at: "2026-11-01", status: "new" },
  { id: "fb2", kind: "suggest", where: "Library", text: "Please add an article on pensions (RSA).", at: "2026-11-02", status: "new" },
  { id: "fb3", kind: "rate", where: "Lesson: Compound interest", text: "5 stars · Loved the example", at: "2026-11-02", status: "read" },
] as const;

export const SEED_ASK_REVIEW = [
  { id: "ar1", question: "Should I buy MTN shares?", answerKind: "refusal", flagged: "Advice request", status: "pending" },
  { id: "ar2", question: "What is a P/E ratio?", answerKind: "answer", flagged: "Learner said not helpful", status: "pending" },
] as const;
