// Ask Fin (design Part 3, docs/designs/ask-fin-grounded-answers.md). Same reply shape as the Phase 2 AI.
// Every answer is built from approved text: hand-written answers, Library articles and company data.
// Citations only ever point to articles that exist; nothing is invented.

import { ASK } from "./config";
import { normalise } from "./search";

export type AskContext = { type: "lesson" | "company" | "article"; id: string; label: string } | null;

export interface ScriptedAnswer {
  id: string;
  keywords: string[];
  answer: string;
  articleSlugs: string[];
  followUps: string[];
}

export type AskKind = "answer" | "didyoumean" | "insufficient" | "decline" | "refusal";

export interface AskResponse {
  kind: AskKind;
  answer: string;
  citations: { articleSlug: string; title: string }[];
  followUps: string[];
  /** "Did you mean" buttons: the closest articles. */
  choices?: { articleSlug: string; title: string }[];
}

/** The parts of a Library article Ask Fin reads. Any field may be empty. */
export interface AskArticle {
  slug: string;
  title: string;
  definition?: string;
  explanation?: string[];
  example?: string;
  whyItMatters?: string;
  misconceptions?: string[];
  related?: string[];
  keywords?: string[];
  deep?: { how?: { intro?: string; steps?: string[] } };
}

export interface AskCompany {
  name: string;
  ticker: string;
  askAliases?: string[];
  about: string;
  howItMakesMoney?: string;
  /** The company's related Library article, if any. */
  slug?: string;
  madeUp: boolean;
}

export interface AskSources {
  scripts: ScriptedAnswer[];
  articles: AskArticle[];
  companies: AskCompany[];
}

/** Only a real answer uses up a free question (owner decision, 8 Nov 2026). */
export function countsTowardLimit(kind: AskKind): boolean {
  return kind === "answer";
}

const ADVICE = /\b(should i (buy|sell|invest)|which (stock|share|company) (should|to)|what (stock|share)s? (should|to) (buy|sell)|buy or sell|is it a good (time|buy)|tell me (what|which) to (buy|sell)|recommend (a|some)? ?(stock|share)s?|best (stock|share)s? to buy)\b/i;

export function isAdviceRequest(q: string): boolean {
  return ADVICE.test(q);
}

const STOP = new Set<string>(ASK.STOP_WORDS);
const KEEP = new Set<string>(ASK.KEEP_WORDS);
const FINANCE = new Set<string>(ASK.FINANCE_WORDS.map((w) => stem(w)));

/** Trims plural and "-ing" endings so "dividends" matches "dividend". */
export function stem(w: string): string {
  if (KEEP.has(w)) return w;
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us")) return w.slice(0, -1);
  return w;
}

/** Question or text to scoring words: normalised, common words dropped, endings trimmed. */
export function askWords(s: string): string[] {
  return normalise(s).split(" ").filter((w) => w && !STOP.has(w)).map(stem).filter((w) => w.length > 1);
}

interface Doc { kind: "script" | "article"; id: string; fields: [Set<string>, number][]; }

function articleDoc(a: AskArticle): Doc {
  const rest = [...(a.explanation || []), a.example || "", a.whyItMatters || "", ...(a.misconceptions || []), a.deep?.how?.intro || "", ...(a.deep?.how?.steps || [])].join(" ");
  return { kind: "article", id: a.slug, fields: [[new Set(askWords(a.title)), 3], [new Set(askWords(a.definition || "")), 2], [new Set(askWords((a.keywords || []).join(" "))), 2], [new Set(askWords(rest)), 1]] };
}

function scriptDoc(s: ScriptedAnswer): Doc {
  return { kind: "script", id: s.id, fields: [[new Set(askWords(s.keywords.join(" "))), 3], [new Set(askWords(s.answer)), 1]] };
}

/** Scores every hand-written answer and article against the question, best first. Scores run 0 to 1. */
export function scoreAll(question: string, sources: Pick<AskSources, "scripts" | "articles">): { kind: "script" | "article"; id: string; score: number }[] {
  const words = [...new Set(askWords(question))];
  const docs = [...sources.scripts.map(scriptDoc), ...sources.articles.map(articleDoc)];
  const N = docs.length;
  if (!words.length || !N) return [];
  const best = (d: Doc, w: string) => d.fields.reduce((m, [set, pts]) => (set.has(w) && pts > m ? pts : m), 0);
  const idf = (w: string) => { const df = docs.filter((d) => best(d, w) > 0).length; return df ? Math.log(1 + N / df) : 0; };
  const weights = words.map(idf);
  const max = words.length * 3 * Math.log(1 + N);
  return docs.map((d) => {
    const raw = words.reduce((sum, w, i) => sum + best(d, w) * (weights[i] ?? 0), 0) / max;
    return { kind: d.kind, id: d.id, score: d.kind === "script" ? raw * ASK.SCRIPT_BOOST : raw };
  }).sort((a, b) => b.score - a.score);
}

function findCompanies(question: string, companies: AskCompany[]): AskCompany[] {
  const n = " " + normalise(question) + " ";
  return companies.filter((c) => {
    const names = [c.name, ...(c.askAliases || [])].map((x) => normalise(x)).filter(Boolean);
    if (names.some((x) => n.includes(" " + x + " "))) return true;
    const t = c.ticker;
    return t.length > 3 ? n.includes(" " + t.toLowerCase() + " ") : new RegExp("\\b" + t + "\\b").test(question);
  });
}

