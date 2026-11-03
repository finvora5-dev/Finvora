"use client";
import { replay } from "@finvora/domain";
import { Screen, TopBar, Money, Change, VirtualLabel, Empty, Notice } from "@/components/ui";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import Link from "next/link";

export default function History() {
  const sim = useStore("sim");
  const trades = [...sim.account.trades].reverse();
  const r = replay(sim.account);
  const consistent = r.cashKobo === sim.account.cashKobo;
  return (
    <Screen top={<TopBar back="/simulator/" title="Trade history" />}>
      <div className="row between"><span className="small muted">{trades.length} practice trade{trades.length === 1 ? "" : "s"}</span><VirtualLabel kind="virtual" /></div>
      {!consistent && <Notice tone="bad">Your history doesn&apos;t match your balance. Start over from the simulator to fix it.</Notice>}
      {trades.length === 0 ? <Empty title="No trades yet" body="Your practice trades will show here." action={<Link href="/simulator/" className="btn btn-sm">Go to the simulator</Link>} /> : (
        <ul className="card" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {trades.map((t) => (
            <li key={t.id} className="li" style={{ cursor: "default" }}>
              <span className={`tag ${t.side === "buy" ? "" : "tag-good"}`}>{t.side === "buy" ? "Bought" : "Sold"}</span>
              <span className="grow"><strong style={{ display: "block" }}>{api.simCompany(t.ticker)?.name}</strong><span className="small muted num">{t.quantity} × <Money kobo={t.priceKobo} /> · fees <Money kobo={t.feesKobo} /> · day {t.day - 249}</span></span>
              <span style={{ textAlign: "right" }}><Money kobo={t.side === "buy" ? -t.netKobo : t.netKobo} sign className="small" />{t.side === "sell" && <><br /><span className="xs"><Change kobo={t.realizedPlKobo} label="Gain or loss" /></span></>}</span>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
