"use client";
import Link from "next/link";
import { Fin } from "@/components/Fin";

export default function Welcome() {
  return (
    <div className="frame">
      <main id="main" className="main" style={{ justifyContent: "center", alignItems: "center", textAlign: "center", gap: 18 }}>
        <span className="logo" aria-hidden="true" style={{ width: 52, height: 52, fontSize: 26, borderRadius: 14 }}>F</span>
        <Fin mood="wave" size={150} />
        <h1 style={{ fontSize: 30 }}>Understand money and investing, five minutes at a time.</h1>
        <p className="muted" style={{ maxWidth: 340 }}>Short lessons with Nigerian examples, a library of plain-English explanations, and a simulator to practise with virtual money.</p>
      </main>
      <footer className="sticky-cta">
        <Link href="/goal/" className="btn">Get started</Link>
        <Link href="/sign-in/" className="link-btn">I already have an account</Link>
      </footer>
    </div>
  );
}
