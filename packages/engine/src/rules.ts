// Game rules in one place so they are easy to read, test and change.
// Every number here is a design decision; see docs/learning-game.md.

export const XP = {
  lessonBase: 10,
  /** Up to this much extra for first-try accuracy on a first completion. */
  lessonAccuracyBonus: 5,
  /** Replaying a completed lesson: small reward, once per lesson per day. */
  lessonPractice: 2,
  /** Going from struggling (<70%) to strong (>=90%) on a lesson. Once per lesson. */
  improvement: 5,
  bossPass: 30,
  worldComplete: 25,
  dailyComplete: 5,
  dailyCorrectBonus: 3,
  challengeFirst: 15,
  /** Reading a Library article to the end, once per article. Decided 9 Nov 2026. */
  articleRead: 3,
  /** Plus learning tools (design Part 4), once each. */
  crisisComplete: 10,
  scenarioComplete: 5,
} as const;

export const THRESHOLDS = {
  bossPass: 0.8,
  struggling: 0.7,
  strong: 0.9,
} as const;

/** Learning levels. Titles describe learning progress, not qualifications. */
export const LEVELS = [
  { level: 1, title: "Money Explorer", minXp: 0 },
  { level: 2, title: "Finance Learner", minXp: 100 },
  { level: 3, title: "Market Explorer", minXp: 250 },
  { level: 4, title: "Company Detective", minXp: 500 },
  { level: 5, title: "Financial Analyst in Training", minXp: 900 },
] as const;

export function levelFor(xp: number) {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.minXp) current = l;
  const next = LEVELS.find((l) => l.minXp > xp) ?? null;
  return {
    ...current,
    next,
    /** 0..1 progress to the next level; 1 at the top level. */
    progress: next ? (xp - current.minXp) / (next.minXp - current.minXp) : 1,
  };
}

export const ACHIEVEMENTS = {
  "first-lesson": { title: "First step", description: "Complete your first lesson." },
  "perfect-lesson": { title: "Clean sheet", description: "Finish a lesson with every answer right first time." },
  comeback: { title: "Came back stronger", description: "Return to a lesson you found hard and ace it." },
  "world-money-foundations": { title: "Foundations laid", description: "Pass the Money Foundations boss challenge." },
  "world-investing": { title: "Investor's mindset", description: "Pass the Understanding Investing boss challenge." },
  "streak-7": { title: "A week of learning", description: "Learn on 7 days in a row (rest days allowed)." },
  "daily-3": { title: "Daily habit", description: "Complete 3 daily challenges." },
  challenger: { title: "Problem solver", description: "Complete 3 practical challenges." },
  "curious-mind": { title: "Curious mind", description: "Read 5 library articles." },
} as const;

export type AchievementId = keyof typeof ACHIEVEMENTS;

/** Finvora counts days in Lagos time (WAT, UTC+1, no daylight saving). */
export function lagosDay(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) throw new Error(`Invalid timestamp: ${iso}`);
  return new Date(t + 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function addDays(day: string, n: number): string {
  const t = Date.parse(day + "T00:00:00Z") + n * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86_400_000);
}
