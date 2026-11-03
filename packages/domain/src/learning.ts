// Lesson progress, XP, streak and the Home "Next for you" choice (build plan §4.3, §4.9).
import { XP, THRESHOLDS, addDays, daysBetween, levelFor } from "@finvora/engine";

export interface LessonProgress {
  /** Step index the learner is on; only saved when they choose "Save and leave". */
  step: number;
  status: "inProgress" | "complete";
  bestScore?: number;
  completedAt?: string;
}

export interface LearningState {
  lessons: Record<string, LessonProgress>;
  xp: number;
  /** Lagos days on which learning happened, ascending, unique. */
  activeDays: string[];
  dailyDoneOn?: string;
  /** Lesson most recently opened. */
  lastLessonId?: string;
}

export const emptyLearning = (): LearningState => ({ lessons: {}, xp: 0, activeDays: [] });

export function startLesson(s: LearningState, lessonId: string): LearningState {
  const cur = s.lessons[lessonId];
  if (cur?.status === "complete") return { ...s, lastLessonId: lessonId };
  return { ...s, lastLessonId: lessonId, lessons: { ...s.lessons, [lessonId]: { step: cur?.step ?? 0, status: "inProgress" } } };
}

export function saveStep(s: LearningState, lessonId: string, step: number): LearningState {
  const cur = s.lessons[lessonId];
  if (!cur || cur.status === "complete") return s;
  return { ...s, lessons: { ...s.lessons, [lessonId]: { ...cur, step } } };
}

export interface CompletionResult {
  state: LearningState;
  xpGained: number;
  firstCompletion: boolean;
  leveledUp: boolean;
  passed: boolean;
}

/** Score is first-try correct / scored steps. Boss needs THRESHOLDS.bossPass to pass. */
export function completeLesson(s: LearningState, lessonId: string, kind: "lesson" | "boss", correct: number, total: number, today: string): CompletionResult {
  const score = total === 0 ? 1 : correct / total;
  const passed = kind === "lesson" || score >= THRESHOLDS.bossPass;
  const prev = s.lessons[lessonId];
  const firstCompletion = prev?.status !== "complete";
  let xpGained = 0;
  if (passed) {
    if (firstCompletion) xpGained = kind === "boss" ? XP.bossPass : XP.lessonBase + Math.round(XP.lessonAccuracyBonus * score);
    else xpGained = XP.lessonPractice;
  }
  const before = levelFor(s.xp).level;
  const lessons = { ...s.lessons };
  if (passed) lessons[lessonId] = { step: 0, status: "complete", bestScore: Math.max(score, prev?.bestScore ?? 0), completedAt: today };
  else lessons[lessonId] = { step: 0, status: "inProgress", bestScore: prev?.bestScore };
  const state: LearningState = { ...s, lessons, xp: s.xp + xpGained, activeDays: markActive(s.activeDays, today) };
  return { state, xpGained, firstCompletion: firstCompletion && passed, leveledUp: levelFor(state.xp).level > before, passed };
}

export function markActive(days: string[], today: string): string[] {
  return days.includes(today) ? days : [...days, today].sort();
}

/** Consecutive active days ending today or yesterday. A missed day resets it (no guilt copy; UI is neutral). */
export function streak(days: string[], today: string): number {
  if (days.length === 0) return 0;
  const set = new Set(days);
  let cursor = set.has(today) ? today : addDays(today, -1);
  if (!set.has(cursor)) return 0;
  let n = 0;
  while (set.has(cursor)) { n++; cursor = addDays(cursor, -1); }
  return n;
}

export function daysSinceActive(days: string[], today: string): number | null {
  const last = days[days.length - 1];
  return last ? daysBetween(last, today) : null;
}

export type NextForYou =
  | { kind: "resume"; lessonId: string; step: number }
  | { kind: "start-first"; lessonId: string }
  | { kind: "daily" }
  | { kind: "review-portfolio" }
  | { kind: "next-lesson"; lessonId: string }
  | { kind: "all-done" };

/** Priority from build plan §4.9. `lessonOrder` is the playable lessons in order. */
export function nextForYou(input: { learning: LearningState; lessonOrder: string[]; today: string; simUsed: boolean; marketMovedSinceVisit: boolean }): NextForYou {
  const { learning, lessonOrder, today } = input;
  const inProgress = (learning.lastLessonId && learning.lessons[learning.lastLessonId]?.status === "inProgress")
    ? learning.lastLessonId
    : lessonOrder.find((id) => learning.lessons[id]?.status === "inProgress");
  if (inProgress) return { kind: "resume", lessonId: inProgress, step: learning.lessons[inProgress]!.step };
  const anyDone = lessonOrder.some((id) => learning.lessons[id]?.status === "complete");
  if (!anyDone && lessonOrder[0]) return { kind: "start-first", lessonId: lessonOrder[0] };
  if (learning.dailyDoneOn !== today) return { kind: "daily" };
  if (input.simUsed && input.marketMovedSinceVisit) return { kind: "review-portfolio" };
  const next = lessonOrder.find((id) => learning.lessons[id]?.status !== "complete");
  return next ? { kind: "next-lesson", lessonId: next } : { kind: "all-done" };
}

/** A lesson is unlocked when every earlier lesson in its world is complete. */
export function isUnlocked(learning: LearningState, lessonOrder: string[], lessonId: string): boolean {
  const i = lessonOrder.indexOf(lessonId);
  if (i <= 0) return i === 0;
  return lessonOrder.slice(0, i).every((id) => learning.lessons[id]?.status === "complete");
}
