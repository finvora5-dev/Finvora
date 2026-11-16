---
name: laptop-build
description: Build or change a Finvora laptop screen (any *LaptopNavy or Admin* board at 1440 px) so it looks exactly like its approved canvas mock-up and every control works like the wired phone version. Use for every laptop screen, before saying one is done. Runs the mock-up match and dead-control checkers and refuses to call a screen finished while either fails.
---

# Laptop build

The owner's rule (16 Nov 2026): **the laptop view is the laptop mock-up.** Never show the phone column, a centred phone screen,
or any other fallback on a laptop instead of the drawn laptop board. Never leave a drawn control that does nothing.

## Sources, in order

1. **Layout and copy:** the laptop board in `apps/prototype/mockups/<Board>.dc.html` (the approved canvas copy). Do not move,
   restyle, add or remove anything it draws.
2. **Behaviour:** the wired phone board it pairs with (`PAIRS` in `site/responsive.js`), e.g. `LessonLaptopNavy` behaves like
   `LessonNavy` and the lesson step boards. Same store calls on `window.FV`, same rules, same copy for states.
3. **Anything neither covers** (a state the laptop board does not draw, a control with no phone twin): stop and ask the owner,
   with a recommendation. Never fill the gap by guessing (CLAUDE.md).

## How to wire one screen

1. Read the mock-up and the phone board's logic. List every drawn control and what it must do, citing the phone source.
2. Write the wiring in a `tools/wire_navy_*.py` script (idempotent, with a MARK comment), editing the site board by string
   anchors, never by hand, so a re-run rebuilds it. Replace drawn sample values with `{{placeholders}}` filled from `FV`.
3. States the laptop board does not draw (empty, loading, error, answered, locked) reuse the phone board's state, laid out
   inside the laptop board's own containers.
4. Apply the design-engineering skills as for any UI: `emil-design-eng` (press, hover gating, motion rules),
   `animate` for any motion, `ask-sonner` rules for toasts.
5. Run `python3 tools/build_sw.py site` last.

## Checkers (all must pass before "done")

Serve the site (`cd apps/prototype/site && python3 -m http.server 8790`), then:

| Check | Command | Pass |
| --- | --- | --- |
| Looks like the mock-up | `node apps/prototype/tools/qa_mockup.cjs http://127.0.0.1:8790/ <out> <Board>` | `drifted 0`; look at the `-a`/`-b` images yourself too |
| Every control works | `node apps/prototype/tools/qa_controls.cjs http://127.0.0.1:8790/ <out> <Board>` | `dead controls 0` |
| Layout faults | `node apps/prototype/tools/qa_responsive.cjs http://127.0.0.1:8790/ 1440 <out>` | no new faults for the board |
| Worst-case data | `break-ui` skill on the board | each finding fixed or explained |
| Phone still fine | `node apps/prototype/tools/qa_mobile.cjs http://127.0.0.1:8790/` | `issues 0` |

A remaining difference or dead control is either fixed or reported to the owner by name with the reason. Never report a
screen as done from reading code alone: say what each checker returned.

## Report format

One line per screen: board, what now works, checker results (mock-up %, dead controls, faults), and anything that needs the
owner's decision.
