"use client";
// One-tap watchlist with Undo (build plan §4.10).
import { update, useStore } from "@/lib/store";
import { useToast } from "./ui";

export function WatchButton({ ticker, name, compact }: { ticker: string; name: string; compact?: boolean }) {
  const list = useStore("watchlist");
  const toast = useToast();
  const on = list.includes(ticker);
  function toggle(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (on) {
      update("watchlist", (l) => l.filter((t) => t !== ticker));
      toast(`Removed ${name} from your watchlist`, () => update("watchlist", (l) => (l.includes(ticker) ? l : [...l, ticker])));
    } else {
      update("watchlist", (l) => [...l, ticker]);
      toast(`Added ${name} to your watchlist`);
    }
  }
  return (
    <button type="button" className={compact ? "icon-btn" : "btn btn-w btn-sm"} aria-pressed={on} aria-label={compact ? (on ? `Remove ${name} from watchlist` : `Add ${name} to watchlist`) : undefined} onClick={toggle} style={on ? { color: "var(--primary)" } : undefined}>
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /></svg>
      {!compact && (on ? "Watching" : "Watch")}
    </button>
  );
}
