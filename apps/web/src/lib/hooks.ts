"use client";
import { effectivePlan, entitlements, type Entitlements } from "@finvora/domain";
import { useStore } from "./store";
import { today } from "./api";

/** Entitlements from the stored plan, safe for hydration (server snapshot = Free). */
export function useEntitlements(): Entitlements {
  const billing = useStore("billing");
  return entitlements(effectivePlan(billing.sub, today()));
}
