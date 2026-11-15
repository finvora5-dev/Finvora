# Finvora prototype: software build plan (Stage 1)

**For:** the engineer building the Stage 1 prototype.
**Design source:** the **Navy and emerald (client)** page of the design canvas (client approved, 12 Nov 2026). Light mode only, no dark mode. About 96 phone screens, plus laptop and admin versions. It replaces the Purple & black canvas this plan was first written for; this plan was updated to match on 12 Nov 2026.
**Builds on:** [`TECHNICAL_PROPOSAL.md`](TECHNICAL_PROPOSAL.md) (architecture, §3 structure, §7 simulator), [`adr/0001`](adr/0001-stage-1-prototype-decisions.md) (decisions D1–D10), [`build-backlog.md`](build-backlog.md) (B1–B4 apply now; B5–B10 are Stage 2) and [`ux-principles.md`](ux-principles.md).

Where this plan differs from those documents, it says so and lists the decision needed (§10).

## Phases at a glance

- **Phase 1 (this prototype):** everything in this plan, on illustrative market data, a scripted Ask Finvora and simulated money. Includes the practice market, a personal Home ("Your companies"), lessons that link to real companies, context-aware Ask Finvora, watchlist, calculator, universal search, visible "Simulated" / "Illustrative prices" labels, and accessibility and performance checks every week.
- **Phase 2 (real-market integration):** the **Mansa API** (replacing EODHD), subject to confirming its capabilities and access, gives real prices for supported listed companies. Users still trade virtual money; portfolios follow actual price movements. Historical market simulation may follow if the data supports it. Real AI sits behind the same context sheet.
- **Always:** the simulator is educational. No trade goes to a broker, and virtual gains or losses are not real returns.

---

## 1. What the prototype is

**How it is built (owner decided 15 Nov 2026):** the earlier prototype is reused and restyled. The site in `apps/prototype/site` is the approved navy canvas boards run by the canvas runtime (`support.js`), fitted to each screen by `responsive.js`, deployed as static files to Cloudflare (`wrangler.jsonc`). The tested rules in `packages/domain` and `packages/sample-data` are wired into the boards screen by screen. The Next.js app below is the Stage 2 target.

A responsive web app (Next.js) that the client opens from one link and uses like the real app. There is **no deployed backend** (ADR D1). Every screen talks to a typed `FinvoraApi` interface backed by `MockFinvoraApi`: sample JSON data, `localStorage` for user state, and a scripted AI. Stage 2 swaps in `HttpFinvoraApi` without touching screens.

Out of scope for Stage 1: real sign-in, real payments, live prices, live AI, server, database, emails actually sent.

---

## 2. Architecture (unchanged from the proposal)

```
Screens (apps/web/src/app, features/*)
   └─ FinvoraApi interface (src/lib/api)
        └─ MockFinvoraApi
             ├─ @finvora/domain   pure TS rules: money, learning, simulator, entitlements, feedback prompts
             ├─ sample-data       JSON: lessons, library, companies, prices, scripted answers
             ├─ localStorage      versioned schema (§5)
             └─ ScriptedAIProvider
```

Rules that keep Stage 2 a swap, not a rewrite:
- Screens never import the mock or sample data directly. Only through `FinvoraApi`.
- `packages/domain` has no React, Next.js or storage imports.
- Money is **integer kobo** everywhere, including JSON (CLAUDE.md).
- The mock adds latency (200–800 ms) and can inject errors via a dev panel, so loading, empty, offline and error states are real (B2).

---

## 3. Routes and screens

One route per screen family. Sheets and dialogs are components on their parent route, not routes. Names in brackets are the canvas artboards.

