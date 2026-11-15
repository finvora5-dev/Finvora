# Phase 1 prototype: status and reviewer guide

**Updated:** 15 Nov 2026 · **Branch:** `awesome-bardeen-2pkwcl` (Cloudflare deploys from it) · **Live:** https://finvora.ehigiatorpowell1.workers.dev

## What changed on 15 Nov 2026

The live site is now the **navy and emerald redesign** (the client's approved canvas, "Finvora: Intelligence Redesign"). It replaced the earlier prototype on this branch. The earlier prototype is kept, unchanged, on the branch `old-website-backup`.

Checked on the live site, 15 Nov 2026: the front page opens the navy welcome screen on a phone with no script errors, the latest build is served, and old-prototype pages no longer exist. Cloudflare serves pages without `.html` (`MainNavy.dc.html` redirects to `MainNavy.dc`).

## What the prototype is

A browser-only prototype of Finvora, a money and investing education app for Nigerian beginners. No backend, no real accounts, no real payments, no live AI and no live market data. Everything a visitor does is saved in that browser only (keys starting `fv.`). Made-up prices are labelled "Illustrative prices".

## How it is built

| Path | What it holds |
|---|---|
| `apps/prototype/site` | The live site: the navy canvas boards (`*Navy.dc.html`) run by `support.js`, `responsive.js` (fits each screen, picks phone or laptop boards, screen transitions, lesson sounds), `responsive.css`, `fv.js` (browser state and glue), `fvd.js` (compiled domain rules), `sfx/` (lesson sounds), `sw.js` (offline cache). |
| `apps/prototype/tools` | Wiring scripts (`wire_navy_*.py`), `build_sw.py` (always last), and the checkers `qa_mobile.cjs` and `qa_responsive.cjs`. |
| `packages/domain`, `packages/engine`, `packages/sample-data` | Tested rules and data: money in integer kobo, checkout states (build-backlog §B5), companies, lessons. These carry into Phase 2. |
| `wrangler.jsonc` | Cloudflare static-assets deploy of `apps/prototype/site`. |

Build plan and decisions: `docs/PROTOTYPE_BUILD_PLAN.md`. Open questions: `docs/open-questions.md`.

## How to run

```bash
npm install
npm test              # domain and engine tests
npm run typecheck
cd apps/prototype/site && python3 -m http.server 8790
```

Checks: `node apps/prototype/tools/qa_mobile.cjs http://127.0.0.1:8790/` and `node apps/prototype/tools/qa_responsive.cjs http://127.0.0.1:8790/ <width> <out-dir>` for widths 280, 390, 820 and 1440.

## What works

*   **Sign-in and onboarding:** as drawn on the board links; goal page with three options (Money basics, Investing, Nigerian market).
*   **Learning:** Home, Learn, lessons with every step type (choice, compare, myth, order, match, calculation, scenario), course review (8 questions, pass mark 6 of 8), daily question, progress.
*   **Lesson sounds** (approved 9 Nov 2026): right or wrong when an answer is checked, and a sound per pair in matching. No lesson-complete sound (owner, 15 Nov 2026). Off when Settings > Sound effects is off.
*   **Library:** articles, search, saved items, dictionary with a tap-or-drag A to Z strip.
*   **Ask Finvora:** scripted answers; refuses buy or sell advice.
*   **Practice market:** real NGX companies, ₦100,000 starting cash, trades by number of shares; Markets, company pages, compare, watchlist, inflation calculator.
*   **Plus and checkout:** simulated Paystack checkout with pending, confirmed success and confirmed failed states (build-backlog §B5); receipt reads "Paid with Paystack".
*   **Me and settings:** account, settings pages, saved, history, feedback (500 characters at most).
*   **Admin (browser-only demonstration):** staff sign-in (work email @finvora.ng, any 6-digit code except 000000; 3 wrong codes lock for 15 minutes), overview counts, feedback inbox and settings with confirm and audit log, AI summary approvals, Finvora AI review, content editor publish, question builder, audit log. On phones, admin opens the phone task list.
*   **Motion:** smooth screen transitions; bottom-nav tabs switch instantly; sheets rise and slide back down; reduced motion respected. Reviewed with `/review-animations`: approved, 15 Nov 2026.
*   **Phones and screens:** `qa_mobile` passes on all 99 phone screens; `qa_responsive` at 280, 390, 820 and 1440 has no layout faults (remaining items are recorded decisions, below).

## Known limits

*   Everything is per browser. Clearing the browser or switching device loses progress.
*   Admin checks run in the browser and are not real security.
*   Text under 12px drawn on the canvas (ticker badges, card labels) is kept as designed, and folded phones (280px) show the 390px design scaled, so controls render about 32px (owner, 15 Nov 2026; build plan §10).
*   Not yet checked on a real phone: the on-screen keyboard, touch feel of drags and sheets, and sound on iPhone.
*   Not wired yet: notifications are as drawn; Top riser and faller and the index are static.
*   Sound effects come from Mixkit (`apps/prototype/site/sfx`). Confirm the Mixkit licence (mixkit.co/license) before launch.
*   Lesson and article content needs review by a finance educator.

## Phase 2 (not in this build)

Real backend and accounts, Paystack payments confirmed by our server, the market-data provider, live AI, notifications, analytics and staff roles. Open Phase 2 questions are in `docs/open-questions.md`.
