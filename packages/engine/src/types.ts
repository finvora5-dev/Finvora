// Content model for Finvora's learning game. Content is plain data so it can
// move from TypeScript files to the database later without changing the engine.

export type WorldId = string;
export type LessonId = string;
export type ArticleSlug = string;

export interface World {
  id: WorldId;
  order: number;
  title: string;
  summary: string;
  /** Lessons in the order they unlock. The boss battle is separate. */
  lessonIds: LessonId[];
  bossId?: LessonId;
  /** True when the world's lessons are written and playable. */
  available: boolean;
  /** Shown for worlds that are planned but not yet written. */
  plannedTopics?: string[];
}

export interface Lesson {
  id: LessonId;
  worldId: WorldId;
  title: string;
  objective: string;
  minutes: number;
  kind: "lesson" | "boss";
  steps: Step[];
  /** Library articles to read for a deeper explanation. */
  relatedArticles: ArticleSlug[];
  /** Concepts this lesson teaches, used for mastery and achievements. */
  concepts: string[];
}

export type Step =
  | InfoStep
  | ChoiceStep
  | TrueFalseStep
  | FillBlankStep
  | OrderStep
  | MatchStep
  | NumberStep
  | ScenarioStep;

interface StepBase {
  id: string;
}

/** Teaching content. Not scored. */
export interface InfoStep extends StepBase {
  type: "info";
  title: string;
  body: string[];
  /** Optional worked example shown in a highlighted box. */
  example?: string;
  /** Optional simple comparison table, rows of [label, value]. */
  table?: { caption: string; rows: [string, string][] };
}

export interface ChoiceStep extends StepBase {
  type: "choice";
  prompt: string;
  options: { id: string; text: string; feedback?: string }[];
  correct: string;
  explanation: string;
}

export interface TrueFalseStep extends StepBase {
  type: "truefalse";
  statement: string;
  answer: boolean;
  explanation: string;
}

/** A sentence with one gap, filled by picking a word. */
export interface FillBlankStep extends StepBase {
  type: "fill";
  /** Use ___ for the gap. */
  sentence: string;
  options: string[];
  answer: string;
  explanation: string;
}

/** Put items in the right order. `items` is the correct order; the player shuffles. */
export interface OrderStep extends StepBase {
  type: "order";
  prompt: string;
  items: { id: string; text: string }[];
  explanation: string;
}

/** Match each left item to its right item. Pairs are listed correctly; the player shuffles the right side. */
export interface MatchStep extends StepBase {
  type: "match";
  prompt: string;
  pairs: { id: string; left: string; right: string }[];
  explanation: string;
}

/** A calculation. The answer is checked within a tolerance. */
export interface NumberStep extends StepBase {
  type: "number";
  prompt: string;
  /** Shown before the input, e.g. "₦". */
  prefix?: string;
  suffix?: string;
  answer: number;
  /** Absolute tolerance, e.g. 1 for "within ₦1". */
  tolerance: number;
  explanation: string;
  hint?: string;
}

/**
 * A decision with no single right answer. Every option gets feedback; options
 * marked `sound` show reasoning the lesson wants to reinforce. Scored as correct
 * when a sound option is picked, but the feedback never says other choices are "wrong"
 * for everyone.
 */
export interface ScenarioStep extends StepBase {
  type: "scenario";
  situation: string;
  question: string;
  options: { id: string; text: string; feedback: string; sound: boolean }[];
  takeaway: string;
}

export type ScoredStep = Exclude<Step, InfoStep>;

/** What the player submits for a step. */
export type Answer =
  | { type: "choice"; optionId: string }
  | { type: "truefalse"; value: boolean }
  | { type: "fill"; value: string }
  | { type: "order"; ids: string[] }
  | { type: "match"; pairs: Record<string, string> } // leftId -> pairId chosen for the right side
  | { type: "number"; value: number }
  | { type: "scenario"; optionId: string };

export interface Evaluation {
  correct: boolean;
  /** Feedback specific to the answer given, if any. */
  feedback?: string;
  /** The general explanation of the concept. */
  explanation: string;
}

export interface Article {
  slug: ArticleSlug;
  title: string;
  category: "Money basics" | "Investing" | "Markets" | "Nigerian market" | "Company analysis" | "Decisions and risk";
  definition: string;
  explanation: string[];
  example: string;
  whyItMatters: string;
  misconceptions: string[];
  related: ArticleSlug[];
  /** Lessons that teach this concept. Filled in from lesson data. */
  lessonIds?: LessonId[];
  check?: { question: string; options: string[]; answer: number; explanation: string };
  sources?: { label: string; url?: string }[];
  /** Full article sections, as in the designed Dividend article. Optional while articles are being expanded. */
  deep?: ArticleDeep;
}

export interface ArticleDeep {
  /** Lead sentence split around the highlighted term: [before, term, after]. */
  lead: [string, string, string];
  takeaways: string[];
  how: { title: string; intro: string; steps: string[] };
  /** Worked example with made-up people or companies only. */
  example: { line: string; rows: [string, string][]; note: string };
  /** The key calculation, where the topic has one. */
  formula?: { title: string; intro: string; rule: string; calc: string; note: string };
  mistake?: { myth: string; fact: string };
}
