// Companies: real names and tickers (ADR 0001 D8) with plain-language descriptions only.
// No real financial figures are stated. Every price in the app is synthetic "Demo data".
// Simulator companies are made up (build plan §10 #5), so no real price is ever implied.

export interface Company {
  ticker: string;
  name: string;
  sector: string;
  exchange: "NGX";
  about: string;
  howItMakesMoney: string;
  learnSlugs: string[];
  /** Seed for synthetic demo prices, kobo. Not a real price. */
  demoBasePriceKobo: number;
  paysDividends: boolean;
}

export const COMPANIES: Company[] = [
  { ticker: "MTNN", name: "MTN Nigeria", sector: "Telecoms", exchange: "NGX", about: "A mobile network company offering calls, data and mobile money services.", howItMakesMoney: "Mostly from people paying for airtime and data, plus fintech and other digital services.", learnSlugs: ["revenue-and-profit", "dividend"], demoBasePriceKobo: 22000_00, paysDividends: true },
  { ticker: "DANGCEM", name: "Dangote Cement", sector: "Industrial goods", exchange: "NGX", about: "A cement maker with plants in Nigeria and other African countries.", howItMakesMoney: "Selling cement to builders, governments and distributors.", learnSlugs: ["market-capitalisation", "revenue-and-profit"], demoBasePriceKobo: 45000_00, paysDividends: true },
  { ticker: "ZENITHBANK", name: "Zenith Bank", sector: "Banking", exchange: "NGX", about: "A commercial bank serving individuals and businesses.", howItMakesMoney: "Interest on loans, plus fees for transfers, cards and other services.", learnSlugs: ["price-to-earnings", "dividend"], demoBasePriceKobo: 4500_00, paysDividends: true },
  { ticker: "GTCO", name: "Guaranty Trust Holding Co.", sector: "Banking", exchange: "NGX", about: "A financial group whose main business is GTBank.", howItMakesMoney: "Interest on loans and fees on banking services.", learnSlugs: ["price-to-earnings"], demoBasePriceKobo: 5500_00, paysDividends: true },
  { ticker: "NESTLE", name: "Nestlé Nigeria", sector: "Consumer goods", exchange: "NGX", about: "Makes food and drinks sold across Nigeria.", howItMakesMoney: "Selling packaged foods and beverages through shops and distributors.", learnSlugs: ["revenue-and-profit"], demoBasePriceKobo: 90000_00, paysDividends: true },
  { ticker: "AIRTELAFRI", name: "Airtel Africa", sector: "Telecoms", exchange: "NGX", about: "A mobile network operator in several African countries.", howItMakesMoney: "Airtime, data and mobile money across its markets.", learnSlugs: ["diversification"], demoBasePriceKobo: 200000_00, paysDividends: true },
  { ticker: "SEPLAT", name: "Seplat Energy", sector: "Oil and gas", exchange: "NGX", about: "An energy company producing oil and gas in Nigeria.", howItMakesMoney: "Selling crude oil and natural gas.", learnSlugs: ["risk-and-return"], demoBasePriceKobo: 500000_00, paysDividends: true },
  { ticker: "NB", name: "Nigerian Breweries", sector: "Consumer goods", exchange: "NGX", about: "Brews and sells beers and soft drinks.", howItMakesMoney: "Selling drinks through distributors, bars and shops.", learnSlugs: ["revenue-and-profit"], demoBasePriceKobo: 3500_00, paysDividends: true },
];

export interface SimCompany {
  ticker: string;
  name: string;
  sector: string;
  blurb: string;
  basePriceKobo: number;
  volatility: number;
  learnSlug: string;
}

export const SIM_COMPANIES: SimCompany[] = [
  { ticker: "LGFD", name: "Lagoon Foods", sector: "Consumer goods", blurb: "A made-up food company that sells noodles and snacks.", basePriceKobo: 1250_00, volatility: 0.015, learnSlug: "revenue-and-profit" },
  { ticker: "SVNT", name: "Savanna Telecom", sector: "Telecoms", blurb: "A made-up mobile network selling data bundles.", basePriceKobo: 3400_00, volatility: 0.018, learnSlug: "dividend" },
  { ticker: "OKBK", name: "Okeke Bank", sector: "Banking", blurb: "A made-up bank that earns interest on loans.", basePriceKobo: 820_00, volatility: 0.022, learnSlug: "price-to-earnings" },
  { ticker: "NSOL", name: "NaijaSol Power", sector: "Energy", blurb: "A made-up solar company. Its price moves more than most.", basePriceKobo: 560_00, volatility: 0.035, learnSlug: "risk-and-return" },
  { ticker: "ARWC", name: "Arewa Cement", sector: "Industrial goods", blurb: "A made-up cement maker.", basePriceKobo: 2900_00, volatility: 0.012, learnSlug: "market-capitalisation" },
  { ticker: "DLTA", name: "Delta Logistics", sector: "Services", blurb: "A made-up delivery company.", basePriceKobo: 410_00, volatility: 0.028, learnSlug: "diversification" },
];

/** Short names learners type, for Ask Fin (design Part 3). Kept specific so ordinary words don't match. */
export const ASK_ALIASES: Record<string, string[]> = {
  MTNN: ["MTN"], DANGCEM: ["Dangote"], ZENITHBANK: ["Zenith"], GTCO: ["GTBank", "GT Bank", "GTB", "Guaranty Trust"], NESTLE: ["Nestle"],
  AIRTELAFRI: ["Airtel"], SEPLAT: ["Seplat"], NB: [],
  LGFD: ["Lagoon"], SVNT: ["Savanna"], OKBK: ["Okeke"], NSOL: ["NaijaSol"], ARWC: ["Arewa"], DLTA: [],
};

/** Both company lists in the shape Ask Fin reads. */
export function askCompanies(): import("@finvora/domain").AskCompany[] {
  return [
    ...COMPANIES.map((c) => ({ name: c.name, ticker: c.ticker, askAliases: ASK_ALIASES[c.ticker] || [], about: c.about, howItMakesMoney: c.howItMakesMoney, slug: c.learnSlugs[0], madeUp: false })),
    ...SIM_COMPANIES.map((c) => ({ name: c.name, ticker: c.ticker, askAliases: ASK_ALIASES[c.ticker] || [], about: c.blurb, slug: c.learnSlug, madeUp: true })),
  ];
}
