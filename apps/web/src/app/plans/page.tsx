"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CONFIG, formatNaira, type BillingPeriod } from "@finvora/domain";
import { Screen, TopBar, Notice, Dialog, useToast } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useEntitlements } from "@/lib/hooks";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";

const FEATURES: [string, boolean, boolean][] = [
  ["Library and lessons in World 1", true, true],
  ["Practice simulator", true, true],
  [`Ask Fin questions a day`, true, true],
  ["All learning worlds as they arrive", false, true],
  ["Company comparison", false, true],
  ["Dividend history", false, true],
  ["Deep report scans and PDF summaries", false, true],
];

export default function Plans() {
  const router = useRouter();
  const toast = useToast();
  const billing = useStore("billing");
  const [period, setPeriod] = useState<BillingPeriod>("yearly");
  const [cancel, setCancel] = useState(false);
  const ent = useEntitlements();
  const monthly = CONFIG.PLUS_PRICE_KOBO.monthly, yearly = CONFIG.PLUS_PRICE_KOBO.yearly;
  const saving = Math.round((1 - yearly / (monthly * 12)) * 100);

  function go() {
    const r = api.startCheckout(period);
    if (r.ok) router.push(`/checkout/?order=${r.orderId}`);
    else if (r.reason === "pending" && r.orderId) router.push(`/checkout/?order=${r.orderId}`);
    else toast("You're already on Plus");
  }

  if (ent.plan === "plus") {
    return (
      <Screen top={<TopBar back="/me/" title="Your plan" />}>
        <section className="card card-pad card-tint col" style={{ gap: 6 }}>
          <span className="eyebrow" style={{ color: "var(--link)" }}>Plus</span>
          <h2>{billing.sub.period === "yearly" ? "Yearly" : "Monthly"} · {formatNaira(api.priceFor(billing.sub.period ?? "monthly"))}</h2>
          <p className="small">{billing.sub.cancelled ? `Cancelled. You keep Plus until ${billing.sub.renewsOn}, then move to Free.` : `Renews on ${billing.sub.renewsOn}.`}</p>
        </section>
        <ul className="col" style={{ listStyle: "none", margin: 0, padding: 0, gap: 8 }}>{FEATURES.map(([f]) => <li key={f} className="row"><Icon name="check" size={20} />{f.replace("Ask Fin questions a day", "Unlimited Ask Fin questions")}</li>)}</ul>
        {billing.sub.cancelled
          ? <button type="button" className="btn" onClick={() => { api.resumePlus(); toast("Plus will renew as normal"); }}>Keep Plus</button>
          : <button type="button" className="link-btn" onClick={() => setCancel(true)}>Cancel Plus</button>}
        {cancel && <Dialog title="Cancel Plus?" body={`You keep Plus until ${billing.sub.renewsOn}. After that you move to Free; your progress stays.`} confirm="Cancel Plus" cancel="Keep Plus" destructive onConfirm={() => { api.cancelPlus(); setCancel(false); toast("Plus cancelled"); }} onCancel={() => setCancel(false)} />}
      </Screen>
    );
  }

  return (
    <Screen top={<TopBar back="/me/" title="Plans" />} nav={false} sticky={<><button type="button" className="btn" onClick={go}>Continue with Plus · {formatNaira(api.priceFor(period))}</button><p className="xs muted center">Simulated checkout. No card details are collected and no payment is taken.</p></>}>
      <h2 className="h1">Learn more with Plus</h2>
      <p className="muted">The Library stays free for everyone.</p>
      <div className="col" role="radiogroup" aria-label="Billing period">
        <button type="button" role="radio" aria-checked={period === "yearly"} className="option" onClick={() => setPeriod("yearly")}><span className="grow"><strong>Yearly</strong> · {formatNaira(yearly)}<br /><span className="small muted">Save about {saving}% compared with monthly</span></span></button>
        <button type="button" role="radio" aria-checked={period === "monthly"} className="option" onClick={() => setPeriod("monthly")}><span className="grow"><strong>Monthly</strong> · {formatNaira(monthly)}</span></button>
      </div>
      {CONFIG.PLUS_PRICE_IS_PLACEHOLDER && <Notice tone="warn">Prices are placeholders while pricing is being decided.</Notice>}
      <table className="t" style={{ border: "1.5px solid var(--border)" }}>
        <thead><tr><th scope="col">Feature</th><th scope="col">Free</th><th scope="col">Plus</th></tr></thead>
        <tbody>{FEATURES.map(([f, free, plus]) => (
          <tr key={f}><td>{f === "Ask Fin questions a day" ? "Ask Fin" : f}</td>
            <td>{f === "Ask Fin questions a day" ? `${CONFIG.ASK_FIN_FREE_DAILY_LIMIT} a day` : free ? <><Icon name="check" size={18} /><span className="sr">Included</span></> : <span className="muted">No</span>}</td>
            <td>{f === "Ask Fin questions a day" ? "Unlimited" : plus ? <><Icon name="check" size={18} /><span className="sr">Included</span></> : "No"}</td></tr>
        ))}</tbody>
      </table>
    </Screen>
  );
}
