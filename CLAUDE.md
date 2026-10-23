# Finvora: notes for Claude sessions

## How to work with this user
- **Flag judgement calls.** When an answer, design choice or recommendation rests on your own judgement rather than on a source (the PRD, the code, a skill's checklist, a test result, a cited reference), say so explicitly, e.g. "My judgement:", with what it's based on and how confident you are. This applies to everything: design, engineering, estimates, product and pricing, legal and regulatory points, tool behaviour and facts stated from memory. Never present judgement as fact.
- If a relevant skill or checklist exists (e.g. design critique, accessibility review, code review, security review), use it or say you didn't.
- Say what you actually checked ("verified by running it", "from PRD §9") versus what you assumed.

## Project rules (decided)
- Read `docs/TECHNICAL_PROPOSAL.md`, `docs/adr/`, `docs/ux-principles.md` and `docs/build-backlog.md` before changing scope or architecture.
- Money is integer kobo everywhere, including JSON. No floats.
- Payments follow `docs/build-backlog.md` §B5: **a failed response is never a failed payment**; three states (pending, confirmed success, confirmed failed); only our server's direct check with Paystack decides; retries are new attempts on the same order, never a new purchase; no retry while pending.
- Duplicates, status checks and reconciliation follow `docs/build-backlog.md` §B7; security, audit, observability, incident and testing patterns follow §B8.
- Use the Fintech Engineering Handbook (handbook.fintechengineer.io) for engineering patterns only; verify its facts, and use Nigerian sources (Paystack docs, CBN, SEC Nigeria, NDPA) for rules.
- Design: no yellow; no em dashes in copy; no "demo/prototype/sample" wording outside the simulator unless the open sample-price decision says otherwise.
