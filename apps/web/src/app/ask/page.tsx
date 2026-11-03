"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { suggestedPrompts } from "@finvora/domain";
import { Screen, TopBar, Notice } from "@/components/ui";
import { AskAnswer } from "@/components/AskSheet";
import { Fin } from "@/components/Fin";
import { Icon } from "@/components/Icon";
import { api, ApiError } from "@/lib/api";
import { useStore, useHydrated } from "@/lib/store";

export default function Ask() {
  const ask = useStore("ask");
  useStore("billing");
  const hydrated = useHydrated();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<{ q: string; msg: string } | null>(null);
  const [limited, setLimited] = useState(false);
  const started = useRef(false);
  const status = hydrated ? api.askStatus() : { allowed: true, remaining: null, used: 0 };

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    if (!api.askStatus().allowed) { setLimited(true); return; }
    setBusy(true); setPending(t); setError(null); setQ("");
    try { await api.ask(t, null); }
    catch (e) { if (e instanceof ApiError && e.code === "limit") setLimited(true); else setError({ q: t, msg: e instanceof Error ? e.message : "Something went wrong." }); }
    finally { setBusy(false); setPending(null); }
  }

  useEffect(() => {
    if (!hydrated || started.current) return;
    started.current = true;
    const pre = new URLSearchParams(window.location.search).get("q");
    if (pre) void send(pre);
  });

  useEffect(() => { window.scrollTo({ top: document.body.scrollHeight }); }, [ask.history.length, pending]);

  return (
    <Screen top={<TopBar back="/" title="Ask Fin" />} sticky={
      limited || (hydrated && !status.allowed) ? (
        <Notice><strong>You&apos;ve used today&apos;s {api.entitlements().askFinDailyLimit} free questions.</strong> They reset at midnight (Lagos time). The Library is always free. <Link href="/plans/">See Plus</Link> for unlimited questions.</Notice>
      ) : (
        <form className="row" onSubmit={(e) => { e.preventDefault(); void send(q); }}>
          <label className="grow"><span className="sr">Your question</span><input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about a money idea or company" maxLength={300} /></label>
          <button type="submit" className="btn btn-sm" style={{ width: 52, padding: 0 }} aria-label="Send" disabled={busy || !q.trim()}><Icon name="send" /></button>
        </form>
      )
    }>
      {hydrated && ask.history.length === 0 && !pending && (
        <div className="col" style={{ alignItems: "center", textAlign: "center" }}>
          <Fin mood="wave" size={96} />
          <h1 style={{ fontSize: 22 }}>Ask me about money, investing or a company</h1>
          <p className="muted small">I explain ideas in plain words with Nigerian examples. I don&apos;t tell anyone what to buy or sell.</p>
          <div className="chips" style={{ justifyContent: "center" }}>{suggestedPrompts(null).map((p) => <button key={p} type="button" className="chip" onClick={() => void send(p)}>{p}</button>)}</div>
        </div>
      )}
      <div className="col" aria-live="polite" style={{ gap: 18 }}>
        {ask.history.map((h, i) => (
          <div key={i} className="col" style={{ gap: 8 }}>
            <p style={{ alignSelf: "flex-end", background: "var(--tint)", padding: "8px 12px", borderRadius: 14, fontWeight: 600, maxWidth: "85%" }}>{h.q}</p>
            <div className="row" style={{ alignItems: "flex-start" }}><Fin mood={h.r.kind === "answer" ? "talk" : "think"} size={32} /><div className="grow"><AskAnswer r={h.r} />
              {i === ask.history.length - 1 && h.r.followUps.length > 0 && <div className="chips" style={{ marginTop: 8 }}>{h.r.followUps.map((f) => <button key={f} type="button" className="chip" onClick={() => void send(f)} disabled={busy}>{f}</button>)}</div>}
            </div></div>
          </div>
        ))}
        {pending && <div className="col" style={{ gap: 8 }}><p style={{ alignSelf: "flex-end", background: "var(--tint)", padding: "8px 12px", borderRadius: 14, fontWeight: 600 }}>{pending}</p><div className="row"><Fin mood="think" size={32} /><span className="muted">Fin is thinking <span className="dot">●</span><span className="dot" style={{ animationDelay: ".2s" }}>●</span><span className="dot" style={{ animationDelay: ".4s" }}>●</span></span></div></div>}
        {error && <div className="notice notice-bad" role="alert"><div className="grow">{error.msg} <button type="button" className="link-btn" onClick={() => void send(error.q)}>Try again</button></div></div>}
      </div>
      {hydrated && status.remaining !== null && status.allowed && <p className="xs muted center">{status.remaining} free question{status.remaining === 1 ? "" : "s"} left today</p>}
    </Screen>
  );
}
