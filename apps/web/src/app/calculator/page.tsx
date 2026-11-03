"use client";
import { useState } from "react";
import { CONFIG, compound, formatNaira, historicalReturn, parseNairaToKobo } from "@finvora/domain";
import { Screen, TopBar, Money, Change, VirtualLabel, Notice } from "@/components/ui";
import { useEntitlements } from "@/lib/hooks";
import { api } from "@/lib/api";
import { update, useStore } from "@/lib/store";

const PERIOD_LABEL: Record<number, string> = { 30: "1 month", 90: "3 months", 180: "6 months", 365: "1 year" };

export default function Calculator() {
  const [tab, setTab] = useState<"history" | "savings">("history");
  return (
    <Screen top={<TopBar back="/markets/" title="Calculators" />}>
      <div className="chips" role="tablist" aria-label="Calculator">
        <button type="button" role="tab" className="chip" aria-selected={tab === "history"} aria-pressed={tab === "history"} onClick={() => setTab("history")}>What if I had invested?</button>
        <button type="button" role="tab" className="chip" aria-selected={tab === "savings"} aria-pressed={tab === "savings"} onClick={() => setTab("savings")}>Savings growth</button>
      </div>
      {tab === "history" ? <Historical /> : <Savings />}
    </Screen>
  );
}

function Historical() {
  const prefs = useStore("prefs");
  const sim = useStore("sim");
  const ent = useEntitlements();
  const [raw, setRaw] = useState(String(prefs.calcAmountKobo / 100));
  const amount = parseNairaToKobo(raw);
  const ticker = api.company(prefs.calcTicker) ? prefs.calcTicker : api.companies()[0]!.ticker;
  const days = prefs.calcDays;
  const start = api.priceOn(ticker, Math.max(0, sim.day - days));
  const end = api.priceOn(ticker, sim.day);
  const r = amount === null ? { ok: false as const, error: "amount-required" as const } : historicalReturn(amount, start, end, days);
  const set = (patch: Partial<typeof prefs>) => update("prefs", (p) => ({ ...p, ...patch }));

  return (
    <>
      <p className="muted small">See how an amount would have changed if you had bought shares in the past. Uses demo prices.</p>
      <div><label className="label" htmlFor="co">Company</label>
        <select id="co" className="field" value={ticker} onChange={(e) => set({ calcTicker: e.target.value })}>{api.companies().map((c) => <option key={c.ticker} value={c.ticker}>{c.name}</option>)}</select></div>
      <div><label className="label" htmlFor="amt">Amount</label>
        <div className="row"><strong style={{ fontSize: 20 }}>₦</strong><input id="amt" className="field num" inputMode="decimal" value={raw} onChange={(e) => { setRaw(e.target.value); const k = parseNairaToKobo(e.target.value); if (k) set({ calcAmountKobo: k }); }} aria-invalid={raw !== "" && amount === null} /></div>
        <div className="chips" style={{ marginTop: 8 }}>{CONFIG.CALC_AMOUNT_PRESETS_KOBO.map((k) => <button key={k} type="button" className="chip" aria-pressed={amount === k} onClick={() => { setRaw(String(k / 100)); set({ calcAmountKobo: k }); }}>{formatNaira(k)}</button>)}</div></div>
      <div><span className="label" id="per">How long ago</span>
        <div className="chips" role="group" aria-labelledby="per">{CONFIG.CALC_PERIOD_PRESETS_DAYS.map((d) => <button key={d} type="button" className="chip" aria-pressed={days === d} onClick={() => set({ calcDays: d })}>{PERIOD_LABEL[d]}</button>)}</div></div>

      <section className="card card-pad" aria-live="polite" aria-label="Result">
        <div className="row between" style={{ marginBottom: 6 }}><strong>Result</strong><VirtualLabel kind="demo" /></div>
        {r.ok ? (<>
          <div className="kv"><span>Price then → now</span><strong><Money kobo={start} /> → <Money kobo={end} /></strong></div>
          <div className="kv"><span>Whole shares bought</span><strong>{r.result.shares}</strong></div>
          <div className="kv"><span>Cash left over</span><strong><Money kobo={r.result.leftoverKobo} /></strong></div>
          <div className="divider" />
          <div className="kv" style={{ fontWeight: 700 }}><span>Worth now</span><strong><Money kobo={r.result.endValueKobo} /></strong></div>
          <div className="kv"><span>Gain or loss</span><strong><Change kobo={r.result.gainKobo} pct={r.result.returnPct} label="Gain or loss" /></strong></div>
          {r.result.cagrPct !== null && <div className="kv"><span>Per year</span><strong>{r.result.cagrPct}%</strong></div>}
        </>) : <p className="error-text">{r.error === "amount-too-small" ? `That's less than one share (${formatNaira(start)}). Try a bigger amount.` : "Enter an amount in naira, like 50000."}</p>}
      </section>
      {!ent.calculatorDividends && <Notice icon="lock">This shows price change only. Including dividends is part of Plus.</Notice>}
      <p className="xs muted">Past results don&apos;t predict the future. Demo prices for learning, not real market data.</p>
    </>
  );
}

function Savings() {
  const [p, setP] = useState("100000");
  const [m, setM] = useState("10000");
  const [rate, setRate] = useState("10");
  const [years, setYears] = useState(5);
  const pk = parseNairaToKobo(p), mk = parseNairaToKobo(m || "0"), rt = Number(rate);
  const valid = pk !== null && mk !== null && Number.isFinite(rt) && rt >= 0 && rt <= 100;
  const c = valid ? compound(pk!, mk!, rt, years) : null;
  return (
    <>
      <p className="muted small">See how saving regularly grows with compound interest. Monthly compounding.</p>
      <div className="grid2">
        <div><label className="label" htmlFor="p">Starting amount (₦)</label><input id="p" className="field num" inputMode="decimal" value={p} onChange={(e) => setP(e.target.value)} aria-invalid={pk === null} /></div>
        <div><label className="label" htmlFor="m">Each month (₦)</label><input id="m" className="field num" inputMode="decimal" value={m} onChange={(e) => setM(e.target.value)} aria-invalid={mk === null} /></div>
      </div>
      <div><label className="label" htmlFor="r">Yearly interest rate (%)</label><input id="r" className="field num" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} aria-invalid={!(rt >= 0 && rt <= 100)} aria-describedby="r-help" /><p id="r-help" className="help" style={{ marginTop: 4 }}>Between 0 and 100.</p></div>
      <div><span className="label" id="yrs">Years</span><div className="chips" role="group" aria-labelledby="yrs">{[1, 3, 5, 10, 20].map((y) => <button key={y} type="button" className="chip" aria-pressed={years === y} onClick={() => setYears(y)}>{y}</button>)}</div></div>
      <section className="card card-pad" aria-live="polite" aria-label="Result">
        {c ? (<>
          <div className="kv" style={{ fontWeight: 700 }}><span>After {years} year{years === 1 ? "" : "s"}</span><strong><Money kobo={c.totalKobo} /></strong></div>
          <div className="kv"><span>You put in</span><strong><Money kobo={c.contributedKobo} /></strong></div>
          <div className="kv"><span>Interest earned</span><strong><Money kobo={c.interestKobo} /></strong></div>
        </>) : <p className="error-text">Check the amounts and rate.</p>}
      </section>
      <p className="xs muted">An illustration only. Real rates change, and inflation reduces what money buys.</p>
    </>
  );
}
