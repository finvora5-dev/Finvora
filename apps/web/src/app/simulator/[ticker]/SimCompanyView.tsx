"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { CONFIG, percentChange, quoteByAmount, quoteShares, feeFor, formatNaira, parseNairaToKobo, bpsToPercent, type Trade, type TradeError } from "@finvora/domain";
import { Screen, TopBar, Money, Change, VirtualLabel, Monogram, Sparkline, Sheet, Notice } from "@/components/ui";
import { Fin } from "@/components/Fin";
import { Icon } from "@/components/Icon";
import { AskSheet } from "@/components/AskSheet";
import { api } from "@/lib/api";
import { newId, update, useStore } from "@/lib/store";

export function SimCompanyView({ ticker }: { ticker: string }) {
  const c = api.simCompany(ticker)!;
  const sim = useStore("sim");
  const [sheet, setSheet] = useState<"buy" | "sell" | null>(null);
  const [done, setDone] = useState<Trade | null>(null);
  const [asking, setAsking] = useState(false);
  const price = api.priceOn(ticker, sim.day);
  const prev = api.priceOn(ticker, sim.day - 1);
  const hist = api.priceHistory(ticker, sim.day, 60);
  const holding = sim.account.holdings.find((h) => h.ticker === ticker);

  if (done) return <TradeDone trade={done} onBack={() => setDone(null)} />;

  return (
    <Screen top={<TopBar back="/simulator/" title={c.name} />} nav={false} sticky={
      <div className="row">{holding && <button type="button" className="btn btn-w" onClick={() => setSheet("sell")}>Sell</button>}<button type="button" className="btn" onClick={() => setSheet("buy")}>Buy</button></div>
    }>
      <div className="row"><Monogram text={c.ticker} /><div className="grow"><h1 style={{ fontSize: 22 }}>{c.name}</h1><span className="small muted">{c.ticker} · {c.sector} · made-up company</span></div></div>
      <section className="card card-pad col" style={{ gap: 8 }}>
        <div className="row between"><span style={{ fontSize: 28, fontWeight: 800 }}><Money kobo={price} /></span><VirtualLabel kind="demo" /></div>
        <span className="small"><Change kobo={price - prev} pct={percentChange(prev, price)} label="Today" /> today</span>
        <Sparkline values={hist} label={`${c.name} demo price, last 60 market days`} />
      </section>
      <p>{c.blurb}</p>
      {holding && (
        <section className="card card-pad col" style={{ gap: 2 }} aria-label="Your position">
          <div className="row between"><strong>You own</strong><VirtualLabel kind="virtual" /></div>
          <div className="kv"><span>Shares</span><strong>{holding.quantity}</strong></div>
          <div className="kv"><span>Value now</span><strong><Money kobo={holding.quantity * price} /></strong></div>
          <div className="kv"><span>Gain or loss</span><strong><Change kobo={holding.quantity * price - holding.costBasisKobo} label="Gain or loss" /></strong></div>
        </section>
      )}
      <div className="row wrap" style={{ gap: 8 }}>
        <Link href={`/library/${c.learnSlug}/`} className="chip"><Icon name="library" size={16} />Learn: {api.article(c.learnSlug)?.title}</Link>
        <button type="button" className="chip" onClick={() => setAsking(true)}><Fin size={20} />Ask Fin</button>
      </div>
      {sheet === "buy" && <BuySheet ticker={ticker} name={c.name} onClose={() => setSheet(null)} onDone={(t) => { setSheet(null); setDone(t); }} />}
      {sheet === "sell" && holding && <SellSheet ticker={ticker} name={c.name} held={holding.quantity} onClose={() => setSheet(null)} onDone={(t) => { setSheet(null); setDone(t); }} />}
      {asking && <AskSheet context={{ type: "company", id: ticker, label: c.name }} onClose={() => setAsking(false)} />}
    </Screen>
  );
}

