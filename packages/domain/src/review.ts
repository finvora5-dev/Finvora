// Review what I missed (design Part 2, D8, D14, D16). Pure rules, no storage, so they carry into Phase 2.
// Amounts mirror packages/engine XP.improvement and XP.lessonPractice (a test keeps them equal).

/** Missed steps for one lesson: step kind -> the learner's first-try answer. */
export type LessonMisses = Record<string, string>;

export const REVIEW_XP = { allFixed: 5, practice: 2 } as const;

/** After a first attempt or a full replay: add first-try wrong steps, clear steps answered right. */
export function recordMisses(prev: LessonMisses | undefined, answers: Record<string, boolean>, given: Record<string, string> = {}): LessonMisses {
  const out: LessonMisses = { ...(prev || {}) };
  for (const step of Object.keys(answers)) {
    if (answers[step]) delete out[step];
    else out[step] = String(given[step] ?? "");
  }
  return out;
}

/** The missed steps to play, in lesson order. Steps without answers (explainers) never appear. */
export function planReview(flow: readonly string[], misses: LessonMisses | undefined): string[] {
  const m = misses || {};
  return flow.filter((step) => Object.prototype.hasOwnProperty.call(m, step));
}

export interface ReviewResult { remaining: LessonMisses; fixed: string[]; stillMissed: string[]; lastFixed: boolean }

/** After a review: steps answered right are cleared, steps still wrong stay. */
export function applyReview(misses: LessonMisses | undefined, answers: Record<string, boolean>): ReviewResult {
  const before = misses || {}, remaining: LessonMisses = { ...before }, fixed: string[] = [], stillMissed: string[] = [];
  for (const step of Object.keys(before)) {
    if (!(step in answers)) continue;
    if (answers[step]) { delete remaining[step]; fixed.push(step); } else stillMissed.push(step);
  }
  return { remaining, fixed, stillMissed, lastFixed: Object.keys(before).length > 0 && Object.keys(remaining).length === 0 };
}

/** XP for a review: the practice reward once per lesson per day, plus the bonus once per lesson, ever. */
export function reviewReward(r: { lastFixed: boolean; bonusPaidBefore: boolean; practicePaidToday: boolean }): { practice: number; bonus: number } {
  return { practice: r.practicePaidToday ? 0 : REVIEW_XP.practice, bonus: r.lastFixed && !r.bonusPaidBefore ? REVIEW_XP.allFixed : 0 };
}
