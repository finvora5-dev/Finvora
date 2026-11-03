"use client";
import Link from "next/link";
import { useState } from "react";
import { XP } from "@finvora/engine";
import { markActive } from "@finvora/domain";
import { Screen, TopBar } from "@/components/ui";
import { Fin } from "@/components/Fin";
import { api, today } from "@/lib/api";
import { update, useStore, useHydrated } from "@/lib/store";

export default function Daily() {
  const q = api.daily();
  const learning = useStore("learning");
  const hydrated = useHydrated();
  const [pick, setPick] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const already = hydrated && learning.dailyDoneOn === today() && !checked;
  const correct = pick === q.correct;

  function submit() {
    setChecked(true);
    update("learning", (l) => (l.dailyDoneOn === today() ? l : { ...l, dailyDoneOn: today(), xp: l.xp + XP.dailyComplete + (correct ? XP.dailyCorrectBonus : 0), activeDays: markActive(l.activeDays, today()) }));
  }

  return (
    <Screen top={<TopBar back="/" title="Daily question" />} sticky={already ? <Link href="/" className="btn">Back to Home</Link> : checked ? <Link href="/" className="btn">Done</Link> : <button type="button" className="btn" disabled={!pick} onClick={submit}>Check</button>}>
      {already ? (
        <div className="col center" style={{ alignItems: "center" }}><Fin mood="proud" size={96} /><h1>You&apos;ve done today&apos;s question</h1><p className="muted">A new one arrives tomorrow.</p></div>
      ) : (
        <>
          <h1 style={{ fontSize: 22 }} id="dq">{q.prompt}</h1>
          <div className="col" role="radiogroup" aria-labelledby="dq">
            {q.options.map((o) => <button key={o.id} type="button" role="radio" aria-checked={pick === o.id} disabled={checked} className={`option ${checked && pick === o.id ? (correct ? "right" : "wrong") : ""}`} onClick={() => setPick(o.id)}>{o.text}</button>)}
          </div>
          {checked && <div className={`notice ${correct ? "notice-good" : "notice-bad"}`} role="status"><div><strong>{correct ? "Correct" : "Not quite"}</strong><p className="small">{q.explanation}</p><p className="small">+{XP.dailyComplete + (correct ? XP.dailyCorrectBonus : 0)} XP</p></div></div>}
        </>
      )}
    </Screen>
  );
}
