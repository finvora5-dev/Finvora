# Review what I missed (Part 2 of 5)

*   **Author:** Powellgraham5
*   **Status:** Draft
*   **Date:** 2026-11-08

--------------------------------------------------------------------------------

## Overview

Learners replay lessons to relearn what they did not understand, or to refresh before something like a job interview (owner, 8 Nov). Today a replay plays the whole 7-step lesson again. This design turns replay into **Review what I missed**: the learner practises only the questions they got wrong, and fixing them all is rewarded (D8, D14 and D16 in [docs/open-questions.md](docs/open-questions.md)). Full replay stays as a small secondary option.

It builds on Part 1 ([prototype-settings-labels-storage.md](docs/designs/prototype-settings-labels-storage.md)), whose storage upgrade already added an empty missed-questions record to every learner's progress.

## The Problem

*   **Replay does not match why people replay.** A learner who missed one calculation has to sit through all seven steps, including the four they already know.
*   **Misses are thrown away.** The app records which questions were right on the first try during a lesson, but deletes that record when the lesson ends. Only the overall percentage survives, so nothing knows which questions to practise.
*   **Getting better is not rewarded.** Replays earn 2 XP once a day whatever happens. The game rules already have an "improvement" reward (5 XP) and a "Came back stronger" badge, but the app never uses them; the badge is always locked.
*   **Learners who finished lessons before this change have no stored misses.** They need a sensible option too.

## Goals

*   **Misses are kept.** When a lesson ends, every question answered wrong on the first try is stored for that lesson, with the learner's answer.
*   **Review what I missed** plays only those questions, in lesson order, with the usual feedback and explanations.
*   **A miss clears when answered right** in a review. Questions still wrong stay for next time.
*   **Fixing every miss in a lesson** gives +5 XP once per lesson, ever, and unlocks the "Came back stronger" badge.
*   **Reviewing still counts for the day:** the existing 2 XP once per lesson per day and a streak day apply to reviews, as they do to replays now.
*   **Full replay stays** as a small link, and is the only option for a lesson with no stored misses (a perfect score, or a lesson finished before this change).
*   **The rules live in the tested domain package** so they carry into Phase 2, with tests for each.
*   **Clear entry points:** the journey's finished-lesson node and the lesson summary show how many questions are waiting ("2 to review").

## Non-Goals

*   **Spaced repetition** ("still remembered days later" checks). Rejected by the owner (D16).
*   **A separate quick refresher** of explainer steps. Full replay already does this job.
*   **Reviewing boss, daily-question or micro-module misses.** This part covers the six World 1 lessons only.
*   **Changing lesson content or question wording.**
*   **New visual style.** Screens reuse the existing lesson steps; the new entry points get a mock-up before they are built.

## Open Questions

*   **Where a review starts from the journey:** tapping a finished lesson could open a small sheet with "Review what I missed (2)" and "Replay the whole lesson", or go straight to the review with a replay link on its first screen. Proposed: the small sheet.
*   **What counts as one question** in multi-part steps (order, match): proposed one miss per step, so a wrong order counts as one question.
*   **Does a review change the lesson's best score?** Proposed: no. The best score records the first full attempt and full replays only; reviews only clear misses.