| Area | Routes | Screens / states |
|---|---|---|
| Onboarding | `/welcome`, `/intro`, `/goal`, `/age` | Welcome, Welcome intro, Onboarding goal, Age check, Allow notifications |
| Sign-in (simulated) | `/sign-in`, `/sign-in/code` | Sign in, Enter code, Wrong code; demo account buttons |
| Home | `/` | Ask Finvora box, suggested questions, **Your companies** (§4.9), Continue learning, Explore |
| Learn | `/learn`, `/learn/[course]/[lesson]`, `/learn/[course]/review` | Learn (courses), Lesson info, question formats (choice, calculation, match, order, scenario), correct / wrong result sheets, hint, Leave lesson, Lesson complete (with real-company card, §4.3), Course review, Course complete, Daily question, quick learn cards (term, steps, compare, market fact, myth) |
| Ask Finvora | `/ask` | Chat, question limit sheet |
| Library | `/library`, `/library/topic/[id]`, `/library/[slug]`, `/library/a-z` | Library (Learn tab), Topic, Article, A to Z |
| Markets | `/markets`, `/markets/exchange`, `/companies`, `/companies/[ticker]`, `/compare`, `/search` | Markets, About the NGX, Companies, Company, Company loading, Compare companies, Search results, No results, Market closed |
| Tools | `/tools/inflation` | Inflation calculator |
| Practice market | `/practice`, `/practice/market`, `/practice/[ticker]`, `/practice/watchlist`, `/practice/history` | Practice market, empty, market list, company, Buy / Sell shares, Order placed, watchlist, Trade history, Dividends, Measures, Compare over time, Market drop, Reset practice |
| Me | `/me`, `/me/progress`, `/me/history`, `/me/saved`, `/me/notifications`, `/me/plan` | Plus empty states (No history, Nothing saved, No notifications) |
| Settings | `/settings`, `/settings/email`, `/settings/goal`, `/settings/privacy`, `/settings/terms`, `/settings/help`, `/settings/delete` | Sign out confirm, Delete account, Account deleted |
| Plans | `/plans`, `/plans/compare`, `/checkout/[orderId]` | Finvora Plus, Compare plans, Upgrade prompt, checkout states (§4.7), Receipt, Your plan, Cancel Plus |
| Admin | `/admin/*` | Sign in, Overview, Content, Editor, Questions, Feedback inbox, AI review, Feedback settings, Plans, Users, AI summaries, Audit log, empty states, confirm dialog |
| System | global | Offline, Something went wrong, Loading, Toasts |

Navigation: a floating navy bottom bar on phones (Home, Markets, a round emerald Ask button in the centre, Learn, Me) and a navy sidebar on laptop and admin.

Feedback sheets (Rate, Report, Suggest, App review) are components opened from their entry screens, controlled by §4.6.

---

## 4. Prototype logic (`packages/domain`)

Each module is pure TypeScript with unit tests. Golden cases go in `testdata/golden/` so Stage 2 Python must match.

### 4.1 Session and roles (simulated)
- Demo accounts per ADR 0001: `free@`, `premium@`, `admin@demo.finvora.test`. Any other email plus any 6-digit code also works and creates a Free user.
- The code screen's error states are reachable on purpose: `000000` shows "wrong code", `111111` "expired", three wrong tries show the 15-minute lockout. Documented in the reviewer guide.
- `session = { userId, role: 'free'|'plus'|'admin', email }` in `localStorage`. A small "Switch demo account" control in Settings (and on the sign-in screen).

### 4.2 Entitlements (B1: one plan value drives every lock)
- `entitlements(plan)` returns one object: `askDailyLimit`, `compare`, `dividendHistory`, `statementYears`, `priceAlertLimit`.
- Split agreed 12 Nov 2026 (open-questions Q4):
  - **Plus:** unlimited Ask Finvora questions, Compare companies, dividend history, 5 years of financial statements, unlimited price alerts.
  - **Free:** 5 Ask Finvora questions a day, **all courses**, the practice market, 1 year of statements, 1 price alert.
  - PDF summaries are removed. Deep report scans are undecided (Phase 2 question).