/** "What is a share?" stays as it is; "Revenue and profit" becomes "What is revenue and profit?". */
function askAbout(title: string): string {
  if (title.endsWith("?")) return title;
  return "What is " + (/^[A-Z][a-z]/.test(title) ? title.charAt(0).toLowerCase() + title.slice(1) : title) + "?";
}

function firstSentence(s: string): string {
  const i = s.indexOf(". ");
  return i < 0 ? s : s.slice(0, i + 1);
}

function fromArticle(a: AskArticle, all: AskArticle[]): AskResponse {
  const parts = [a.definition || "", a.explanation && a.explanation[0] ? firstSentence(a.explanation[0]) : "", a.example || ""].map((x) => x.trim()).filter(Boolean);
  const related = (a.related || []).map((slug) => all.find((x) => x.slug === slug)).filter((x): x is AskArticle => !!x).slice(0, 2);
  return { kind: "answer", answer: parts.join(" "), citations: [{ articleSlug: a.slug, title: a.title }], followUps: related.map((r) => askAbout(r.title)) };
}

const INSUFFICIENT = "I don't have a Library article on that yet. Try searching the Library, or ask in a different way, for example \"What is inflation?\".";
const DECLINE = "I only help with money, saving and investing. Try asking about budgeting, inflation or how shares work.";

export function answerQuestion(question: string, context: AskContext, sources: AskSources): AskResponse {
  const q = question.trim();
  const titleOf = (slug: string) => sources.articles.find((a) => a.slug === slug)?.title;
  const cite = (slugs: string[]) => slugs.flatMap((slug) => { const t = titleOf(slug); return t ? [{ articleSlug: slug, title: t }] : []; });
  const starters = ["What is inflation?", "What is a share?", "How does compound interest work?"];

  // 1. Too short.
  if (normalise(q).replace(/ /g, "").length < 2) return { kind: "insufficient", answer: INSUFFICIENT, citations: [], followUps: starters };

  // 2. Advice.
  if (isAdviceRequest(q)) {
    return {
      kind: "refusal",
      answer: "I can't tell you what to buy or sell. That depends on your money, goals and risk, and Finvora is for learning, not advice. I can explain how to judge a company yourself, for example what profit, dividends and price-to-earnings tell you.",
      citations: cite(["what-is-a-share", "price-to-earnings"]),
      followUps: ["How do I read a company's profit?", "What is a dividend?"],
    };
  }

  // 3. Company: what it does, how it makes money, and the Library explanation of what was asked.
  let named = findCompanies(q, sources.companies);
  if (!named.length && context && context.type === "company") named = sources.companies.filter((c) => c.ticker === context.id);
  if (named.length) {
    let rest = q;
    for (const c of named) for (const x of [c.name, c.ticker, ...(c.askAliases || [])]) rest = rest.replace(new RegExp(x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " ");
    const top = scoreAll(rest, { scripts: [], articles: sources.articles })[0];
    const howItEarns = /\b(make|makes|making|earn|earns)\b/i.test(rest);
    const art = !howItEarns && top && top.score >= ASK.SCORE_LOW ? sources.articles.find((a) => a.slug === top.id) : sources.articles.find((a) => a.slug === named[0]!.slug);
    const lower = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);
    const about = named.map((c) => [
      /^(A|An) /.test(c.about) ? c.name + " is " + lower(c.about) : c.name + " " + lower(c.about),
      c.howItMakesMoney ? "How it makes money: " + lower(c.howItMakesMoney) : "",
      c.madeUp ? "Its prices in the Practice Market are made up for practice." : "",
    ].filter(Boolean).join(" "));
    const parts = [...about, !howItEarns && art && art.definition ? art.title.replace(/\?$/, "") + ": " + lower(art.definition) : ""].filter(Boolean);
    return { kind: "answer", answer: parts.join(" "), citations: art ? [{ articleSlug: art.slug, title: art.title }] : [], followUps: art ? fromArticle(art, sources.articles).followUps : starters };
  }

  // 4. Score hand-written answers and articles together.
  const ranked = scoreAll(q, sources);
  const top = ranked[0];
  if (top && top.score >= ASK.SCORE_HIGH) {
    if (top.kind === "script") {
      const s = sources.scripts.find((x) => x.id === top.id)!;
      return { kind: "answer", answer: s.answer, citations: cite(s.articleSlugs), followUps: s.followUps };
    }
    return fromArticle(sources.articles.find((a) => a.slug === top.id)!, sources.articles);
  }
  if (top && top.score >= ASK.SCORE_LOW) {
    const slugs: string[] = [];
    for (const r of ranked) {
      const ids = r.kind === "article" ? [r.id] : sources.scripts.find((x) => x.id === r.id)!.articleSlugs;
      for (const id of ids) if (titleOf(id) && !slugs.includes(id)) slugs.push(id);
      if (slugs.length >= 2) break;
    }
    const choices = cite(slugs.slice(0, 2));
    if (choices.length) return { kind: "didyoumean", answer: "I'm not sure I understood. Did you mean one of these?", citations: [], followUps: [], choices };
  }

  // 5. Below the bands: finance words mean we lack an article; otherwise it is off topic.
  const finance = askWords(q).some((w) => FINANCE.has(w));
  return finance
    ? { kind: "insufficient", answer: INSUFFICIENT, citations: [], followUps: starters }
    : { kind: "decline", answer: DECLINE, citations: [], followUps: starters };
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
