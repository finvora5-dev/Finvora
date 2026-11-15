import type { PracticeCompany } from "@finvora/domain";

// The Practice Market's made-up companies (design Part 4). One list for every screen and for Ask Fin.
// Prices come from the seeded price series; yearly figures are written by hand. All money in kobo.
const BN = 100_000_000_000; // ₦1 billion in kobo

export const PRACTICE_COMPANIES: PracticeCompany[] = [
  { ticker: "ADF", name: "Adire Foods", sector: "Food", label: "Food and drink", basePriceKobo: 3000, color: "#5B21B6", payDay: 120,
    about: "A made-up food and drink company that sells packaged snacks and drinks.", sharesInIssue: 1_000_000_000, learnSlug: "revenue-and-profit",
    years: [
      { year: 2021, revenueKobo: 18 * BN, profitKobo: 2.0 * BN, dividendPerShareKobo: 120, debtKobo: 6 * BN, equityKobo: 13 * BN },
      { year: 2022, revenueKobo: 20 * BN, profitKobo: 2.2 * BN, dividendPerShareKobo: 130, debtKobo: 6 * BN, equityKobo: 14 * BN },
      { year: 2023, revenueKobo: 22 * BN, profitKobo: 2.5 * BN, dividendPerShareKobo: 140, debtKobo: 6 * BN, equityKobo: 14 * BN },
      { year: 2024, revenueKobo: 25 * BN, profitKobo: 2.8 * BN, dividendPerShareKobo: 150, debtKobo: 6 * BN, equityKobo: 15 * BN },
      { year: 2025, revenueKobo: 27 * BN, profitKobo: 3.1 * BN, dividendPerShareKobo: 150, debtKobo: 6 * BN, equityKobo: 15 * BN },
    ] },
  { ticker: "KSP", name: "Kola Solar Power", sector: "Energy", label: "Energy", basePriceKobo: 12450, color: "#0FA394", payDay: 0,
    about: "A made-up solar energy company that builds and runs solar farms.", sharesInIssue: 400_000_000, learnSlug: "risk-and-return",
    years: [
      { year: 2021, revenueKobo: 4 * BN, profitKobo: -1.0 * BN, dividendPerShareKobo: 0, debtKobo: 18 * BN, equityKobo: 8 * BN },
      { year: 2022, revenueKobo: 6 * BN, profitKobo: -0.4 * BN, dividendPerShareKobo: 0, debtKobo: 19 * BN, equityKobo: 8 * BN },
      { year: 2023, revenueKobo: 9 * BN, profitKobo: 0.8 * BN, dividendPerShareKobo: 0, debtKobo: 20 * BN, equityKobo: 9 * BN },
      { year: 2024, revenueKobo: 12 * BN, profitKobo: 1.6 * BN, dividendPerShareKobo: 0, debtKobo: 20 * BN, equityKobo: 10 * BN },
      { year: 2025, revenueKobo: 15 * BN, profitKobo: 2.4 * BN, dividendPerShareKobo: 0, debtKobo: 20 * BN, equityKobo: 10 * BN },
    ] },
  { ticker: "NTB", name: "Nupe Trust Bank", sector: "Banking", label: "Banking", basePriceKobo: 5620, color: "#7B4AF0", payDay: 90,
    about: "A made-up bank that earns interest on loans and fees on transfers and cards.", sharesInIssue: 2_000_000_000, learnSlug: "price-to-earnings",
    years: [
      { year: 2021, revenueKobo: 60 * BN, profitKobo: 10 * BN, dividendPerShareKobo: 200, debtKobo: 380 * BN, equityKobo: 70 * BN },
      { year: 2022, revenueKobo: 66 * BN, profitKobo: 11 * BN, dividendPerShareKobo: 220, debtKobo: 390 * BN, equityKobo: 74 * BN },
      { year: 2023, revenueKobo: 74 * BN, profitKobo: 12 * BN, dividendPerShareKobo: 250, debtKobo: 395 * BN, equityKobo: 77 * BN },
      { year: 2024, revenueKobo: 82 * BN, profitKobo: 13 * BN, dividendPerShareKobo: 280, debtKobo: 400 * BN, equityKobo: 79 * BN },
      { year: 2025, revenueKobo: 90 * BN, profitKobo: 14 * BN, dividendPerShareKobo: 300, debtKobo: 400 * BN, equityKobo: 80 * BN },
    ] },
  { ticker: "OKM", name: "Okeke Motors", sector: "Transport", label: "Transport", basePriceKobo: 8100, color: "#E8361C", payDay: 200,
    about: "A made-up company that assembles and sells buses and motorcycles.", sharesInIssue: 500_000_000, learnSlug: "revenue-and-profit",
    years: [
      { year: 2021, revenueKobo: 30 * BN, profitKobo: 2.2 * BN, dividendPerShareKobo: 150, debtKobo: 12 * BN, equityKobo: 18 * BN },
      { year: 2022, revenueKobo: 28 * BN, profitKobo: 1.5 * BN, dividendPerShareKobo: 120, debtKobo: 13 * BN, equityKobo: 18 * BN },
      { year: 2023, revenueKobo: 33 * BN, profitKobo: 2.6 * BN, dividendPerShareKobo: 160, debtKobo: 12 * BN, equityKobo: 19 * BN },
      { year: 2024, revenueKobo: 36 * BN, profitKobo: 3.0 * BN, dividendPerShareKobo: 180, debtKobo: 12 * BN, equityKobo: 20 * BN },
      { year: 2025, revenueKobo: 40 * BN, profitKobo: 3.4 * BN, dividendPerShareKobo: 200, debtKobo: 12 * BN, equityKobo: 20 * BN },
    ] },
  { ticker: "ZLT", name: "Zuri Telecom", sector: "Telecoms", label: "Telecoms", basePriceKobo: 2275, color: "#4C1D95", payDay: 0,
    about: "A made-up mobile network that sells airtime and data bundles.", sharesInIssue: 3_000_000_000, learnSlug: "dividend",
    years: [
      { year: 2021, revenueKobo: 25 * BN, profitKobo: 1.5 * BN, dividendPerShareKobo: 0, debtKobo: 28 * BN, equityKobo: 22 * BN },
      { year: 2022, revenueKobo: 29 * BN, profitKobo: 2.0 * BN, dividendPerShareKobo: 0, debtKobo: 29 * BN, equityKobo: 23 * BN },
      { year: 2023, revenueKobo: 33 * BN, profitKobo: 2.4 * BN, dividendPerShareKobo: 0, debtKobo: 30 * BN, equityKobo: 24 * BN },
      { year: 2024, revenueKobo: 38 * BN, profitKobo: 2.9 * BN, dividendPerShareKobo: 0, debtKobo: 30 * BN, equityKobo: 25 * BN },
      { year: 2025, revenueKobo: 44 * BN, profitKobo: 3.4 * BN, dividendPerShareKobo: 0, debtKobo: 30 * BN, equityKobo: 25 * BN },
    ] },
];
