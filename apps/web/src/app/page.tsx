"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { nextForYou, streak } from "@finvora/domain";
import { levelFor } from "@finvora/engine";
import { Screen, TopBar, ProgressBar } from "@/components/ui";
import { Fin } from "@/components/Fin";
import { Icon } from "@/components/Icon";
import { api, today } from "@/lib/api";
import { useStore, useHydrated } from "@/lib/store";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function Home() {
  const router = useRouter();
  const hydrated = useHydrated();
  const session = useStore("session");
  const learning = useStore("learning");
  const sim = useStore("sim");
  const [q, setQ] = useState("");
  const order = api.lessonOrder();
  const next = nextForYou({ learning, lessonOrder: order, today: today(), simUsed: sim.account.trades.length > 0, marketMovedSinceVisit: sim.day !== sim.lastSeenDay });
  const lvl = levelFor(learning.xp);
  const days = streak(learning.activeDays, today());

  const card = (() => {
    switch (next.kind) {
      case "resume": { const l = api.lesson(next.lessonId)!; return { eyebrow: "Pick up where you left off", title: l.title, body: `Step ${next.step + 1} of ${l.steps.length}`, href: `/learn/${l.id}/`, cta: "Resume", progress: next.step / l.steps.length, icon: "learn" }; }
      case "start-first": { const l = api.lesson(next.lessonId)!; return { eyebrow: "Start here", title: l.title, body: `${l.minutes} min · ${l.objective}`, href: `/learn/${l.id}/`, cta: "Start your first lesson", icon: "learn" }; }
      case "daily": return { eyebrow: "Daily question", title: "One quick question for today", body: "About 30 seconds. Keeps your learning going.", href: "/daily/", cta: "Answer today's question", icon: "sparkle" };
      case "review-portfolio": return { eyebrow: "The market moved", title: "See how your virtual portfolio changed", body: "Prices in the simulator have moved since your last visit.", href: "/simulator/", cta: "Review your portfolio", icon: "sim" };
      case "next-lesson": { const l = api.lesson(next.lessonId)!; return { eyebrow: "Next for you", title: l.title, body: `${l.minutes} min · ${l.objective}`, href: `/learn/${l.id}/`, cta: l.kind === "boss" ? "Take the challenge" : "Start lesson", icon: "learn" }; }
      default: return { eyebrow: "World complete", title: "You've finished Money Foundations", body: "Try the simulator or explore the Library while new lessons arrive.", href: "/simulator/", cta: "Practise in the simulator", icon: "sim" };
    }
  })();

  return (
    <Screen mature top={<TopBar logo right={<><Link href="/search/" className="icon-btn" aria-label="Search"><Icon name="search" /></Link><Link href="/me/" className="icon-btn" aria-label="Profile"><Icon name="me" /></Link></>} />}>
      <div>
        <span className="muted small">{new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}</span>
        <h1>{greeting()}{hydrated && session ? `, ${session.name}` : ""}.</h1>
      </div>

      <div className="cols two">
      {hydrated ? (
        <Link href={card.href} className="card card-pad card-tint press in col" style={{ textDecoration: "none", color: "inherit", gap: 10 }} aria-label={`${card.eyebrow}: ${card.title}. ${card.cta}`}>
          <div className="row"><span className="tile" style={{ background: "#FFFFFF" }}><Icon name={card.icon} /></span><div className="grow"><span className="eyebrow" style={{ color: "var(--link)" }}>{card.eyebrow}</span><h2>{card.title}</h2></div></div>
          <p className="muted small">{card.body}</p>
          {"progress" in card && card.progress !== undefined && <ProgressBar value={card.progress} label="Lesson progress" />}
          <span className="btn" aria-hidden="true">{card.cta}</span>
        </Link>
      ) : <div />}

      <section className="card card-pad col" aria-labelledby="ask-h" style={{ gap: 10 }}>
        <div className="row"><Fin mood="happy" size={32} /><h2 id="ask-h" style={{ fontSize: 17 }}>Ask Fin</h2></div>
        <form className="row" onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/ask/?q=${encodeURIComponent(q.trim())}`); }}>
          <label className="grow"><span className="sr">Ask Fin a question</span><input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about a company or money idea" /></label>
          <button type="submit" className="btn btn-sm" style={{ width: 52, padding: 0 }} aria-label="Ask" disabled={!q.trim()}><Icon name="send" /></button>
        </form>
        <div className="chips">{["What is a dividend?", "Why is inflation high?", "What is a P/E ratio?"].map((p) => <Link key={p} href={`/ask/?q=${encodeURIComponent(p)}`} className="chip">{p}</Link>)}</div>
      </section>
      </div>

      {hydrated && (
        <div className="row small muted" style={{ gap: 16 }}>
          <span><strong className="num" style={{ color: "var(--ink)" }}>{learning.xp}</strong> XP · {lvl.title}</span>
          {days > 0 && <span><strong className="num" style={{ color: "var(--ink)" }}>{days}</strong> day{days === 1 ? "" : "s"} in a row</span>}
        </div>
      )}

      <h2>Explore</h2>
      <div className="grid2">
        {[
          { href: "/companies/", icon: "company", t: "Companies", d: "How Nigerian companies make money." },
          { href: "/simulator/", icon: "sim", t: "Simulator", d: "Practise with virtual money." },
          { href: "/library/", icon: "library", t: "Library", d: "Plain-English explanations." },
          { href: "/calculator/", icon: "calc", t: "Calculators", d: "See how money can grow." },
        ].map((x) => (
          <Link key={x.href} href={x.href} className="card card-pad press col" style={{ textDecoration: "none", color: "inherit", gap: 4 }}>
            <span style={{ color: "var(--link)" }}><Icon name={x.icon} size={24} /></span><strong>{x.t}</strong><span className="muted small">{x.d}</span>
          </Link>
        ))}
      </div>
    </Screen>
  );
}
