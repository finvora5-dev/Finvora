# Finvora: notes for Claude sessions

## How to work with this user
- **Build nothing from your own head.** Every screen, component, behaviour, number and piece of copy must come from a source: the approved navy and emerald canvas, the docs in `docs/`, the client's brand sheet, or a skill's rules. If no source covers it, stop and ask the owner before building; never fill the gap with a guess (owner, 15 Nov 2026).
- **Flag judgement calls.** When an answer, design choice or recommendation rests on your own judgement rather than on a source (the PRD, the code, a skill's checklist, a test result, a cited reference), say so explicitly, e.g. "My judgement:", with what it's based on and how confident you are. This applies to everything: design, engineering, estimates, product and pricing, legal and regulatory points, tool behaviour and facts stated from memory. Never present judgement as fact.
- **Use the design engineering skills on all UI work** (in `.claude/skills/`, from emilkowalski/skills): `emil-design-eng` for every UI build or change; `mobile-native` and `gestures` for phone screens and bottom sheets; `animate` for any motion; `animation-performance` and `break-ui` before saying a screen is done; `review-animations` before each handover; `ask-sonner` for toasts and Undo; `learn-taste` when the owner corrects a design, to turn it into a rule (owner, 15 Nov 2026).
- If a relevant skill or checklist exists (e.g. design critique, accessibility review, code review, security review), use it or say you didn't.
- Say what you actually checked ("verified by running it", "from PRD §9") versus what you assumed.

## Project rules (decided)
- **Phase 1 (the prototype) comes first.** Open questions live in `docs/open-questions.md`; only its Phase 1 list blocks work. Don't raise Phase 2 questions unless asked.
- Read `docs/TECHNICAL_PROPOSAL.md`, `docs/adr/`, `docs/ux-principles.md` and `docs/build-backlog.md` before changing scope or architecture.
- Money is integer kobo everywhere, including JSON. No floats.
- Payments follow `docs/build-backlog.md` §B5: **a failed response is never a failed payment**; three states (pending, confirmed success, confirmed failed); only our server's direct check with Paystack decides; retries are new attempts on the same order, never a new purchase; no retry while pending.
- Duplicates, status checks and reconciliation follow `docs/build-backlog.md` §B7; security, audit, observability, incident and testing patterns follow §B8; idempotency keys and race conditions follow §B9; sign-in, age, market calendar, subscriptions, AI data handling and analytics follow §B10.
- Nothing ships without the **Definition of done**; Stage 2 does not launch until the **Pre-launch checklist** in `docs/build-backlog.md` is complete.
- Use the Fintech Engineering Handbook (handbook.fintechengineer.io) for engineering patterns only; verify its facts, and use Nigerian sources (Paystack docs, CBN, SEC Nigeria, NDPA) for rules.
- Design: no yellow; no em dashes in copy; no "demo/prototype/sample" wording outside the simulator; no "Illustrative" label or wording anywhere (owner, 15 Nov 2026; replaces open-questions Q2 of 12 Nov 2026). Prices are still made up; the "Simulated" tags and "Not financial advice" lines stay.
