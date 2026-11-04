"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Screen, TopBar, Empty } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { SuggestSheet } from "@/components/FeedbackSheets";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";

const KIND = { company: "Company", lesson: "Lesson", article: "Article" } as const;

export default function Search() {
  const [q, setQ] = useState("");
  const [deb, setDeb] = useState("");
  const [suggest, setSuggest] = useState(false);
  const fb = useStore("feedback");
  useEffect(() => { const t = setTimeout(() => setDeb(q), 150); return () => clearTimeout(t); }, [q]);
  const { results, didYouMean } = api.search(deb);

  return (
    <Screen top={<TopBar back={true} title="Search" />}>
      <div>
        <label className="sr" htmlFor="q">Search companies, lessons and articles</label>
        <input id="q" className="field" type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “dividend” or “MTN”" />
      </div>
      {!deb.trim() ? (
        <div className="col" style={{ gap: 8 }}>
          <span className="eyebrow muted">Popular</span>
          <div className="chips">{["Inflation", "Dividend", "MTN Nigeria", "Compound interest", "P/E ratio"].map((s) => <button key={s} type="button" className="chip" onClick={() => setQ(s)}>{s}</button>)}</div>
        </div>
      ) : results.length === 0 ? (
        <Empty title={`No results for “${deb}”`} body="Check the spelling, try a simpler word, or ask Fin." mood="confused" action={
          <div className="col" style={{ width: "100%" }}>
            {didYouMean && <button type="button" className="btn btn-w" onClick={() => setQ(didYouMean)}>Search for “{didYouMean}”</button>}
            <Link href={`/ask/?q=${encodeURIComponent(deb)}`} className="btn btn-w">Ask Fin instead</Link>
            {fb.prompts.suggestTopic.enabled && <button type="button" className="link-btn" onClick={() => setSuggest(true)}>Suggest this topic</button>}
          </div>} />
      ) : (
        <>
          <p className="small muted" role="status">{results.length} result{results.length === 1 ? "" : "s"}</p>
          <ul className="card rlist" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {results.map((r) => (
              <li key={r.kind + r.id}><Link href={r.href} className="li"><span className="tile"><Icon name={r.kind === "company" ? "company" : r.kind === "lesson" ? "learn" : "library"} size={20} /></span><span className="grow"><strong style={{ display: "block" }}>{r.title}</strong><span className="small muted">{KIND[r.kind]} · {r.subtitle}</span></span></Link></li>
            ))}
          </ul>
        </>
      )}
      {suggest && <SuggestSheet initial={deb} onClose={() => setSuggest(false)} />}
    </Screen>
  );
}
