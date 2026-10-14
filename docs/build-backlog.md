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
