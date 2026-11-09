# Admin tasks on phones (Part 5 of 5)

*   **Author:** Powellgraham5
*   **Status:** Draft, revised after EGM review
*   **Date:** 2026-11-08

## Overview

D10 and D14 in [open-questions.md](../open-questions.md): admin must work on phones, as tasks (approve, check, switch on or off). Wide tables say "open on a larger screen".

## The Problem

Admin boards are 1440 px wide. Below 1024 px, `fit()` in `responsive.js` scales them down: to 0.27 at 390 px and 0.57 on an 820 px tablet. Text and buttons become too small to read or tap. Staff who check the app on a phone cannot approve anything.

## Goals

*   **Phone admin is a task list.** Below 700 px, the admin home shows cards, each with a count and one action:
    *   AI summaries to approve (n)
    *   Ask Fin replies to check (n)
    *   Feedback to read (n)
    *   Features on or off (the existing switches)
*   **Each task works with one thumb:** one item per screen, the item's text in full (scrolling), and the action buttons fixed at the bottom. After an action the next item slides in; at the end, "All done" and back to the list. Buttons per task, using today's functions:

| Task | Buttons | Call |
|---|---|---|
| AI summaries | Approve, Reject | `ADMIN.decideSum(x, d, text)` (exists) |
| Ask Fin replies | Answer is fine, Needs a better answer (with note), Escalate | `ADMIN.decide(id, q, d, note)` (exists) |
| Feedback | Mark done | `ADMIN.markDone(id)` (exists) |
| Features on or off | the existing switches, with the existing confirm screen (`UAConfirmOff`) before switching off | `ADMIN.set(k, on)` plus `ADMIN.log` (the board logs it) |

*   **Undo:** after any action, a 5-second toast "Done. Undo" (the existing `fvToast` with an action). The call runs only when the toast closes, so the audit log never records an undone action.
*   **Wide screens on phones:** Users and payments, Audit log, Content table, Plans and Overview charts show the 3 or 4 summary numbers they already have, plus "Open on a larger screen to see the full table". Nothing is hidden that the task list needs.
*   **Navigation:** the sidebar becomes a top bar with the Finvora mark, the screen name and a menu button that opens the same links as a sheet.
*   **Same data, same audit log:** every phone action calls the same `FV.ADMIN` functions as desktop, so the audit log records it the same way.

## Non-Goals

*   Editing articles or building daily questions on phones beyond what the forms already allow (they become one column, nothing more).
*   Real staff accounts or roles (Phase 2).

## Detailed Design

*   **Layout switch:** `fit()` in `responsive.js` gains a phone admin mode: on boards with the `.dside` sidebar, when the screen's shorter side is under 700 px (so landscape phones count as phones), it adds the class `fv-admin-phone` instead of scaling. `responsive.css` then hides `.dside` (the class stays in the markup), shows a top bar with the Finvora mark, the screen name and a menu button that opens the same links as a sheet, and stacks content in one column. Tablets (820 px) keep today's scaled desktop.
*   **New boards:** `UAPhoneTasks` (task list) and `UAPhoneTask` (one item; `?type=sums|ask|feedback`), built by `apps/prototype/tools/wire_admin_phone.py` (new) from `UAOverview`, so they keep the admin look and the `UA` staff check in `fv.js`. `route()` sends `UAOverview` to `UAPhoneTasks` in phone admin mode.
*   **Wide boards on phones:** `UAUsers`, `UAAudit`, `UAContent` and `UAPlans` show their existing summary row (Users: learners, on Plus, pending payments, failed today; the others: the counts at the top of each) and a banner "Open on a larger screen to see the full table". The tables are hidden in phone admin mode.
*   **Forms** (`UAEditor`, `UAQuestions`, `UAFeedbackSettings`): one column, full-width fields, buttons at the bottom.
*   **Text size:** follows the phone setting (D15); the fixed action bar keeps buttons visible at large text.
*   **Done when:** the owner can approve a summary, check an Ask Fin reply with a note, mark feedback done and switch a feature on a 390 px phone without zooming (D19).
*   **Tests:** a Playwright walk at 280, 390, 844×390 (landscape) and 820 px: each action once, Undo once, the counts go down, "All done" shows, the audit log lists the actions and not the undone one, and wide boards show the banner.

## Alternatives Considered

*   **Scale the desktop layout:** today's behaviour; unreadable.
*   **Make every table responsive:** a lot of work for screens staff use rarely on phones; the owner chose tasks (D14).

## Open Questions

1.  **Breakpoint:** proposed: shorter screen side under 700 px.
2.  **Undo:** proposed: 5-second Undo on every phone action; the action runs when the toast closes.