- Every locked screen reads this object; no screen checks `plan === 'plus'` itself.
- **Phase 1 shows the split on the plan screens only.** Locked views for Free users (blurred Compare and dividend history behind a "See plans" card) are Phase 2. The entitlements object still exists in Phase 1 so the Ask Finvora limit and the plan screens read from one place.

### 4.3 Learning engine
The approved design is interactive but not game-like: no XP, levels, badges, mascot or Boss.
- **Content model:** Course → Lessons → Steps. A step is one of `learn` (term, steps, compare, market fact, myth) or `question` (choice, calculation, order, match, scenario). Each course ends with a **Course review** (a short set of questions).
- **Courses:** 6 in total, all open to Free users. A later course opens after the one before it is finished (the "Course locked" screen means "finish the earlier course first", not "Plus only"; **confirm with the client**).
- **Lesson state machine:** `notStarted → inProgress(step i) → complete`. Leaving mid-lesson asks first ("Leave lesson?") and does not save step progress.
- **Answer checking:** pure function per question type: `check(step, answer) → { correct, explanationKey }`. The result shows in a bottom sheet for both correct and wrong answers, with an "Ask Finvora why" link. Each question has an optional hint. Wrong answers can be retried; the first-try result is what scores.
- **Lesson complete:** shows correct answers (e.g. 4/5), time and days in a row, plus key takeaways.
- **Lessons lead to real companies (client request, 12 Nov 2026):** a lesson about a company measure ends with a "Now see it on real companies" card. Example: the P/E lesson shows Zenith Bank's and GTCO's P/E with a plain-English reading and a "Compare Zenith and GTCO" button. Content model: an optional `realCompanyCard { metric, tickers[], explanation }` per lesson. Which lessons get one is a content decision (Phase 2 question); Phase 1 ships the P/E example.
- **Days in a row:** a day counts when at least one lesson or the daily question is finished, using the **Africa/Lagos** calendar day (B10 market-time rule applies to dates too).
- **Progress:** lessons and courses done, minutes this week, per-course progress bars.

### 4.4 Ask Finvora (`ScriptedAIProvider`)
- Same response shape as Stage 2: `{ answer, citations: [{ articleSlug, title }], kind: 'answer'|'insufficient'|'refusal' }`.
- Matches a question to scripted answers by keyword set; no match → "insufficient evidence" answer pointing to Library search.
- **Never-advise rule:** questions asking what to buy or sell get the scripted refusal plus a lesson suggestion. Tested.
- Streams text in chunks to mimic real latency.
- Counts questions per Lagos day against `askDailyLimit` (5 on Free); at the limit the limit sheet opens.
- Home's Ask Finvora box submits into `/ask` with the question prefilled.
- **Context-aware questions:** lessons, company pages and articles pass `{ type: 'lesson'|'company'|'article', id }`. Suggested prompts come from that context: a company offers "How does it make money?" and "Explain its dividend"; a lesson offers "Explain simpler" and "Give a Nigerian example".
- The answer opens in a **bottom sheet over the current screen**, so the user keeps their place. Sources and follow-up chips stay in the sheet, with an optional "Open full chat".
- Phase 1 uses scripted answers keyed by context in `sample-data`. Phase 2 puts real AI behind the same sheet.

### 4.5 Simulator (proposal §7, ADR D3–D5)
- Starting cash ₦100,000 = `10_000_000` kobo (`SIM_STARTING_CASH_KOBO`).
- Whole shares, market orders, long only; weighted-average cost; fees per D5 (approximate, basis points).
- Invariants and calculations exactly as proposal §7.2–7.3, including idempotency (double-tap places one trade) and the stale-price re-confirm.
- Deterministic market clock with "Advance market day" (D3). Market hours sheet uses Lagos time, weekdays 10:00–14:30 (**unverified**, confirm against NGX).
- Reset archives the old account and starts fresh.

