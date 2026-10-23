# Build backlog from the design review

These items came out of the design review of the Stage 1 mockups (14 Oct 2026). Each one says what the mockups now show and what the code phase must do. They sit alongside the week plan in [TECHNICAL_PROPOSAL.md](TECHNICAL_PROPOSAL.md) and the rules in [ux-principles.md](ux-principles.md).

## B1. One plan value drives every locked or unlocked screen

**Mockups:** Ada is a Free user everywhere. Compare and Dividends exist in two versions, *Premium member view* and *Free plan (locked)*, on mobile and desktop. Profile has a Free version (Upgrade) and a Premium version (Your plan, next payment, switch to yearly, cancel).

**Code:**
- The user record has one `plan` field (`free` | `premium`). No screen decides its own tier.
- A single `<PremiumGate>` component wraps premium content. Free users see the content blurred behind a lock card with "See Premium plans". It is not hidden, so they can see what they would get.
- The three test accounts (free, premium, admin) must each show the matching state on every screen.
- Profile shows the plan section only for Premium users, and shows Upgrade for Free users.

## B2. Empty, no-results, offline and error states

**Mockups:** these are on the *States* row of the canvas, on mobile, with one desktop example:

| State | Screen | Main action |
|---|---|---|
| Empty watchlist | Watchlist | Add companies (+ 3 suggestions) |
| No search results | Companies search | "Did you mean…" + popular searches |
| Empty portfolio (new user) | Simulator | Find a company |
| Empty chat (first visit) | Ask AI | 4 starter questions |
| Offline | Any screen (Home shown) | Retry; trading disabled |
| Error | Company page + failed AI answer | Try again / go back |

**Code:**
- Shared components: `<EmptyState>`, `<OfflineBanner>`, `<ErrorCard>`. Every list, search and data screen uses them, not one-off markup.
- Offline: cache the last good data and show it read-only with the time it was saved. Disable trades and AI questions while offline.
- Errors never show stack traces. Show a short code for support, such as `F-503`. A failed AI answer does not count against the daily free limit.
- Each state needs a test (component test or Playwright) so it can't silently break.

## B3. Glass effects must not slow down budget phones

**Mockups:** unchanged, except that Profile's "Reduce motion" setting is now **"Reduce motion & effects"**.

**Code:**
- Define a solid version of every glass token: `--surface-glass` and `--surface-solid`, per theme.
- Use the solid version when any of these is true:
  - the browser lacks `backdrop-filter` (`@supports not (backdrop-filter: blur(1px))`);
  - the user prefers reduced transparency or reduced motion;
  - the device looks low-end (`navigator.deviceMemory <= 2` or `hardwareConcurrency <= 4`);
  - the user switches on "Reduce motion & effects".
- Set a `data-effects="reduced"` attribute on `<html>` once at startup, and let CSS do the rest.
- **Performance check before each demo:** Chrome DevTools with 6× CPU slowdown on a mid-range Android profile. Scrolling Home, Companies and Portfolio should stay smooth (no long frames over 50 ms in a 5-second scroll). Test on one real budget Android phone (Tecno or Infinix) if one is available.

## B4. Light mode uses the hand-tuned token set

**Mockups:** light mode was retuned:
- page background `#F5F2EE` with a softer tint;
- glass cards with a faint dark edge (`rgba(23,21,18,.08)`) and a two-layer soft shadow, so cards no longer blend into the page.

**Code:**
- Light and dark are two sets of CSS variables (`[data-theme="light"]` / `[data-theme="dark"]`), with System following the device.
- Take the values from the light mockups, not by inverting dark.
- Check contrast against WCAG 2.1 AA with an automated tool (axe in Playwright) on every screen in both themes:
  - body and muted text 4.5:1;
  - large text and icons 3:1.
- Charts use the theme tokens for gain, loss, accent and the teal portfolio colour.

## B5. Payments (Stage 2, Paystack)

