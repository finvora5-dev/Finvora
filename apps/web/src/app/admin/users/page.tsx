"use client";
import { formatNaira } from "@finvora/domain";
import { AdminShell } from "@/components/AdminShell";
import { Notice } from "@/components/ui";
import { api } from "@/lib/api";

const STATUS: Record<string, string> = { confirmedSuccess: "Paid (confirmed)", confirmedFailed: "Failed (confirmed)", pending: "Pending" };

export default function Users() {
  return (
    <AdminShell title="Users and payments">
      <section className="col"><h2>Learners</h2>
        <table className="t"><thead><tr><th scope="col">Email</th><th scope="col">Plan</th><th scope="col">Joined</th><th scope="col">Lessons done</th></tr></thead>
          <tbody>{api.admin.users().map((u) => <tr key={u.id}><td>{u.email}</td><td>{u.plan === "plus" ? "Plus" : "Free"}</td><td className="num">{u.joined}</td><td className="num">{u.lessons}</td></tr>)}</tbody></table>
      </section>
      <section className="col"><h2>Orders</h2>
        <Notice>Staff can view orders but cannot mark them paid. Only the payment provider&apos;s confirmation changes an order.</Notice>
        <table className="t"><thead><tr><th scope="col">Order</th><th scope="col">Email</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">Date</th></tr></thead>
          <tbody>{api.admin.orders().map((o) => <tr key={o.id}><td className="num">{o.id}</td><td>{o.email}</td><td className="num">{formatNaira(o.amountKobo)}</td><td>{STATUS[o.status]}</td><td className="num">{o.at}</td></tr>)}</tbody></table>
      </section>
    </AdminShell>
  );
}
