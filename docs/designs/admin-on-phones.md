# Admin tasks on phones (Part 5 of 5)

*   **Author:** Powellgraham5
*   **Status:** Draft
*   **Date:** 2026-11-08

## Overview

D10 and D14 in [open-questions.md](../open-questions.md): admin must work on phones, as tasks (approve, check, switch on or off). Wide tables say "open on a larger screen".

## The Problem

At 390 px the admin screens are the desktop layout shrunk to about a third: 8 px text, a sidebar taking a fifth of the width, tables nobody can read or tap. Staff who check the app on a phone cannot approve anything.

## Goals

*   **Phone admin is a task list.** Below 700 px, the admin home shows cards, each with a count and one action:
    *   AI summaries to approve (n)
    *   Ask Fin replies to check (n)
    *   Feedback to read (n)
    *   Daily question for tomorrow (set or not set)
    *   Features on or off (the existing switches)
*   **Each task works with one thumb:** one item per screen, the item's text in full, and large buttons (Approve, Send back with a note, Reject). After an action the next item slides in; at the end, "All done" and back to the list.
*   **Wide screens on phones:** Users and payments, Audit log, Content table, Plans and Overview charts show the 3 or 4 summary numbers they already have, plus "Open on a larger screen to see the full table". Nothing is hidden that the task list needs.
*   **Navigation:** the sidebar becomes a top bar with the Finvora mark, the screen name and a menu button that opens the same links as a sheet.
*   **Same data, same audit log:** every phone action calls the same `FV.ADMIN` functions as desktop, so the audit log records it the same way.

## Non-Goals

*   Editing articles or building daily questions on phones beyond what the forms already allow (they become one column, nothing more).
*   Real staff accounts or roles (Phase 2).

## Detailed Design

*   **Breakpoint:** `responsive.js` already fits screens by width. Admin boards below 700 px switch to the phone layout instead of being scaled down.
*   **New boards:** `UMAdminTasks` (the task list) and `UMAdminTask` (one item, used for summaries, Ask Fin replies and feedback by a `?type=` parameter). Built by a wiring script from existing phone boards so they keep the app's look.
*   **Wide boards:** a shared phone banner component added to `UAUsers`, `UAAudit`, `UAContent`, `UAPlans`, `UAOverview` with their existing summary numbers.
*   **Forms** (`UAEditor`, `UAQuestions`, `UAFeedbackSettings`): one column below 700 px, full-width fields, buttons at the bottom.
*   **Tests:** a Playwright walk at 280, 390 and 820 px: approve one summary, send one back with a note, check the audit log shows both.

## Alternatives Considered

*   **Scale the desktop layout:** today's behaviour; unreadable.
*   **Make every table responsive:** a lot of work for screens staff use rarely on phones; the owner chose tasks (D14).

## Open Questions

1.  **Breakpoint:** proposed 700 px, so tablets (820 px) keep the desktop layout.
2.  **Undo:** proposed a 5-second "Undo" toast after Approve or Reject on phones, since a thumb slip is easy.
