# Finvora: notes for Claude sessions

## How to work with this user
- **Flag judgement calls.** When an answer, design choice or recommendation rests on your own judgement rather than on a source (the PRD, the code, a skill's checklist, a test result, a cited reference), say so explicitly, e.g. "My judgement:", with what it's based on and how confident you are. This applies to everything: design, engineering, estimates, product and pricing, legal and regulatory points, tool behaviour and facts stated from memory. Never present judgement as fact.
- **Before saying anything is done, run the `mobile-app-qa` skill** (`.claude/skills/mobile-app-qa/SKILL.md`): `node apps/prototype/tools/qa_mobile.cjs <url>` must report 0 issues, then walk its manual checklist (scrolling, touch, typing, motion, layout) on the changed screens. Report what was checked.
- **Always use a UI/UX skill** (ui-ux-pro-max, design critique or accessibility review) before and after any visual change, and check focus, hover and pressed states, not just the resting screen. No focus outline drawn inside a field: the ring goes on the element that draws the field border (owner, 9 Nov 2026).
- If a relevant skill or checklist exists (e.g. design critique, accessibility review, code review, security review), use it or say you didn't.
- Say what you actually checked ("verified by running it", "from PRD §9") versus what you assumed.

## Design reviews: Elephant-Goldfish Model (EGM)
- The EGM plugin (google/elephant-goldfish-model) is enabled for this project in `.claude/settings.json`. Start a new session after pulling if its commands are missing.
- Use it for any feature, scope or architecture change before building: `/egm:egm-brainstorm`, then `/egm:egm-draft`, then `/egm:egm-review <draft>`. Save approved specs in `docs/designs/`.
- Use `/egm:egm-review-loop` for other documents (ADRs, Phase 2 briefs), and `/egm:egm-drift-report` to check the code still matches approved designs.
- Small fixes and copy changes don't need it. The user approves every design before it is implemented.

## Project rules (decided)
- **Phase 1 (the prototype) comes first.** Open questions live in `docs/open-questions.md`; only its Phase 1 list blocks work. Don't raise Phase 2 questions unless asked.
- Read `docs/TECHNICAL_PROPOSAL.md`, `docs/adr/`, `docs/ux-principles.md` and `docs/build-backlog.md` before changing scope or architecture.
- Money is integer kobo everywhere, including JSON. No floats.
- Payments follow `docs/build-backlog.md` §B5: **a failed response is never a failed payment**; three states (pending, confirmed success, confirmed failed); only our server's direct check with Paystack decides; retries are new attempts on the same order, never a new purchase; no retry while pending.
- Duplicates, status checks and reconciliation follow `docs/build-backlog.md` §B7; security, audit, observability, incident and testing patterns follow §B8; idempotency keys and race conditions follow §B9; sign-in, age, market calendar, subscriptions, AI data handling and analytics follow §B10.
- Nothing ships without the **Definition of done**; Stage 2 does not launch until the **Pre-launch checklist** in `docs/build-backlog.md` is complete.
- Use the Fintech Engineering Handbook (handbook.fintechengineer.io) for engineering patterns only; verify its facts, and use Nigerian sources (Paystack docs, CBN, SEC Nigeria, NDPA) for rules.
- Design: no yellow; no em dashes in copy; no "demo/prototype/sample" wording outside the simulator unless the open sample-price decision says otherwise.
