---
name: mobile-app-qa
description: Mobile app behaviour checklist for Finvora. Run before telling the owner any screen, animation or flow is done, and after every visual change. Covers how screens behave when scrolled, typed into, tapped and resized, not just how they look at rest.
---

# Mobile app QA (Finvora)

The prototype must feel like a real app on a phone. Looking right at rest is not enough: check how each changed screen **behaves**. Run `node apps/prototype/tools/qa_mobile.cjs <base-url>` (automated part), then walk the manual part on the changed screens at 390 px (iPhone 13 emulation), 280 px, 820 px and 1440 px. Report what was checked and what failed. Never say "done" with a failing item.

Also load a UI/UX skill (`anthropic-skills:ui-ux-pro-max`, `design:design-critique`, `design:accessibility-review`) for visual changes (CLAUDE.md rule).

## Scrolling
- Top bars hide on scroll down and **come back on any small scroll up**, not only at the top. Lesson progress bars stay fixed.
- Bottom navigation and chat composers stay pinned; content never ends hidden under them (last item fully visible at the end of the scroll).
- New chat messages scroll into view after they finish drawing.
- No sideways scrolling of the page, at any width. Wide tables scroll inside their own box.
- Going back restores where you were; pull-down does not break layout.

## Touch
- Every tap target is at least 44 × 44 px with 8 px between targets.
- Every tappable thing gives feedback within 100 ms (pressed state); nothing relies on hover.
- Sheets and pop-ups close by tapping outside or a visible close/back control.

## Typing
- Focus ring sits on the field's own border (or its rounded container), never a box inside it.
- Fields use the right keyboard (email, numeric code, decimal for money).
- The field being typed in stays above the on-screen keyboard; submit works with the keyboard's Enter/Go.
- Errors appear next to the field in plain words, with how to fix.

## Motion and feedback
- Every action gives visible feedback: a toast (2.5 s, D22), a state change or a moment.
- Animations play once per event (not on every visit), can be skipped or don't block input, and respect reduced motion.
- Loading longer than 300 ms shows a skeleton or progress, not a frozen screen.

## Layout
- Safe areas: nothing important under the notch, home indicator or browser bars.
- Text follows the phone's text size on the lesson path (D15); nothing clips at large text.
- One primary action per screen; destructive actions are red and confirm first.
- Empty states say what will appear and how to start.

## Consistency
- Same pattern for the same job everywhere (headers, sheets, toasts, back buttons).
- Desktop mirrors the phone's information but uses desktop patterns (hover sidebar, wider layouts).
