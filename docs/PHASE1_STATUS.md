# Phase 1 prototype: status and reviewer guide

**Updated:** 8 Nov 2026 · **Branch:** `awesome-bardeen-2pkwcl` · **Live:** https://finvora.ehigiatorpowell1.workers.dev

## What the prototype is

A browser-only prototype of Finvora, a money and investing education app for Nigerian beginners. It runs entirely in the visitor's browser: no backend, no real accounts, no real payments, no live AI and no market data. Everything a visitor does is saved in that browser only (keys starting `fv.`).

Its job (D11, D19): a tester finishes a lesson and starts the next one without being asked, and nobody gets lost or stuck. The product owner is the reviewer and signs off by testing the app personally.

The earlier Next.js web app described in older versions of this file was removed on 4 Nov 2026. Its tested rules live on in `packages/`.

## How it is built

| Path | What it holds |
|---|---|
| `packages/domain` | Tested TypeScript rules: money in integer kobo, fees, simulator prices and trades, market hours in Lagos time, checkout states (build-backlog B5), Ask Fin answers and refusals, entitlements, calculators, search. Also every configurable value (`config.ts`) and the label words (`LABELS`). These carry into Phase 2. |
| `packages/engine` | Game rules: XP amounts and levels (`rules.ts`), content types. |
| `packages/sample-data` | Lessons, 15 Library articles, scripted Ask Fin answers, companies, admin seed data. |
| `apps/prototype/site` | The live site: screens (`*.dc.html` boards), `fvd.js` (the compiled domain rules), `fv.js` (browser state and glue), `responsive.js` (fitting screens to every width, toasts, motion), `sw.js` (offline cache). |
| `apps/prototype/tools` | Build and wiring scripts, run in the order in `tools/README.md`. |
| `docs/designs` | Approved EGM designs. |

The screens and wiring scripts are prototype scaffolding and are not expected to carry into Phase 2; the domain packages are.

## How to run

```bash
npm install
npm test              # domain and engine tests
npm run typecheck
cd apps/prototype/site && python3 -m http.server 8791
```

Rebuild steps are in `apps/prototype/tools/README.md`. `build_sw.py` always runs last.

## What works

*   **Learning:** World 1 with six 7-step lessons (explainer, myth or compare, question, order, match, scenario, calculation), a boss challenge, daily question, micro modules, challenges, XP, five levels, streak with a weekly rest day, badges, lesson replay. Inside lessons: a "3 in a row" label and Fin's halfway cheer. After a lesson: a learning receipt, the streak fire dial (first activity of the day) and a "new high" level chart (when a level is crossed), then the summary.
*   **Library:** 15 articles with takeaways, how it works, an African example with made-up figures and common mistakes; search; saved articles; dictionary. Reading an article to the end earns 3 XP once.
*   **Ask Fin:** scripted answers, refusal of buy or sell advice, a free limit of 5 questions a day, links only to real Library articles, every answer labelled "Example answer from the Finvora Library".
*   **Practice Market (simulator):** made-up companies and virtual naira, amount-first buying, approximate fees, real NGX hours (weekdays 10:00 to 14:30 Lagos time) with a closed sheet that shows the next opening time and offers to queue the order or do a lesson. Prices move once per trading day.
*   **Plans and checkout:** Plus at ₦5,999 a month or ₦65,989 a year (one month free); simulated checkout with pending, confirmed success and confirmed failed states; receipt email preview.
*   **Admin (browser-only demonstration):** staff sign-in, overview, content editor, daily-question builder, Ask Fin review, AI summary approvals, users and payments, plan prices, feedback, audit log.
*   **Reviewer tools** (Settings, or the sign-in screen): switch Free or Plus, sign in as Ada, open admin, pick the next checkout result, open the market, jump progress, clear everything. Open to everyone by decision D21.
*   **Phones:** every screen fits widths from 280 px up; the lesson path follows the phone's text-size setting.

## Decisions and designs

*   All product decisions: `docs/open-questions.md` (D1 to D21).
*   Design Part 1, built: `docs/designs/prototype-settings-labels-storage.md`.
*   Still to design: Part 2 Review what I missed (D8, D16), Part 3 Ask Fin grounded answers (D4, D18), Part 4 Plus features (D6, D13), Part 5 admin tasks on phones (D10, D14).
*   EGM review brief: `concepts_brief.md`.

## Known limits

*   Everything is per browser. Clearing the browser or switching device loses progress.
*   Reviewer tools are open to everyone (D21).
*   Admin checks run in the browser and are not real security.
*   Text size follows the phone setting on the lesson path only so far; other screens rely on pinch zoom.
*   Ask Fin matches about 19 scripted answers by keyword. It does not yet search the Library text (Part 3).
*   Market hours ignore public holidays.
*   Lesson and article content was written for the prototype and needs review by a finance educator.

## Phase 2 (not in this build)

Real backend and accounts, Paystack payments confirmed by our server, the market-data provider, live AI with RAG (`docs/phase2-ai-rag.md`), notifications, analytics and staff roles. The open Phase 2 questions are in `docs/open-questions.md`.
