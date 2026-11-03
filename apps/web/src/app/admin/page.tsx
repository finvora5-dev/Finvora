"use client";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";

export default function AdminOverview() {
  const fb = useStore("feedback");
  const admin = useStore("admin");
  const newCount = fb.submissions.filter((s) => s.status === "new").length + api.admin.seedFeedback().filter((s) => s.status === "new").length;
  const pending = api.admin.askReviewQueue().filter((q) => !admin.askReview[q.id]).length;
  const cards = [
    { t: "New feedback", v: newCount, href: "/admin/feedback/" },
    { t: "Ask Fin answers to review", v: pending, href: "/admin/review/" },
    { t: "Learners", v: api.admin.users().length, href: "/admin/users/" },
    { t: "Prompts switched on", v: Object.values(fb.prompts).filter((p) => p.enabled).length, href: "/admin/settings/" },
  ];
  return (
    <AdminShell title="Overview">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {cards.map((c) => <Link key={c.t} href={c.href} className="card card-pad col press" style={{ textDecoration: "none", color: "inherit", gap: 4 }}><span className="small muted">{c.t}</span><strong className="num" style={{ fontSize: 28 }}>{c.v}</strong></Link>)}
      </div>
      <section className="card card-pad col" style={{ gap: 6 }}><h2>Recent changes</h2>
        {admin.audit.length === 0 ? <p className="small muted">No admin changes yet.</p> : admin.audit.slice(0, 5).map((a) => <p key={a.id} className="small"><strong>{a.area}</strong>: {a.change} <span className="muted">· {new Date(a.when).toLocaleString("en-NG")}</span></p>)}
      </section>
    </AdminShell>
  );
}
