"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TopBar, Notice } from "@/components/ui";
import { openDevPanel } from "@/components/DevPanel";
import { api } from "@/lib/api";
import { update } from "@/lib/store";

const DEMO = [
  { email: "free@demo.finvora.test", label: "Free learner" },
  { email: "premium@demo.finvora.test", label: "Plus learner" },
  { email: "admin@demo.finvora.test", label: "Admin" },
];

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function finish(e: string) {
    const s = api.signInAs(e);
    update("profile", (p) => ({ ...p, onboarded: true }));
    router.replace(s.role === "admin" ? "/admin/" : "/");
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy(true); setError("");
    try { await api.requestCode(email); router.push(`/sign-in/code/?email=${encodeURIComponent(email.trim())}`); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  return (
    <div className="frame">
      <TopBar back="/welcome/" title="Sign in" />
      <main id="main" className="main">
        <h2 className="h1">Sign in or create an account</h2>
        <p className="muted">We&apos;ll send a 6-digit code to your email. No password needed.</p>
        <form className="col" onSubmit={submit} noValidate>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="field" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "email-err" : undefined} />
            {error && <p id="email-err" className="error-text" role="alert" style={{ marginTop: 6 }}>{error}</p>}
          </div>
          <button type="submit" className="btn" disabled={busy || !email.trim()}>{busy ? "Sending…" : "Send code"}</button>
        </form>
        <div className="divider" />
        <Notice>Sign-in is simulated: no email is sent and no password is stored. Pick an account to explore each role.</Notice>
        <div className="col" style={{ gap: 8 }}>
          {DEMO.map((d) => <button key={d.email} type="button" className="btn btn-w" onClick={() => finish(d.email)}>{d.label}<span className="xs muted">({d.email})</span></button>)}
        </div>
        <button type="button" className="link-btn" onClick={openDevPanel}>Reviewer tools</button>
      </main>
    </div>
  );
}