**Trade sheet (as designed):** the approved Buy and Sell screens are **shares-first**: a number-of-shares stepper with presets (10, 50, 100, 500), then price per share, shares, simulated fees and total, with cash available shown. `quote(shares, priceKobo, feeSchedule, cashKobo)` returns fees and total in kobo.
- Edge cases (golden tests): total above cash → block with a clear message and offer the largest number of shares that fits; selling more than held → blocked; double-tap places one trade.
- The earlier plan made amount-first ("How much?" in naira) the default. That is not in the approved design. See §10.

**Visible financial safety:** a shared label sits on every practice screen. Screens carry a **"Simulated"** tag; trade screens say "Simulated money. Nothing is bought on the NGX."; fees say "Fees (simulated)". Made-up prices are labelled **"Illustrative prices"** (open-questions Q2; never "sample" or "demo"). A test fails if any money value under `/practice` renders without a label. In Phase 2 the price label becomes "Real prices, simulated money" with the data delay noted. Nothing may suggest illustrative prices are real market performance.
- **Note:** the approved design uses real company names (Zenith Bank, MTN Nigeria) in the practice market, matching ADR D8.
- **Note:** the designs show a practice portfolio above ₦1,000,000; ADR D4 sets starting cash at ₦100,000. See §10.

### 4.6 Feedback prompts (admin-controlled)
- Config per prompt: `{ enabled, placements[], frequencyOneIn, cooldownDays }`. Stored by the admin screens, read by the learner app (same browser in the prototype).
- `shouldShow(prompt, userHistory, rng)`: off → never and the entry point is removed (no greyed-out stubs); rating shows to 1 in N finished lessons; app review at most once per 90 days and never again after "Not really".
- Submissions go into the mock feedback inbox; the admin inbox reads them.

### 4.7 Plans and simulated checkout (B5 rules, simulated)
- Order state machine: `created → pending → confirmedSuccess | confirmedFailed`. Extra visible states: `slow` (still pending after a timeout), `offline`, `alreadyPaid` (duplicate).
- Only the mock "server check" moves an order out of `pending`; a failed response never marks it failed. Retry reuses the same order ID. No retry button while pending.
- A dev control lets reviewers force each outcome. No card details are ever collected.
- Prices (decided, open-questions Q3): **₦5,999 a month** (`599_900` kobo) and **₦65,989 a year** (`6_598_900` kobo, one month free). Kept in one config value (`PLUS_PRICE_KOBO`, monthly and yearly).
- Cancel Plus keeps Plus until the period ends.

### 4.8 Admin (mock)
- Admin role only (UI gate; the proposal §5 notes this is a demonstration, not security).
- Content and questions edit the sample content in `localStorage`, so changes show in the learner app on the same browser.
- Ask Finvora review and AI summaries show seeded queues; approve / reject updates state.
- Users and payments shows demo users and orders; staff cannot mark orders paid.
- Every admin change writes an audit-log entry `{ when, who, area, change }`, append-only.

### 4.9 Home (personal over time; client request, 12 Nov 2026)
- **Your companies:** up to three company cards chosen by a pure `yourCompanies(activity)`, each with the reason it is shown: "Viewed N times this week", "On your watchlist", "You compared it with X". Below them, one "New since your last visit" line for the top company (e.g. a declared dividend).
- Phase 1 computes this from local activity (`fv.activity`: company views, compares, watchlist). A new user with no activity sees popular companies instead. What counts as interest and how long history is kept in production is a Phase 2 question.
- **Continue learning** card: lesson in progress → resume; none started → first lesson; otherwise → next lesson.
- The Ask Finvora box and suggested questions stay at the top; Explore links are secondary. Unit tests cover each state.

