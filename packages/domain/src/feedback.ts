// Admin-controlled feedback prompts (build plan §4.6).

export type PromptId = "rateLesson" | "reportMistake" | "suggestTopic" | "appReview";

export interface PromptConfig {
  enabled: boolean;
  /** Show to 1 in N eligible moments (rating prompt). 1 = always. */
  frequencyOneIn: number;
  cooldownDays: number;
}

export const DEFAULT_PROMPTS: Record<PromptId, PromptConfig> = {
  rateLesson: { enabled: true, frequencyOneIn: 1, cooldownDays: 0 },
  reportMistake: { enabled: true, frequencyOneIn: 1, cooldownDays: 0 },
  suggestTopic: { enabled: true, frequencyOneIn: 1, cooldownDays: 0 },
  appReview: { enabled: true, frequencyOneIn: 1, cooldownDays: 90 },
};

export interface PromptHistory { lastShownDay?: string; declinedForever?: boolean }

/** Off → never (and the UI removes the entry point). `roll` is a number in [0,1). */
export function shouldShow(cfg: PromptConfig, history: PromptHistory, today: string, roll: number): boolean {
  if (!cfg.enabled || history.declinedForever) return false;
  if (cfg.cooldownDays > 0 && history.lastShownDay) {
    const days = (Date.parse(today) - Date.parse(history.lastShownDay)) / 86_400_000;
    if (days < cfg.cooldownDays) return false;
  }
  return roll < 1 / Math.max(1, cfg.frequencyOneIn);
}
