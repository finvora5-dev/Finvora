"use client";
import { useState } from "react";
import type { PromptId } from "@finvora/domain";
import { AdminShell } from "@/components/AdminShell";
import { Dialog, Switch, useToast } from "@/components/ui";
import { api } from "@/lib/api";
import { update, useStore } from "@/lib/store";

const META: Record<PromptId, { t: string; d: string }> = {
  rateLesson: { t: "Rate this lesson", d: "Shown after a lesson is finished." },
  reportMistake: { t: "Report a mistake", d: "Flag button on lessons and articles." },
  suggestTopic: { t: "Suggest a topic", d: "Card in the Library and on empty search." },
  appReview: { t: "App store review", d: "At most once every 90 days." },
};

export default function FeedbackSettings() {
  const fb = useStore("feedback");
  const toast = useToast();
  const [confirmOff, setConfirmOff] = useState<PromptId | null>(null);

  function set(id: PromptId, patch: Partial<(typeof fb.prompts)[PromptId]>, change: string) {
    update("feedback", (f) => ({ ...f, prompts: { ...f.prompts, [id]: { ...f.prompts[id], ...patch } } }));
    api.admin.audit("Feedback settings", change);
    toast("Saved. Learners see this straight away.");
  }

  return (
    <AdminShell title="Feedback settings">
      <p className="muted">When a prompt is off, its entry point is removed from the app completely.</p>
      <div className="col">
        {(Object.keys(META) as PromptId[]).map((id) => {
          const p = fb.prompts[id];
          return (
            <section key={id} className="card card-pad col" style={{ gap: 10 }}>
              <div className="row between"><div><h2 style={{ fontSize: 17 }}>{META[id].t}</h2><p className="small muted">{META[id].d}</p></div>
                <Switch label={`${META[id].t} ${p.enabled ? "on" : "off"}`} checked={p.enabled} onChange={(v) => (v ? set(id, { enabled: true }, `${META[id].t} turned on`) : setConfirmOff(id))} /></div>
              {id === "rateLesson" && p.enabled && (
                <label className="row small">Show to 1 in
                  <select className="field" style={{ width: "auto", minHeight: 44 }} value={p.frequencyOneIn} onChange={(e) => set(id, { frequencyOneIn: Number(e.target.value) }, `Rate this lesson shown to 1 in ${e.target.value}`)}>{[1, 2, 3, 5, 10].map((n) => <option key={n} value={n}>{n}</option>)}</select>learners
                </label>
              )}
              <p className="xs muted">Preview: {p.enabled ? "visible to learners" : "Hidden from learners"}</p>
            </section>
          );
        })}
      </div>
      {confirmOff && <Dialog title={`Turn off ${META[confirmOff].t}?`} body="Learners will no longer see this prompt or its button." confirm="Turn off" onConfirm={() => { set(confirmOff, { enabled: false }, `${META[confirmOff].t} turned off`); setConfirmOff(null); }} onCancel={() => setConfirmOff(null)} />}
    </AdminShell>
  );
}
