# Phase 1 prototype: status and reviewer guide

> **Current site (4 Nov 2026): the canvas boards.** On the user's instruction, the screens I first designed myself were deleted. The deployed prototype is now the approved purple canvas boards in `apps/prototype/site`, exactly as designed and linked as on the canvas. `responsive.js` scales each board to fit folded phones, phones, tablets and desktop. Numbers on screen are the boards' sample content.
>
> **Next step (option B):** rebuild the key flows (lessons, simulator, Ask Fin, checkout) in code inside these exact designs, reusing the tested logic in `packages/domain`. The sections below describe the earlier web app. Its screens were removed, but its logic packages remain.


**Updated:** 3 Nov 2026 · **Branch:** `awesome-bardeen-2pkwcl`

## What was there before this work

- `packages/engine`: the content model, answer checks and game rules. It had no tests.
- The docs.
- No app. The designs lived only on the purple canvas.

This work builds the app on the documented architecture. Nothing that existed was rewritten.

## How to run

```bash
npm install
npm test                 # unit tests (engine + domain)
npm run typecheck
npm run build            # static site in apps/web/out (no server, ADR D1)
cd apps/web/out && python3 -m http.server 8790
node e2e/journeys.cjs http://127.0.0.1:8790   # end-to-end journeys (needs Playwright)
```

`apps/web/out` is plain static files and can be hosted on any static host. Vercel is not used.

## Structure

| Path | What it holds |
|---|---|
| `packages/domain` | Pure TypeScript rules, all with unit tests: money (integer kobo), fees, simulator (`quoteByAmount`, `executeTrade`, valuation, replay), learning progress and `nextForYou`, scripted Ask Fin (with the never-advise rule and daily limit), checkout state machine (B5), calculators, search, feedback prompts, and safe parsing of localStorage |
| `packages/domain/src/config.ts` | **Every configurable business value**, including the unresolved ones below |
| `packages/sample-data` | World 1 (6 lessons and a challenge, every step type), 15 Library articles, 8 real NGX companies (descriptions only, no real figures), 6 made-up simulator companies, scripted answers, and seeded admin data |
| `apps/web/src/lib/api.ts` | The `FinvoraApi` mock. Screens reach data only through it. It simulates latency and can force an error |
| `apps/web/src/lib/store.ts` | Versioned localStorage, one key per area. Malformed data falls back to defaults. No secrets are stored |
| `apps/web/src/app` | Routes (below) |
| `e2e/journeys.cjs` | 57 end-to-end checks |

## What works

**Onboarding and sign-in (simulated):**
- Welcome, then Goal, then email, then a 6-digit code.
- Code `000000` shows "wrong code" and `111111` shows "expired". Three wrong tries lock the form.
- One-tap accounts: `free@`, `premium@` and `admin@demo.finvora.test`.

**Home:**
- One "Next for you" card. In order of priority: resume, start your first lesson, daily question, review portfolio, next lesson.
- An Ask Fin box with prompts.
- Secondary Explore links.

**Learn:**
- Journey with lock and unlock, and in-progress status.
- The lesson player handles info, choice, true/false, fill-the-gap, order (move up and down buttons, so no drag is needed), match, calculation and scenario steps.
- Feedback on each answer, with Try again after a wrong answer.
- Your place is saved on every step, so you can resume.
- "Leave lesson" asks for confirmation.
- Lesson complete screen with XP and level up.
- The challenge needs 80% to pass.
- Daily question.

**Ask Fin:**
- Full chat at `/ask` and a context sheet on lessons, articles and companies.
- The sheet suggests prompts for the screen you're on and offers follow-ups.
- Refuses buy or sell advice.
- Says so when it has no answer.
- Citations point only to real Library articles in the app. Nothing is presented as verified research.
- The free daily limit is explained calmly.
- Loading and error states, with a retry.

**Library and search:**
- Topics (your last choice is remembered), word of the day, articles, and save with Undo.
- Universal search across companies, lessons and articles, with "did you mean".
- No-results state.
- Suggest a topic.

**Companies:**
- Filter (remembered) and sort.
- One-tap watchlist with Undo, and a watchlist empty state.
- Company page:
  - demo price chart, with the range remembered;
  - "How it makes money" and related Library links;
  - context-aware Ask Fin;
  - dividend history locked for Plus;
  - the trademark and "Demo data" footer.

**Simulator:**
- ₦100,000 of virtual cash to start.
- Amount-first buy:
  - presets of ₦1,000, ₦5,000, ₦10,000 and ₦20,000;
  - whole shares, with approximate fees and virtual cash left shown before Confirm;
  - a "By shares" toggle.
- Edge cases:
  - an amount too small for one share offers the cheapest amount;
  - an amount larger than your cash is capped to it;
  - fees are taken into account;
  - insufficient cash is blocked;
  - you can't sell more shares than you own;
  - a double tap places one trade;
  - if the price changed, you're asked to confirm again.
- Sell with Half and All buttons and the gain or loss shown.
- A result screen, holdings, and trade history with a consistency check.
- Advance market day.
- Start over (archives the old portfolio).
- "Virtual money" and "Demo data" labels sit on every price and balance.

**Calculators:**
- "What if I had invested" (live results, presets, remembered inputs; dividends locked for Plus).
- Savings compound growth.
- Input validation on both.

