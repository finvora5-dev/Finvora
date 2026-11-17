# Phase 1 prototype: status and reviewer guide

**Updated:** 16 Nov 2026 (evening) · **Branch:** `awesome-bardeen-2pkwcl` (Cloudflare deploys from it) · **Live:** https://finvora.ehigiatorpowell1.workers.dev

## What changed on 15 Nov 2026

The live site is now the **navy and emerald redesign** (the client's approved canvas, "Finvora: Intelligence Redesign"). It replaced the earlier prototype on this branch. The earlier prototype is kept, unchanged, on the branch `old-website-backup`.

Checked on the live site, 15 Nov 2026: the front page opens the navy welcome screen on a phone with no script errors, the latest build is served, and old-prototype pages no longer exist. Cloudflare serves pages without `.html` (`MainNavy.dc.html` redirects to `MainNavy.dc`).

## What changed on 16 Nov 2026: laptop screens

Every phone screen a visitor can reach now has its own laptop screen at 1440 px (95 `*LaptopNavy.dc.html` boards), built to match its canvas mock-up (owner rule, 16 Nov 2026). The only phone screens without one are LessonCorrect and LessonWrong, which nothing links to.

*   **How they are built:** the `laptop-build` skill (`.claude/skills/laptop-build`). Canvas originals and the approved drafts are in `apps/prototype/mockups/`. Screens the canvas did not draw were drafted by `tools/design_laptop_steps.py` (lesson steps, Daily, Course review) and `tools/design_laptop_pages.py` (markets, practice, account, states, screens, codes, dialogs, learning). The owner approved each batch before it went live; `--site` builds the working versions.
*   **Controls:** `tools/wire_navy_laptop.py` and `tools/wire_navy_controls.py` wire them like the phone versions. `responsive.js` sends a laptop to the laptop screen and adds the sidebar profile card, chip filters, sheets, toasts, chart ranges and the letter strip. Hover states and the collapsible sidebar live in `responsive.css`. The Courses/Library toggle was removed (owner). Put in order also works by tapping two items to swap them.
*   **Checks run:** `qa_mockup.cjs` (matches the mock-up) and `qa_controls.cjs` (no dead controls) pass on every laptop screen. break-ui ran at 1440 with worst-case data (a long name and email, long Ask questions, 24 Ask messages, a Plus user). It found three faults, all fixed: Settings account rows showed fixed sample details instead of the signed-in user, a long name wrapped onto 2 to 3 lines in the sidebar (it now shows one line with an ellipsis and the full name on hover), and the sidebar sometimes said "Free plan" for a Plus user. Re-checked with no script errors and no sideways scrolling (`tools/break_ui/seed.cjs`).
*   **Not done yet on laptop:** notifications are as drawn, Big moves is not wired, Error, Offline and Upgrade use plain links, dialogs now open over the live page (Ask limit keeps its own page).
*   **Motion on laptop:** reviewed with `/review-animations`, 16 Nov 2026. One finding, fixed: toasts now enter and leave on the same path with an interruptible transition, and reduced motion keeps the fade without the slide. Approved.

## Later changes on 16 Nov 2026 (owner requests)

*   **Phone navigation:** the bottom bar's Me tab is now **Practice** (the laptop sidebar's Practice market icon) and opens the Practice portfolio. Me is a button beside the notification bell on Home (a person in a circle, an icon nothing else uses). The short label keeps the four tabs even around the Ask button. On Me and History no tab is selected, and Practice pages have no bottom bar. `tools/wire_navy_nav_practice.py`.
*   **Lessons:** finished lessons on the phone Learn page open again for replay (2 XP once a day, best score kept), as on laptop.
*   **Buttons:** the Continue (Learn) and Next (lesson complete) buttons wrap long lesson titles inside padding, and "· 4 min" stays together. `tools/break_ui/buttons.cjs` checks every button on every screen for text that touches the edges, spills out or wraps in a fixed height; all phone (390 px) and laptop (1440 px) screens pass with normal and worst-case data.
*   **Charts:** tap or drag along the Company, Practice company and Practice portfolio charts to read the price (or portfolio value) and date of any day, on phone and laptop. Practice charts are drawn from the simulated prices and their range buttons (1D, 1W, 1M, 3M, 1Y, All) work. Points are trading days counted back over weekends; public holidays are not skipped yet. The NGX All-Share chart stays as drawn until index data has a source.
*   **Laptop Practice:** the page shows the live practice portfolio: value and return, the buy panel (price, shares, total with fees, cash; Review order carries the company and shares) and holdings. With no shares it opens the empty Practice screen. The Market closed and Reset practice dialogs show the same live page behind them.
*   **Colours:** losses now show in red on the phone Practice header (#F2A39C, the navy down colour from the welcome board) and on the Practice company Return line.
*   **Checks run:** `qa_mobile` passes on all 99 phone screens; `qa_mockup` and `qa_controls` pass on the changed laptop screens (`qa_mockup` now places the mock-up's holdings before checking Practice screens). Not yet checked on a real phone.

## Changes on 16 Nov 2026, evening (owner requests and the logic audit)

*   **Logic audit against the launch rules** (build-backlog B2, B5, B10): signed-out visitors only reach the welcome, sign-in and status screens; codes allow 5 wrong tries, a new code at most once a minute, and work once; onboarding is interest, then age (date of birth, under 18 blocked), then notifications; returning users go Home and an email change returns to Settings; checkout needs an 18+ date of birth; paying again after a failure reuses the order; a cancelled plan cannot be bought over and can be kept; renewals are recorded on the renewal date and an ended plan is Free; Plus prices follow the one price setting; delete account needs Plus cancelled and keeps payment records; indirect advice wording is refused (domain rule and tests); the Save chats switch is honoured; market status lines follow trading hours; queued-order results are shown; no trades or questions offline. Still simulated: any 6-digit code signs in (no email is sent) and there is no analytics to switch off.
*   **Installable app:** a manifest, icons (the leaf mark on navy) and the Draw launch animation (client's choice) on the start page, once per visit; reduced motion fades. `tools/build_pwa.py`, `tools/build_pwa_icons.cjs`.
*   **Library:** articles show their full written sections (key points, how-to steps, example, common mistake) and the read time is counted from the words on screen. Topic screens (phone and laptop) and the Library (phone and laptop) are redesigned from approved drafts (`mockups/drafts-library`): light header with read progress, guide cards, word of the day, continue reading, topic cards, popular this week. Phone Learn matches (light header, no "6 courses" line).
*   **Ask Finvora:** saved conversations (history, newest first, at most 20) on phone and laptop. Laptop Ask rebuilt as direction A "Focus" (`mockups/drafts-ask`): history panel, New chat, the Home ask box, the chat scrolls on its own with the box pinned, source links, Copy, follow-ups, no company card next to a refusal. `tools/wire_navy_ask_laptop_focus.py`.
*   **Laptop fixes:** content spans the full width on Settings, Notifications, Sell and Cancel Plus; charts fill their box and redraw on resize; lesson results (order, calculation, scenario, daily, course review) show as a tinted line with the button, like the multiple-choice question, not the phone sheet; answered options no longer flicker on hover; the sidebar Watchlist and Help open their pages; the watchlist hover is a soft grey row; dialogs (Sign out, Cancel Plus, Leave lesson, Locked, Rate, Review, Upgrade) open over the live page.
*   **Phone fixes:** Me loses the Practice portfolio row; the Settings icon is a gear everywhere; the Market news switch is gone (no such feature); the conversations list opens as a side panel; A-Z on Library has a 44 px tap area.
*   **Also:** Practice company change pill and laptop article Related links fixed. Checker `tools/break_ui/buttons.cjs` for button text.
*   **Not reachable yet:** the lesson rating (Rate), app review (Review) and Suggest a topic screens exist and save to the admin inbox, but nothing opens them (build plan §4.6 says when they should appear).
*   **Navigation:** Back and Close return to the page you came from (falling back to their own link); payment, sign-in, finished lessons and a placed trade keep fixed links. Closing a lesson part-way opens "Leave this lesson?" with the live count; Keep going returns to the same question.
*   **Motion reviewed** with `/review-animations` (16 Nov 2026, evening): conversations panel, laptop History panel, result card scroll, launch animation, new hovers. One finding fixed (the History panel now grows from its button). Approved.
*   **Checks run:** `qa_mobile` passes on all 99 phone screens; `qa_controls` finds no dead controls on the changed screens (two false alarms: Clear on an empty calculation answer, and Great on the Rate dialog where it is already selected); browser tests for each flow above. The redesigned Library, Topic, Ask and Practice company screens now differ from their old canvas boards by design. Not yet checked on a real phone.

## What the prototype is

A browser-only prototype of Finvora, a money and investing education app for Nigerian beginners. No backend, no real accounts, no real payments, no live AI and no live market data. Everything a visitor does is saved in that browser only (keys starting `fv.`). Prices are made up; by owner decision (15 Nov 2026) they carry no "Illustrative" label.

## How it is built

| Path | What it holds |
|---|---|
| `apps/prototype/site` | The live site: the navy canvas boards (`*Navy.dc.html`) run by `support.js`, `responsive.js` (fits each screen, picks phone or laptop boards, screen transitions, lesson sounds), `responsive.css`, `fv.js` (browser state and glue), `fvd.js` (compiled domain rules), `sfx/` (lesson sounds), `sw.js` (offline cache). |
| `apps/prototype/tools` | Wiring scripts (`wire_navy_*.py`), `build_sw.py` (always last), the laptop draft generators (`design_laptop_*.py`), and the checkers `qa_mobile.cjs`, `qa_responsive.cjs`, `qa_mockup.cjs`, `qa_controls.cjs`, `break_ui/seed.cjs` and `break_ui/buttons.cjs`. |
| `apps/prototype/mockups` | Canvas originals and approved laptop drafts that each laptop screen must match. |
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

*   **Sign-in and onboarding:** welcome, intro, sign-in with a 6-digit code (simulated), interest (Money basics, Investing, Nigerian market), date of birth (18+), notifications.
*   **Learning:** Home, Learn, lessons with every step type (choice, compare, myth, order, match, calculation, scenario), course review (8 questions, pass mark 6 of 8), daily question, progress.
*   **Lesson sounds** (approved 9 Nov 2026): right or wrong when an answer is checked, and a sound per pair in matching. No lesson-complete sound (owner, 15 Nov 2026). Off when Settings > Sound effects is off.
*   **Library:** full articles, topics with read progress, search, saved items, dictionary with a tap-or-drag A to Z strip.
*   **Ask Finvora:** scripted answers with sources; refuses buy or sell advice, direct or indirect; saved conversations.
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
*   Not wired yet: notifications are as drawn; Top riser and faller, Big moves and the NGX All-Share index are static (the index chart has no data source yet).
*   Light mode only: dark mode was removed by the owner.
*   Sound effects come from Mixkit (`apps/prototype/site/sfx`). Confirm the Mixkit licence (mixkit.co/license) before launch.
*   Lesson and article content needs review by a finance educator.

## Phase 2 (not in this build)

Real backend and accounts, Paystack payments confirmed by our server, the market-data provider, live AI, notifications, analytics and staff roles. Open Phase 2 questions are in `docs/open-questions.md`.

## Plus features (17 Nov 2026)

Built from the approved drafts (`apps/prototype/mockups/drafts-plus`), phone and laptop, by `tools/build_plus_features.cjs` with the parts you can use in `site/fvplus.js`. All figures are simulated.

| Feature | Screen | Opens from | What works |
|---|---|---|---|
| Finvora Risk Signals | PlusRisk | Company, Plus tools | Signals with levels; "Learn what this means" opens Ask Finvora |
| Dividend and cash flow tracker | Practice, Dividends tab | Practice portfolio | Upcoming payouts, cash against dividends chart |
| Advanced watchlists | PlusWatchlists | Watchlist, Plus tools | Switch between lists |
| Portfolio intelligence | Practice, Insights tab | Practice portfolio | Return, yield, sector mix, against the market, tips |
| Advanced company analysis | PlusAnalysis | Company, Plus tools | Ratios against the bank average, strengths and watch-outs |
| Historical comparisons | PlusHistory | Company, Plus tools | Switch revenue, profit, dividend, share price |
| Financial report comparisons | PlusReports | Company, Plus tools | Choose any two of five reports |
| Market crisis simulator | Practice, Crisis tab | Practice portfolio | Three downturns, month by month, a choice each month, results at the end |
| Interactive financial scenarios | PlusScenarios | Learn, Plus tools | Sliders worked out in kobo, three ready-made scenarios |

Owner, 17 Nov 2026: portfolio intelligence, dividends and the crisis simulator live inside the practice portfolio as tabs (Holdings, Insights, Dividends, Crisis), not as their own screens.

Not yet: Free users are not locked out (locked views are Phase 2); the figures do not come from the practice portfolio or real reports.

### Practice portfolio, live (client review, 17 Nov 2026)

Holdings is the source; the other tabs are worked out from the real practice account with tested rules in `packages/domain/src/portfolio.ts` (11 tests).

- **Holdings:** shares, average purchase price, current value, gain or loss in naira and per cent.
- **Insights:** sector concentration, dependence on one dividend payer, what is driving the gain or loss, cash share. Written from the holdings.
- **Dividends:** expected payouts and dates from each company's simulated schedule, 10% tax taken once (the net shown as expected is exactly what enters cash; tested), this year received against still expected, who pays most, dividends received, and whether each company can keep paying (payout from profit and cash cover, explained).
- **Crisis:** stock market crash, inflation surge, naira depreciation and interest rate increase, run on a copy of the portfolio. While one runs, Holdings, Insights and Dividends all show it; "Return to my portfolio" puts everything back and keeps which ones were tried. Real trades always use real prices.
- Dividend amounts, company figures and scenario moves are simulated.
