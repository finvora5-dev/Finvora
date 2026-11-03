"use client";
import Link from "next/link";
import { useState } from "react";
import { percentChange } from "@finvora/domain";
import { Screen, TopBar, Money, Change, VirtualLabel, Monogram, Sparkline, Notice } from "@/components/ui";
import { WatchButton } from "@/components/Watch";
import { AskSheet } from "@/components/AskSheet";
import { Fin } from "@/components/Fin";
import { Icon } from "@/components/Icon";
import { useEntitlements } from "@/lib/hooks";
import { api } from "@/lib/api";
import { update, useStore } from "@/lib/store";

const RANGES = [{ d: 7, l: "1W" }, { d: 30, l: "1M" }, { d: 90, l: "3M" }, { d: 250, l: "1Y" }];

export function CompanyView({ ticker }: { ticker: string }) {
  const c = api.company(ticker)!;
  const sim = useStore("sim");
  const prefs = useStore("prefs");
  const [asking, setAsking] = useState(false);
  const ent = useEntitlements();
  const range = RANGES.some((r) => r.d === prefs.chartRange) ? prefs.chartRange : 30;
  const hist = api.priceHistory(ticker, sim.day, range);
  const price = hist[hist.length - 1]!;
  const prev = api.priceOn(ticker, sim.day - 1);

  return (
    <Screen top={<TopBar back={true} title={c.name} right={<WatchButton ticker={ticker} name={c.name} compact />} />} nav={false}
      sticky={<button type="button" className="btn" onClick={() => setAsking(true)}><Fin size={26} />Ask Fin about {c.name}</button>}>
      <div className="row"><Monogram text={c.ticker} /><div className="grow"><h2 className="h1" style={{ fontSize: 22 }}>{c.name}</h2><span className="small muted">{c.ticker} · {c.exchange} · {c.sector}</span></div></div>

      <section className="card card-pad col" style={{ gap: 8 }} aria-label="Price">
        <div className="row between"><span style={{ fontSize: 28, fontWeight: 800 }}><Money kobo={price} /></span><VirtualLabel kind="demo" /></div>
        <span className="small"><Change kobo={price - prev} pct={percentChange(prev, price)} label="Today" /> today</span>
        <Sparkline values={hist} label={`${c.name} demo price over ${RANGES.find((r) => r.d === range)!.l}`} />
        <div className="chips" role="group" aria-label="Chart range">{RANGES.map((r) => <button key={r.d} type="button" className="chip" aria-pressed={range === r.d} onClick={() => update("prefs", (p) => ({ ...p, chartRange: r.d }))}>{r.l}</button>)}</div>
        <p className="xs muted">Demo prices for learning. They are not live or real market quotes.</p>
      </section>

      <section className="col" style={{ gap: 6 }}><h2>About</h2><p>{c.about}</p></section>
      <section className="card card-pad card-tint col" style={{ gap: 6 }}><h2>How it makes money</h2><p>{c.howItMakesMoney}</p></section>

      <section className="col" style={{ gap: 8 }}>
        <h2>Learn the ideas behind this page</h2>
        <div className="chips">{c.learnSlugs.map((s) => { const a = api.article(s); return a ? <Link key={s} href={`/library/${s}/`} className="chip"><Icon name="library" size={16} />{a.title}</Link> : null; })}</div>
      </section>

      <section className="col" style={{ gap: 8 }}>
        <h2>Dividend history</h2>
        {ent.dividendHistory
          ? <Notice>{c.paysDividends ? "This company has a history of paying dividends. Exact amounts will come from licensed market data in Phase 2." : "This company hasn't paid dividends recently."}</Notice>
          : <Notice icon="lock">Dividend history is part of Plus. <Link href="/plans/">See Plus</Link></Notice>}
      </section>

      <Link href="/simulator/" className="card card-pad row press" style={{ textDecoration: "none", color: "inherit" }}>
        <span className="tile"><Icon name="sim" /></span><span className="grow"><strong style={{ display: "block" }}>Practise in the simulator</strong><span className="small muted">Buy and sell made-up companies with virtual money.</span></span><Icon name="chevron" size={20} />
      </Link>
      <p className="xs muted">Company names and logos are trademarks of their respective owners. Finvora is not affiliated with or endorsed by them. Prices shown are demo data. Educational content, not financial advice.</p>
      {asking && <AskSheet context={{ type: "company", id: ticker, label: c.name }} onClose={() => setAsking(false)} />}
    </Screen>
  );
}
