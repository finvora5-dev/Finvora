# Finvora prototype: software build plan (Stage 1)

**For:** the engineer building the Stage 1 prototype.
**Design source:** the **Purple & black** canvas (client choice, 3 Nov 2026), which is the Playful V2 screens with the chosen AI-first Home. 113 screens.
**Builds on:** [`TECHNICAL_PROPOSAL.md`](TECHNICAL_PROPOSAL.md) (architecture, §3 structure, §7 simulator), [`adr/0001`](adr/0001-stage-1-prototype-decisions.md) (decisions D1–D10), [`build-backlog.md`](build-backlog.md) (B1–B4 apply now; B5–B10 are Stage 2) and [`ux-principles.md`](ux-principles.md).

Where this plan differs from those documents, it says so and lists the decision needed (§10).

## Phases at a glance

- **Phase 1 (this prototype):** everything in this plan, on sample market data, a scripted Ask Fin and virtual money. Includes amount-first trading, the Next for you card, context-aware Ask Fin, watchlist, calculator, universal search, visible "Virtual money" / "Demo data" labels, and accessibility and performance checks every week.
- **Phase 2 (real-market integration):** the **Mansa API** (replacing EODHD), subject to confirming its capabilities and access, gives real prices for supported listed companies. Users still trade virtual money; portfolios follow actual price movements. Historical market simulation may follow if the data supports it. Real AI sits behind the same context sheet.
- **Always:** the simulator is educational. No trade goes to a broker, and virtual gains or losses are not real returns.

---

## 1. What the prototype is

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
| Onboarding | `/welcome`, `/meet-fin`, `/goal`, `/age` | Welcome, Meet Fin, Pick goal, Age check, Reminder permission |
| Sign-in (simulated) | `/sign-in`, `/sign-in/code` | Email, code; wrong / expired / too many tries; demo account buttons |
| Home | `/` | AI-first Home (chosen option) with one personalised **Next for you** card (§4.9) |
| Learn | `/learn`, `/learn/[world]/[lesson]`, `/learn/[world]/boss` | Journey, micro module steps, quick-learn formats, question formats, Lesson complete, Boss intro / question / result, Level up, Streak, Streak lost, Daily question |
| Ask Fin | `/ask` | Chat, typing state, daily-limit sheet |
| Library | `/library`, `/library/topic/[id]`, `/library/[slug]`, `/library/search`, `/library/a-z` | Library, Topic, Article, Search, No results, Dictionary |
| Markets | `/markets`, `/markets/[exchange]`, `/companies`, `/companies/[ticker]` | Markets, Exchange, Companies, Company, loading |
| Challenges | `/challenges`, `/challenges/[id]` | Challenges list, Inflation challenge |
| Simulator | `/simulator`, `/simulator/market`, `/simulator/[ticker]`, `/simulator/history` | Home, empty, market, company, buy / sell sheets, done, market closed, reset confirm |
| Me | `/me`, `/me/progress`, `/me/achievements`, `/me/history`, `/me/saved`, `/me/notifications`, `/me/plan` | Plus empty states |
| Settings | `/settings`, `/settings/email`, `/settings/goal`, `/settings/privacy`, `/settings/terms`, `/settings/help`, `/settings/delete` | Sign out confirm, Delete account, Account deleted |
| Plans | `/plans`, `/plans/compare`, `/checkout/[orderId]` | Upgrade sheet, checkout states (§4.7), Cancel Plus |
| Admin | `/admin/*` | Sign in, Overview, Content, Editor, Question builder, Feedback inbox, Ask Fin review, Feedback settings, Plans, Users and payments, AI summary approvals, Audit log, empty states, confirm dialog |
| System | global | Offline, Something went wrong, Loading skeleton, Toasts |

Feedback sheets (Rate, Report, Suggest, App review) are components opened from their entry screens, controlled by §4.6.

---

## 4. Prototype logic (`packages/domain`)

Each module is pure TypeScript with unit tests. Golden cases go in `testdata/golden/` so Stage 2 Python must match.

### 4.1 Session and roles (simulated)
- Demo accounts per ADR 0001: `free@`, `premium@`, `admin@demo.finvora.test`. Any other email plus any 6-digit code also works and creates a Free user.
- The code screen's error states are reachable on purpose: `000000` shows "wrong code", `111111` "expired", three wrong tries show the 15-minute lockout. Documented in the reviewer guide.
- `session = { userId, role: 'free'|'plus'|'admin', email }` in `localStorage`. A small "Switch demo account" control in Settings (and on the sign-in screen).