function errorText(e: TradeError, name: string): string {
  switch (e.code) {
    case "insufficient-cash": return `You need ${formatNaira(e.neededKobo)} but have ${formatNaira(e.cashKobo)} in virtual cash. Try a smaller amount.`;
    case "insufficient-shares": return `You only own ${e.held} share${e.held === 1 ? "" : "s"} of ${name}.`;
    case "stale-price": return `The price changed to ${formatNaira(e.currentKobo)}. Check the new total and confirm again.`;
    default: return "Enter a whole number of shares, 1 or more.";
  }
}

/** Amount-first buy (build plan §4.5): presets, whole shares, fees and remaining cash shown before Confirm. */
function BuySheet({ ticker, name, onClose, onDone }: { ticker: string; name: string; onClose: () => void; onDone: (t: Trade) => void }) {
  const sim = useStore("sim");
  const prefs = useStore("prefs");
  const [mode, setMode] = useState<"amount" | "shares">("amount");
  const [raw, setRaw] = useState(String(prefs.tradeAmountKobo / 100));
  const [sharesRaw, setSharesRaw] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key = useRef(newId("idem")); // one key per sheet: a double tap places one trade
  const price = api.priceOn(ticker, sim.day);
  const cash = sim.account.cashKobo;

  const amount = parseNairaToKobo(raw);
  const shares = /^\d+$/.test(sharesRaw) ? Number(sharesRaw) : NaN;
  const q = mode === "amount"
    ? (amount && amount > 0 ? quoteByAmount(amount, price, cash) : null)
    : (shares > 0 ? { status: "ok" as const, cappedToCash: false, reducedForFees: false, ...quoteShares(shares, price, cash) } : null);
  const overCash = q?.status === "ok" && q.totalKobo > cash;
  const canConfirm = q?.status === "ok" && !overCash && !busy;

  async function confirm() {
    if (q?.status !== "ok") return;
    setBusy(true); setError("");
    try {
      const r = await api.trade({ side: "buy", ticker, quantity: q.shares, quotedPriceKobo: price, idempotencyKey: key.current });
      if (r.ok) { if (mode === "amount" && amount) update("prefs", (p) => ({ ...p, tradeAmountKobo: amount })); onDone(r.trade); }
      else { setError(errorText(r.error, name)); key.current = newId("idem"); }
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong. Your virtual cash hasn't changed."); }
    finally { setBusy(false); }
  }

  return (
    <Sheet title={`Buy ${name}`} onClose={onClose}>
      <div className="row between small"><span>Price <Money kobo={price} /> per share</span><VirtualLabel kind="demo" /></div>
      <div className="chips" role="group" aria-label="Buy by">
        <button type="button" className="chip" aria-pressed={mode === "amount"} onClick={() => setMode("amount")}>By amount</button>
        <button type="button" className="chip" aria-pressed={mode === "shares"} onClick={() => setMode("shares")}>By shares</button>
      </div>
      {mode === "amount" ? (
        <div>
          <label className="label" htmlFor="amt">How much do you want to invest?</label>
          <div className="row"><strong style={{ fontSize: 22 }}>₦</strong><input id="amt" className="field num" inputMode="decimal" value={raw} onChange={(e) => setRaw(e.target.value)} aria-invalid={raw !== "" && amount === null} aria-describedby="amt-help" style={{ fontSize: 22 }} /></div>
          {raw !== "" && amount === null && <p className="error-text" style={{ marginTop: 6 }}>Enter an amount in naira, like 5000.</p>}
          <div className="chips" style={{ marginTop: 10 }}>{CONFIG.SIM_AMOUNT_PRESETS_KOBO.map((k) => <button key={k} type="button" className="chip" aria-pressed={amount === k} onClick={() => setRaw(String(k / 100))}>{formatNaira(k)}</button>)}</div>
          <p id="amt-help" className="help" style={{ marginTop: 6 }}>We work out how many whole shares this buys, including fees.</p>
        </div>
      ) : (
        <div>
          <label className="label" htmlFor="sh">Number of shares</label>
          <input id="sh" className="field num" inputMode="numeric" value={sharesRaw} onChange={(e) => setSharesRaw(e.target.value.replace(/\D/g, ""))} style={{ fontSize: 22 }} />
        </div>
      )}

      {q?.status === "too-small" && <Notice tone="warn">That buys 0 shares. One share costs {formatNaira(q.cheapestKobo)} with fees. <button type="button" className="link-btn" onClick={() => setRaw(String(Math.ceil(q.cheapestKobo / 100)))}>Use {formatNaira(Math.ceil(q.cheapestKobo / 100) * 100)}</button></Notice>}
      {q?.status === "no-cash" && <Notice tone="bad">You don&apos;t have enough virtual cash for one share ({formatNaira(q.cheapestKobo)} with fees). Sell something or start over.</Notice>}
      {q?.status === "ok" && (
        <section className="card card-pad" aria-label="Cost breakdown" aria-live="polite">
          <div className="kv"><span>Shares</span><strong>{q.shares}</strong></div>
          <div className="kv"><span>{q.shares} × <Money kobo={price} /></span><strong><Money kobo={q.grossKobo} /></strong></div>
          <div className="kv"><span>Fees (approx. {bpsToPercent(CONFIG.SIM_FEE_BPS)}, min {formatNaira(CONFIG.SIM_MIN_FEE_KOBO)})</span><strong><Money kobo={q.feesKobo} /></strong></div>
          <div className="divider" />
          <div className="kv" style={{ fontWeight: 700 }}><span>Total</span><strong><Money kobo={q.totalKobo} /></strong></div>
          <div className="kv"><span>Virtual cash left</span><strong className={overCash ? "down" : ""}><Money kobo={q.leftoverKobo} /></strong></div>
          {q.cappedToCash && <p className="help">Capped to your virtual cash of {formatNaira(cash)}.</p>}
          {q.reducedForFees && <p className="help">One share fewer so the total, with fees, stays within your amount.</p>}
          {overCash && <p className="error-text">That&apos;s more than your virtual cash ({formatNaira(cash)}). Try fewer shares.</p>}
        </section>
      )}
      {error && <Notice tone="bad">{error}</Notice>}
      <button type="button" className="btn" disabled={!canConfirm} onClick={confirm}>{busy ? "Placing practice trade…" : q?.status === "ok" ? `Confirm: buy ${q.shares} share${q.shares === 1 ? "" : "s"}` : "Confirm"}</button>
      <p className="xs muted center">Virtual money. No real trade is placed.</p>
    </Sheet>
  );
}

function SellSheet({ ticker, name, held, onClose, onDone }: { ticker: string; name: string; held: number; onClose: () => void; onDone: (t: Trade) => void }) {
  const sim = useStore("sim");
  const [raw, setRaw] = useState(String(held));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key = useRef(newId("idem"));
  const price = api.priceOn(ticker, sim.day);
  const n = /^\d+$/.test(raw) ? Number(raw) : NaN;
  const valid = n > 0 && n <= held;
  const gross = valid ? n * price : 0;
  const fees = feeFor(gross);
  const holding = sim.account.holdings.find((h) => h.ticker === ticker);
  const costPart = holding && valid ? Math.round((holding.costBasisKobo * n) / holding.quantity) : 0;

  async function confirm() {
    setBusy(true); setError("");
    try {
      const r = await api.trade({ side: "sell", ticker, quantity: n, quotedPriceKobo: price, idempotencyKey: key.current });
      if (r.ok) onDone(r.trade); else { setError(errorText(r.error, name)); key.current = newId("idem"); }
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong. Nothing was sold."); }
    finally { setBusy(false); }
  }

  return (
    <Sheet title={`Sell ${name}`} onClose={onClose}>
      <div className="row between small"><span>Price <Money kobo={price} /> per share</span><VirtualLabel kind="demo" /></div>
      <div>
        <label className="label" htmlFor="sell">Shares to sell (you own {held})</label>
        <input id="sell" className="field num" inputMode="numeric" value={raw} onChange={(e) => setRaw(e.target.value.replace(/\D/g, ""))} aria-invalid={raw !== "" && !valid} style={{ fontSize: 22 }} />
        <div className="chips" style={{ marginTop: 10 }}>{[["Half", Math.max(1, Math.floor(held / 2))], ["All", held]].map(([l, v]) => <button key={l as string} type="button" className="chip" onClick={() => setRaw(String(v))}>{l}</button>)}</div>
        {raw !== "" && !valid && <p className="error-text" style={{ marginTop: 6 }}>{n > held ? `You only own ${held} shares.` : "Enter 1 or more shares."}</p>}
      </div>
      {valid && (
        <section className="card card-pad" aria-label="Sale breakdown" aria-live="polite">
          <div className="kv"><span>{n} × <Money kobo={price} /></span><strong><Money kobo={gross} /></strong></div>
          <div className="kv"><span>Fees (approx.)</span><strong><Money kobo={-fees} /></strong></div>
          <div className="divider" />
          <div className="kv" style={{ fontWeight: 700 }}><span>You receive</span><strong><Money kobo={gross - fees} /></strong></div>
          <div className="kv"><span>Gain or loss on these shares</span><strong><Change kobo={gross - fees - costPart} label="Gain or loss" /></strong></div>
        </section>
      )}
      {error && <Notice tone="bad">{error}</Notice>}
      <button type="button" className="btn" disabled={!valid || busy} onClick={confirm}>{busy ? "Placing practice trade…" : valid ? `Confirm: sell ${n} share${n === 1 ? "" : "s"}` : "Confirm"}</button>
      <p className="xs muted center">Virtual money. No real trade is placed.</p>
    </Sheet>
  );
}

function TradeDone({ trade, onBack }: { trade: Trade; onBack: () => void }) {
  const sim = useStore("sim");
  const c = api.simCompany(trade.ticker)!;
  const h = sim.account.holdings.find((x) => x.ticker === trade.ticker);
  return (
    <Screen top={<TopBar title="Practice trade done" />} nav={false} sticky={<><Link href="/simulator/" className="btn">See your portfolio</Link><button type="button" className="link-btn" onClick={onBack}>Back to {c.name}</button></>}>
      <div className="col center pop" style={{ alignItems: "center" }}>
        <Fin mood="cheer" size={110} />
        <h1>{trade.side === "buy" ? "You bought" : "You sold"} {trade.quantity} share{trade.quantity === 1 ? "" : "s"}</h1>
        <p className="muted">of {c.name} at <Money kobo={trade.priceKobo} /> each.</p>
      </div>
      <section className="card card-pad">
        <div className="row between" style={{ marginBottom: 6 }}><strong>Summary</strong><VirtualLabel kind="virtual" /></div>
        <div className="kv"><span>Fees (approx.)</span><strong><Money kobo={trade.feesKobo} /></strong></div>
        <div className="kv"><span>{trade.side === "buy" ? "Total paid" : "You received"}</span><strong><Money kobo={trade.netKobo} /></strong></div>
        {trade.side === "sell" && <div className="kv"><span>Gain or loss</span><strong><Change kobo={trade.realizedPlKobo} label="Gain or loss" /></strong></div>}
        <div className="kv"><span>Shares you now own</span><strong>{h?.quantity ?? 0}</strong></div>
        <div className="kv"><span>Virtual cash left</span><strong><Money kobo={sim.account.cashKobo} /></strong></div>
      </section>
      <Notice>{trade.side === "buy" ? "If the price goes up, the value of your shares rises. If it falls, so does their value. Fees are why a trade starts slightly below what you paid." : "Selling turns your shares back into virtual cash. The gain or loss is the difference from what you paid, including fees."}</Notice>
    </Screen>
  );
}
