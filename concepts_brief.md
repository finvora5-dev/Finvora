# Concepts brief: Finvora Phase 1, next changes (D1 to D11)

* **Author:** Powellgraham5
* **Date:** 2026-11-08

## Reviewer status

All seven Goldfish reviewers ran on 8 Nov 2026, each in a fresh context: egm-design, egm-codebase-details, egm-zoom-out, egm-comprehension, egm-implementation-readiness, egm-structural and egm-inventive-catalyst. This brief merges their findings. The decisions table D1 to D11 in [docs/open-questions.md](docs/open-questions.md) is the source of truth; this brief does not reopen them except where reviewers found a risk the owner should see.

## Overview

Finvora Phase 1 is a browser-only prototype for Nigerian beginners learning money and investing. Its job is to make the client and a small group of testers (partly real learners) satisfied enough to approve Phase 2. Success (D11): a tester finishes a lesson and starts the next one without being asked, and nobody gets lost or stuck.

The owner has settled eleven decisions: Plus at ₦5,999 a month and ₦65,989 a year (D1), 5 free Ask Fin questions a day (D2), real NGX market hours (D3), Ask Fin following the RAG steps on Library content with a finance-only decline and a "no figures" reply (D4), quiet labels (D5), a reduced and renamed set of Plus features (D6), reviewer tools behind a code (D7), "Practise my mistakes" (D8), text zoom deferred (D9), admin on phones (D10) and the success measure (D11).

## Analysis

The reviewers agree on five things.

1. **Market hours can break the success test.** Four of seven reviewers raised it. A tester in an evening or weekend session meets a closed practice market, and only reviewers can open it. That is the "stuck" moment D11 forbids. The fix keeps D3: a clear closed state with the next opening time in Lagos time, orders that queue for the open (the code already queues), and one next step such as a lesson. Sessions should be scheduled inside market hours or testers told beforehand. The hours in config are still marked "unverified against NGX". Prices also move on weekends while the market is closed.

2. **The scope of D6 and D10 is larger than the success test needs.** D11 is about lessons. Seven Plus features and phone admin add screens testers on the lesson path never see. The smallest versions: build the Market Crisis Simulator fully (no real data, clearly educational, covers interactive scenarios), plus at most portfolio insights on the learner's own practice holdings, and show the rest as locked Plus cards with their learning names. For admin, phones get tasks (approve, check, switch on or off) rather than shrunken desktop tables.

3. **The advice line has to be enforced in one place, not in names.** Renaming "Risk Signals" to "Risk explained" keeps "risk" beside a company, which a beginner can read as "this share is risky". The reviewers propose turning Plus towards the learner's understanding ("what this number means and what moves it") and running every Plus and Ask Fin text through one shared check that blocks buy, sell, avoid, rating, signal, recommend, scores and ranks. The promise becomes: Finvora teaches you to judge; it never tells you what to buy.

4. **Several decisions need exact rules before anyone builds.**
   * Prices disagree in three places today: the tested config says ₦2,500, the app code charges ₦1,500, and boards contain written figures. Browsers that saved admin prices keep old figures. The offline cache can serve old files to returning testers.
   * Missed questions are not stored after a lesson ends, so Practise my mistakes has nothing to work from, and testers who already finished lessons have no stored misses.
   * Ask Fin today matches about 19 hand-written answers by keyword and never reads the Library text. D4 needs a new tested domain function: a scope check, a ranked search over article text with a minimum score, the "no figures" path for named companies, and a fourth answer kind for out-of-scope questions.
   * The reviewer tools are linked openly from Settings and sign-in, and other shortcuts (sign-in test codes, ?outcome=, ?dq=) stay open to anyone.

5. **Success cannot be measured without a record.** There is no backend. The app already keeps a local activity log; adding a "lesson started" event and a reviewer-only export makes "starts the next lesson unprompted" readable from real sessions at no cost. Q5 (who signs off) is still open, so nobody owns the verdict yet.

Secondary points: labels should be one consistent list across every surface, and presenting made-up companies as a named Practice Market lets honesty sit at its entrance instead of on every number; reviewer mode should use separate storage so a client demo on a tester's device cannot change the tester's progress; "Practise my mistakes" may read as a telling-off ("Review what I missed" is gentler); the streak rule in the app (one rest day a week) differs from the tested domain rule (a missed day resets); text zoom (D9) leaves out the low-vision testers D11 most needs, and making only the core lesson path resize would cover them.

**Ideal final result:** every tester can finish a lesson and move on at any hour, on any phone; nothing simulated can be mistaken for real; Plus feels valuable without ever rating a share; and the client can see the success measure as evidence, not impression.

## Goals vs. Non-Goals

* **In-Scope Goals:** D1 to D11 as decided; testers never stuck by market hours; one advice check for all generated or Plus text; one price source; stored misses for practice; a measurable D11.
* **Out-of-Scope Non-Goals:** backend, real accounts, real payments, live AI, real market data, paid analytics, fully responsive admin tables on phones, full text-zoom support on every screen (D9).

## Alternatives Weighed

* **Plus scope:** all seven features with made-up data (owner's D6) versus the Crisis Simulator plus locked cards (zoom-out reviewer). Open for the owner.
* **Admin on phones:** full responsive admin (D10 as written) versus task-based phone admin versus deferring to Phase 2. Open for the owner.
* **Text zoom:** deferred (D9) versus fixing only the core lesson path. Open for the owner.
* **Ask Fin:** two small rules in the existing matcher (zoom-out) versus a tested retrieval function over Library text (design, readiness, codebase). The owner chose the RAG steps in D4, which needs the retrieval function.
* **Reviewer gate:** a URL flag or long press (first brief) was replaced by the owner's code (D7).
* **Phone layout fix:** a fluid layout for all phone boards (first brief) was rejected by the owner in D9.

## Key Decisions & Staging for Next Steps

Decisions still needed from the owner are listed in the chat summary of 8 Nov 2026. Once settled, the work splits into five designs, in this order:
1. Prototype settings, labels and stored data (D1, D2, D3, D5, D7, cache update rule, storage plan).
2. Practise my mistakes (D8).
3. Ask Fin grounded answers (D4), with a section on what carries into Phase 2.
4. Plus features in Phase 1 (D6), advice check first, mock-ups before screens.
5. Admin on phones (D10), mock-up first.
D9 and D11 are records for docs/PHASE1_STATUS.md, with a handover ADR saying the tested domain packages carry into Phase 2 and the boards and wiring scripts do not.
