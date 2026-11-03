"use client";
// Context-aware Ask Fin (build plan §4.4): opens over the current screen so the learner keeps their place.
import Link from "next/link";
import { useState } from "react";
import { suggestedPrompts, type AskContext, type AskResponse } from "@finvora/domain";
import { api, ApiError } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Sheet } from "./ui";
import { Fin } from "./Fin";
import { Icon } from "./Icon";

export function AskAnswer({ r }: { r: AskResponse }) {
  return (
    <div className="col" style={{ gap: 10 }}>
      <p>{r.answer}</p>
      {r.citations.length > 0 && (
        <div className="col" style={{ gap: 6 }}>
          <span className="eyebrow muted">From the Finvora Library</span>
          <div className="chips">{r.citations.map((c) => <Link key={c.articleSlug} className="chip" href={`/library/${c.articleSlug}/`}><Icon name="library" size={16} />{c.title}</Link>)}</div>
        </div>
      )}
      <p className="xs muted">Fin explains ideas for learning. It doesn&apos;t give financial advice.</p>
    </div>
  );
}

export function AskSheet({ context, onClose }: { context: AskContext; onClose: () => void }) {
  useStore("ask");
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<{ q: string; r?: AskResponse; error?: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [limited, setLimited] = useState(false);
  const status = api.askStatus();
  const prompts = turns.length ? (turns[turns.length - 1]!.r?.followUps ?? []) : suggestedPrompts(context);

  async function send(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    if (!api.askStatus().allowed) { setLimited(true); return; }
    setBusy(true); setQ("");
    setTurns((t) => [...t, { q: text }]);
    try {
      const r = await api.ask(text, context);
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, r } : x)));
    } catch (e) {
      if (e instanceof ApiError && e.code === "limit") setLimited(true);
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, error: e instanceof Error ? e.message : "Something went wrong." } : x)));
    } finally { setBusy(false); }
  }

  return (
    <Sheet title="Ask Fin" onClose={onClose}>
      {context && <span className="tag" style={{ alignSelf: "flex-start" }}>About: {context.label}</span>}
      {turns.length === 0 && <div className="row"><Fin mood="wave" size={48} /><p className="muted">Ask me anything about this. I&apos;ll explain it in plain words.</p></div>}
      <div className="col" aria-live="polite">
        {turns.map((t, i) => (
          <div key={i} className="col" style={{ gap: 8 }}>
            <p style={{ alignSelf: "flex-end", background: "var(--tint)", padding: "8px 12px", borderRadius: 14, fontWeight: 600, maxWidth: "85%" }}>{t.q}</p>
            {t.r ? <AskAnswer r={t.r} /> : t.error ? (
              <div className="notice notice-bad" role="alert"><div className="grow">{t.error} <button type="button" className="link-btn" onClick={() => { setTurns((x) => x.slice(0, i)); void send(t.q); }}>Try again</button></div></div>
            ) : <p className="muted" aria-label="Fin is typing"><span className="dot">●</span> <span className="dot" style={{ animationDelay: ".2s" }}>●</span> <span className="dot" style={{ animationDelay: ".4s" }}>●</span></p>}
          </div>
        ))}
      </div>
      {limited ? (
        <div className="notice notice-info"><div className="grow col" style={{ gap: 8 }}>
          <strong>You&apos;ve used today&apos;s free questions</strong>
          <span className="small">Free includes {api.entitlements().askFinDailyLimit} questions a day. They reset at midnight (Lagos time). The Library is always free.</span>
          <div className="row wrap"><Link href="/plans/" className="btn btn-sm">See Plus</Link><Link href="/library/" className="link-btn">Open the Library</Link></div>
        </div></div>
      ) : (
        <>
          <div className="chips">{prompts.map((p) => <button key={p} type="button" className="chip" onClick={() => void send(p)} disabled={busy}>{p}</button>)}</div>
          <form className="row" onSubmit={(e) => { e.preventDefault(); void send(q); }}>
            <label className="grow"><span className="sr">Your question</span><input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a question" maxLength={300} /></label>
            <button type="submit" className="btn btn-sm" style={{ width: 52, padding: 0 }} aria-label="Send" disabled={busy || !q.trim()}><Icon name="send" /></button>
          </form>
          {status.remaining !== null && <p className="xs muted">{status.remaining} free question{status.remaining === 1 ? "" : "s"} left today</p>}
          <Link href="/ask/" className="link-btn" style={{ alignSelf: "center" }}>Open full chat</Link>
        </>
      )}
    </Sheet>
  );
}
