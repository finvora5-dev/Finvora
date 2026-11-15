"use client";
// Local prototype persistence (build plan §5). One versioned key per domain.
// Reads are defensive: malformed or old data falls back to defaults. No secrets are stored.
import { useSyncExternalStore } from "react";
import {
  parseStored, serialise, isObject, emptyLearning, newAccount, DEFAULT_PROMPTS,
  type LearningState, type SimAccount, type AskUsage, type AskResponse, type Order, type Subscription,
  type PromptId, type PromptConfig, type PromptHistory,
} from "@finvora/domain";

export interface Session { email: string; name: string; role: "learner" | "admin" }
export interface Profile { goal?: string; onboarded: boolean }
export interface AskState { usage?: AskUsage; history: { q: string; r: AskResponse; at: string }[] }
export interface SimState { account: SimAccount; day: number; lastSeenDay: number; archived: SimAccount[] }
export interface BillingState { sub: Subscription; orders: Order[] }
export interface FeedbackState { prompts: Record<PromptId, PromptConfig>; submissions: { id: string; kind: string; where: string; text: string; at: string; status: "new" | "read" }[]; history: Partial<Record<PromptId, PromptHistory>> }
export interface AdminState { audit: { id: string; when: string; who: string; area: string; change: string }[]; askReview: Record<string, "approved" | "rejected"> }
export interface Prefs { companyFilter: string; companySort: "name" | "change"; chartRange: number; tradeAmountKobo: number; libraryTopic: string; calcTicker: string; calcAmountKobo: number; calcDays: number }
export interface Dev { latency: boolean; failNextRequest: boolean; checkoutOutcome: "success" | "failed" | "slow" | "offline" }
export interface LibraryState { saved: string[]; read: string[] }

export const SIM_START_DAY = 250;

const defs = {
  session: { v: 1, def: (): Session | null => null, ok: (d: unknown): d is Session | null => d === null || (isObject(d) && typeof d.email === "string" && (d.role === "learner" || d.role === "admin")) },
  profile: { v: 1, def: (): Profile => ({ onboarded: false }), ok: (d: unknown): d is Profile => isObject(d) && typeof d.onboarded === "boolean" },
  learning: { v: 1, def: emptyLearning, ok: (d: unknown): d is LearningState => isObject(d) && isObject(d.lessons) && typeof d.xp === "number" && Array.isArray(d.activeDays) },
  ask: { v: 1, def: (): AskState => ({ history: [] }), ok: (d: unknown): d is AskState => isObject(d) && Array.isArray(d.history) },
  sim: { v: 1, def: (): SimState => ({ account: newAccount("acc-1", new Date().toISOString()), day: SIM_START_DAY, lastSeenDay: SIM_START_DAY, archived: [] }), ok: (d: unknown): d is SimState => isObject(d) && isObject(d.account) && Number.isSafeInteger((d.account as Record<string, unknown>).cashKobo) && typeof d.day === "number" && Array.isArray(d.archived) },
  billing: { v: 1, def: (): BillingState => ({ sub: { plan: "free" }, orders: [] }), ok: (d: unknown): d is BillingState => isObject(d) && isObject(d.sub) && Array.isArray(d.orders) },
  feedback: { v: 1, def: (): FeedbackState => ({ prompts: { ...DEFAULT_PROMPTS }, submissions: [], history: {} }), ok: (d: unknown): d is FeedbackState => isObject(d) && isObject(d.prompts) && Array.isArray(d.submissions) },
  admin: { v: 1, def: (): AdminState => ({ audit: [], askReview: {} }), ok: (d: unknown): d is AdminState => isObject(d) && Array.isArray(d.audit) },
  watchlist: { v: 1, def: (): string[] => [], ok: (d: unknown): d is string[] => Array.isArray(d) && d.every((x) => typeof x === "string") },
  library: { v: 1, def: (): LibraryState => ({ saved: [], read: [] }), ok: (d: unknown): d is LibraryState => isObject(d) && Array.isArray(d.saved) && Array.isArray(d.read) },
  prefs: { v: 1, def: (): Prefs => ({ companyFilter: "All", companySort: "name", chartRange: 30, tradeAmountKobo: 5_000_00, libraryTopic: "All", calcTicker: "MTNN", calcAmountKobo: 50_000_00, calcDays: 365 }), ok: (d: unknown): d is Prefs => isObject(d) && typeof d.chartRange === "number" && typeof d.tradeAmountKobo === "number" },
  dev: { v: 1, def: (): Dev => ({ latency: true, failNextRequest: false, checkoutOutcome: "success" }), ok: (d: unknown): d is Dev => isObject(d) && typeof d.latency === "boolean" },
} as const;

export type StoreKey = keyof typeof defs;
type ValueOf<K extends StoreKey> = ReturnType<(typeof defs)[K]["def"]>;

const cache = new Map<StoreKey, unknown>();
const listeners = new Set<() => void>();
const storageKey = (k: StoreKey) => `fv.${k}`;

function safeStorage(): Storage | null {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
}

export function read<K extends StoreKey>(k: K): ValueOf<K> {
  if (cache.has(k)) return cache.get(k) as ValueOf<K>;
  const d = defs[k];
  const raw = safeStorage()?.getItem(storageKey(k)) ?? null;
  const value = parseStored(raw, d.v, d.def as () => ValueOf<K>, d.ok as (x: unknown) => x is ValueOf<K>);
  cache.set(k, value);
  return value;
}

export function write<K extends StoreKey>(k: K, value: ValueOf<K>): void {
  cache.set(k, value);
  try { safeStorage()?.setItem(storageKey(k), serialise(defs[k].v, value)); } catch { /* storage full or blocked: keep in memory */ }
  listeners.forEach((l) => l());
}

export function update<K extends StoreKey>(k: K, fn: (v: ValueOf<K>) => ValueOf<K>): ValueOf<K> {
  const next = fn(read(k));
  write(k, next);
  return next;
}

/** Clears all demo data except the session (Settings → Reset demo data). */
export function resetAll(keepSession = true): void {
  (Object.keys(defs) as StoreKey[]).forEach((k) => {
    if (keepSession && (k === "session" || k === "dev")) return;
    cache.delete(k);
    try { safeStorage()?.removeItem(storageKey(k)); } catch { /* ignore */ }
  });
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key?.startsWith("fv.")) { cache.clear(); l(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
};

const serverSnapshots = new Map<StoreKey, unknown>();
/** React hook. Server render gets defaults; the client reads localStorage after hydration. */
export function useStore<K extends StoreKey>(k: K): ValueOf<K> {
  return useSyncExternalStore(subscribe, () => read(k), () => {
    if (!serverSnapshots.has(k)) serverSnapshots.set(k, defs[k].def());
    return serverSnapshots.get(k) as ValueOf<K>;
  });
}

export function useHydrated(): boolean {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}

let idCounter = 0;
export function newId(prefix: string): string {
  idCounter += 1;
  const rand = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}${idCounter}`;
}
