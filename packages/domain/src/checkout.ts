// Simulated checkout following build-backlog §B5 rules. No card data, no real payment.
// A failed or missing response is never a failed payment; only the (mock) server check decides.

export type OrderStatus = "pending" | "confirmedSuccess" | "confirmedFailed";
export type BillingPeriod = "monthly" | "yearly";

export interface Order {
  id: string;
  period: BillingPeriod;
  amountKobo: number;
  status: OrderStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  plan: "free" | "plus";
  period?: BillingPeriod;
  renewsOn?: string;
  /** Cancelled: Plus stays until renewsOn, then ends. */
  cancelled?: boolean;
}

export type ServerCheck = "success" | "failed" | "pending" | "offline";

export function createOrder(id: string, period: BillingPeriod, amountKobo: number, at: string): Order {
  return { id, period, amountKobo, status: "pending", attempts: 1, createdAt: at, updatedAt: at };
}

/** Apply the result of our server's check with the payment provider. "offline"/"pending" change nothing. */
export function applyCheck(order: Order, check: ServerCheck, at: string): Order {
  if (order.status !== "pending") return order;
  if (check === "success") return { ...order, status: "confirmedSuccess", updatedAt: at };
  if (check === "failed") return { ...order, status: "confirmedFailed", updatedAt: at };
  return order;
}

/** Retry is a new attempt on the same order, only after a confirmed failure. */
export function retry(order: Order, at: string): Order {
  if (order.status !== "confirmedFailed") throw new Error("Retry is only allowed after a confirmed failure");
  return { ...order, status: "pending", attempts: order.attempts + 1, updatedAt: at };
}

/** Starting a purchase while already on Plus or with a pending order returns the existing state. */
export function canStartPurchase(sub: Subscription, orders: Order[]): { ok: true } | { ok: false; reason: "already-plus" | "pending"; orderId?: string } {
  if (sub.plan === "plus" && !sub.cancelled) return { ok: false, reason: "already-plus" };
  const pending = orders.find((o) => o.status === "pending");
  if (pending) return { ok: false, reason: "pending", orderId: pending.id };
  return { ok: true };
}

export function addPeriod(day: string, period: BillingPeriod): string {
  const d = new Date(day + "T00:00:00Z");
  if (period === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
  else d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/** Effective plan today: a cancelled subscription keeps Plus until its renewal date. */
export function effectivePlan(sub: Subscription, today: string): "free" | "plus" {
  if (sub.plan !== "plus") return "free";
  if (sub.cancelled && sub.renewsOn && today >= sub.renewsOn) return "free";
  return "plus";
}