**Plans and checkout (simulated, no card fields):**
- Monthly and yearly options with a placeholder-price notice.
- Checkout states: checking, taking longer, offline, confirmed success and confirmed failure.
- A retry reuses the same order. There's no retry while a payment is pending.
- Your plan screen and Cancel Plus (you keep Plus until the period ends).

**Me and Settings:**
- Me: progress, achievements, saved articles, plan, and links to your trade and Ask Fin history.
- Settings: goal, reset, sign out, and delete account (each confirmed first).

**Admin (demonstration):**
- Overview.
- Feedback settings: switching a prompt off removes its button from the app, and you can set "1 in N" for ratings.
- Feedback inbox.
- Ask Fin review queue.
- Users and orders (read-only; staff can't mark an order paid).
- Append-only audit log.
- Access is a browser-side check and is labelled as a demonstration.

**Reviewer tools:** open them from Settings or the sign-in screen. They let you:
- turn the simulated delay on or off;
- make the next request fail;
- pick the next checkout outcome;
- switch account;
- advance the market day;
- reset the data.

## Test results (run on 3 Nov 2026)

- `npm test`: engine 4 tests and domain 35 tests, all passing.
- `npm run build` and `npm run typecheck`: both pass.
- `e2e/journeys.cjs`: **57 of 57 passing** at a 360 px viewport. It covers:
  - onboarding and sign-in errors;
  - lesson answers, resume and completion;
  - unlocking;
  - Ask Fin answer, refusal, no-answer, context sheet and daily limit;
  - search and did-you-mean;
  - watchlist with Undo and remembered filter;
  - simulator buy, too-small amount, double tap, insufficient cash, oversell, sell and history;
  - calculator validation;
  - checkout failure then retry on the same order, and offline;
  - admin toggle hiding the entry point, and the audit log;
  - malformed localStorage;
  - no horizontal scroll on 8 key routes;
  - no page errors.
- **axe-core 4.10** on 27 routes (WCAG 2.0, 2.1 and 2.2 A/AA plus best practice): **1 serious issue remains**, `target-size` on `/library/`. The last list row sits partly under the sticky bottom nav before you scroll, and it is fully tappable once scrolled. Everything else, including the moderate items, is cleared.
- Not done: a Lighthouse performance run, a manual screen-reader pass and real-device testing.

## Values not yet decided by the client (all in `config.ts`)

| Value | Conflict | Used in the prototype |
|---|---|---|
| Plus price | ₦2,500 a month and ₦25,000 a year (open-questions #3), but the client is still deciding | Placeholder figures, with a "placeholders" notice on Plans |
| Free Ask Fin daily limit | 5 in the designs, 10 in open-questions #4 | 5 |
| Simulator fees | ADR D5 says "approximate"; the NGX fee components aren't confirmed | 1.5% with a ₦50 minimum, labelled "approx." |
| NGX trading hours | Not verified | 10:00–14:30 Lagos time, in config. There is no market-closed state yet (see below) |
| Simulator companies | Made-up in the designs; real names in ADR D8 | Made-up in the simulator; real names in Companies, with "Demo data" prices |

## Design styles

- **Home** uses the mature design. It is the only option the client chose.
- **Every other screen** uses the Playful V2 style, as on the Journey and lesson artboards:
  - 52px buttons with a 4px key edge that presses flat;
  - square-ish 44px chips with an 18px label.

Both are defined in `apps/web/src/app/globals.css`. Home switches by adding the `.mature` class, which is set by `<Screen mature>`.

Note: on the purple canvas, 91 boards (Library, Markets, Simulator, Me, Plans, admin and others) are still drawn in the mature style. The app follows the client's choice rather than those boards.

## Deviations from the documents (my judgement, worth confirming)

- **Resume saves your place on every step.** Build plan §4.3 says leaving doesn't save step progress, but the Phase 1 brief requires resume. I followed the brief.
- **Mock content reads are synchronous.** Lessons and articles come from `FinvoraApi` without simulated latency. Actions such as sign-in, Ask Fin, trades and checkout are asynchronous and do have latency. I think this is enough to show loading states without slowing every screen.
- **Ask Fin chips on Home** link into `/ask`. The context sheet is used on lessons, articles and companies.

## Not built yet (remaining Phase 1 items)

These are smaller or secondary screens on the canvas:
- Boss intro and result designs as separate screens (the challenge runs in the lesson player);
- Level up and Streak as separate screens (they show inline);
- Streak lost;
- Challenges (the inflation challenge);
- the Exchange page;
- Dictionary A–Z;
- Notifications;
- Achievements page;
- Reminder permission and Age check (the age rules are Phase 2, B10);
- market-closed sheet;
- company comparison and report scan or PDF summary (Plus; not designed in purple yet);
- admin content editor, question builder and AI summary approvals;
- app-review prompt UI;
- offline banner.

Every other in-scope journey works end to end.

## Phase 2 (not in this build)

Not built, by design:
- Mansa market data;
- a real backend and database;
- real authentication and server-side authorisation;
- live AI;
- real payments;
- production monitoring.

Also Phase 2 (raised 4 Nov 2026 while reviewing the prototype):
- real user accounts, with progress synced across devices (the prototype keeps everything in one browser);
- real Paystack payments confirmed by our server;
- reminders and notifications that actually send;
- analytics, error monitoring and admin roles with a real staff sign-in.
- **RAG-based Ask Fin:** requirements and the Phase 1 status check are in [phase2-ai-rag.md](phase2-ai-rag.md).

The `FinvoraApi` boundary and `packages/domain` are where those plug in.
