"use client";
// Simulated checkout following build-backlog §B5: a failed response is never a failed payment.
// Only our "server check" decides. Retry reuses the same order. No retry while pending.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CONFIG, formatNaira, type Order } from "@finvora/domain";
import { Screen, TopBar, Notice } from "@/components/ui";
import { Fin } from "@/components/Fin";
import { api, ApiError } from "@/lib/api";
import { useStore, useHydrated } from "@/lib/store";

export default function Checkout() {
  const hydrated = useHydrated();
  const billing = useStore("billing");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | undefined>();
  const [offline, setOffline] = useState(false);
  const [slow, setSlow] = useState(false);
  const [checking, setChecking] = useState(false);
  const started = useRef<number>(0);

  useEffect(() => { if (hydrated) { const id = new URLSearchParams(window.location.search).get("order"); setOrderId(id); setOrder(id ? api.order(id) : undefined); } }, [hydrated]);

  const check = useCallback(async (id: string) => {
    setChecking(true); setOffline(false);
    try {
      const o = await api.checkOrder(id);
      setOrder(o);
      if (o.status === "pending" && Date.now() - started.current > CONFIG.CHECKOUT_SLOW_AFTER_MS) setSlow(true);
    } catch (e) { if (e instanceof ApiError && e.code === "network") setOffline(true); }
    finally { setChecking(false); }
  }, []);

  // Poll while pending.
  useEffect(() => {
    if (!orderId || !order || order.status !== "pending" || offline) return;
    if (!started.current) started.current = Date.now();
    const t = setTimeout(() => void check(orderId), 1500);
    return () => clearTimeout(t);
  }, [orderId, order, offline, check]);

  if (!hydrated) return null;
  if (!order) return <Screen top={<TopBar back="/plans/" title="Checkout" />}><Notice tone="bad">We couldn&apos;t find that order. <Link href="/plans/">Back to plans</Link></Notice></Screen>;

  const amount = formatNaira(order.amountKobo);
  const ref = <p className="xs muted center">Order {order.id} · attempt {order.attempts}</p>;

  if (order.status === "confirmedSuccess") return (
    <Screen top={<TopBar title="Payment confirmed" />} nav={false} sticky={<Link href="/" className="btn">Start exploring Plus</Link>}>
      <div className="col center pop" style={{ alignItems: "center" }}><Fin mood="proud" size={110} /><h1>You&apos;re on Plus</h1><p className="muted">We confirmed your {amount} payment. Your plan renews on {billing.sub.renewsOn}.</p></div>
      {ref}
    </Screen>
  );

  if (order.status === "confirmedFailed") return (
    <Screen top={<TopBar back="/plans/" title="Payment not completed" />} nav={false} sticky={<><button type="button" className="btn" onClick={() => { const o = api.retryOrder(order.id); started.current = Date.now(); setSlow(false); setOrder(o); }}>Try again</button><Link href="/plans/" className="link-btn">Back to plans</Link></>}>
      <div className="col center" style={{ alignItems: "center" }}><Fin mood="oops" size={96} /><h1>Payment not completed</h1><p className="muted">The payment provider confirmed this payment didn&apos;t go through. You haven&apos;t been charged. Trying again uses the same order, so you can&apos;t be charged twice.</p></div>
      {ref}
    </Screen>
  );

  return (
    <Screen top={<TopBar title="Checking your payment" />} nav={false} sticky={offline ? <button type="button" className="btn" onClick={() => void check(order.id)} disabled={checking}>{checking ? "Checking…" : "Check again"}</button> : undefined}>
      <div className="col center" style={{ alignItems: "center" }} aria-live="polite">
        <Fin mood={offline ? "sleep" : "think"} size={96} />
        <h1>{offline ? "You're offline" : slow ? "This is taking longer than usual" : "Checking with the payment provider"}</h1>
        <p className="muted">{offline ? "We can't check your payment right now. If you paid, it's safe: we'll confirm it when you're back online." : slow ? "Your payment may still be processing. Please don't pay again. We'll keep checking." : `Confirming your ${amount} payment. Please don't pay again or close this screen.`}</p>
        {!offline && <p className="muted" aria-hidden="true"><span className="dot">●</span> <span className="dot" style={{ animationDelay: ".2s" }}>●</span> <span className="dot" style={{ animationDelay: ".4s" }}>●</span></p>}
      </div>
      <Notice>Simulated checkout. No card details were collected and no money moves. Use Reviewer tools to pick the outcome.</Notice>
      {ref}
    </Screen>
  );
}