### 4.2 Entitlements (B1: one plan value drives every lock)
- `entitlements(plan)` returns one object: `askFinDailyLimit`, `allWorlds`, `bossChallenges`, `fullSimulator`, `offline`, `compare`, `dividendHistory`, `reportScan`, `pdfSummary`.
- Every locked screen reads this object; no screen checks `plan === 'plus'` itself.
- Free daily Ask Fin limit: **config value, pending client answer** (designs show 5, earlier docs 10).

### 4.3 Learning engine
- **Content model:** World → Lessons (micro modules) → Steps. A step is one of `learn` (term, steps, compare, market fact, myth) or `question` (choice, calculation, order, match, scenario). Boss = a world-final lesson of 5 questions.
- **Lesson state machine:** `notStarted → inProgress(step i) → complete`. Leaving mid-lesson asks first ("Leave lesson?") and does not save step progress.
- **Answer checking:** pure function per question type: `check(step, answer) → { correct, explanationKey }`. Wrong answers can be retried; the first-try result is what scores.
- **XP:** per correct first try + completion bonus (values in config, e.g. +10 per question, +5 completion, Boss +55). Totals shown on Lesson complete.
- **Levels:** fixed XP thresholds in config; crossing one shows Level up.
- **Streak:** a day counts when at least one lesson or the daily question is finished, using the **Africa/Lagos** calendar day (B10 market-time rule applies to dates too). Missed day → Streak lost screen. Streak freeze: Plus gets 2 a month (placeholder, confirm).
- **Boss:** pass mark 80% (4 of 5). Pass unlocks the next World; fail offers review and retry.
- **Unlocks:** World 1 free; later Worlds need `allWorlds` (shows the locked sheet otherwise).

### 4.4 Ask Fin (`ScriptedAIProvider`)
- Same response shape as Stage 2: `{ answer, citations: [{ articleSlug, title }], kind: 'answer'|'insufficient'|'refusal' }`.
- Matches a question to scripted answers by keyword set; no match → "insufficient evidence" answer pointing to Library search.
- **Never-advise rule:** questions asking what to buy or sell get the scripted refusal plus a lesson suggestion. Tested.
- Streams text in chunks to mimic real latency.
- Counts questions per Lagos day against `askFinDailyLimit`; at the limit the limit sheet opens.
- Home's Ask Fin box submits into `/ask` with the question prefilled.
- **Context-aware questions:** lessons, company pages and articles pass `{ type: 'lesson'|'company'|'article', id }`. Suggested prompts come from that context: a company offers "How does it make money?" and "Explain its dividend"; a lesson offers "Explain simpler" and "Give a Nigerian example".
- The answer opens in a **bottom sheet over the current screen**, so the user keeps their place. Sources and follow-up chips stay in the sheet, with an optional "Open full chat".
- Phase 1 uses scripted answers keyed by context in `sample-data`. Phase 2 puts real AI behind the same sheet.

### 4.5 Simulator (proposal §7, ADR D3–D5)
- Starting cash ₦100,000 = `10_000_000` kobo (`SIM_STARTING_CASH_KOBO`).
- Whole shares, market orders, long only; weighted-average cost; fees per D5 (approximate, basis points).
- Invariants and calculations exactly as proposal §7.2–7.3, including idempotency (double-tap places one trade) and the stale-price re-confirm.
- Deterministic market clock with "Advance market day" (D3). Market hours sheet uses Lagos time, weekdays 10:00–14:30 (**unverified**, confirm against NGX).
- Reset archives the old account and starts fresh.

**Amount-first trading (the default):**
1. On a company page the user taps **Trade**.
2. A bottom sheet asks **"How much?"** with presets (₦1,000, ₦5,000, ₦10,000, ₦20,000) and a custom naira amount.
3. `quoteByAmount(amountKobo, priceKobo, feeSchedule, cashKobo)` returns whole shares affordable, estimated fees, total cost and leftover cash, all in kobo.
4. The user reviews the full cost and taps **Confirm**; `buy()` runs as above and a clear result screen shows the new holding and cash.
- A **By shares** toggle remains, but is not the default.
- Edge cases (golden tests): the amount buys 0 shares → say so, show the cheapest price and offer "Use ₦Y"; fees push the total over cash → reduce by one share until it fits, else block with a clear message; amount above cash → cap to cash and say so.
- Design change needed before Week 3: the purple buy and sell sheets use a quantity stepper and must be redesigned amount-first.

**Visible financial safety:** a shared `<VirtualLabel>` sits next to every company price, trade sheet and confirmation total, cash balance, portfolio value, gain or loss, and chart or market summary in the simulator. Balances and P/L say **"Virtual money"**; prices say **"Demo data"** (allowed inside the simulator per the CLAUDE.md wording rule). A test fails if any money value under `/simulator` renders without it. In Phase 2 the price label becomes "Real prices, virtual money" with the Mansa delay noted. Nothing may suggest synthetic prices are real market performance.
- **Note:** the designs use made-up companies in the simulator and real companies in Companies; ADR D8 says real names. See §10.

