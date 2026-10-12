# ADR 0001 — Stage 1 prototype decisions

**Status:** Accepted (2026-10-12)
**Context:** Answers to decisions D1–D10 in [`TECHNICAL_PROPOSAL.md` §12](../TECHNICAL_PROPOSAL.md#12-risks-assumptions-and-decisions-needed).

| # | Decision | Outcome |
|---|---|---|
| D1 | Backend in Stage 1? | **No deployed backend.** The client wants a prototype. The UI talks to a typed `FinvoraApi` interface backed by `MockFinvoraApi` (sample data + `localStorage`). FastAPI implements the same contract in Stage 2. Consequence: demo state is per browser and not shared between reviewers' devices. |
| D2 | Admin Portal in Stage 1? | **Yes.** It is the 18th screen (reports list + upload demo + summary approval mock-up), built in Week 4. |
| D3 | How simulator prices change | **Deterministic market clock** with an "Advance market day" control. Seeded, so demos and tests repeat exactly. |
| D4 | Starting virtual balance | **₦100,000.** This is a realistic first-investment amount for the target audience (young Nigerians) and still buys meaningful positions in most sample companies. Kept as one config value (`SIM_STARTING_CASH_KOBO`). Unlimited resets; history archived. |
| D5 | Trading fees in the simulator | **Yes.** A simplified schedule labelled "approximate", in basis points, with a defined rounding rule. Exact NGX fee components to be confirmed. |
| D6 | Dividends in the historical calculator | **Premium only.** Free users see price return. Premium sees "with dividends". The gate is demonstrated with demo accounts. |
| D7 | Claude or Gemini | Deferred to Stage 2 (bake-off on the golden Q&A set). |
| D8 | Real company names and logos | **Real names, tickers and logos.** See *Logo handling* below. |
| D9 | Account ownership | **The founders provide and own** the hosting, Supabase, provider and GitHub accounts. The developer is added as a member. |
| D10 | Brand | Open. The founder is designing a logo. Colour directions are being explored. The UI is built on design tokens so the chosen palette is a one-file change. |

## Demo accounts (one per role)

The simulated sign-in screen offers one-tap demo accounts. There are no real credentials; any password is accepted for these addresses.

| Role | Email | Shows |
|---|---|---|
| Free user | `free@demo.finvora.test` | AI daily limit, upgrade prompts, Premium previews locked |
| Premium user | `premium@demo.finvora.test` | Comparison tool, deep scan preview, dividends in calculator, downloads |
| Admin | `admin@demo.finvora.test` | Admin Portal: report upload demo, summary approval |

The `.test` top-level domain is reserved (RFC 2606), so these addresses can never belong to a real person.

## Logo handling

- Logo files are stored at `apps/web/public/logos/<TICKER>.svg` (or `.png`). They come from each company's official website or press kit. Every logo's source URL is recorded in `packages/sample-data/logos.json`.
- A monogram fallback (ticker initials) renders whenever a logo is missing, so no layout depends on a logo existing.
- Logos are trademarks of their owners. A footer line on company pages reads: "Company names and logos are trademarks of their respective owners. Finvora is not affiliated with or endorsed by them. Prices shown are demo data."
- **Before production:** confirm the logo source and usage rights, for example whether the licensed market-data provider supplies logos. This is tracked as a Stage 2 item.

## Addendum (2026-10-12): sign-in and account creation

The PRD lists "Simulated sign-in" and "Simulated account creation" as two screens. The prototype merges them into one passwordless flow (email, then a 6-digit code) followed by a single setup question. This follows the fewer-taps rule in [`docs/ux-principles.md`](../ux-principles.md), and both PRD journeys are still covered. This deviation is flagged to the client; a separate "Create account" screen can be added if they prefer.
