# Plus (Premium) features: client's list

**Decided 9 Nov 2026:** see D6 in [open-questions.md](open-questions.md). **Status:** received 8 Nov 2026 from the client, through the user. Not designed or built yet. This changes the Plus scope, so it needs an EGM design (brainstorm, draft, review) and the user's approval before any build.

## The client's list (as given)

Added to the existing Plus features:

- **Advanced company analysis**
  - Historical comparisons
- **Investment Intelligence**
  - Finvora Risk Signals
  - Dividend and Cash Flow Tracker
  - Advanced watchlists
  - Portfolio intelligence
- **Financial Education**
  - Market Crisis Simulator
  - Interactive financial scenarios

## Plus today (from the designs and open question #4)

All Worlds and Boss challenges, unlimited Ask Fin, the full simulator, offline lessons, Compare, dividend history, deep report scans and PDF summaries.

## First read: Phase 1 or Phase 2 (judgement, not yet reviewed)

| Feature | Needs real company data? | Prototype (Phase 1) possible with made-up data? |
|---|---|---|
| Historical comparisons | Yes (multi-year figures) | Yes, on the simulator's made-up companies |
| Finvora Risk Signals | Yes | Only as a labelled illustration; see the advice risk below |
| Dividend and Cash Flow Tracker | Yes (dividend history, cash flow) | Yes, for made-up companies and the learner's simulator holdings |
| Advanced watchlists | Prices and alerts | Yes (groups, notes, price-move alerts on made-up prices) |
| Portfolio intelligence | No, it uses the learner's virtual portfolio | Yes |
| Market Crisis Simulator | No (scripted historical-style scenarios) | Yes |
| Interactive financial scenarios | No | Yes (extends the lesson scenario step) |

## Points to settle in the design

1. **Education, not advice.** "Risk Signals" and "Investment Intelligence" can read as telling people what to buy or sell. That conflicts with Finvora's rule and may matter for SEC Nigeria (open Phase 2 legal question). Proposed framing: signals explain *why* a measure matters, never rate a share as good or bad.
2. **Names.** "Investment Intelligence" may promise more than an education app should. Consider names that keep the learning framing.
3. **Data.** Real figures need the market-data provider (a Phase 2 question). The prototype would use made-up companies and label them.
4. **Scope for Phase 1.** Which of these the client wants to see in the prototype, and which can wait for Phase 2.
