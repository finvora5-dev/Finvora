"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fin } from "@/components/Fin";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";

export default function AdminSignIn() {
  const router = useRouter();
  const session = useStore("session");
  return (
    <div className="frame">
      <main id="main" className="main" style={{ alignItems: "center", textAlign: "center", justifyContent: "center" }}>
        <Fin mood="think" size={88} />
        <h1>Admin access only</h1>
        <p className="muted">{session ? `${session.email} isn't an admin account.` : "Sign in with an admin account to continue."}</p>
        <button type="button" className="btn" onClick={() => { api.signInAs("admin@demo.finvora.test"); router.replace("/admin/"); }}>Sign in as admin@demo.finvora.test</button>
        <Link href="/" className="link-btn">Back to the learner app</Link>
      </main>
    </div>
  );
}
