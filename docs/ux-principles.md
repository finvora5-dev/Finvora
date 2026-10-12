# Finvora UX principles

**Goal:** smart, calm, few taps. Many of our users are new to investing and use mid-range Android phones. Every screen should reduce effort and anxiety, never add to it.

These rules apply to every screen in the prototype and in production. Reviews check new screens against them.

## 1. One clear next step
- Each screen has **one primary action**. It is saffron, sits at the bottom in thumb reach, and stays visible (sticky) when the screen scrolls.
- The Home screen leads with a single **"Next for you"** card (resume a lesson, review a trade, finish setup) instead of a menu of options.

## 2. Fewer taps
| Task | Target |
|---|---|
| Buy a share from a company page | 2 taps: **Trade** → **Confirm** |
| Add or remove a company from the watchlist | 1 tap, from any list or page |
| Ask the AI about what's on screen | 1 tap: a context chip opens the answer in a sheet |
| Resume learning | 1 tap from Home |
| Sign in (returning user) | Email, then a 6-digit code. No passwords to remember |

- **Quick tasks use bottom sheets** (trade, AI answer, filters), so the user keeps their place.
- **Actions sit inline** in lists: Watch and Buy without opening a detail page first.
- **Search is universal:** one field finds companies and lessons, and offers "Ask AI".

## 3. Smart defaults
- **Amount first:** people think in naira, not share counts. The trade sheet asks "How much?" with ₦1k / ₦5k / ₦10k / Max chips and works out whole shares, fees and leftover cash automatically. Switching to "Shares" is still available.
- **Calculators update live.** There are no "Calculate" buttons, and presets (1 year, 3 years, ₦10k, ₦50k) cover common questions.
- **Remember choices:** last filter, sort, chart range, trade amount and theme.
- **Infer, then confirm:** the Admin upload reads company and period from the file name and pre-fills them for the admin to confirm.

## 4. Less stress
- **Plain language first, jargon second:** "You're up ₦4,320 since you started", not "Unrealised P/L +4.32%". Every metric carries a one-line meaning ("P/E 4.0 · cheaper than most banks").
- **Undo over confirm:** reversible actions (watchlist, settings) happen at once and show **Undo**. Only trades get a confirmation, and it is a single clear step with the full cost shown.
- **Safety is always visible:** "Virtual money" and "Demo data" labels sit near every price and balance, so nobody worries that real money is involved.
- **No guilt mechanics:** no streak-loss warnings, no red badges for missed days, no countdowns. Limits (for example AI questions) are shown calmly, with what happens next.
- **Errors explain the fix:** "You can buy up to 404 shares", not just "Insufficient funds". Blocked buttons say why.
- **Progressive disclosure:** show the three numbers that matter, with "More details" for the rest.

## 5. Context-aware AI
- AI chips change with the screen: on a company page, "Is this company profitable?" or "Explain its P/E"; on a lesson, "Explain simpler" or "Give a Nigerian example".
- Answers open in a sheet over the current screen, with sources, "Explain simpler" and "Ask a follow-up".
- AI never tells users what to buy or sell.

## 6. Comfortable on any phone
- Tap targets are at least 44 px, and primary buttons are 52 px.
- The main actions are reachable with one thumb.
- Glass effects fall back to solid surfaces on low-power devices and when "reduce transparency" is on.
- Text contrast meets WCAG 2.2 AA. Gains and losses always carry ▲/▼ arrows as well as colour.
