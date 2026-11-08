# Plus learning tools (Part 4 of 5)

*   **Author:** Powellgraham5
*   **Status:** Draft
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
| Finvora Risk Signals | **What this number means** | On each Practice company page: P/E, debt level, price swings and dividend cover, each with a plain explanation and where the company sits among the 6 practice companies. Never good or bad. |
| Dividend and Cash Flow Tracker | **Dividend tracker** | For the learner's practice holdings: next made-up payment dates, amount per share, what they'd receive, total received so far. |
| Advanced watchlists | **Watchlists** | Several named lists, a note per company, and an in-app alert when a price moves more than a chosen percent in a day. |
| Portfolio intelligence | **Your practice portfolio** | Sector mix, biggest holding as a share of the total, fees paid, number of companies, each explained. |
| Market Crisis Simulator | **Crisis practice** | Three scripted crises replayed on a copy of the learner's portfolio over 5 steps. At each step the learner chooses hold, sell some or buy more; the end screen explains what happened and why. Not scored as right or wrong. |
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

### Data

`packages/domain/src/plus.ts` (new, tested). All amounts in integer kobo.

*   `companyHistory(ticker)`: 5 made-up yearly figures (revenue, profit, dividend per share, year-end price) per Practice company, generated from a fixed seed so every visitor sees the same numbers.
*   `measures(ticker, day)`: P/E, debt to equity, 30-day price swing, dividend cover, and the company's rank among the 6 on each (shown as "highest of the six", "middle", "lowest", never as good or bad).
*   `dividendCalendar(holdings, day)`: next payment date and amount per share for each holding, and total received since the learner bought.
*   `portfolioMix(holdings, prices)`: sector shares, biggest holding share, fees paid, company count.
*   `CRISES`: three scripts, each 5 steps with a price multiplier per sector and a plain explanation: "Oil price crash" (2016-style, oil and banks fall, naira weakens), "Bank scare" (2009-style, banks fall), "Pandemic shock" (2020-style, everything falls then recovers unevenly). Each step's result is computed on a copy; the learner's real practice portfolio is not touched.
*   `SCENARIOS`: three money scenarios with inputs (salary, bill, inflation rate) and pure functions for the result.
*   `adviceCheck(text)`: returns the blocked words found. Words: buy, sell, avoid, rating, rated, signal, recommend, recommendation, score, rank, ranked, outperform, underperform, undervalued, overvalued, "good investment", "bad investment". The verb "buy" in the simulator's own Buy button is allowed by listing screen labels separately.

### Entitlements

`entitlements(plan)` gains `plusTools: boolean` (true for Plus). Free learners get the locked list.

### Screens

New boards, built by a wiring script from existing boards so they keep the app's look:
*   `USimPlus` (the hub, also linked from the Practice Market home and the Plus plans page).
*   `USimCompareTime`, `USimMeasures` (section on `USimCompany`), `USimDividends`, `USimWatchlists`, `USimPortfolio`, `USimCrisis` (intro, step, result), `UPScenario` (one board, three scenarios).
*   Desktop versions follow the existing desktop pattern (`UDx...`).

### Storage

`fv.plus.v1` in the browser: watchlists, notes, alert percent, crises and scenarios done. Covered by the Part 1 reset tool.

### Tests

Domain tests for each function, totals in kobo, the advice check over every string in `plus.ts` and the boards, and that a crisis never changes the real practice portfolio.

## Alternatives Considered

*   **Build some, lock the rest:** rejected by the owner (D13).
*   **Use real NGX companies with invented figures:** rejected; invented figures next to real names could mislead.

## Open Questions

1.  **Where the hub lives:** proposed on the Practice Market home, because six of the seven tools use the practice portfolio. Money scenarios also appear in the Learn tab.
2.  **Crisis XP:** proposed 10 XP once per crisis, 5 per money scenario.
3.  **Watchlist alerts:** proposed in-app only, checked when the Practice Market opens.
