# Plus learning tools (Part 4 of 5)

*   **Author:** Powellgraham5
*   **Status:** Approved 9 Nov 2026 (open-question proposals accepted)
*   **Date:** 2026-11-08

## Overview

The client listed seven Plus features ([premium-features.md](../premium-features.md)). D6 and D13 in [open-questions.md](../open-questions.md) decide that all seven are built in the Phase 1 prototype, with made-up data, under learning names, and with one shared advice check. The word is **Plus** everywhere. Real company data arrives with the Mansa API in Phase 2.

## The Problem

*   Plus today offers more of the free app (all Worlds, unlimited Ask Fin, Compare). The client wants tools a learner can only get with Plus.
*   Some of the client's names ("Risk Signals", "Investment Intelligence") read as buy or sell advice, which Finvora never gives.
*   There is no real company data in Phase 1, so every tool must work on the Practice Market's made-up companies and the learner's virtual portfolio.

## Goals

*   **Seven tools, learning names:**

| Client's name | Name in the app | What it does |
|---|---|---|
| Historical comparisons | **Compare over time** | Two Practice Market companies side by side over 5 made-up years: revenue, profit, dividend per share, price. |
| Finvora Risk Signals | **What this number means** | On each Practice company page: P/E, debt level, price swings and dividend cover, each with a plain explanation, a link to the lesson or article that teaches it, and the company's position among the 5 practice companies ("highest of the five"). Never good or bad. |
| Dividend and Cash Flow Tracker | **Dividend tracker** | For the learner's practice holdings: next made-up payment dates, amount per share, what they'd receive, total received so far. |
| Advanced watchlists | **Watchlists** | Several named lists, a note per company, and an in-app alert when a price moves more than a chosen percent in a day. |
| Portfolio intelligence | **Your practice portfolio** | Sector mix, biggest holding as a share of the total, fees paid, number of companies, each explained. |
| Market Crisis Simulator | **Crisis practice** | Three made-up crises, each "in the style of" a real one, replayed on a copy of the learner's portfolio over 5 steps. At each step the learner chooses "Keep everything", "Move some to cash" or "Add more"; the end screen shows their path next to "if nothing changed", in neutral words. Not scored as right or wrong. |
| Interactive financial scenarios | **Money scenarios** | Everyday situations (salary day, surprise bill, prices rising) with sliders; the result shows the effect in naira. |

*   **One Plus hub:** a "Plus tools" section on the Practice Market home lists all seven. Free learners see the same list with a lock; tapping opens the existing upgrade screen.
*   **One advice check** (D13): a domain function blocks buy, sell, avoid, rating, signal, recommend, score and rank wording in all Plus text and Ask Fin text. A test runs it over every string the tools can show.
*   **Labels:** every figure says it is made up for practice (the existing `LABELS.MADE_UP_FIGURES`).
*   **XP:** finishing a crisis or money scenario gives XP once each, from the engine rules.

## Non-Goals

*   Real company data, real alerts by push or email (Phase 2, Mansa API and notifications).
*   Changes to Plus prices or checkout.
*   Any wording that rates a company or tells the learner what to do with money.

## Detailed Design

### Companies: one source of truth