### 4.10 Effortless interactions (frontend only, not postponed)
- **Watchlist:** add or remove a company in one tap from company rows and pages.
- **Undo:** a 5-second Undo toast after reversible actions (unwatch, unsave, remove).
- **Remembered choices** (`fv.prefs`): last filter, sort order, chart range and number of shares.
- **Inflation calculator:** results update live as inputs change, with presets for common amounts and periods. (The historical calculator from proposal §7.6 has no navy design; see §10.)
- **Universal search:** one field finds companies, lessons and articles.

---

## 5. Local data (`localStorage`, versioned)

One key per domain, each `{ v, data }`, with a migration step on schema change. Mirrors the Stage 2 tables (proposal §4).

| Key | Holds |
|---|---|
| `fv.session` | current demo user and role |
| `fv.profile` | goal, daily minutes, birth date, reminder time, preferences |
| `fv.learning` | lesson and course progress, days in a row, first-try results |
| `fv.ask` | chat history, daily question count |
| `fv.library` | saved articles, reading history, read progress |
| `fv.sim` | accounts (current and archived), holdings, trades, market clock |
| `fv.billing` | plan, orders and their states |
| `fv.feedback` | prompt config, submissions, prompt history per user |
| `fv.admin` | content edits, review decisions, audit log |
| `fv.watchlist` | watched companies |
| `fv.activity` | company views and compares, for Your companies (§4.9) |
| `fv.prefs` | last filter, sort, chart range, number of shares |

"Reset practice data" in Settings clears all keys except `fv.session`.

---

## 6. Design implementation

- **Tokens first (client brand sheet, 15 Nov 2026):** page off-white `#F8F9FA`, surface `#FFFFFF`, navy (ink, primary buttons, headers) `#0B192C`, emerald on light `#10B981` (fills, icons, progress, brand), emerald on dark `#00E676`, emerald text on light `#047857` (owner decided 15 Nov 2026), muted `#5B6577`, lines `#E5E7EB`, red `#B9473F`, amber warnings `#B45309`. No yellow. Light mode only; no dark theme.
- **Logo:** the leaf "F" mark in `docs/brand/` (navy and emerald on light; white and `#00E676` on navy). Small sizes use the app-icon form: the mark in a navy rounded square. Wordmark is "FINVORA" in capitals with wide letter spacing. My judgement: the SVGs were traced from the client's PDF, which is a flat image; ask the client for the original vector files before launch.
- Main buttons are navy. A navy header is used only on main and research screens (Home, Markets, Companies, Company, Compare, Search, Learn, Library, Me, Ask Finvora, practice market list and watchlist, Welcome).
- Font: Geist, with Geist Mono for numbers and tickers. Icons: inline stroke SVG set, no emoji. No mascot.
- Primitives (Week 1): Button (primary, secondary, destructive, loading, disabled), Chip, Tag, Card, ListRow, Switch, Field with error, Sheet, Dialog, Toast, ProgressBar, Skeleton, floating BottomNav with centre Ask button, Sidebar (laptop, admin).
- Responsive on every screen size: phone layouts as designed; laptop layouts as designed where a laptop board exists, otherwise the phone column centred; admin is desktop-first.
- Motion respects `prefers-reduced-motion`. Glass effects stay off on budget phones (B3).
- **Built into the primitives:** tap targets at least 44 px; primary buttons 52 px tall; high-contrast primary actions within thumb reach; WCAG 2.2 AA text contrast; gains and losses shown with an arrow and sign as well as colour; `prefers-reduced-transparency` and low-power devices fall back to solid surfaces.

---

## 7. Sample data (`packages/sample-data`)

- Lessons: course 1 (Money Foundations) complete with every step type and its Course review; the P/E lesson in Understanding Investing with its real-company card; the other courses outline only.
- Library: about 15 articles, topics, an A–Z glossary.
- Companies: real names and tickers (ADR D8); figures marked "from latest annual report" until real data. The practice market uses the same real companies.
- Prices: seeded daily series, labelled "Illustrative prices" wherever they show (open-questions Q2).
- Scripted Ask Finvora answers for every Library topic, plus refusal and insufficient-evidence cases.

