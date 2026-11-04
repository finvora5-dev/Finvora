"use client";
import Link from "next/link";
import { percentChange } from "@finvora/domain";
import { Screen, TopBar, Money, Change, VirtualLabel, Monogram, Empty } from "@/components/ui";
import { WatchButton } from "@/components/Watch";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api";
import { update, useStore } from "@/lib/store";

export default function Companies() {
  const prefs = useStore("prefs");
  const watch = useStore("watchlist");
  const sim = useStore("sim");
  const sectors = ["All", "Watchlist", ...Array.from(new Set(api.companies().map((c) => c.sector)))];
  const filter = sectors.includes(prefs.companyFilter) ? prefs.companyFilter : "All";
  const rows = api.companies()
    .filter((c) => filter === "All" || (filter === "Watchlist" ? watch.includes(c.ticker) : c.sector === filter))
    .map((c) => { const p = api.priceOn(c.ticker, sim.day), prev = api.priceOn(c.ticker, sim.day - 1); return { c, p, pct: percentChange(prev, p) }; })
    .sort((a, b) => (prefs.companySort === "change" ? b.pct - a.pct : a.c.name.localeCompare(b.c.name)));

  return (
    <Screen top={<TopBar back="/markets/" title="Companies" right={<Link href="/search/" className="icon-btn" aria-label="Search companies"><Icon name="search" /></Link>} />}>
      <div className="chips-scroll" role="group" aria-label="Filter companies">
        {sectors.map((s) => <button key={s} type="button" className="chip" style={{ flex: "none" }} aria-pressed={filter === s} onClick={() => update("prefs", (p) => ({ ...p, companyFilter: s }))}>{s}{s === "Watchlist" && watch.length ? ` (${watch.length})` : ""}</button>)}
      </div>
      <div className="row between wrap">
        <span className="row small muted" style={{ gap: 6 }}><VirtualLabel kind="demo" />prices</span>
        <label className="row small" style={{ gap: 6 }}>Sort
          <select className="field" style={{ minHeight: 44, width: "auto" }} value={prefs.companySort} onChange={(e) => update("prefs", (p) => ({ ...p, companySort: e.target.value as "name" | "change" }))}>
            <option value="name">Name</option><option value="change">Today&apos;s change</option>
          </select>
        </label>
      </div>
      {rows.length === 0 ? (
        <Empty title="Your watchlist is empty" body="Tap the star on any company to keep it here." mood="think" action={<button type="button" className="btn btn-w btn-sm" onClick={() => update("prefs", (p) => ({ ...p, companyFilter: "All" }))}>Browse all companies</button>} />
      ) : (
        <ul className="card rlist" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {rows.map(({ c, p, pct }) => (
            <li key={c.ticker} className="row" style={{ paddingRight: 6, borderTop: "1px solid var(--border)" }}>
              <Link href={`/companies/${c.ticker}/`} className="li grow" style={{ borderTop: 0 }}>
                <Monogram text={c.ticker} />
                <span className="grow"><strong style={{ display: "block" }}>{c.name}</strong><span className="small muted">{c.sector}</span></span>
                <span style={{ textAlign: "right" }}><Money kobo={p} className="small" /><br /><span className="small"><Change pct={pct} label="Today" /></span></span>
              </Link>
              <WatchButton ticker={c.ticker} name={c.name} compact />
            </li>
          ))}
        </ul>
      )}
      <p className="xs muted">Company names and logos are trademarks of their respective owners. Finvora is not affiliated with or endorsed by them. Prices shown are demo data.</p>
    </Screen>
  );
}
