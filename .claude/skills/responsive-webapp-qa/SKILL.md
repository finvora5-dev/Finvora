---
name: responsive-webapp-qa
description: Responsive web-app checker for Finvora. Checks every screen at phone (280, 390), tablet (820) and laptop (1440) for objective layout and behaviour faults, then a human look at contact sheets. Run after any change that touches layout, before saying it is done; pair with mobile-app-qa for phone behaviour.
---

# Responsive web-app QA

1. Serve the site (`cd apps/prototype/site && python3 -m http.server 8791`) or use the live URL.
2. Run the checker at four sizes, in parallel:
   `for w in 280 390 820 1440; do node apps/prototype/tools/qa_responsive.cjs <url> $w <out-dir> & done; wait`
3. Read each `qa-<width>.json`. Every entry is a fault to fix or to justify in the report. Kinds:
   - **sideways scroll**, **runs off the edge**: layout wider than the screen.
   - **text cut off**, **text overlaps text**: clipped or colliding text.
   - **control covered by something**: a button or link sits under another element and cannot be tapped.
   - **tap target under 44px** (phone and tablet sizes only).
   - **text under 12px**.
   - **broken image**, **missing file**, **script error**, **template text showing**, **bad text showing**.
4. Look at the contact-sheet screenshots (`qa-<width>-<screen>.png`) for what a script cannot judge: alignment, spacing rhythm, hierarchy, empty space, consistency between phone and laptop.
5. Fix, re-run until 0 faults (or each remaining one is explained), then report the counts per width and what you looked at.

Known limits: it checks screens at rest (plus what mobile-app-qa covers when scrolled); it cannot feel the on-screen keyboard or real touch. Note those for a real-phone test.
