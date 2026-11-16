// Shared break-ui fixtures: demo, worst, one, empty.
const now = Date.now(), day = (n) => new Date(now + 3600000 - n * 86400000).toISOString().slice(0, 10);
function fixture(state) {
  if (state === 'empty') return {};
  const worst = state === 'worst', one = state === 'one';
  const auth = { email: worst ? 'bartholomew.fitzgerald@northwind-industries-holdings.example.com' : one ? 'jo@x.ng' : 'ada@example.com', name: worst ? 'Aleksandra Wiśniewska-Kowalczyk' : one ? 'Jo' : 'Ada Okafor', goal: 'Investing' };
  const orders = [], n = worst ? 12 : 1;
  for (let i = 0; i < n; i++) orders.push({ id: 'ord-' + (100000 + i).toString(36) + 'x' + i, period: 'monthly', amountKobo: 599900, status: 'confirmedSuccess', attempts: 1, createdAt: new Date(now - i * 30 * 86400000).toISOString(), updatedAt: new Date(now - i * 30 * 86400000).toISOString() });
  const bill = { sub: { plan: 'plus', period: 'monthly', renewsOn: day(-30) }, orders };
  const slugs = ['what-is-money', 'inflation', 'saving-vs-investing', 'compound-interest', 'risk-and-return', 'diversification', 'budgeting', 'what-is-a-share', 'stock-exchange', 'dividend', 'price-to-earnings', 'revenue-and-profit', 'treasury-bills', 'market-capitalisation', 'fees-and-costs'];
  const lib = { saved: worst ? slugs : one ? ['price-to-earnings'] : slugs.slice(0, 2), read: {}, recent: [] };
  const plus = { lists: [{ name: 'My watchlist', tickers: worst ? ['MTNN', 'DANGCEM', 'ZENITHBANK', 'GTCO', 'NESTLE', 'AIRTELAFRI', 'SEPLAT', 'NB'] : one ? ['NB'] : ['ZENITHBANK'], notes: {} }], alertBps: 500, seenAlerts: {}, crises: {}, scenarios: {}, run: null };
  const log = [];
  const k = worst ? 60 : one ? 1 : 3;
  for (let i = 0; i < k; i++) log.push({ at: now - i * 3600000 * 9, day: day(Math.floor(i / 3)), kind: ['lesson', 'daily', 'article'][i % 3], title: ['Inflation and purchasing power', 'Daily question', 'Price-to-earnings (P/E) ratio'][i % 3], href: 'UPArticle.dc.html?a=price-to-earnings', xp: 0 });
  const proto = { done: worst ? 6 : one ? 1 : process.env.FV_DONE ? +process.env.FV_DONE : 2, best: [], xp: 0, bossPassed: false, days: [day(0)], run: null, log, misses: {} };
  // Ask history: one very long question and many messages (worst), one message (one).
  const longQ = 'How did Guaranty Trust Holding Company and Zenith Bank compare on dividends, earnings per share and the share price over the last five years, and what does that mean for me?';
  const msgs = []; const m = worst ? 24 : one ? 1 : 2;
  for (let i = 0; i < m; i++) msgs.push({ q: i === m - 1 && worst ? longQ : ['What is a dividend?', 'What is inflation?', 'What is a share?'][i % 3], r: { kind: 'answer', answer: 'A dividend is part of a company\'s profit paid to shareholders.', citations: [{ articleSlug: 'dividend', title: 'Dividend' }], followUps: [] }, at: new Date(now - (m - i) * 60000).toISOString() });
  return { 'fv.ask.v1': { msgs, usage: {} }, 'fv.auth.v1': auth, 'fv.bill.v1': bill, 'fv.lib.v1': lib, 'fv.plus.v1': plus, 'fv.proto.v1': proto };
}
module.exports = fixture;
