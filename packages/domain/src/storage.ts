// Versioned, defensive parsing for localStorage values (build plan §5).
// Malformed, missing or old-version data falls back to the default; it never throws.

export interface Stored<T> { v: number; data: T }

export function parseStored<T>(raw: string | null, version: number, fallback: () => T, validate: (d: unknown) => d is T): T {
  if (!raw) return fallback();
  try {
    const parsed = JSON.parse(raw) as Partial<Stored<unknown>>;
    if (!parsed || typeof parsed !== "object" || parsed.v !== version) return fallback();
    return validate(parsed.data) ? parsed.data : fallback();
  } catch {
    return fallback();
  }
}

export function serialise<T>(version: number, data: T): string {
  return JSON.stringify({ v: version, data } satisfies Stored<T>);
}

export const isObject = (d: unknown): d is Record<string, unknown> => !!d && typeof d === "object" && !Array.isArray(d);