Agreed with the client lead on 23 Oct 2026. Sources: the patterns follow the [Fintech Engineering Handbook](https://handbook.fintechengineer.io/) chapters *The External World* and *Executing Money Flows*. Paystack-specific behaviour below is **unverified**: it is from memory and must be checked against Paystack's current docs before building.

### The core rule: a failed response is never a failed payment

A payment attempt has exactly three states:

| State | Meaning | User sees | Premium |
|---|---|---|---|
| **Pending** | Anything that isn't a confirmed final answer: network errors, timeouts, 5xx, malformed replies, a closed app, a decline seen only in the browser, an unverified webhook | "Checking your payment. Don't pay again." | Locked |
| **Confirmed success** | Our **server** asked Paystack directly (verify API) and got a final success | "Payment confirmed" | Unlocked, once |
| **Confirmed failed** | Our **server** asked Paystack directly and got a final failed status | "Payment didn't go through. You weren't charged." + Try again | Locked |

- Pending always resolves. Re-check with backoff; the webhook triggers another check; nightly reconciliation against Paystack's records settles anything left.
- Even "confirmed failed" can be overturned. If reconciliation finds the money was taken, unlock (or refund) and tell the user.
- Map every Paystack status to one of the three states from their docs. **Any status we don't recognise is pending, never failed.**
- Never unlock from the browser's word or from a webhook body alone.

### Retries are never a new purchase

- **Order vs attempt.** Choosing a plan creates one **order** (internal ID, plan, amount, user). Each try at charging is an **attempt** linked to that order. A retry is a new attempt on the same order.
- **No retry while an attempt is pending.** The pay button is replaced by "Checking your payment…" until that attempt resolves.
- **A new attempt only after the previous one is confirmed failed.**
- **Each attempt gets its own Paystack reference** (unverified: Paystack is believed to require unique references), all pointing back to the one order.
- **The order completes once.** The first confirmed successful attempt marks it paid. If a second attempt also succeeds, refund it automatically and email the user.
- Reconciliation checks **every** attempt on an order, not just the latest.
- A user who comes back after a confirmed payment sees "You're already Premium", not a payment page.

### Webhooks

- Verify the signature over the **raw** request bytes.
- Store the raw payload before processing, then return 2xx fast and process asynchronously.
- Deduplicate (the same event will arrive more than once) and don't assume order.
- Use the webhook only as a trigger to verify with Paystack's API.

### Other failure cases

- **Hard declines** (insufficient funds, blocked card): don't auto-retry the same card. Offer another card, bank transfer or USSD, keeping the chosen plan.
- **Renewal fails:** grace period (length is a **client decision**; 3–7 days suggested), banner + email, a couple of retries, then downgrade to Free. Keep all user data; only Premium tools lock.
- **Paystack down:** "Payments are temporarily unavailable. Nothing was charged." Free features keep working. A second provider is not planned for launch (judgement; revisit if outages matter).
- **Refunds and chargebacks:** recorded as new entries, never edits. On a chargeback, downgrade and keep the record. Capture evidence at payment time (time, plan, receipt email, Paystack reference).

### Always

- Every attempt and outcome is logged against its order.
- Admin portal can look up payments by email or reference.
- Never store card numbers; Paystack holds them.
- Tests: duplicate webhooks, out-of-order webhooks, timeouts, a late success after a confirmed failure, and two concurrent attempts on one order.

### Mockups needed before client review

Three checkout states, mobile and desktop, dark and light: **Checking your payment**, **Payment confirmed**, **Payment didn't go through**. There is no screen that says "failed" because of an error. PRD §4 asks for error states on supporting interactions.

## B6. From the Fintech Engineering Handbook

Checked against the handbook text, 22 Oct 2026. The handbook is community-written and US-focused. Use it for engineering patterns, not for facts or Nigerian rules. One factual error was found: it says the ex-date is one business day before the record date under T+1. That was true under T+2; since the US moved to T+1 in May 2024 they are normally the same day (my knowledge, not checked against an official source).

- **Money in JSON:** send amounts as integer kobo (or strings), never bare decimals.
- **Rounding:** explicit, at the edges only (storing or display), with a written rule per calculation. Never mint or lose a kobo.
- **Simulator ledger:** derive cash and holdings from the list of trades instead of storing and editing balances. (Judgement: cheap and fits Stage 1.)
- **Property-based tests** on money maths, e.g. "rounding never loses more than 1 kobo" (fast-check for TypeScript, Hypothesis for Python), alongside the golden tests.
- **Not adopting:** Kafka, event sourcing, distributed sagas, Temporal, provider routing. (Judgement: built for real money moving at scale; overkill for Finvora unless it ever moves real money.)

## Open decision

- **Sample-price labelling.** PRD §4.1 says sample prices must be "clearly marked as demo data", but the mockups had that wording removed on request. Options: a small, consistent "Sample prices" label wherever prices show (recommended, judgement) or confirm with the client that no label is wanted.
