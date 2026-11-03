"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Screen, TopBar, Dialog, useToast } from "@/components/ui";
import { openDevPanel } from "@/components/DevPanel";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api";
import { update, useStore } from "@/lib/store";

const GOALS = ["Understand investing basics", "Learn about Nigerian companies", "Grow my savings", "Practise with the simulator"];

export default function Settings() {
  const router = useRouter();
  const toast = useToast();
  const profile = useStore("profile");
  const session = useStore("session");
  const [confirm, setConfirm] = useState<"signout" | "reset" | "delete" | null>(null);

  return (
    <Screen top={<TopBar back="/me/" title="Settings" />}>
      <section className="card card-pad col" style={{ gap: 6 }}>
        <span className="label">Email</span><span>{session?.email}</span>
      </section>
      <div><label className="label" htmlFor="goal">Your goal</label>
        <select id="goal" className="field" value={profile.goal ?? GOALS[0]} onChange={(e) => { update("profile", (p) => ({ ...p, goal: e.target.value })); toast("Goal updated"); }}>{GOALS.map((g) => <option key={g}>{g}</option>)}</select></div>
      <ul className="card" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        <li><button type="button" className="li" onClick={() => setConfirm("reset")}><Icon name="undo" /><span className="grow">Reset my progress and practice portfolio</span></button></li>
        <li><button type="button" className="li" onClick={() => setConfirm("signout")}><Icon name="back" /><span className="grow">Sign out</span></button></li>
        <li><button type="button" className="li" onClick={() => setConfirm("delete")} style={{ color: "#B42020" }}><Icon name="alert" /><span className="grow">Delete account</span></button></li>
      </ul>
      <p className="small muted">Finvora is for financial education. It does not give financial advice, and the simulator never places real trades.</p>
      <button type="button" className="link-btn" onClick={openDevPanel}>Reviewer tools</button>
      {confirm === "signout" && <Dialog title="Sign out?" body="Your progress stays on this device." confirm="Sign out" onConfirm={() => { api.signOut(); router.replace("/welcome/"); }} onCancel={() => setConfirm(null)} />}
      {confirm === "reset" && <Dialog title="Reset your progress?" body="This clears lessons, XP, saved articles, watchlist and your practice portfolio on this device. You stay signed in." confirm="Reset" destructive onConfirm={() => { api.resetDemo(); setConfirm(null); toast("Progress reset"); }} onCancel={() => setConfirm(null)} />}
      {confirm === "delete" && <Dialog title="Delete your account?" body="This removes your account and everything on this device. It can't be undone." confirm="Delete account" destructive onConfirm={() => { api.resetDemo(); api.signOut(); router.replace("/welcome/"); }} onCancel={() => setConfirm(null)} />}
    </Screen>
  );
}
