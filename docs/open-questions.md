# Open questions

Split by phase on 29 Oct 2026. **Only the Phase 1 list blocks current work.** Phase 2 questions are parked until the prototype is approved; nobody needs to answer them now.

## Phase 1: needed for the prototype (answer now)

| # | Question | Why Phase 1 needs it | Answer |
|---|---|---|---|
| 1 | **Design direction:** pink/red (Core screens + Light mode) or blue (Option B)? | Sets the colour tokens the build starts from in Week 1 | **Navy and emerald**, light mode only (client, Nov 2026). |
| 2 | **Sample-price label:** show a small "Sample prices" label wherever prices appear (PRD §4.1), or no label? | Prototype prices are made up; the PRD asks for a label | **Yes, but not the word "sample".** Use "Illustrative prices" (or "Illustrative market data" on index cards), as the designs already do. |
| 3 | **Prices shown:** keep ₦2,500 / month and ₦25,000 / year in the prototype? | They appear on the pricing, checkout and profile screens | **No.** Plus is ₦5,999 a month or ₦65,989 a year (one month free). |
| 4 | **Free vs Premium split:** keep what the mockups show (10 AI questions a day on Free; Compare, dividend history, deep report scans and PDF summaries on Premium)? | Drives which screens are locked in the prototype | **Plus:** unlimited AI questions, Compare companies, dividend history, 5-year statements, unlimited price alerts. **Free:** 5 AI questions a day, all courses, the practice market, 1 price alert. PDF summaries removed. The prototype shows this split on the plan screens only; locked states move to Phase 2 (12 Nov 2026). |
| 5 | **Feedback and sign-off:** who gives consolidated feedback and approves the prototype? | PRD §7 assumes one consolidated reviewer and a 48-hour feedback window | **The client and the project owner** give feedback and approve. |
| 6 | **Prototype success:** what would make the client happy with Stage 1? | Defines "done" for Week 5 | **An interactive design plus a working prototype that behaves like the real web app.** |
| 7 | **Founders' expectations:** do they accept that Stage 1 has sample prices, scripted AI and no real users (their brief mentions live data and onboarding early users)? | Avoids a mismatch at the Week 5 review | **Yes.** They accept illustrative prices, scripted AI and no real users. Phase 1 is the design and the prototype. |

## Phase 2: parked until the prototype is approved

These don't block Phase 1. The related build rules stay in `build-backlog.md` (B5 to B10) and the **Pre-launch checklist**, so nothing is lost.

| Question | Owner | Related |
|---|---|---|
| Minimum age (18+ only, or under-18s on Free?) | Client + lawyer | B10 |
| Renewal grace period (3–7 days suggested) | Client | B5 |
| Monthly to yearly: at renewal or immediately with credit? | Client | B10 |
| Market-data provider and display licence | Client | Proposal §12 |
| AI provider, model and monthly budget; its data terms | Client + developer | Proposal §6, B10 |
| Which 30–50 companies, metrics and reports at launch | Client | PRD §9 |
| VAT on Premium and receipts | Client's accountant | B10 |
| Operating company and insurance | Client | Pre-launch checklist |
| SEC Nigeria "education, not advice"; NDPA duties; retention periods | Lawyer | Pre-launch checklist |
| Analytics tool and consent | Client + developer | B10 |
| Locked views for Free users: Compare and dividend history blurred behind a "See plans" card (the `PremiumGate` pattern), and the lesson "Compare Zenith and GTCO" link becoming "Compare in full · Plus" | Developer, client approves | B1 (plan gating) |
| Deep report scans: keep as a Plus feature or drop? Not in the current design | Client | Q4 |
| Free AI limit: 5 a day (current design) or 10 (first mockups)? | Client | Q4 |
| Personalised Home ("Your companies"): what counts as interest (views, watchlist, compares), and how long history is kept | Client + developer | B10 (analytics, AI data) |
| Lessons linking to real companies: which lessons get a real-company card, and who picks the companies | Client | Content |
