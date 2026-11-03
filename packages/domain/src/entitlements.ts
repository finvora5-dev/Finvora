// B1: one plan value drives every lock. Screens read this object, never `plan === 'plus'`.
import { CONFIG } from "./config";

export type Plan = "free" | "plus";
export type Role = "learner" | "admin";

export interface Entitlements {
  plan: Plan;
  askFinDailyLimit: number | null;
  allWorlds: boolean;
  bossChallenges: boolean;
  compare: boolean;
  dividendHistory: boolean;
  calculatorDividends: boolean;
  reportScan: boolean;
  pdfSummary: boolean;
}

export function entitlements(plan: Plan): Entitlements {
  const plus = plan === "plus";
  return {
    plan,
    askFinDailyLimit: plus ? null : CONFIG.ASK_FIN_FREE_DAILY_LIMIT,
    allWorlds: plus,
    bossChallenges: true,
    compare: plus,
    dividendHistory: plus,
    calculatorDividends: plus,
    reportScan: plus,
    pdfSummary: plus,
  };
}
