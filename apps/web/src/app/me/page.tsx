"use client";
import Link from "next/link";
import { streak } from "@finvora/domain";
import { levelFor, ACHIEVEMENTS } from "@finvora/engine";
import { Screen, TopBar, ProgressBar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Fin } from "@/components/Fin";
import { api, today } from "@/lib/api";
import { useStore } from "@/lib/store";

export default function Me() {
  const session = useStore("session");
  const learning = useStore("learning");
  const billing = useStore("billing");
  const lib = useStore("library");
  const ent = api.entitlements();
  const lvl = levelFor(learning.xp);
  const done = Object.values(learning.lessons).filter((l) => l.status === "complete").length;
  const earned: (keyof typeof ACHIEVEMENTS)[] = [];
  if (done >= 1) earned.push("first-lesson");
  if (Object.values(learning.lessons).some((l) => l.bestScore === 1)) earned.push("perfect-lesson");
  if (learning.lessons["boss-foundations"]?.status === "complete") earned.push("world-money-foundations");
  if (lib.read.length >= 5) earned.push("curious-mind");

  return (
    <Screen top={<TopBar title="Me" right={<Link href="/settings/" className="icon-btn" aria-label="Settings"><Icon name="settings" /></Link>} />}>
      <div className="row"><Fin mood="happy" size={64} /><div className="grow"><h1 style={{ fontSize: 22 }}>{session?.name ?? "Learner"}</h1><span className="small muted">{session?.email}</span></div></div>
      <section className="card card-pad col" style={{ gap: 8 }}>
        <div className="row between"><strong>{lvl.title}</strong><span className="small muted num">{learning.xp} XP</span></div>
        <ProgressBar value={lvl.progress} label="Level progress" />
        <div className="grid2 small">
          <div><strong className="num" style={{ fontSize: 20 }}>{done}</strong><br /><span className="muted">lessons done</span></div>
          <div><strong className="num" style={{ fontSize: 20 }}>{streak(learning.activeDays, today())}</strong><br /><span className="muted">day streak</span></div>
        </div>
      </section>
      <section className="col" style={{ gap: 8 }}>
        <h2>Achievements</h2>
        {earned.length === 0 ? <p className="small muted">Finish your first lesson to earn your first achievement.</p> : (
          <div className="chips">{earned.map((a) => <span key={a} className="tag" style={{ minHeight: 32 }} title={ACHIEVEMENTS[a].description}><Icon name="star" size={14} />{ACHIEVEMENTS[a].title}</span>)}</div>
        )}
      </section>
      <ul className="card" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        <li><Link className="li" href="/plans/"><Icon name="sparkle" /><span className="grow"><strong style={{ display: "block" }}>Your plan: {ent.plan === "plus" ? "Plus" : "Free"}</strong><span className="small muted">{ent.plan === "plus" ? (billing.sub.cancelled ? `Cancelled. Plus stays until ${billing.sub.renewsOn}.` : `Renews ${billing.sub.renewsOn ?? ""}`) : "Unlimited Ask Fin and more with Plus"}</span></span><Icon name="chevron" size={20} /></Link></li>
        <li><Link className="li" href="/me/saved/"><Icon name="bookmark" /><span className="grow">Saved articles <span className="muted">({lib.saved.length})</span></span><Icon name="chevron" size={20} /></Link></li>
        <li><Link className="li" href="/simulator/history/"><Icon name="history" /><span className="grow">Practice trade history</span><Icon name="chevron" size={20} /></Link></li>
        <li><Link className="li" href="/ask/"><Fin size={22} /><span className="grow">Ask Fin history</span><Icon name="chevron" size={20} /></Link></li>
        <li><Link className="li" href="/settings/"><Icon name="settings" /><span className="grow">Settings</span><Icon name="chevron" size={20} /></Link></li>
      </ul>
    </Screen>
  );
}
