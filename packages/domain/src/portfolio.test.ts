import { describe, expect, it } from "vitest";
import { withholding, settleDividends, expectedDividends, dividendYear, incomeByHolding, dividendSustainability, portfolioInsights, SCENARIOS, scenarioPrice, scenarioCut, adviceCheck, DIVIDEND_FACTS, type AccountLite } from "./index";

const acct = (): AccountLite => ({ cashKobo: 5_000_000, holdings: [{ ticker: "ZENITHBANK", quantity: 500, costBasisKobo: 2_300_000 }, { ticker: "GTCO", quantity: 300, costBasisKobo: 1_700_000 }],
  trades: [{ ticker: "ZENITHBANK", side: "buy", quantity: 500, day: 5 }, { ticker: "GTCO", side: "buy", quantity: 300, day: 5 }] });

describe("dividends", () => {
  it("takes 10% tax once, in kobo", () => { expect(withholding(100_000)).toEqual({ grossKobo: 100_000, taxKobo: 10_000, netKobo: 90_000 }); expect(withholding(105)).toEqual({ grossKobo: 105, taxKobo: 11, netKobo: 94 }); });
  it("credits cash with exactly the expected net amount: tax is not taken twice", () => {
    const a = acct(), exp = expectedDividends(a, 25, 63);
    const z = exp.items.find((i) => i.ticker === "ZENITHBANK")!; expect(z.grossKobo).toBe(500 * 200); expect(z.netKobo).toBe(90_000);
    const { account, credited } = settleDividends(a, z.payDay);
    const paid = credited.find((c) => c.ticker === "ZENITHBANK")!;
    expect(paid.netKobo).toBe(z.netKobo);
    expect(account.cashKobo - a.cashKobo).toBe(credited.reduce((s, c) => s + c.netKobo, 0));
    expect(settleDividends(account, z.payDay).credited).toHaveLength(0); // once only
  });
  it("uses the shares held on the qualification day", () => {
    const a = acct(); a.trades.push({ ticker: "ZENITHBANK", side: "sell", quantity: 500, day: 21 }); a.holdings = a.holdings.filter((h) => h.ticker !== "ZENITHBANK");
    const z = expectedDividends(a, 25, 63).items.find((i) => i.ticker === "ZENITHBANK")!; expect(z.shares).toBe(500); expect(z.qualified).toBe(true);
  });
  it("received plus still expected makes the year's total", () => { const { account } = settleDividends(acct(), 120); const y = dividendYear(account, 120); expect(y.totalKobo).toBe(y.receivedKobo + y.stillExpectedKobo); expect(y.receivedKobo).toBeGreaterThan(0); });
  it("ranks holdings by income", () => { const r = incomeByHolding(acct(), 0); expect(r.rows[0]!.ticker).toBe("ZENITHBANK"); expect(r.rows.reduce((s, x) => s + x.netKobo, 0)).toBe(r.totalKobo); });
  it("explains sustainability with figures", () => { const s = dividendSustainability("NESTLE")!; expect(s.payoutPct).toBe(125); expect(s.level).toBe("Hard to keep up"); expect(dividendSustainability("ZENITHBANK")!.level).toBe("Well covered"); });
});

describe("scenarios", () => {
  it("move prices by sector and leave the real account alone", () => {
    const crash = SCENARIOS.find((s) => s.id === "crash")!, a = acct(), before = JSON.stringify(a);
    expect(scenarioPrice(10_000, "Banking", crash)).toBe(6_500); expect(scenarioPrice(10_000, "Banking", null)).toBe(10_000);
    expectedDividends(a, 0, 250, (t) => scenarioCut(crash, "Banking")); expect(JSON.stringify(a)).toBe(before);
  });
  it("dividend cuts lower expected income", () => { const crash = SCENARIOS[0]!; expect(expectedDividends(acct(), 0, 250, () => scenarioCut(crash, "Banking")).netKobo).toBeLessThan(expectedDividends(acct(), 0, 250).netKobo); });
  it("never cuts a payment already qualified for", () => {
    const a = acct(), full = expectedDividends(a, 25, 63).items.find((i) => i.ticker === "ZENITHBANK")!, cut = expectedDividends(a, 25, 63, () => 5000).items.find((i) => i.ticker === "ZENITHBANK")!;
    expect(full.qualified).toBe(true); expect(cut.netKobo).toBe(full.netKobo);
    const later = expectedDividends(a, 0, 250, () => 5000).items.find((i) => i.ticker === "ZENITHBANK" && !i.qualified)!; expect(later.perShareKobo).toBe(100);
  });
  it("covers the four events the client asked for", () => expect(SCENARIOS.map((s) => s.id)).toEqual(["crash", "inflation", "naira", "rates"]));
});

describe("insights", () => {
  it("names concentration, income dependence and the main driver from the holdings", () => {
    const pos = [{ ticker: "ZENITHBANK", quantity: 500, valueKobo: 2_400_000, costBasisKobo: 2_300_000, unrealizedPlKobo: 100_000 }, { ticker: "GTCO", quantity: 300, valueKobo: 1_600_000, costBasisKobo: 1_700_000, unrealizedPlKobo: -100_000 - 50_000 }];
    const r = portfolioInsights(pos, 1_000_000, () => "Banking", (t) => t, { totalKobo: 100, rows: [{ ticker: "ZENITHBANK", netKobo: 70, pct: 70 }, { ticker: "GTCO", netKobo: 30, pct: 30 }] });
    expect(r.sectors[0]).toMatchObject({ label: "Banking", pct: 80 }); expect(r.notes.join(" ")).toMatch(/Banking is 80%/); expect(r.notes.join(" ")).toMatch(/ZENITHBANK gives 70%/); expect(r.notes.join(" ")).toMatch(/GTCO is behind most of your loss/);
  });
  it("never uses advice words", () => {
    const text = SCENARIOS.flatMap((s) => [s.story, ...s.lessons]).concat(Object.keys(DIVIDEND_FACTS).flatMap((t) => dividendSustainability(t)!.lines)).join(" ");
    expect(adviceCheck(text)).toEqual([]);
  });
});
