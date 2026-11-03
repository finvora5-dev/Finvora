"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TopBar } from "@/components/ui";
import { Fin } from "@/components/Fin";
import { update, read } from "@/lib/store";

const GOALS = ["Understand investing basics", "Learn about Nigerian companies", "Grow my savings", "Practise with the simulator"];

export default function Goal() {
  const router = useRouter();
  const [goal, setGoal] = useState(GOALS[0]!);
  return (
    <div className="frame">
      <TopBar back="/welcome/" title="Your goal" />
      <main id="main" className="main has-sticky">
        <div className="row"><Fin mood="talk" size={56} /><h2 className="h1" style={{ fontSize: 22 }}>What would you like to get from Finvora?</h2></div>
        <p className="muted">This helps us choose what to show you first. You can change it later in Settings.</p>
        <div className="col" role="radiogroup" aria-label="Your goal">
          {GOALS.map((g) => <button key={g} type="button" role="radio" aria-checked={goal === g} className="option" onClick={() => setGoal(g)}>{g}</button>)}
        </div>
      </main>
      <footer className="sticky-cta">
        <button type="button" className="btn" onClick={() => { update("profile", (p) => ({ ...p, goal })); router.push(read("session") ? "/" : "/sign-in/"); }}>Continue</button>
      </footer>
    </div>
  );
}
