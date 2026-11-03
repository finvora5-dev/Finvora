"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TopBar, Notice } from "@/components/ui";
import { api } from "@/lib/api";
import { update } from "@/lib/store";

export default function Code() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [tries, setTries] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setEmail(new URLSearchParams(window.location.search).get("email") ?? ""); }, []);
  const locked = tries >= 3;

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!/^\d{6}$/.test(code)) { setError("Enter the 6 digits from the email."); return; }
    setBusy(true); setError("");
    try {
      const r = await api.verifyCode(email, code);
      if (r.ok) { update("profile", (p) => ({ ...p, onboarded: true })); router.replace(r.session.role === "admin" ? "/admin/" : "/"); return; }
      setTries((t) => t + 1);
      setError(r.reason === "wrong" ? "That code isn't right. Check the email and try again." : "That code has expired. Send a new one.");
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  return (
    <div className="frame">
      <TopBar back="/sign-in/" title="Enter code" />
      <main id="main" className="main">
        <h2 className="h1">Check your email</h2>
        <p className="muted">We sent a 6-digit code to <strong>{email || "your email"}</strong>.</p>
        {locked ? <Notice tone="warn">Too many tries. For your security, wait 15 minutes or send a new code.</Notice> : (
          <form className="col" onSubmit={submit} noValidate>
            <div>
              <label className="label" htmlFor="code">6-digit code</label>
              <input id="code" className="field num" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-invalid={!!error} aria-describedby="code-help" style={{ letterSpacing: ".3em", fontSize: 22 }} />
              {error ? <p className="error-text" role="alert" style={{ marginTop: 6 }}>{error}</p> : <p id="code-help" className="help" style={{ marginTop: 6 }}>For review: any 6 digits work. 000000 shows a wrong code, 111111 an expired one.</p>}
            </div>
            <button type="submit" className="btn" disabled={busy || code.length !== 6}>{busy ? "Checking…" : "Continue"}</button>
          </form>
        )}
        <button type="button" className="link-btn" onClick={() => { setTries(0); setError(""); setCode(""); }}>Send a new code</button>
      </main>
    </div>
  );
}
