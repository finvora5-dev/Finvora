# Concepts brief: Finvora Phase 1 prototype, current state and open decisions

Author: Powellgraham5
Date: 2026-11-09
Mode: BRAINSTORM

## Reviewer status

| Reviewer | Status |
| --- | --- |
| egm-design | not run |
| egm-codebase-details | not run |
| egm-zoom-out | not run |
| egm-comprehension | not run |
| egm-implementation-readiness | not run |
| egm-structural | not run |
| egm-inventive-catalyst | not run |

None of the seven reviewers ran. This synthesizer session had no tool for starting subagents, so it could not launch them, and no retry was possible. Everything below is the synthesizer's own reading of the brief it was given, plus docs/premium-features.md, docs/open-questions.md and a file count of apps/prototype/site. **It is single-author judgement, not a multi-lens review.** Rerun `/egm:egm-brainstorm` in a session that can start reviewers before treating this brief as reviewed.

## Overview

Finvora Phase 1 is a browser-only clickable prototype. It is meant to make the client and a small group of testers (some of them real learners) feel satisfied enough that the client approves Phase 2. Proposed success measure: a tester finishes a lesson and starts the next one without being asked, and nobody gets lost or stuck. Most of the product is built. This brief looks at six open decisions and ranks the risks.

## Analysis

1. **The success measure cannot be seen yet.** There is no backend and no analytics, so "starts the next lesson unprompted" can only be watched in sessions or reported by testers. Open question 6 (what success means) and question 5 (who signs off) are still unanswered (docs/open-questions.md). A brilliant prototype can still fail a review that has no agreed criteria.
2. **Reviewer tools change the test.** If real learners can switch themselves to Plus, jump their progress or wipe their data, the satisfaction signal is mixed with tool use. Learners may also think the shortcuts are real features.
3. **The premium list brings in advice risk.** "Finvora Risk Signals", "Investment Intelligence" and "Portfolio intelligence" sound like ratings of shares. That goes against the "education, never advice" rule and touches the parked SEC Nigeria question. Even with made-up companies, a prototype that shows the client a "risk signal" sets an expectation that Phase 2 would then need legal sign-off to meet.
4. **Replay of the full lesson does not fit the stated purpose.** The owner says replay is for relearning weak spots or preparing for an interview. Replaying all 7 steps makes learners re-read what they already know.
5. **Accessibility gap on phones.** Scaling a 390px board to fit narrower screens stops browser text zoom from working (WCAG 1.4.4, Resize Text). The axe-core pass was on desktop only, so "WCAG 2.2 AA clean" overstates the mobile result. Testers use phones, so this is the main view, not an edge case.
6. **Labelling conflicts.** The project rule forbids "demo/prototype/sample" wording outside the simulator. The anchored hypothesis says simulated content must be clearly labelled, and open question 2 (sample-price label) is unanswered. Scripted Ask Fin answers and made-up African examples with no label could mislead real learners.
7. **Two Plus prices and two Ask Fin limits are in circulation.** Testers and the client may see figures that do not match.
8. **Architecture for handover.** About 200 *.dc.html boards are wired by Python scripts, with shared state in fv.js. The tested TypeScript domain rules (money, fees, checkout, Ask Fin, XP) can be carried into Phase 2. The boards and wiring scripts probably cannot. They are a throwaway presentation layer. My judgement: that is fine for a prototype, as long as everyone agrees on it now so Phase 2 is not estimated as "finish the prototype". Medium confidence: I read the file layout, not the scripts.

## Goals vs. Non-Goals

Goals
- Testers finish a lesson and start the next one on their own, and nobody gets stuck. Watched in sessions and agreed with the client as the sign-off test.
- Simulated content is honest, and that honesty does not take away from the experience.
- Plus features stay on the education side of the advice line.
- Phones are usable at real text sizes.
- The domain rules hand over cleanly to Phase 2.

Non-Goals (Phase 1)
- Backend, real accounts, real payments, live AI, real market data.
- Real-time analytics (a paid tool or backend would be needed).
- Building every premium feature the client listed.
- Making admin fully usable on phones.

## Alternatives Weighed

**Replay**
- A. Keep full replay (current). Simple, but slow for relearning.
- B. "Practise my mistakes" only. Focused, but needs mistakes to be stored per lesson, and does nothing for a learner with a perfect score.
- C. Recommended (my judgement, medium confidence): offer both on the lesson card. "Practise my mistakes" when misses are stored, and "Quick refresher" (the info and takeaways steps only) for interview prep. Full replay stays as a secondary link. Reward: keep 2 XP once per lesson per day for any of them, and give a "fixed it" moment when a missed question is answered correctly. That reward is for understanding, not for repeating, which matches the stated purpose.

**Reviewer tools**
- A. Leave them visible. This distorts the test.
- B. Remove them. The client loses their shortcuts.
- C. Recommended: hide them behind an unlisted switch, for example a `?reviewer=1` link or a long-press on the version number, saved in localStorage. Give the client the link. Testers never see the tools. Add a small "Reviewer mode on" chip while the switch is active.

**Premium features in Phase 1**
- Include with made-up data, framed as learning: Market Crisis Simulator, interactive scenarios, historical comparisons on the simulator companies, dividend and cash flow tracker on the learner's virtual holdings, and watchlists with notes.
- Redesign before showing anything: rename "Risk Signals" to something that explains what each measure means and why it matters, for example "What this number tells you". It must never rate a share or say "buy" or "avoid". Rename "Investment Intelligence" and "Portfolio intelligence" to learning names, for example "Understand your practice portfolio".
- Leave out of Phase 1: anything that implies real or live figures.

**Phone text size**
- A. Keep scaling. This fails WCAG 1.4.4.
- B. Recommended: below 600px, use a fluid layout instead of scaling, at least for the learner screens. If that is too costly before review, record the limitation openly and test with 200% text zoom on the core lesson path.

**Labelling**
- Recommended: ask the client to settle question 2 with a single, consistent and friendly label. Possible wording is "Practice prices" or "Made-up figures" on prices and examples, and "Scripted answer" on Ask Fin. Get the client to confirm, in writing, that this label is allowed despite the wording rule.

## Key Decisions & Staging for Next Steps

1. Now: get answers from the client on success criteria and sign-off (Q5, Q6), the single Plus price, the Ask Fin limit (5 or 10), and labelling (Q2).
2. Now (small fix): hide the reviewer tools behind the unlisted switch.
3. Next: write an EGM draft for the replay redesign (option C).
4. Next: write an EGM draft for the premium scope, starting with the advice framing and names, before building any screen.
5. Before tester sessions: fix or document the phone text-zoom issue, and run axe at 390px.
6. Before handover: write a short ADR saying the domain packages carry over to Phase 2 and the boards and wiring scripts do not. Update docs/PHASE1_STATUS.md, which still describes the removed Next.js app.

## Ranked objections and risks

1. No agreed success or sign-off criteria (Q5, Q6). The prototype could be judged on the wrong things.
2. "Risk Signals" and "Investment Intelligence" read as investment advice (SEC Nigeria context).
3. Reviewer tools visible to real-learner testers distort the satisfaction signal and confuse learners.
4. Phone scaling blocks text zoom (WCAG 1.4.4), and the accessibility claim covers desktop only.
5. Unlabelled scripted or made-up content conflicts with the honesty goal, and the labelling rule conflicts with the hypothesis.
6. Full-lesson replay does not serve relearning or interview preparation.
7. Two prices and two Ask Fin limits are in circulation.
8. The board-and-script layer is throwaway. Phase 2 estimates must not assume it can be reused.
