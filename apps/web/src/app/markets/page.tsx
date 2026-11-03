"use client";
import Link from "next/link";
import { Screen, TopBar, VirtualLabel } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";

export default function Markets() {
  const watch = useStore("watchlist");
  return (
    <Screen top={<TopBar title="Markets" right={<Link href="/search/" className="icon-btn" aria-label="Search"><Icon name="search" /></Link>} />}>
      <section className="card card-pad col" style={{ gap: 8 }}>
        <span className="eyebrow muted">Nigerian Exchange (NGX)</span>
        <h2>How the market works</h2>
        <p className="small">Companies list their shares on the NGX in Lagos. People buy and sell those shares through licensed stockbrokers. Prices move as buyers and sellers agree on new prices.</p>
        <Link href="/library/stock-exchange/" className="link-btn" style={{ alignSelf: "flex-start", paddingLeft: 0 }}>Read: Stock exchange</Link>
      </section>
      <div className="col" style={{ gap: 10 }}>
        {[
          { href: "/companies/", icon: "company", t: "Companies", d: `Browse ${api.companies().length} Nigerian companies and how they make money.${watch.length ? ` ${watch.length} on your watchlist.` : ""}` },
          { href: "/simulator/", icon: "sim", t: "Simulator", d: "Practise buying and selling with ₦100,000 of virtual money." },
          { href: "/calculator/", icon: "calc", t: "Calculators", d: "See how an amount could have grown, or how savings compound." },
        ].map((x) => (
          <Link key={x.href} href={x.href} className="card card-pad row press" style={{ textDecoration: "none", color: "inherit" }}>
            <span className="tile"><Icon name={x.icon} /></span><span className="grow"><strong style={{ display: "block" }}>{x.t}</strong><span className="small muted">{x.d}</span></span><Icon name="chevron" size={20} />
          </Link>
        ))}
      </div>
      <p className="xs muted row" style={{ gap: 6 }}><VirtualLabel kind="demo" />Prices in Finvora are demo data for learning, not live market quotes.</p>
    </Screen>
  );
}
