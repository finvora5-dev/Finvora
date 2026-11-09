# Prototype site build tools

The site in `apps/prototype/site` is the approved canvas boards. These scripts make them work.
Run them in this order after copying fresh boards from the canvas:

1. `build_desktop.py <canvas boards> <site>`: the 7 main desktop boards.
2. `build_fvd.mjs <domain js> <site> <sample-data js>`: compiles the tested rules (including `markethours`) into `fvd.js`
   (compile `packages/domain` and `packages/sample-data` with `tsc --noEmit false --outDir` first; the domain output lands in `<out>/domain/src` because its tests read the sample data).
3. `wire_sim.py`, `wire_ask.py`, `wire_pay.py`, `wire_auth.py`, `wire_lib.py`, `wire_admin.py` on the site:
   simulator, Ask Fin, checkout, sign-in, Library and admin. Each skips boards it already wired.
4. Regenerate the desktop sub-pages, focus flows and pop-ups from the wired phone boards, then
   `build_desktop_more.py <generated boards> <site> <pairs.json>`.
5. `wire_desktop.py <site>`: the desktop article header and desktop Library page.
6. `wire_admin_more.py <site>` (after `wire_admin.py`): staff sign-in, overview, content, article editor,
   question builder, Ask Fin review, AI summary approvals, users and payments, and plans.
7. `wire_emails.py <site>`: Welcome, the sign-in code and receipt emails (in-app previews), and the
   links to them. Desktop boards it touches are patched directly, so run it after step 4.
8. `wire_replay.py <site>` and `wire_reviewer.py <site>`: lesson replay, and the Reviewer tools page
   with its links from Settings and sign-in. Re-run both after regenerating desktop boards.
9. `wire_settings.py <site>`: design Part 1 screens: one price source, the Practice Market label and entrance line,
   the closed-market sheet with its next opening time, and the Ask Fin source label.
10. `wire_a11y.py <site>`: contrast and ARIA fixes from the axe-core audit. Re-run after any board rebuild.
11. `build_celebrate.py <site>`: the screens after a lesson (receipt, streak dial, new-high level chart), the
    summary's use of the saved result, and the white Meet Fin screen.
12. `build_review.py <site>`: Review what I missed (design Part 2): the review end screen, the lesson summary button,
    "Lesson review" in History. The journey sheet is in `responsive.js`.
13. `build_sw.py <site>` last, so the offline cache lists every file.

All learner data stays in the browser (`localStorage`, keys starting `fv.`). Nothing is sent anywhere.

Reviewer shortcuts:
- Sign-in: any 6 digits work; `000000` is a wrong code, `111111` an expired one; 3 wrong codes lock for 15 minutes.
- Admin: open `UASignIn.dc.html`. Use any `@finvora.app` email and any 6 digits (`000000` is wrong; 3
  wrong codes lock for 15 minutes). The staff sign-in lasts until the tab is closed. Published article
  edits, saved daily questions and saved plan prices change what learners see in this browser.
- Reviewer tools: Settings, Reviewer tools (or the link on the sign-in screen): switch Free or Plus,
  sign in as Ada, open admin, pick the next checkout result, run the practice market, jump progress, reset.
- Emails: the code screen links to the code email, and checkout success links to the receipt.
- Checkout: open Plans with `?outcome=failed`, `slow` or `offline` to see those results; otherwise payments succeed.

After `wire_settings.py`: `wire_askfin3.py` (design Part 3: Ask Fin "Did you mean" buttons, free-reply line, limit panel, admin Ask words). Then `build_sw.py` last.

After `wire_askfin3.py`: `wire_plus.py` (design Part 4: the eight Plus tool boards drawn by `site/plus.js`, plus entry points on the Practice Market, Plans and Learn). Then `wire_a11y.py` if re-running, and `build_sw.py` last.

Then `wire_admin_phone.py` (design Part 5: `UAPhoneTasks` and `UAPhoneTask`, drawn by `site/admin-phone.js`; `responsive.js` sends admin pages there when the shorter screen side is under 700 px). Then `build_sw.py` last.

`wire_profile.py`: one way into Me (removes the Home top-right profile icon and the desktop sidebar "Me" link; the sidebar learner card opens Me). Then `build_sw.py` last.
