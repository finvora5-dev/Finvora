"use client";
import Link from "next/link";
import { useState } from "react";
import { isUnlocked, streak } from "@finvora/domain";
import { levelFor } from "@finvora/engine";
import { Screen, TopBar, ProgressBar, Sheet } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Fin } from "@/components/Fin";
import { api, today } from "@/lib/api";
import { useStore, useHydrated } from "@/lib/store";

export default function Journey() {
  const learning = useStore("learning");
  const hydrated = useHydrated();
  const [locked, setLocked] = useState<string | null>(null);
  const order = api.lessonOrder();
  const lvl = levelFor(learning.xp);
  const done = order.filter((id) => learning.lessons[id]?.status === "complete").length;

  return (
    <Screen top={<TopBar title="Learn" right={<Link href="/search/" className="icon-btn" aria-label="Search lessons"><Icon name="search" /></Link>} />}>
      <section className="card card-pad col" style={{ gap: 8 }} aria-label="Your progress">
        <div className="row between"><strong>{lvl.title}</strong><span className="num small muted">{learning.xp} XP</span></div>
        <ProgressBar value={lvl.progress} label={lvl.next ? `Progress to ${lvl.next.title}` : "Top level reached"} />
        <span className="small muted">{lvl.next ? `${lvl.next.minXp - learning.xp} XP to ${lvl.next.title}` : "Top level reached"}{hydrated && streak(learning.activeDays, today()) > 0 ? ` · ${streak(learning.activeDays, today())}-day streak` : ""}</span>
      </section>

      {api.worlds().map((w) => (
        <section key={w.id} className="col" aria-labelledby={`w-${w.id}`}>
          <div>
            <span className="eyebrow muted">World {w.order}</span>
            <h2 id={`w-${w.id}`}>{w.title}</h2>
            <p className="muted small">{w.summary}{w.available ? ` · ${done} of ${order.length} done` : ""}</p>
          </div>
          {w.available ? (
            <ol className="card" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {[...w.lessonIds, ...(w.bossId ? [w.bossId] : [])].map((id, i) => {
                const l = api.lesson(id)!;
                const st = learning.lessons[id];
                const unlocked = isUnlocked(learning, order, id);
                const status = st?.status === "complete" ? "Done" : st?.status === "inProgress" ? `In progress · step ${st.step + 1} of ${l.steps.length}` : unlocked ? `${l.minutes} min` : "Locked";
                const tile = <span className="tile" style={st?.status === "complete" ? { background: "var(--success-bg)", color: "#0F6B39" } : !unlocked ? { background: "#F3F1F6", color: "var(--muted)" } : undefined}>{st?.status === "complete" ? <Icon name="check" /> : !unlocked ? <Icon name="lock" size={20} /> : l.kind === "boss" ? <Icon name="star" /> : i + 1}</span>;
                const body = <><span className="grow"><strong style={{ display: "block" }}>{l.title}</strong><span className="small muted">{status}</span></span><Icon name="chevron" size={20} /></>;
                return (
                  <li key={id}>
                    {unlocked
                      ? <Link className="li" href={`/learn/${id}/`} aria-label={`${l.title}, ${status}`}>{tile}{body}</Link>
                      : <button type="button" className="li" onClick={() => setLocked(l.title)} aria-label={`${l.title}, locked`}>{tile}{body}</button>}
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="card card-pad col" style={{ gap: 8, background: "#FAF9FC" }}>
              <div className="row"><span className="tile" style={{ background: "#F3F1F6", color: "var(--muted)" }}><Icon name="lock" size={20} /></span><span className="grow small muted">Coming soon. Planned topics: {w.plannedTopics?.join(", ")}.</span></div>
            </div>
          )}
        </section>
      ))}

      {locked && (
        <Sheet title="Not unlocked yet" onClose={() => setLocked(null)}>
          <div className="row"><Fin mood="think" size={56} /><p>Finish the lessons before <strong>{locked}</strong> to unlock it. Each one builds on the last.</p></div>
          <button type="button" className="btn" onClick={() => setLocked(null)}>Got it</button>
        </Sheet>
      )}
    </Screen>
  );
}