### 4.6 Feedback prompts (admin-controlled)
- Config per prompt: `{ enabled, placements[], frequencyOneIn, cooldownDays }`. Stored by the admin screens, read by the learner app (same browser in the prototype).
- `shouldShow(prompt, userHistory, rng)`: off → never and the entry point is removed (no greyed-out stubs); rating shows to 1 in N finished lessons; app review at most once per 90 days and never again after "Not really".
- Submissions go into the mock feedback inbox; the admin inbox reads them.

### 4.7 Plans and simulated checkout (B5 rules, simulated)
- Order state machine: `created → pending → confirmedSuccess | confirmedFailed`. Extra visible states: `slow` (still pending after a timeout), `offline`, `alreadyPaid` (duplicate).
- Only the mock "server check" moves an order out of `pending`; a failed response never marks it failed. Retry reuses the same order ID. No retry button while pending.
- A dev control lets reviewers force each outcome. No card details are ever collected.
- Prices: **not decided by the client yet.** Keep them in one config value (`PLUS_PRICE_KOBO`, monthly and yearly) so the final figure is a one-line change. Until then the screens show the design placeholder, clearly marked as a placeholder in the reviewer guide.
- Cancel Plus keeps Plus until the period ends.

### 4.8 Admin (mock)
- Admin role only (UI gate; the proposal §5 notes this is a demonstration, not security).
- Content and questions edit the sample content in `localStorage`, so changes show in the learner app on the same browser.
- Ask Fin review and AI summaries show seeded queues; approve / reject updates state.
- Users and payments shows demo users and orders; staff cannot mark orders paid.
- Every admin change writes an audit-log entry `{ when, who, area, change }`, append-only.

### 4.9 Next for you (Home)
- Home shows one personalised card chosen by a pure `nextForYou(state)`, in priority order: lesson in progress → **Resume**; no lessons done → **Start your first lesson**; daily question not done → **Daily question**; simulator used and the market moved → **Review your portfolio**; otherwise → **Next lesson**.
- The Ask Fin box stays; Explore links are secondary. Unit tests cover each state.
- Design tweak: the chosen Home's "Continue learning" card becomes the Next for you card with these variants.

### 4.10 Effortless interactions (frontend only, not postponed)
- **Watchlist:** add or remove a company in one tap from company rows and pages.
- **Undo:** a 5-second Undo toast after reversible actions (unwatch, unsave, remove).
- **Remembered choices** (`fv.prefs`): last filter, sort order, chart range, trade amount and theme.
- **Historical calculator** (proposal §7.6 logic): results update live as inputs change, with presets for common amounts and periods.
- **Universal search:** one field finds companies, lessons and articles.

---

## 5. Local data (`localStorage`, versioned)

One key per domain, each `{ v, data }`, with a migration step on schema change. Mirrors the Stage 2 tables (proposal §4).

| Key | Holds |
|---|---|
| `fv.session` | current demo user and role |
| `fv.profile` | goal, daily minutes, birth date, reminder time, preferences |
| `fv.learning` | lesson progress, XP, level, streak, freezes, badges, first-try results |
| `fv.ask` | chat history, daily question count |
| `fv.library` | saved articles, reading history, read progress |
| `fv.sim` | accounts (current and archived), holdings, trades, market clock |
| `fv.billing` | plan, orders and their states |
| `fv.feedback` | prompt config, submissions, prompt history per user |
| `fv.admin` | content edits, review decisions, audit log |
| `fv.watchlist` | watched companies |
| `fv.prefs` | last filter, sort, chart range, trade amount, theme |

"Reset demo data" in Settings clears all keys except `fv.session`.

---

## 6. Design implementation

- **Tokens first:** the purple palette as CSS variables / Tailwind theme: page `#FFFFFF`, primary `#5B21B6`, primary edge `#3B0F7A`, link `#4C1D95`, tint `#F1EBFB`, border `#E7E2F0`, ink `#0E0B14`, muted `#615A6E`. Success and error keep green / red. Illustrations and Fin keep their own colours. Brand is still a one-file change (ADR D10).
- Font: Plus Jakarta Sans. Icons: inline stroke SVG set, no emoji.
- Primitives (Week 1): Button (primary, secondary, destructive, loading, disabled), Chip, Tag, Card, ListRow, Switch, Field with error, Sheet, Dialog, Toast, ProgressBar, Skeleton, BottomNav, Fin (mood prop).
- Responsive on every screen size: phone layouts as designed; tablet and desktop centre the phone column, admin is desktop-first.
- Motion respects `prefers-reduced-motion`. Glass effects stay off on budget phones (B3).
- **Built into the primitives:** tap targets at least 44 px; primary buttons 52 px tall; high-contrast primary actions within thumb reach; WCAG 2.2 AA text contrast; gains and losses shown with an arrow and sign as well as colour; `prefers-reduced-transparency` and low-power devices fall back to solid surfaces.

