// Inline stroke icon set (no emoji). Paths taken from the purple canvas where available.
const P: Record<string, string> = {
  home: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  learn: "M3 8l9-4 9 4-9 4z M7 10v5c2.5 2 7.5 2 10 0v-5 M21 8v6",
  library: "M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z M5 16a4 4 0 0 1 4-4h10",
  markets: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  me: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4z M10 21h4",
  back: "M15 5l-7 7 7 7",
  close: "M6 6l12 12M18 6L6 18",
  chevron: "M9 6l6 6-6 6",
  send: "M12 19V5 M5 12l7-7 7 7",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M20 20l-4-4",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  bookmark: "M6 4h12v17l-6-4-6 4z",
  flag: "M5 21V4 M5 4h11l-2 4 2 4H5",
  check: "M5 12l5 5 9-10",
  lock: "M6 11h12v10H6z M8 11V7a4 4 0 0 1 8 0v4",
  sim: "M12 3a9 9 0 1 0 9 9h-9z M14 3.3A9 9 0 0 1 20.7 10H14z",
  company: "M3 21h18 M5 21V7l7-4v18 M12 21V10l7 3v8 M8 10h1 M8 14h1 M15 15h1",
  calc: "M6 3h12v18H6z M9 7h6 M9 12h1 M14 12h1 M9 16h1 M14 16h1",
  arrowUp: "M12 19V5 M6 11l6-6 6 6",
  arrowDown: "M12 5v14 M6 13l6 6 6-6",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v6 M12 7.5v.5",
  alert: "M12 3l10 18H2z M12 10v5 M12 18v.5",
  sparkle: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z",
  plus: "M12 5v14M5 12h14",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z",
  history: "M4 12a8 8 0 1 0 2.3-5.7L4 8.5 M4 4v4.5h4.5 M12 8v4l3 2",
  undo: "M9 14L4 9l5-5 M4 9h10a6 6 0 0 1 0 12h-3",
  fire: "M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z",
};

export function Icon({ name, size = 22, stroke = 1.9, className, label }: { name: keyof typeof P | string; size?: number; stroke?: number; className?: string; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden={label ? undefined : true} role={label ? "img" : undefined} aria-label={label}>
      <path d={P[name] ?? P.info} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
