"use client";
import { AdminShell } from "@/components/AdminShell";
import { Empty } from "@/components/ui";
import { api } from "@/lib/api";
import { update, useStore } from "@/lib/store";

export default function Inbox() {
  const fb = useStore("feedback");
  const rows = [...fb.submissions, ...api.admin.seedFeedback()];
  return (
    <AdminShell title="Feedback inbox">
      {rows.length === 0 ? <Empty title="No feedback yet" body="Reports, ratings and suggestions from learners appear here." /> : (
        <table className="t"><thead><tr><th scope="col">Type</th><th scope="col">Where</th><th scope="col">Message</th><th scope="col">Date</th><th scope="col">Status</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}><td><span className="tag">{r.kind}</span></td><td>{r.where}</td><td>{r.text}</td><td className="num">{r.at}</td>
              <td>{r.status === "new" && fb.submissions.some((s) => s.id === r.id)
                ? <button type="button" className="btn btn-w btn-sm" onClick={() => { update("feedback", (f) => ({ ...f, submissions: f.submissions.map((s) => (s.id === r.id ? { ...s, status: "read" as const } : s)) })); api.admin.audit("Feedback inbox", `Marked ${r.id} as read`); }}>Mark read</button>
                : <span className="small muted">{r.status === "new" ? "New" : "Read"}</span>}</td></tr>
          ))}</tbody></table>
      )}
    </AdminShell>
  );
}
