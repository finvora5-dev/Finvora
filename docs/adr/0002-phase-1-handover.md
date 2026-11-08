# ADR 0002: Phase 1 handover to Phase 2

**Status:** Proposed (2026-11-08) · **Context:** the browser-only prototype (Phase 1) is close to sign-off. This records what Phase 2 keeps, what it replaces, and where each Phase 2 service plugs in.

## Decision

Phase 2 keeps the tested rules in `packages/` and replaces the prototype's browser storage and screens. Every decision behind the prototype is in [open-questions.md](../open-questions.md) (D1 to D21) and the approved designs in [docs/designs](../designs/).

## What carries over

| Part | Where | Why it carries |
|---|---|---|
| Money, fees, simulator prices and trades | `packages/domain` (`money`, `market`, `simulator`) | Integer kobo everywhere, tested. |
| Market hours | `packages/domain/src/markethours.ts` | Lagos time, NGX hours (D3, D12). Public holidays still to add. |
| Checkout states | `packages/domain/src/checkout.ts` | Pending, confirmed success, confirmed failed (build-backlog B5). |
| Entitlements and prices | `entitlements.ts`, `config.ts` | ₦5,999 a month, ₦65,989 a year (D1); free Ask Fin limit 5 (D2). |
| Learning and review rules | `packages/engine`, `review.ts` | XP, levels, streaks, "Review what I missed" (D8, D16). |
| Ask Fin pipeline and test set | `askfin.ts`, `askfin.cases.ts` | Reply shape, advice refusal, decline, limit rule (D4, D18). The 40 test questions check the Phase 2 AI. |
| Content | `packages/sample-data` | Lessons and 15 articles, to be reviewed by a finance educator before launch. |

## What Phase 2 replaces

| Prototype | Phase 2 |
|---|---|
| Browser storage (`fv.proto.v1`, `fv.sim.v1`, `fv.ask.v1`, `fv.billing.v1`, `fv.lib.v1`, `fv.prefs.v1`, `fv.auth.v1`, `fv.admin.v1`) | Server tables per user, same field names where possible. |
| Simulated checkout | Paystack, confirmed only by our server's direct check (B5, B7). |
| Ask Fin answering step (Library word scoring) | Live AI with RAG ([phase2-ai-rag.md](../phase2-ai-rag.md)); same reply shape and test set. |
| Company descriptions with no figures | Mansa API for real prices and company figures. Ask Fin's company step and the Markets screens read from it. |
| Practice Market made-up prices | Stay made up (it is practice), but real NGX companies can show real prices from Mansa. |
| Browser-only admin and staff sign-in | Real staff accounts and roles (B8, B10). |
| Canvas boards and wiring scripts (`apps/prototype`) | The Phase 2 app. These are prototype scaffolding only. |

## Consequences

*   Phase 2 starts with tested rules, decisions and designs, not a blank page.
*   The prototype's screens are a reference for look and flow, not code to reuse.
*   Open Phase 2 questions stay in `open-questions.md`; nothing here answers them.
