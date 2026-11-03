"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { percentChange } from "@finvora/domain";
import { Screen, TopBar, Money, Change, VirtualLabel, Monogram, Dialog, useToast, Notice } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Fin } from "@/components/Fin";
import { api } from "@/lib/api";
import { useStore, useHydrated } from "@/lib/store";

export default function SimHome() {
  const sim = useStore("sim");
  const hydrated = useHydrated();
  const toast = useToast();
  const [resetting, setResetting] = useState(false);
  const v = api.valuation();
  const moved = hydrated && sim.day !== sim.lastSeenDay;
  const [showMoved] = useState(moved);
  useEffect(() => { if (hydrated) api.markPortfolioSeen(); }, [hydrated]);

  return (
    <Screen top={<TopBar back="/markets/" title="Simulator" right={<Link href="/simulator/history/" className="icon-btn" aria-label="Trade history"><Icon name="history" /></Link>} />}>
      <Notice icon="info">Practice only. You&apos;re using virtual money on made-up companies with demo prices. Nothing here is a real trade, and virtual gains or losses aren&apos;t real returns.</Notice>

      <section className="card card-pad col" style={{ gap: 6 }} aria-label="Portfolio value">
        <div className="row between"><span className="small muted">Portfolio value</span><VirtualLabel kind="virtual" /></div>
        <span style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1 }}><Money kobo={v.totalKobo} /></span>
        <div className="row wrap small" style={{ gap: 14 }}>
          <span>Today <Change kobo={v.dayChangeKobo} label="Today" /></span>
          <span>All time <Change kobo={v.totalPlKobo} pct={percentChange(v.totalKobo - v.totalPlKobo, v.totalKobo)} label="All time" /></span>
        </div>
        <div className="divider" style={{ margin: "6px 0" }} />
        <div className="kv"><span>Cash</span><strong><Money kobo={v.cashKobo} /></strong></div>
        <div className="kv"><span>Invested</span><strong><Money kobo={v.holdingsValueKobo} /></strong></div>
        {showMoved && <p className="small" style={{ color: "var(--link)", fontWeight: 600 }}>Prices moved since your last visit.</p>}
      </section>

      <section className="col" style={{ gap: 8 }} aria-labelledby="hold-h">
        <h2 id="hold-h">Your holdings</h2>
        {v.positions.length === 0 ? (
          <div className="card card-pad col center" style={{ alignItems: "center" }}>
            <Fin mood="think" size={72} />
            <strong>You don&apos;t own any shares yet</strong>
            <p className="small muted">Pick a company below and try buying with a small amount, like ₦5,000.</p>
          </div>
        ) : (
          <ul className="card" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {v.positions.map((p) => {
              const co = api.simCompany(p.ticker)!;
              return (
                <li key={p.ticker}><Link href={`/simulator/${p.ticker}/`} className="li">
                  <Monogram text={p.ticker} />
                  <span className="grow"><strong style={{ display: "block" }}>{co.name}</strong><span className="small muted num">{p.quantity} share{p.quantity === 1 ? "" : "s"} · avg <Money kobo={p.avgCostKobo} /></span></span>
                  <span style={{ textAlign: "right" }}><Money kobo={p.valueKobo} className="small" /><br /><span className="small"><Change kobo={p.unrealizedPlKobo} label="Gain or loss" /></span></span>
                </Link></li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="col" style={{ gap: 8 }} aria-labelledby="mkt-h">
        <div className="row between"><h2 id="mkt-h">Practice market</h2><VirtualLabel kind="demo" /></div>
        <ul className="card" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {api.simCompanies().map((c) => {
            const p = api.priceOn(c.ticker, sim.day), prev = api.priceOn(c.ticker, sim.day - 1);
            return (
              <li key={c.ticker}><Link href={`/simulator/${c.ticker}/`} className="li">
                <Monogram text={c.ticker} /><span className="grow"><strong style={{ display: "block" }}>{c.name}</strong><span className="small muted">{c.sector}</span></span>
                <span style={{ textAlign: "right" }}><Money kobo={p} className="small" /><br /><span className="small"><Change pct={percentChange(prev, p)} label="Today" /></span></span>
              </Link></li>
            );
          })}
        </ul>
        <p className="xs muted">Market day {sim.day - 249}. Prices move when the market day advances (Reviewer tools).</p>
      </section>

      <button type="button" className="link-btn" onClick={() => setResetting(true)}>Start over with ₦100,000</button>
      {resetting && <Dialog title="Start over?" body="Your current practice portfolio is archived and you get a fresh ₦100,000 of virtual money. Your trade history stays in the archive." confirm="Start over" onConfirm={() => { api.resetSim(); setResetting(false); toast("New practice portfolio started"); }} onCancel={() => setResetting(false)} />}
    </Screen>
  );
}
