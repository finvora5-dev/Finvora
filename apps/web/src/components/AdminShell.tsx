"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SessionGuard } from "./ui";
import { useStore } from "@/lib/store";

const LINKS = [
  ["/admin/", "Overview"], ["/admin/feedback/", "Feedback inbox"], ["/admin/settings/", "Feedback settings"],
  ["/admin/review/", "Ask Fin review"], ["/admin/users/", "Users and payments"], ["/admin/audit/", "Audit log"],
] as const;

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const path = usePathname();
  const session = useStore("session");
  return (
    <div className="admin">
      <SessionGuard admin />
      <aside aria-label="Admin">
        <div className="row" style={{ padding: "4px 8px 12px" }}><span className="logo" aria-hidden="true">F</span><strong>Admin</strong></div>
        {LINKS.map(([href, label]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>{label}</Link>)}
        <Link href="/">Learner app</Link>
      </aside>
      <main id="main">
        <div className="row between wrap"><h1>{title}</h1><span className="small muted">{session?.email}</span></div>
        <p className="xs muted">Admin access here is a demonstration of the permission model, checked in the browser only. Production uses server-side authorisation.</p>
        {children}
      </main>
    </div>
  );
}
