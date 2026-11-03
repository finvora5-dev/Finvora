// Scripted Ask Fin (build plan §4.4). Same response shape as the Phase 2 AI.
// Citations only ever point to our own Library articles that exist; never invented.

export type AskContext = { type: "lesson" | "company" | "article"; id: string; label: string } | null;

export interface ScriptedAnswer {
  id: string;
  keywords: string[];
  answer: string;
  articleSlugs: string[];
  followUps: string[];
}

export interface AskResponse {
  kind: "answer" | "insufficient" | "refusal";
  answer: string;
  citations: { articleSlug: string; title: string }[];
  followUps: string[];
}

const ADVICE = /\b(should i (buy|sell|invest)|which (stock|share|company) (should|to)|what (stock|share)s? (should|to) (buy|sell)|buy or sell|is it a good (time|buy)|tell me (what|which) to (buy|sell)|recommend (a|some)? ?(stock|share)s?|best (stock|share)s? to buy)\b/i;

export function isAdviceRequest(q: string): boolean {
  return ADVICE.test(q);
}

function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9₦%\s-]/g, " ").split(/\s+/).filter((w) => w.length > 2);
}

export function answerQuestion(
  question: string,
  context: AskContext,
  scripts: ScriptedAnswer[],
  articleTitle: (slug: string) => string | undefined,
): AskResponse {
  const q = question.trim();
  if (isAdviceRequest(q)) {
    return {
      kind: "refusal",
      answer: "I can't tell you what to buy or sell. That depends on your money, goals and risk, and Finvora is for learning, not advice. I can explain how to judge a company yourself, for example what profit, dividends and price-to-earnings tell you.",
      citations: cite(["what-is-a-share", "price-to-earnings"], articleTitle),
      followUps: ["How do I read a company's profit?", "What is a dividend?"],
    };
  }
  const words = new Set([...tokens(q), ...(context ? tokens(context.label) : [])]);
  let best: { s: ScriptedAnswer; score: number } | null = null;
  for (const s of scripts) {
    const score = s.keywords.reduce((n, k) => n + (k.split(" ").every((part) => words.has(part) || q.toLowerCase().includes(k)) ? 1 : 0), 0);
    if (score > 0 && (!best || score > best.score)) best = { s, score };
  }
  if (!best) {
    return {
      kind: "insufficient",
      answer: "I don't have a good answer for that yet. Try searching the Library, or ask in a different way, for example \"What is inflation?\".",
      citations: [],
      followUps: ["What is inflation?", "What is a share?", "How does compound interest work?"],
    };
  }
  return { kind: "answer", answer: best.s.answer, citations: cite(best.s.articleSlugs, articleTitle), followUps: best.s.followUps };
}

function cite(slugs: string[], title: (s: string) => string | undefined) {
  return slugs.flatMap((slug) => { const t = title(slug); return t ? [{ articleSlug: slug, title: t }] : []; });
}

/** Suggested prompts for the current screen (build plan §4.4). */
export function suggestedPrompts(ctx: AskContext): string[] {
  if (!ctx) return ["What is a share?", "How does inflation affect my savings?", "What is compound interest?"];
  if (ctx.type === "company") return [`How does ${ctx.label} make money?`, `Explain ${ctx.label}'s dividend`, "What is a P/E ratio?"];
  if (ctx.type === "lesson") return ["Explain this more simply", "Give me a Nigerian example", "Why does this matter?"];
  return ["Explain this more simply", "Give me a Nigerian example", "What should I learn next?"];
}

export interface AskUsage { day: string; count: number }

export function canAsk(usage: AskUsage | undefined, today: string, limit: number | null): { allowed: boolean; used: number; remaining: number | null } {
  const used = usage && usage.day === today ? usage.count : 0;
  if (limit === null) return { allowed: true, used, remaining: null };
  return { allowed: used < limit, used, remaining: Math.max(0, limit - used) };
}

export function recordAsk(usage: AskUsage | undefined, today: string): AskUsage {
  return usage && usage.day === today ? { day: today, count: usage.count + 1 } : { day: today, count: 1 };
}