---

## 8. Testing

- **Unit (Vitest):** every `domain` module, 95% branch coverage on simulator, learning, entitlements, feedback prompts, checkout state machine.
- **Golden JSON:** simulator trades, learning scoring and streak dates (including Lagos midnight edges).
- **E2E (Playwright):** onboarding → Home → lesson → Course review; Ask Finvora to the limit; buy, sell, oversell blocked, double-tap; upgrade with each forced checkout outcome; admin turns a prompt off and the entry point disappears.
- **Accessibility:** axe on every route, 0 serious or critical; keyboard and screen-reader pass in Week 5.
- **Performance:** proposal §8 budgets (Lighthouse mobile ≥ 85 on key routes, LCP < 2.5 s, CLS < 0.1).
- **Every week, not just Week 5:** axe with 0 serious or critical issues on that week's routes, the Lighthouse mobile budget on that week's key route, and a 360 px check. These are part of each week's "Done when" below.
- Definition of done and the Pre-launch checklist in `build-backlog.md` still apply.

---

## 9. Five-week plan (re-cut for the chosen design)

Every week's "Done when" also includes the weekly accessibility and performance checks in §8.

| Week | Build | Done when |
|---|---|---|
| 1 | Repo, CI, staging; tokens and accessible primitives (44 px targets, 52 px buttons, contrast); `FinvoraApi` + mock skeleton; `domain`: money, simulator, learning engine, entitlements with golden tests; onboarding, sign-in, Home | Staging live; Home (with Your companies) and onboarding pass axe at 360 px |
| 2 | Learn courses, all step types, result sheets and hints, Lesson complete with real-company card, Course review, days in a row; Ask Finvora with context sheet; Library; universal search | Course 1 runs end to end, keyboard only |
| 3 | Practice market with the trade sheet and Simulated / Illustrative labels; Markets, About the NGX, Companies, Company, Compare, watchlist with Undo; inflation calculator | All simulator golden cases pass through the UI; state survives refresh |
| 4 | Me, Settings, Plans and checkout states; historical calculator; remembered preferences; feedback prompts; admin console | Each checkout outcome reachable; prompt toggles reflect in the app |
| 5 | Device and accessibility pass, performance, fixes, reviewer guide | 0 critical / high bugs; budgets met; client walkthrough done |

My judgement: about 96 phone screens plus laptop and admin in 5 weeks is tight for one engineer. If time runs short, cut in this order: admin AI summaries and audit log detail, the extra practice screens (Measures, Compare over time, Market drop), quick-learn formats beyond three. Keep Home, Learn, Ask Finvora, company research and the practice market whole. Mobile matters more than admin (owner, Nov 2026).

---

## 10. Decisions still needed before Week 1

Decided since the first version: design direction, Plus price, the Free vs Plus split, the price label, sign-off and success measure (all in `open-questions.md`, Phase 1).

| # | Question | Default if no answer |
|---|---|---|
| 1 | Trade sheet | **Decided (owner, 15 Nov 2026):** number of shares, as designed |
| 2 | Practice starting cash | **Decided (owner, 15 Nov 2026):** ₦100,000 (ADR D4); screens show real computed values |
| 3 | "Course locked": does it mean "finish the earlier course first"? Free users get all courses | Yes, order only; never a Plus lock |
| 4 | Original logo vector files (the client sent a flat image) | Use the traced SVGs in `docs/brand/` |
| 5 | Context-aware Ask Finvora as a bottom sheet over the current screen is in this plan but has no navy design; the designs link to the full chat | Link to the full chat with the question prefilled |
| 6 | Historical calculator (proposal §7.6) has no navy screen; the inflation calculator does | Build the inflation calculator only in Phase 1 |
| 7 | NGX trading hours used in the market-closed sheet | Confirm before Week 3 |
