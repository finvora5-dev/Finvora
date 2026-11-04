"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { formatNaira } from "@finvora/domain";
import { Icon } from "./Icon";
import { Fin } from "./Fin";
import { useStore, useHydrated } from "@/lib/store";

/* ---------- Layout ---------- */

export function TopBar({ title, back, right, logo }: { title?: string; back?: string | true; right?: ReactNode; logo?: boolean }) {
  const router = useRouter();
  return (
    <header className="topbar">
      {back && (back === true
        ? <button type="button" className="icon-btn" aria-label="Back" onClick={() => router.back()}><Icon name="back" /></button>
        : <Link href={back} className="icon-btn" aria-label="Back"><Icon name="back" /></Link>)}
      {logo && <><span className="logo" aria-hidden="true">F</span><strong style={{ letterSpacing: ".08em", flex: 1 }}>FINVORA</strong></>}
      {title && <h1>{title}</h1>}
      {right}
    </header>
  );
}

const NAV = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/learn/", label: "Learn", icon: "learn" },
  { href: "/library/", label: "Library", icon: "library" },
  { href: "/markets/", label: "Markets", icon: "markets" },
  { href: "/me/", label: "Me", icon: "me" },
];

export function BottomNav() {
  const path = usePathname() ?? "/";
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href) || (href === "/markets/" && (path.startsWith("/companies") || path.startsWith("/simulator") || path.startsWith("/calculator"))) || (href === "/library/" && path.startsWith("/search")) || (href === "/me/" && (path.startsWith("/settings") || path.startsWith("/plans"))));
  return (
    <nav className="bottomnav" aria-label="Main">
      <div>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className="press">
            <span><Icon name={n.icon} size={20} stroke={2.1} /></span>{n.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** Screen with header, scrollable content, optional sticky primary action and bottom nav. */
export function Screen({ children, top, sticky, nav = true, guard = true, mature = false }: { children: ReactNode; top?: ReactNode; sticky?: ReactNode; nav?: boolean; guard?: boolean; mature?: boolean }) {
  return (
    <div className={mature ? "frame mature" : "frame"}>
      {guard && <SessionGuard />}
      {top}
      <main id="main" className={`main${sticky ? " has-sticky" : ""}`}>{children}</main>
      {sticky && <footer className="sticky-cta">{sticky}</footer>}
      {nav && !sticky && <BottomNav />}
    </div>
  );
}

/** Sends visitors without a demo session to the welcome screen. */
export function SessionGuard({ admin = false }: { admin?: boolean }) {
  const session = useStore("session");
  const hydrated = useHydrated();
  const router = useRouter();
  useEffect(() => {
    if (!hydrated) return;
    if (!session) router.replace("/welcome/");
    else if (admin && session.role !== "admin") router.replace("/admin/sign-in/");
  }, [hydrated, session, admin, router]);
  return null;
}

/* ---------- Money and labels ---------- */

/** Visible financial safety (build plan §4.5): every simulated value carries a label. */
export function VirtualLabel({ kind }: { kind: "virtual" | "demo" }) {
  return <span className="tag tag-demo" data-virtual-label={kind}>{kind === "virtual" ? "Virtual money" : "Demo data"}</span>;
}

export function Money({ kobo, sign, className }: { kobo: number; sign?: boolean; className?: string }) {
  return <span className={`num ${className ?? ""}`}>{formatNaira(kobo, { sign })}</span>;
}

/** Gains and losses use an arrow, a sign and colour, never colour alone. */
export function Change({ kobo, pct, label }: { kobo?: number; pct?: number; label?: string }) {
  const v = kobo ?? pct ?? 0;
  const dir = v > 0 ? "up" : v < 0 ? "down" : "";
  const word = v > 0 ? "up" : v < 0 ? "down" : "no change";
  return (
    <span className={`num ${dir}`} style={{ display: "inline-flex", alignItems: "center", gap: 2, fontWeight: 700 }}>
      {v !== 0 && <Icon name={v > 0 ? "arrowUp" : "arrowDown"} size={15} stroke={2.4} />}
      <span className="sr">{label ? `${label} ` : ""}{word} </span>
      {kobo !== undefined && formatNaira(kobo, { sign: true })}
      {kobo !== undefined && pct !== undefined && " "}
      {pct !== undefined && `${kobo !== undefined ? "(" : ""}${pct > 0 ? "+" : ""}${pct.toFixed(1)}%${kobo !== undefined ? ")" : ""}`}
    </span>
  );
}

/* ---------- Feedback states ---------- */

export function Notice({ tone = "info", children, icon }: { tone?: "info" | "warn" | "bad" | "good"; children: ReactNode; icon?: string }) {
  return <div className={`notice notice-${tone}`} role={tone === "bad" ? "alert" : undefined}><Icon name={icon ?? (tone === "bad" || tone === "warn" ? "alert" : tone === "good" ? "check" : "info")} size={20} /><div className="grow">{children}</div></div>;
}

export function Empty({ title, body, action, mood = "think" }: { title: string; body: string; action?: ReactNode; mood?: "think" | "sleep" | "confused" | "happy" }) {
  return (
    <div className="col center in" style={{ alignItems: "center", padding: "24px 8px", gap: 10 }}>
      <Fin mood={mood} size={88} />
      <h2>{title}</h2>
      <p className="muted" style={{ maxWidth: 320 }}>{body}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="col center" style={{ alignItems: "center", padding: "24px 8px", gap: 10 }} role="alert">
      <Fin mood="oops" size={80} />
      <h2>Something went wrong</h2>
      <p className="muted">{message}</p>
      <button type="button" className="btn btn-w btn-sm" onClick={onRetry}>Try again</button>
    </div>
  );
}

export function Skeleton({ h = 20, w = "100%", r = 10 }: { h?: number; w?: number | string; r?: number }) {
  return <div className="sk" style={{ height: h, width: w, borderRadius: r }} aria-hidden="true" />;
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return <div className="col" aria-busy="true" aria-live="polite"><span className="sr">{label}</span><Skeleton h={88} r={20} /><Skeleton h={20} w="60%" /><Skeleton h={56} r={16} /><Skeleton h={56} r={16} /></div>;
}

/* ---------- Overlays ---------- */

function useEscape(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
}

function useFocusTrap(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prev = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(el.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])'));
    (el.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0] ?? el).focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const f = focusables(); if (!f.length) return;
      const first = f[0]!, last = f[f.length - 1]!;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    el.addEventListener("keydown", onKey);
    return () => { el.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [ref]);
}

