"use client";
// Rate / Report / Suggest sheets. Entry points are removed entirely when admin turns a prompt off.
import { useState } from "react";
import { api } from "@/lib/api";
import { Sheet } from "./ui";
import { Fin } from "./Fin";
import { Icon } from "./Icon";

const WORDS = ["", "Not for me", "Could be better", "It was okay", "Good lesson", "Loved it"];

function Thanks({ onClose, text }: { onClose: () => void; text: string }) {
  return (
    <div className="col center" style={{ alignItems: "center" }}>
      <Fin mood="proud" size={88} /><h2>Thank you</h2><p className="muted">{text}</p>
      <button type="button" className="btn" onClick={onClose}>Done</button>
    </div>
  );
}

export function RateSheet({ where, onClose }: { where: string; onClose: () => void }) {
  const [r, setR] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const T = ["Loved the example", "Too easy", "Too hard", "Confusing", "Want more like this"];
  return (
    <Sheet title={sent ? undefined : "How was this lesson?"} onClose={onClose}>
      {sent ? <Thanks onClose={onClose} text="Your rating helps us make lessons clearer for everyone." /> : <>
        <div role="radiogroup" aria-label="Rating out of 5" className="row" style={{ justifyContent: "space-between" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={r === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setR(n)} className="icon-btn" style={{ width: 52, height: 52 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill={n <= r ? "#FBBF24" : "#FFFFFF"} stroke={n <= r ? "#F59E0B" : "#D3CDE0"} strokeWidth="1.6" strokeLinejoin="round" /></svg>
            </button>
          ))}
        </div>
        <p aria-live="polite" className="center" style={{ fontWeight: 700, color: "var(--link)", minHeight: 24 }}>{WORDS[r] || "Tap a star"}</p>
        <div className="chips">{T.map((t) => <button key={t} type="button" className="chip" aria-pressed={tags.includes(t)} onClick={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))}>{t}</button>)}</div>
        <button type="button" className="btn" disabled={!r} onClick={() => { api.submitFeedback("rate", where, `${r} stars${tags.length ? " · " + tags.join(", ") : ""}`); setSent(true); }}>Send rating</button>
        <button type="button" className="link-btn" onClick={onClose}>Not now</button>
      </>}
    </Sheet>
  );
}

export function ReportSheet({ where, onClose, onSent }: { where: string; onClose: () => void; onSent?: () => void }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const R = ["Wrong answer or fact", "Typo or unclear wording", "Outdated example", "Something else"];
  return (
    <Sheet title="Report a mistake" onClose={onClose}>
      <p className="small muted">About: {where}</p>
      <div className="col" role="radiogroup" aria-label="What's wrong?" style={{ gap: 8 }}>
        {R.map((x) => <button key={x} type="button" role="radio" aria-checked={reason === x} className="option" onClick={() => setReason(x)}>{x}</button>)}
      </div>
      <div><label className="label" htmlFor="rep-note">Add a note (optional)</label><textarea id="rep-note" className="field" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></div>
      <button type="button" className="btn" disabled={!reason} onClick={() => { api.submitFeedback("report", where, reason + (note ? ` · ${note}` : "")); onSent?.(); onClose(); }}><Icon name="flag" size={18} />Send report</button>
    </Sheet>
  );
}

export function SuggestSheet({ onClose, initial = "" }: { onClose: () => void; initial?: string }) {
  const [text, setText] = useState(initial);
  const [sent, setSent] = useState(false);
  return (
    <Sheet title={sent ? undefined : "Suggest a topic"} onClose={onClose}>
      {sent ? <Thanks onClose={onClose} text="We read every suggestion when planning new articles." /> : <>
        <div><label className="label" htmlFor="sug">What would you like explained?</label><textarea id="sug" className="field" rows={3} maxLength={300} value={text} onChange={(e) => setText(e.target.value)} placeholder="For example: how pensions (RSA) work" /></div>
        <button type="button" className="btn" disabled={text.trim().length < 3} onClick={() => { api.submitFeedback("suggest", "Library", text.trim()); setSent(true); }}>Send suggestion</button>
      </>}
    </Sheet>
  );
}
