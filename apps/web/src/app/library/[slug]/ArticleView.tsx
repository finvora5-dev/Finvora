"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Screen, TopBar, useToast } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Fin } from "@/components/Fin";
import { AskSheet } from "@/components/AskSheet";
import { ReportSheet } from "@/components/FeedbackSheets";
import { api } from "@/lib/api";
import { update, useStore } from "@/lib/store";

export function ArticleView({ slug }: { slug: string }) {
  const a = api.article(slug)!;
  const lib = useStore("library");
  const fb = useStore("feedback");
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const [reporting, setReporting] = useState(false);
  const saved = lib.saved.includes(slug);
  useEffect(() => { update("library", (l) => (l.read.includes(slug) ? l : { ...l, read: [...l.read, slug] })); }, [slug]);

  function toggleSave() {
    update("library", (l) => ({ ...l, saved: saved ? l.saved.filter((s) => s !== slug) : [...l.saved, slug] }));
    toast(saved ? "Removed from saved" : "Saved for later", saved ? () => update("library", (l) => ({ ...l, saved: [...l.saved, slug] })) : undefined);
  }

  const lessons = api.lessons().filter((l) => l.relatedArticles.includes(slug));

  return (
    <Screen top={<TopBar back={true} title={a.title} right={<>
      <button type="button" className="icon-btn" aria-label={saved ? "Remove from saved" : "Save article"} aria-pressed={saved} onClick={toggleSave} style={{ color: saved ? "var(--primary)" : undefined }}><Icon name="bookmark" /></button>
      {fb.prompts.reportMistake.enabled && <button type="button" className="icon-btn" aria-label="Report a mistake" onClick={() => setReporting(true)}><Icon name="flag" size={20} /></button>}
    </>} />} nav={false} sticky={<button type="button" className="btn btn-w" onClick={() => setAsking(true)}><Fin size={26} />Ask Fin about this</button>}>
      <div className="col prose" style={{ gap: 16 }}>
      <span className="tag" style={{ alignSelf: "flex-start" }}>{a.category}</span>
      <h2 className="h1">{a.title}</h2>
      <p style={{ fontSize: 18, fontWeight: 600 }}>{a.definition}</p>
      {a.explanation.map((p, i) => <p key={i}>{p}</p>)}
      <div className="card card-pad card-tint"><span className="eyebrow" style={{ color: "var(--link)" }}>Example</span><p>{a.example}</p></div>
      <section><h2>Why it matters</h2><p>{a.whyItMatters}</p></section>
      {a.misconceptions.length > 0 && <section><h2>Common mix-up</h2>{a.misconceptions.map((m) => <p key={m}>{m}</p>)}</section>}
      {lessons.length > 0 && <section className="col" style={{ gap: 8 }}><h2>Practise it</h2>{lessons.map((l) => <Link key={l.id} href={`/learn/${l.id}/`} className="card card-pad row press" style={{ textDecoration: "none", color: "inherit" }}><Icon name="learn" /><span className="grow">{l.title}<span className="small muted"> · {l.minutes} min</span></span><Icon name="chevron" size={20} /></Link>)}</section>}
      {a.related.length > 0 && <section className="col" style={{ gap: 8 }}><h2>Related</h2><div className="chips">{a.related.map((r) => { const x = api.article(r); return x ? <Link key={r} href={`/library/${r}/`} className="chip">{x.title}</Link> : null; })}</div></section>}
      </div>
      {asking && <AskSheet context={{ type: "article", id: slug, label: a.title }} onClose={() => setAsking(false)} />}
      {reporting && <ReportSheet where={`Article: ${a.title}`} onClose={() => setReporting(false)} onSent={() => toast("Thanks. We'll check this article.")} />}
    </Screen>
  );
}