---

## 7. Sample data (`packages/sample-data`)

- Lessons: World 1 complete (6 lessons + Boss) with every step type; Worlds 2–3 outline only (locked).
- Library: about 15 articles, topics, an A–Z glossary.
- Companies: real names and tickers (ADR D8); figures marked "from latest annual report" until real data. Simulator companies per the §10 decision.
- Prices: seeded daily series; sample-price labels are not shown (client wording rule) unless the client asks.
- Scripted Ask Fin answers for every Library topic, plus refusal and insufficient-evidence cases.

---

## 8. Testing

- **Unit (Vitest):** every `domain` module, 95% branch coverage on simulator, learning, entitlements, feedback prompts, checkout state machine.
- **Golden JSON:** simulator trades, learning scoring and streak dates (including Lagos midnight edges).
- **E2E (Playwright):** onboarding → Home → lesson → Boss; Ask Fin to the limit; buy, sell, oversell blocked, double-tap; upgrade with each forced checkout outcome; admin turns a prompt off and the entry point disappears.
- **Accessibility:** axe on every route, 0 serious or critical; keyboard and screen-reader pass in Week 5.
- **Performance:** proposal §8 budgets (Lighthouse mobile ≥ 85 on key routes, LCP < 2.5 s, CLS < 0.1).
- **Every week, not just Week 5:** axe with 0 serious or critical issues on that week's routes, the Lighthouse mobile budget on that week's key route, and a 360 px check. These are part of each week's "Done when" below.
- Definition of done and the Pre-launch checklist in `build-backlog.md` still apply.

---

## 9. Five-week plan (re-cut for the chosen design)

Every week's "Done when" also includes the weekly accessibility and performance checks in §8.

| Week | Build | Done when |
|---|---|---|
| 1 | Repo, CI, staging; tokens and accessible primitives (44 px targets, 52 px buttons, contrast); `FinvoraApi` + mock skeleton; `domain`: money, simulator, learning engine, entitlements with golden tests; onboarding, sign-in, Home | Staging live; Home (with Next for you) and onboarding pass axe at 360 px |
| 2 | Learn journey, all step types, Lesson complete, Boss, XP / levels / streak; Ask Fin with context sheet; Library; universal search | A full World 1 run works end to end, keyboard only |
| 3 | Simulator with amount-first trading and Virtual money / Demo data labels; Markets, Exchange, Companies, watchlist with Undo; Challenges | All simulator golden cases, including amount edge cases, pass through the UI; state survives refresh |
| 4 | Me, Settings, Plans and checkout states; historical calculator; remembered preferences; feedback prompts; admin console | Each checkout outcome reachable; prompt toggles reflect in the app |
| 5 | Device and accessibility pass, performance, fixes, reviewer guide | 0 critical / high bugs; budgets met; client walkthrough done |

My judgement: about 110 screens in 5 weeks is tight for one engineer. If time runs short, cut in this order: admin AI summaries and audit log detail, Challenges, extra quick-learn formats beyond three. Keep Home, Learn, Ask Fin and the simulator whole.

---

## 10. Decisions still needed before Week 1

| # | Question | Default if no answer |
|---|---|---|
| 1 | Plus price: **client still deciding** | Placeholder from the designs, kept in config; swap in when decided |
| 2 | Free Ask Fin daily limit (client) | 5, as designed, kept in config |
| 3 | Final logo, font, exact purple (client) | Use the canvas values |
| 4 | Plus extras (compare, dividend history, report scan, PDF summary) are confirmed in, but **not designed in purple yet** | Design them before Week 4 |
| 5 | Simulator companies in Phase 1: made-up (designs) or real names (ADR D8)? Phase 2 uses real listed companies via Mansa | Made-up in Phase 1, so no real price is ever implied |
| 6 | Watchlist and historical calculator are in scope (§4.10) but have no purple screens yet | Design them before Weeks 3–4 |
| 9 | Amount-first trade sheet and Next for you card variants need purple designs | Design before Weeks 1 and 3 |
| 7 | Simulator fees (D5) are not shown in the buy / sell sheets | Add an "approx. fees" line to the sheets |
| 8 | NGX trading hours used in the market-closed sheet | Confirm before Week 3 |
