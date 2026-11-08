# Open questions

Split by phase on 29 Oct 2026. **Only the Phase 1 list blocks current work.** Phase 2 questions are parked until the prototype is approved; nobody needs to answer them now.

## Phase 1: needed for the prototype (answer now)

| # | Question | Why Phase 1 needs it | Answer |
|---|---|---|---|
| 1 | **Design direction:** pink/red (Core screens + Light mode) or blue (Option B)? | Sets the colour tokens the build starts from in Week 1 | |
| 2 | **Sample-price label:** show a small "Sample prices" label wherever prices appear (PRD §4.1), or no label? | Prototype prices are made up; the PRD asks for a label | |
| 3 | **Prices shown:** keep ₦2,500 / month and ₦25,000 / year in the prototype? | They appear on the pricing, checkout and profile screens | |
| 4 | **Free vs Premium split:** keep what the mockups show (10 AI questions a day on Free; Compare, dividend history, deep report scans and PDF summaries on Premium)? | Drives which screens are locked in the prototype | 8 Nov 2026: the client added more Plus features (company analysis, risk signals, dividend tracker, watchlists, portfolio intelligence, crisis simulator, scenarios). See [premium-features.md](premium-features.md); needs a design before building. |
| 5 | **Feedback and sign-off:** who gives consolidated feedback and approves the prototype? | PRD §7 assumes one consolidated reviewer and a 48-hour feedback window | |
| 6 | **Prototype success:** what would make the client happy with Stage 1? | Defines "done" for Week 5 | |
| 7 | **Founders' expectations:** do they accept that Stage 1 has sample prices, scripted AI and no real users (their brief mentions live data and onboarding early users)? | Avoids a mismatch at the Week 5 review | |

## Decisions recorded 8 Nov 2026 (from the product owner)

| # | Decision | Notes |
|---|---|---|
| D1 | **Plus price: ₦5,999 a month** (599900 kobo), agreed by the client. **Yearly: ₦65,989** (6598900 kobo): one month free, 11 × ₦5,999. | Full price would be ₦71,988, so yearly saves ₦5,999 (about 8%). Answers question 3. |
| D2 | **Free Ask Fin limit: 5 questions a day.** | Answers question 4's AI limit. |
| D3 | **Practice market follows real NGX hours** (weekdays 10:00 to 14:30, Lagos time). Reviewer tools can still open it. | |
| D4 | **Ask Fin declines non-finance questions and says when it has no figures for a company**, following the RAG procedure in [phase2-ai-rag.md](phase2-ai-rag.md): scope check, then retrieval from approved content, then a grounded answer with real references, else "not enough information". Phase 1 runs this on the app's own Library content in the browser, labelled as example answers. | No live AI or paid service in Phase 1. |
| D5 | **Labels:** a quiet label on scripted Ask Fin answers ("Example answer") and on made-up company figures ("Made-up figures"). | Answers question 2 in part. |
| D6 | **Plus features in the prototype:** portfolio insights, market crisis simulator and interactive scenarios built with made-up data; dividend tracker and historical comparisons on made-up companies; "Risk Signals" and "Investment Intelligence" renamed to learning names (for example "Risk explained"). | See [premium-features.md](premium-features.md). |
| D7 | **Reviewer tools** sit behind a short reviewer code given only to the client. | Testers who are learners don't see them. |
| D8 | **Replay becomes "Practise my mistakes"** (only missed questions) plus a quick refresher. Reward: 2 XP once per lesson per day, plus a bonus for fixing every mistake. | |
| D9 | **Text zoom on phones: not in Phase 1.** Recorded as a known accessibility gap (WCAG 1.4.4). | |
| D10 | **Admin works on phones too**, responsive across all devices. | Needs a mock-up first. |
| D11 | **Phase 1 success:** a tester finishes a lesson and starts the next one without being asked, and nobody gets lost or stuck. | |
| D12 | **Market hours, refined:** when closed, show the next opening time (Lagos time), let practice orders queue for the open, and offer a lesson meanwhile. Prices move only on trading days. | Keeps D3; stops testers getting stuck. |
| D13 | **All of the client's listed Plus features are built** (replaces the "build some, lock the rest" option). One shared advice check blocks buy, sell, avoid, rating, signal, recommend, scores and ranks in all Plus and Ask Fin text. Learning names: "What this number means" (was Risk Signals), "Your practice portfolio" (was Portfolio intelligence). The word is **Plus** everywhere. | Refines D6. |
| D14 | **Admin on phones = admin tasks** (approve, check, switch on or off); wide tables say "open on a larger screen". | Refines D10. |
| D15 | **Text zoom is in Phase 1** (the owner reversed the earlier removal on 8 Nov). Text on phones follows the phone's text-size setting, starting with the lesson path, then the other screens. | Replaces D9. WCAG 1.4.4. |
| D16 | **Review what I missed** (the name for D8): a miss is a question wrong on the first try and clears when answered right; fixing every miss gives +5 XP once per lesson, ever, and the "Came back stronger" badge; full replay stays as a small link. No spaced-recall checks. | Refines D8. |
| D17 | **Practice Market:** made-up companies are presented as a named Practice Market with one clear line at its entrance and a small icon inside; Ask Fin answers say "Example answer from the Finvora Library" with a link; checkout says "No money is taken". Mock-up first. | Refines D5. |
| D18 | **Ask Fin:** declines and "no figures" replies do not count towards the 5-a-day limit; answers come from a search of Library text with a minimum match score, tested on about 30 questions. | Refines D4. |
| D19 | **Sign-off:** the product owner is the reviewer and signs off by using the app. No activity log or session recording in the code. | Answers question 5 and replaces the D11 measurement ideas. Question 7 answered: the client knows all of this is Phase 1. Question 1 answered: purple, as on the live site. |

| D20 | **Reviewer tools use a separate demo copy of the data.** Changes made from Reviewer tools (plan, progress, market) go into a demo copy; "Back to my progress" restores the tester's real progress exactly as it was. No reviewer-mode label, and the test sign-in codes stay as they are. The reviewer code (D7) stays. | Answers Q9 from the review. |

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
