"use client";
import { AdminShell } from "@/components/AdminShell";
import { Empty } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function Audit() {
  const admin = useStore("admin");
  return (
    <AdminShell title="Audit log">
      <p className="muted">Every admin change is recorded here. Entries can&apos;t be edited or deleted.</p>
      {admin.audit.length === 0 ? <Empty title="No changes yet" body="Changes to feedback settings and reviews will appear here." /> : (
        <table className="t"><thead><tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">Area</th><th scope="col">Change</th></tr></thead>
          <tbody>{admin.audit.map((a) => <tr key={a.id}><td className="num">{new Date(a.when).toLocaleString("en-NG")}</td><td>{a.who}</td><td>{a.area}</td><td>{a.change}</td></tr>)}</tbody></table>
      )}
    </AdminShell>
  );
}
