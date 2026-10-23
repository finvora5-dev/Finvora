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

## B7. Duplicate detection, status verification and reconciliation (Stage 2)

Patterns from the handbook (*The External World*, *Executing Money Flows*, *Observability*). Table design, job timings and thresholds are **judgement and starting values, untested**. Paystack API details are **unverified**.

### Spotting duplicates

**Prevent (database-enforced):**
- `orders`: at most one **open** order per user per plan (partial unique index).
- `payment_attempts`: unique `paystack_reference`; at most one **pending** attempt per order. "No retry while pending" is enforced by the database, not just the button.
- `webhook_events`: unique on Paystack's event ID (or a hash of the raw body). A redelivery hits the constraint and is skipped.
- Unlocking Premium is one conditional update (`… WHERE status = 'open'`), so two workers can't both unlock.

**Detect (every few minutes):**
- 2+ successful attempts on one order.
- 2+ successful payments by one user for the same plan and amount within ~10 minutes, across orders.
- Matches go to the **Duplicates** queue and trigger an automatic refund of the extra charge, recorded as a new entry.

### Verifying the real status

- One function, `verifyAttempt(reference)`, calls Paystack's verify endpoint from our server and maps the reply to `pending | succeeded | failed` using one tested mapping table. Unknown status, error or timeout returns `pending`.
- Called by: checkout return, every webhook, the polling job and the admin "Re-check" button. **Nothing else changes an attempt's state.**
- Every check is stored (time, raw response, state before and after), giving each attempt a full history.
- Sanity checks: amount, currency (NGN), reference and customer email must match what we created. A mismatch stays pending and raises an alert.

### Reconciling delays

- **Polling:** pending attempts re-checked at roughly 30s, 2m, 10m, 1h, 6h. After ~24h still pending, they go to the **Stuck payments** queue and the user gets "We're still confirming your payment".
- **Nightly reconciliation:** pull the previous day's Paystack transactions, match by reference, and store a report (counts, match rate, every break).

  | Case | Action |
  |---|---|
  | Match, same status | OK |
  | Paystack succeeded, ours pending or failed | Mark succeeded, unlock or refund if already paid, email the user, alert |
  | Paystack failed, ours succeeded | Lock Premium, investigate, alert immediately |
  | In Paystack, not in our DB | Unknown payment: investigate |
  | Ours succeeded, missing in Paystack | Investigate |

- **Match rate is tracked as an objective** (target 100%). The handbook recommends tracking reconciliation match rate as an SLO.
- **Later:** check Paystack payouts to the bank against successful payments minus fees and refunds.

### Team tools and alerts

- **Admin › Payments:** search by email, order or reference; the attempt timeline with raw payloads; "Re-check with Paystack"; "Refund extra charge", which needs a second admin to approve (maker-checker). Queues: Duplicates, Stuck, Reconciliation breaks.
- **Alerts:** any reconciliation break; match rate below 100%; pending older than 1h above a small threshold; webhook signature failures; any duplicate success.
- Order ID and reference on every log line.

### Tests

Using a fake Paystack plus Paystack test mode:
- the same webhook twice;
- webhooks out of order;
- a verify timeout;
- a late success after a confirmed failure;
- two attempts racing on one order;
- an amount mismatch;
- an unknown status;
- the nightly job with one planted break of each kind.

Scale (judgement): a few tables, three background jobs and one admin page. No Kafka or Temporal.

## B8. Other handbook patterns to adopt

Each item cites the handbook chapter it comes from; applying it to Finvora is **judgement** unless stated. Checked against the handbook text on 23 Oct 2026.

### Security and access (*Security Model*, *Controls & Access*)
- **Row-level security in Postgres/Supabase.** Users can only read their own rows, even if the API has a bug. The browser and API use an RLS-enforced connection; background jobs use a separate privileged role.
- **Deny by default.** Every API route declares which roles may use it. A route with no declaration is blocked.
- **Least privilege** for every service key (AI, email, Paystack, storage), scoped to what that job needs.
- **Never log:** passwords, tokens, API keys, full card or bank numbers, or raw personal data.
- **Correlation ID** on every request, carried through jobs and logs.
- **Maker-checker** for sensitive admin actions: publishing AI summaries (already in the mockups), refunds, changing a user's plan, deleting data.
- **Break-glass access:** emergency admin access is granted by someone else, logged *before* use, and expires automatically, with a review afterwards.

### Change trail (*Controls & Access*)
- Protected main branch, required review and required CI checks; nobody merges their own money or sign-in code without review.
- Decision records in `docs/adr/` (already in place).
- Each deployment is traceable to a commit and a pull request.

### Audit and data protection (*Auditability*)
- Audit records are append-only. Fix mistakes with a new entry; never edit or delete the original.
- **Keep financial and audit records apart from personal data,** linked by an opaque user ID. Then a deletion request (an NDPA right, to be confirmed by the lawyer) can remove personal data without breaking payment records.
- The handbook says financial records typically must be kept 5–7 years. **The Nigerian retention period must be confirmed by a lawyer.**

### Observability (*Observability*)
- **One canonical log line per boundary:** each API request, each Paystack call and each webhook received, with correlation ID, user, operation, amount, outcome and latency, in a defined schema.
- Alerts are tied to financial impact (a reconciliation break beats a slow page), and alert on error-rate trends rather than single errors.

### Incidents (*Incident Response*)
- **Severity includes money at risk.** A double charge or a reconciliation drift is high severity even if the site looks healthy.
- **A payments "off switch":** pause checkout and renewals while keeping the rest of the app working.
- **A premortem before launching payments:** imagine it failed badly, then list the missing alerts, safeguards and tests as launch blockers.
- Blameless postmortems for any incident that touches money.

### API design (*API Design for Financial Products*)
- **Structured errors** with `type`, `code`, `message`, `retryable`, `suggested_action` and `request_id`, so the app shows the right message and knows whether a retry is safe.
- Correct HTTP status codes, and additive-only changes to the API.
- Idempotency keys on any request that creates an order or attempt.
- Rate limits on AI questions and checkout.

### Testing (*Testing Patterns*)
- **Contract tests against Paystack's API shape,** to catch it if Paystack changes their responses.
- **Crash-and-resume tests** for the payment flow: crash after each step, resume, and check there's no double charge and nothing is stuck.
- Golden tests for the simulator and calculator, and property-based tests for money maths (already listed in B6).

### Market data (*Investments and Securities*)
- Label which price each screen uses. Finvora uses **end-of-day closing prices** for values, and must say so ("Prices at 12 Oct close"; the mockups already do this).
- When real data arrives, store each price with its source and timestamp, and validate impossible values (negative or zero prices, big jumps) before showing them (*Core Tenets: No Trust*).
- Corporate actions (dividends, bonus issues, splits) must adjust historical prices in the calculator; the data provider must supply them.

### Not adopting (judgement)
US payment rails and regulation (ACH, Fedwire, Reg E, NACHA), lending, custody, settlement and tax lots, blockchain, Kafka, event sourcing, sagas, Temporal, provider routing. Finvora moves no money between users and holds no assets.

## Open decision

- **Sample-price labelling.** PRD §4.1 says sample prices must be "clearly marked as demo data", but the mockups had that wording removed on request. Options: a small, consistent "Sample prices" label wherever prices show (recommended, judgement) or confirm with the client that no label is wanted.
