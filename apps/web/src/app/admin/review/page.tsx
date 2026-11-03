"use client";
import { AdminShell } from "@/components/AdminShell";
import { Empty } from "@/components/ui";
import { api } from "@/lib/api";
import { update, useStore } from "@/lib/store";

export default function AskReview() {
  const admin = useStore("admin");
  const ask = useStore("ask");
  const queue = [
    ...api.admin.askReviewQueue(),
    ...ask.history.filter((h) => h.r.kind !== "answer").slice(-5).map((h, i) => ({ id: `live-${i}-${h.at}`, question: h.q, answerKind: h.r.kind, flagged: h.r.kind === "refusal" ? "Advice request" : "No scripted answer", status: "pending" })),
  ];
  const decide = (id: string, d: "approved" | "rejected") => { update("admin", (a) => ({ ...a, askReview: { ...a.askReview, [id]: d } })); api.admin.audit("Ask Fin review", `${d === "approved" ? "Approved" : "Flagged for rewrite"} answer ${id}`); };
  return (
    <AdminShell title="Ask Fin review">
      <p className="muted">Questions Fin refused, couldn&apos;t answer, or a learner marked unhelpful.</p>
      {queue.length === 0 ? <Empty title="Nothing to review" body="New items appear when Fin refuses or can't answer a question." /> : (
        <table className="t"><thead><tr><th scope="col">Question</th><th scope="col">Answer type</th><th scope="col">Why it's here</th><th scope="col">Decision</th></tr></thead>
          <tbody>{queue.map((q) => (
            <tr key={q.id}><td>{q.question}</td><td>{q.answerKind}</td><td>{q.flagged}</td>
              <td>{admin.askReview[q.id] ? <span className="tag">{admin.askReview[q.id] === "approved" ? "Approved" : "Needs rewrite"}</span> : <div className="row" style={{ gap: 6 }}><button type="button" className="btn btn-sm" onClick={() => decide(q.id, "approved")}>Approve</button><button type="button" className="btn btn-w btn-sm" onClick={() => decide(q.id, "rejected")}>Needs rewrite</button></div>}</td></tr>
          ))}</tbody></table>
      )}
    </AdminShell>
  );
}
