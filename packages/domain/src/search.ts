// Universal search across companies, lessons and articles (build plan §4.10).

export interface SearchItem {
  kind: "company" | "lesson" | "article";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
}

export function normalise(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

/** Ranks title prefix > title word > keyword match. Empty query returns nothing. */
export function search(items: SearchItem[], query: string, limit = 20): SearchItem[] {
  const q = normalise(query);
  if (!q) return [];
  const scored = items.flatMap((it) => {
    const t = normalise(it.title);
    const all = t + " " + normalise(it.subtitle + " " + it.keywords + " " + it.id);
    let score = 0;
    if (t.startsWith(q)) score = 3;
    else if (t.split(" ").some((w) => w.startsWith(q))) score = 2;
    else if (q.split(" ").every((w) => all.includes(w))) score = 1;
    return score ? [{ it, score }] : [];
  });
  return scored.sort((a, b) => b.score - a.score || a.it.title.localeCompare(b.it.title)).slice(0, limit).map((s) => s.it);
}

/** Simple "did you mean": closest title word within edit distance 2. */
export function suggest(items: SearchItem[], query: string): string | null {
  const q = normalise(query);
  if (q.length < 3) return null;
  let best: { w: string; d: number } | null = null;
  for (const it of items) for (const w of normalise(it.title).split(" ")) {
    if (w.length < 3) continue;
    const d = editDistance(q, w);
    if (d <= 2 && (!best || d < best.d)) best = { w, d };
  }
  return best && best.w !== q ? best.w : null;
}

export function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length]![b.length]!;
}