The live Practice Market uses 5 made-up companies hard-coded in `fv.js` (Adire Foods ADF, Kola Solar Power KSP, Nupe Trust Bank NTB, Okeke Motors OKM, Zuri Telecom ZLT). `SIM_COMPANIES` in `packages/sample-data` (6 different companies) is not used by any screen. Decision (my judgement, to keep learners' existing trades valid): the 5 live companies move into `packages/sample-data` as `PRACTICE_COMPANIES`, `fv.js` reads them from there, and `SIM_COMPANIES` is deleted. Each gains made-up yearly figures (below). Ask Fin already uses the 5 live companies.

### Data

`packages/domain/src/plus.ts` (new, tested). All amounts integer kobo; rates in basis points; one rounding helper (`roundHalfEven`) for every multiplication; tests check that parts add up to totals.

*   **Made-up yearly figures** in `PRACTICE_COMPANIES`: 5 years of revenue, profit, debt, equity, shares in issue and dividend per share (0 for KSP and ZLT). Written by hand so they read plausibly; no seed needed.
*   `companyHistory(ticker)`: the 5 years plus each year-end price from the existing seeded `priceSeries`.
*   `measures(ticker, day)`: P/E (today's price from `priceSeries` / latest profit per share), debt to equity, 30-trading-day price swing (from `priceSeries`, deterministic by day), dividend cover ("not applicable" when no dividend), and `position`: "highest of the five", "in the middle", "lowest of the five".
*   `dividendCalendar(account, day)`: every company that pays one pays once a year on a fixed simulator day per company. Shares held on that day (from `account.trades`) receive dividend per share × shares. Shows next date, amount, and total received. Received dividends are shown, not added to cash (adding them is a simulator change, out of scope).
*   `portfolioMix(account, day)`: sector shares by value, biggest holding share, fees paid (sum of `trades[].feesKobo`), company count.
*   `CRISES`: three scripts keyed by the live sector names (Food, Energy, Banking, Transport, Telecoms): "Oil price shock, 2016 style" (Energy and Transport fall most), "Bank scare, 2009 style" (Banking falls most), "Pandemic shock, 2020 style" (all fall, Telecoms and Food recover first). Each labelled "made-up figures", with one real-history line from the Library. Run on a deep copy; a test checks the real account is unchanged.
*   `SCENARIOS`: "Salary day" (split a salary into needs, wants, savings), "Surprise bill" (emergency fund vs borrowing), "Prices rising" (inflation slider on savings). Pure functions, kobo in and out.

### Advice check

`adviceCheck(text)`: whole-word, case-insensitive match against: buy, sell, avoid, rating, rated, signal, recommend, recommendation, score, rank, ranked, outperform, underperform, undervalued, overvalued, "good investment", "bad investment". Returns the words found. Exempt: the simulator's own Buy and Sell buttons and trade screens, and Library article text (which explains these words); exemption is by screen, listed in one constant `ADVICE_EXEMPT_BOARDS`. A test runs it over every string in `plus.ts`, the Plus boards' text and Ask Fin's fixed replies; any hit fails the test. Crisis choices avoid the words ("Move some to cash", "Add more").

### Entitlements and XP

*   `entitlements(plan)` gains `plusTools: boolean` alongside the existing `compare` and `dividendHistory` (kept). Screens read `entitlements(plan()).plusTools`. Checked in the browser only; Phase 2 checks it on the server.
*   `packages/engine/src/rules.ts` gains `crisisComplete: 10` and `scenarioComplete: 5`, paid once each, recorded in `fv.plus.v1`.

### Storage

`fv.plus.v1`: `{ lists: [{ name, tickers: [], notes: {ticker: text} }], alertBps: 500, seenAlerts: {ticker: day}, crises: {id: true}, scenarios: {id: true} }`. If it does not parse, it starts empty. Watchlist tickers not in `PRACTICE_COMPANIES` are dropped. Resetting the practice portfolio does not clear it; "clear everything" does.

### Screens

Built by `apps/prototype/tools/wire_plus.py` (new) from existing boards, run after `wire_settings.py` and before `wire_a11y.py` and `build_sw.py`; listed in `tools/README.md`.
*   `USimPlus` (hub): linked from a "Plus tools" card on `USimHome` and from `USPlans`. Free learners see the list with a lock; tapping opens `USUpgrade`.
*   `USimCompareTime`, `USimDividends`, `USimWatchlists`, `USimPortfolio`, `USimCrisis` (intro, step and result by parameter), `UPScenario` (also linked from the Learn tab). "What this number means" is a section on `USimCompany`.
*   Desktop: the same boards at desktop width through the existing `fit()` scaling; no separate `UDx` copies.
*   Every board follows the phone text-size rule (D15), and the scenario sliders work with the keyboard and screen readers (native range inputs with labels).

### Build order

Each step ships on its own: hub and entitlements, What this number means, Your practice portfolio, Crisis practice, Money scenarios, Dividend tracker, Compare over time, Watchlists.

### Risks

*   **Advice drift:** new copy may slip in advice words. The test fails the build.
*   **Made-up figures read as real:** every figure carries the made-up label; crisis names say "style".
*   **Scope:** seven tools is the largest part so far; the build order lets the owner review each as it lands.

## Alternatives Considered

*   **Build some, lock the rest:** rejected by the owner (D13).
*   **Use real NGX companies with invented figures:** rejected; invented figures next to real names could mislead.

## Open Questions

1.  **Where the hub lives:** proposed on the Practice Market home, because six of the seven tools use the practice portfolio. Money scenarios also appear in the Learn tab.
2.  **Crisis XP:** proposed 10 XP once per crisis, 5 per money scenario.
3.  **Watchlist alerts:** proposed in-app only, checked when the Practice Market opens, against the last trading day's close, each alert shown once.
