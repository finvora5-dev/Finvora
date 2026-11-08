# Prototype settings, labels and stored data (Part 1 of 5)

*   **Author:** Powellgraham5
*   **Status:** Draft
*   **Date:** 2026-11-08

--------------------------------------------------------------------------------

## Overview

This is the first of five designs for the next round of Finvora Phase 1 changes, decided as D1 to D20 in [docs/open-questions.md](docs/open-questions.md) after a seven-reviewer EGM review ([concepts_brief.md](concepts_brief.md)). It covers the shared foundations the other four designs depend on: the Plus price and Ask Fin limit, practice market hours, labels for simulated content and the Practice Market, the reviewer code and its separate demo copy, how stored data changes safely in testers' browsers, and how returning testers get the updated app. The other four designs (Review what I missed, Ask Fin grounded answers, Plus features, admin on phones) follow once this one is approved.

Everything stays in the browser, as in the rest of Phase 1: no backend, no paid service, no live AI.

## The Problem

The prototype works end to end, but the review found that some of its foundations either contradict the owner's decisions or can stop a tester in their tracks:

*   **Prices disagree in three places.** The tested domain config says ₦2,500 a month, the app code charges ₦1,500, other figures are written directly into screens, and a price an admin once saved in a browser overrides all of them. The decided price (D1) is ₦5,999 a month and ₦65,989 a year.
*   **Market hours can strand a tester.** The practice market opens only on weekdays, 10:00 to 14:30 Lagos time (D3). A tester trying it in the evening or at a weekend meets a closed market with no clear way forward, which breaks the success test (D11). Prices also move over weekends while the market is closed, which is confusing.
*   **Simulated content is not clearly marked.** Ask Fin's answers are scripted and most company figures are made up, but nothing on screen says so consistently. The owner chose quiet labels (D5) and a named Practice Market (D17).
*   **Reviewer tools are open to everyone.** They are linked from Settings and the sign-in screen, so any tester can find them, switch themselves to Plus or jump their progress. The owner chose a reviewer code (D7), and a separate demo copy so a demo never changes a tester's real progress (D20).
*   **Stored data has no plan for change.** Progress, plan, Ask Fin usage and settings live in the browser's storage with no version or migration rules. The upcoming designs add new stored data (for example missed questions), and the offline cache can keep serving old files to a returning tester, so the same tester session could mix old and new prices or screens.
*   **Phone text does not follow the phone's text size.** Phone screens are scaled to fit the width, so the phone's own text-size setting has no effect (D15, WCAG 1.4.4).

The proposed solution sets one source for each setting, adds a clear closed-market experience, introduces one shared label style and the Practice Market entrance, gates reviewer tools behind a code with a separate demo copy, versions the stored data with safe upgrades, makes returning testers load the new version, and lets the lesson path follow the phone's text size.

## Goals

*   **One price everywhere.** Every screen, checkout, receipt email and admin page shows ₦5,999 a month and ₦65,989 a year, from a single source in the tested domain config, in a clean browser and in a browser that has old saved prices.
*   **Ask Fin limit of 5 a day** from the same single source (D2), with its tests checking the value 5 directly.
*   **No tester is ever stuck on market hours.** When the market is closed, the tester sees when it opens (Lagos time), can queue a practice order for the open, and is offered a lesson. Prices move only on trading days (D12).
*   **Simulated content is always recognisable** without breaking the experience: the Practice Market has one clear entrance line and a small icon on its screens, Ask Fin answers carry "Example answer from the Finvora Library" with a link, and checkout says "No money is taken" (D5, D17).
*   **Testers cannot reach reviewer tools by accident.** No visible links; the tools open only with the reviewer code (D7). Anything done there changes a demo copy, and "Back to my progress" restores the tester's real data exactly (D20).
*   **Stored data upgrades safely.** Existing testers keep their progress after the update; new fields get sensible defaults; corrupt or old data never crashes a screen.
*   **Returning testers get the new version** on their next visit at the latest, without clearing anything themselves.
*   **The lesson path follows the phone's text size** (D15) without breaking layout at 280px to 430px wide.

## Non-Goals

*   **Review what I missed, Ask Fin's new answering, the Plus features and admin on phones.** Each has its own design (Parts 2 to 5). This design only prepares the stored data and labels they rely on.
*   **Real security.** The reviewer code is checked in the browser and can be found by anyone who reads the page source. It hides the tools from testers; it does not protect them. Phase 2 needs real staff accounts.
*   **A reviewer-mode banner or special handling of the test sign-in codes.** The owner rejected these (D20).
*   **An activity log or session recording.** The owner judges success by testing the app personally (D19).
*   **An NGX public-holiday calendar.** Phase 1 treats every weekday as a trading day unless the owner asks otherwise.
*   **Text-size support on every screen in this part.** This part covers the lesson path; other screens follow in a later step of D15.
*   **Backend, real payments, real market data or live AI.**

## Open Questions

*   **Holidays:** should the practice market close on Nigerian public holidays, or treat every weekday as open? This draft assumes every weekday is open.
*   **Old orders and receipts:** a tester who bought Plus at an old price keeps that order. Should their receipt and plan screen show the price they paid (proposed) or the new price?
*   **Where the reviewer code is entered:** proposed on the Help and feedback screen, as a small "Reviewer code" field, so it is out of a tester's normal path.
