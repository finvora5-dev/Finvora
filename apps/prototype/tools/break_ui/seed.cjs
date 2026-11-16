// Break UI fixtures (skill: break-ui), dev-only. Seeds the browser store through the same boundary the app uses
// (localStorage keys read by fv.js), so screens render worst-case data without touching their markup.
// Usage: node tools/break_ui/seed.cjs <base url> <state: demo|worst|one|empty> <out dir> <boards...>
const { chromium } = require('playwright');
const [B, state, out, ...boards] = process.argv.slice(2);
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
  const proto = { done: worst ? 6 : one ? 1 : 2, best: [], xp: 0, bossPassed: false, days: [day(0)], run: null, log, misses: {} };
  // Ask history: one very long question and many messages (worst), one message (one).
  const longQ = 'How did Guaranty Trust Holding Company and Zenith Bank compare on dividends, earnings per share and the share price over the last five years, and what does that mean for me?';
  const msgs = []; const m = worst ? 24 : one ? 1 : 2;
  for (let i = 0; i < m; i++) msgs.push({ q: i === m - 1 && worst ? longQ : ['What is a dividend?', 'What is inflation?', 'What is a share?'][i % 3], r: { kind: 'answer', answer: 'A dividend is part of a company\'s profit paid to shareholders.', citations: [{ articleSlug: 'dividend', title: 'Dividend' }], followUps: [] }, at: new Date(now - (m - i) * 60000).toISOString() });
  return { 'fv.ask.v1': { msgs, usage: {} }, 'fv.auth.v1': auth, 'fv.bill.v1': bill, 'fv.lib.v1': lib, 'fv.plus.v1': plus, 'fv.proto.v1': proto };
}
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const w of (process.env.FV_WIDTHS || '390,320,820').split(',').map(Number)) {
    const p = await b.newPage({ viewport: { width: w, height: w >= 1024 ? 900 : w > 600 ? 1180 : 844 } }); p.on('pageerror', (e) => errs.push(w + ' ' + p.url().split('/').pop() + ': ' + e.message));
    await p.goto(B + 'index.html'); await p.waitForTimeout(300);
    await p.evaluate((f) => { localStorage.clear(); const billKey = Object.keys(f).find((k) => k === 'fv.bill.v1'); Object.entries(f).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); }, fixture(state));
    // the billing key name used by fv.js
    await p.evaluate(() => { const v = localStorage.getItem('fv.bill.v1'); if (v) { const keys = ['fv.billing.v1', 'fv.bill.v1']; keys.forEach((k) => localStorage.setItem(k, v)); } });
    for (const bd of boards) { await p.goto(B + bd + '.dc.html'); await p.waitForTimeout(1100);
      const r = await p.evaluate(() => { const spill = [];
        document.querySelectorAll('#dc-root *').forEach((e) => { if (e.children.length || !e.textContent.trim() || !e.offsetParent) return; const box = e.getBoundingClientRect(), par = e.parentElement.getBoundingClientRect();
          if (box.right > par.right + 2 && getComputedStyle(e.parentElement).overflow === 'visible' && box.width > 4) spill.push(e.textContent.trim().slice(0, 30)); });
        return { hs: document.documentElement.scrollWidth > document.documentElement.clientWidth, spill: spill.slice(0, 4) }; });
      if (r.hs) errs.push(w + ' ' + bd + ': scrolls sideways'); if (r.spill.length) errs.push(w + ' ' + bd + ': text spills out: ' + r.spill.join(' | ')); await p.screenshot({ path: out + '/' + state + '_' + w + '_' + bd + '.png', fullPage: true }); }
    await p.close();
  }
  console.log(errs.length ? errs.join('\n') : 'no errors or sideways scroll'); await b.close();
})();
