"use client";
import Link from "next/link";
import { useState } from "react";
import { Screen, TopBar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { SuggestSheet } from "@/components/FeedbackSheets";
import { api } from "@/lib/api";
import { update, useStore } from "@/lib/store";

export default function Library() {
  const prefs = useStore("prefs");
  const fb = useStore("feedback");
  const [suggest, setSuggest] = useState(false);
  const topic = prefs.libraryTopic;
  const all = api.articles();
  const list = topic === "All" ? all : all.filter((a) => a.category === topic);
  const word = all[new Date().getDate() % all.length]!;

  return (
    <Screen top={<TopBar title="Library" right={<Link href="/me/saved/" className="icon-btn" aria-label="Saved articles"><Icon name="bookmark" /></Link>} />}>
      <Link href="/search/" className="field row" style={{ textDecoration: "none", color: "var(--muted)" }}><Icon name="search" />Search articles, lessons and companies</Link>
      <Link href={`/library/${word.slug}/`} className="card card-pad card-tint col press" style={{ textDecoration: "none", color: "inherit", gap: 4 }}>
        <span className="eyebrow" style={{ color: "var(--link)" }}>Word of the day</span><h2>{word.title}</h2><p className="small muted">{word.definition}</p>
      </Link>
      <div className="chips-scroll" role="group" aria-label="Filter by topic">
        {["All", ...api.topics()].map((t) => <button key={t} type="button" className="chip" style={{ flex: "none" }} aria-pressed={topic === t} onClick={() => update("prefs", (p) => ({ ...p, libraryTopic: t }))}>{t}</button>)}
      </div>
      <ul className="card rlist" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {list.map((a) => (
          <li key={a.slug}><Link href={`/library/${a.slug}/`} className="li"><span className="grow"><strong style={{ display: "block" }}>{a.title}</strong><span className="small muted">{a.category}</span></span><Icon name="chevron" size={20} /></Link></li>
        ))}
      </ul>
      {fb.prompts.suggestTopic.enabled && (
        <button type="button" className="card card-pad row press" style={{ font: "inherit", textAlign: "left", cursor: "pointer" }} onClick={() => setSuggest(true)}>
          <span className="tile"><Icon name="plus" /></span><span className="grow"><strong style={{ display: "block" }}>Can&apos;t find a topic?</strong><span className="small muted">Suggest one and we&apos;ll consider writing it.</span></span>
        </button>
      )}
      {suggest && <SuggestSheet onClose={() => setSuggest(false)} />}
    </Screen>
  );
}
