"use client";
// Reviewer controls (build plan §2, B2): latency, forced errors and checkout outcomes.
// Opened from Settings and the sign-in screen ("Reviewer tools"); not part of the learner design.
import { useEffect, useState } from "react";

export const openDevPanel = () => window.dispatchEvent(new Event("fv:dev"));
import { read, update, useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Sheet, Switch, useToast } from "./ui";

export function DevPanel() {
  const [open, setOpen] = useState(false);
  const dev = useStore("dev");
  const session = useStore("session");
  const toast = useToast();
  useEffect(() => { const h = () => setOpen(true); window.addEventListener("fv:dev", h); return () => window.removeEventListener("fv:dev", h); }, []);
  return (
    <>
      {open && (
        <Sheet title="Reviewer tools" onClose={() => setOpen(false)}>
          <p className="small muted">For testing the prototype. Learners never see this.</p>
          <div className="row between"><span>Simulate network delay</span><Switch label="Simulate network delay" checked={dev.latency} onChange={(v) => update("dev", (d) => ({ ...d, latency: v }))} /></div>
          <div className="row between"><span>Make the next request fail</span><Switch label="Make the next request fail" checked={dev.failNextRequest} onChange={(v) => update("dev", (d) => ({ ...d, failNextRequest: v }))} /></div>
          <div>
            <span className="label">Next checkout result</span>
            <div className="chips">{(["success", "failed", "slow", "offline"] as const).map((o) => <button key={o} type="button" className="chip" aria-pressed={dev.checkoutOutcome === o} onClick={() => update("dev", (d) => ({ ...d, checkoutOutcome: o }))}>{o}</button>)}</div>
          </div>
          <div>
            <span className="label">Switch demo account</span>
            <div className="chips">{["free@demo.finvora.test", "premium@demo.finvora.test", "admin@demo.finvora.test"].map((e) => (
              <button key={e} type="button" className="chip" aria-pressed={session?.email === e} onClick={() => { if (!e.startsWith("premium")) update("billing", (b) => ({ ...b, sub: { plan: "free" } })); api.signInAs(e); toast(`Signed in as ${e}`); }}>{e.split("@")[0]}</button>
            ))}</div>
          </div>
          <button type="button" className="btn btn-w" onClick={() => { api.advanceDay(); toast(`Market moved to day ${read("sim").day}`); }}>Advance market day</button>
          <button type="button" className="btn btn-w" onClick={() => { api.resetDemo(); toast("Demo data reset"); setOpen(false); }}>Reset demo data</button>
        </Sheet>
      )}
    </>
  );
}