export function Sheet({ title, onClose, children, labelledBy }: { title?: string; onClose: () => void; children: ReactNode; labelledBy?: string }) {
  const id = useId();
  const ref = useRef<HTMLElement>(null);
  useEscape(onClose);
  useFocusTrap(ref);
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section ref={ref} className="sheet" role="dialog" aria-modal="true" aria-labelledby={labelledBy ?? (title ? id : undefined)} tabIndex={-1}>
        <span className="grabber" aria-hidden="true" />
        {title && <div className="row between"><h2 id={id}>{title}</h2><button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" /></button></div>}
        {children}
      </section>
    </div>
  );
}

export function Dialog({ title, body, confirm, cancel = "Cancel", onConfirm, onCancel, destructive }: { title: string; body: ReactNode; confirm: string; cancel?: string; onConfirm: () => void; onCancel: () => void; destructive?: boolean }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEscape(onCancel);
  useFocusTrap(ref);
  return (
    <div className="scrim center">
      <div ref={ref} className="dialog" role="alertdialog" aria-modal="true" aria-labelledby={id}>
        <h2 id={id}>{title}</h2>
        <div className="muted">{body}</div>
        <button type="button" className={`btn ${destructive ? "btn-r" : ""}`} onClick={onConfirm}>{confirm}</button>
        <button type="button" className="link-btn" data-autofocus onClick={onCancel}>{cancel}</button>
      </div>
    </div>
  );
}

/* ---------- Toasts with Undo ---------- */

type ToastItem = { id: number; text: string; undo?: () => void };
const ToastCtx = createContext<(text: string, undo?: () => void) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text: string, undo?: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), text, undo });
    timer.current = setTimeout(() => setToast(null), undo ? 5000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-wrap" aria-live="polite" role="status">
        {toast && (
          <div className="toast in" key={toast.id}>
            <span className="grow">{toast.text}</span>
            {toast.undo && <button type="button" className="link-btn" onClick={() => { toast.undo!(); setToast(null); }}><Icon name="undo" size={18} />Undo</button>}
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Small pieces ---------- */

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)}><span /></button>;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return <div className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><div style={{ width: `${pct}%` }} /></div>;
}

export function Monogram({ text }: { text: string }) {
  return <span className="tile" aria-hidden="true">{text.slice(0, 3)}</span>;
}

export function Sparkline({ values, width = 300, height = 90, label }: { values: number[]; width?: number; height?: number; label: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 6 - ((v - min) / span) * (height - 12)}`).join(" ");
  const upTrend = values[values.length - 1]! >= values[0]!;
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={upTrend ? "#16884A" : "#D92B2B"} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
