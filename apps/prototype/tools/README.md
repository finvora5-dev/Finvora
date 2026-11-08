# Prototype site build tools

The site in `apps/prototype/site` is the approved canvas boards. These scripts make them work.
Run them in this order after copying fresh boards from the canvas:

1. `build_desktop.py <canvas boards> <site>`: the 7 main desktop boards.
2. `build_fvd.mjs <domain js> <site> <sample-data js>`: compiles the tested rules into `fvd.js`
   (compile `packages/domain` and `packages/sample-data` with `tsc --noEmit false --outDir` first).
3. `wire_sim.py`, `wire_ask.py`, `wire_pay.py`, `wire_auth.py`, `wire_lib.py`, `wire_admin.py` on the site:
   simulator, Ask Fin, checkout, sign-in, Library and admin. Each skips boards it already wired.
4. Regenerate the desktop sub-pages, focus flows and pop-ups from the wired phone boards, then
   `build_desktop_more.py <generated boards> <site> <pairs.json>`.
5. `wire_desktop.py <site>`: the desktop article header and desktop Library page.
6. `wire_admin_more.py <site>` (after `wire_admin.py`): staff sign-in, overview, content, article editor,
   question builder, Ask Fin review, AI summary approvals, users and payments, and plans.
7. `wire_emails.py <site>`: Welcome, the sign-in code and receipt emails (in-app previews), and the
   links to them. Desktop boards it touches are patched directly, so run it after step 4.
8. `build_sw.py <site>` last, so the offline cache lists every file.

All learner data stays in the browser (`localStorage`, keys starting `fv.`). Nothing is sent anywhere.

Reviewer shortcuts:
- Sign-in: any 6 digits work; `000000` is a wrong code, `111111` an expired one; 3 wrong codes lock for 15 minutes.
- Admin: open `UASignIn.dc.html`. Use any `@finvora.app` email and any 6 digits (`000000` is wrong; 3
  wrong codes lock for 15 minutes). The staff sign-in lasts until the tab is closed. Published article
  edits, saved daily questions and saved plan prices change what learners see in this browser.
- Emails: the code screen links to the code email, and checkout success links to the receipt.
- Checkout: open Plans with `?outcome=failed`, `slow` or `offline` to see those results; otherwise payments succeed.
