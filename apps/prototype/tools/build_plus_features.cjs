// Owner, 17 Nov 2026: "build the plus features now", from the approved drafts (mockups/drafts-plus, made by
// draft_plus_features.cjs). Writes a phone and a laptop board for each feature on the Home layout (header and nav on phone,
// sidebar on laptop), with the parts you can use in fvplus.js, and adds the ways in from Company, Practice, Watchlist and Learn.
// Idempotent. Usage: node tools/build_plus_features.cjs <site>
const fs = require('fs'), path = require('path');
const SITE = process.argv[2];
const { F } = require('./draft_plus_features.cjs');
const FEAT = [ // draft key, board, title, section, back (phone)
  ['1-risk-signals', 'PlusRisk', 'Risk Signals', 'Markets', 'CompanyNavy.dc.html'],
  ['3-advanced-watchlists', 'PlusWatchlists', 'Watchlists', 'Watchlist', 'PracticeWatchlistNavy.dc.html'],
  ['5-advanced-company-analysis', 'PlusAnalysis', 'Company analysis', 'Markets', 'CompanyNavy.dc.html'],
  ['6-historical-comparisons', 'PlusHistory', 'Historical comparisons', 'Markets', 'CompanyNavy.dc.html'],
  ['7-financial-report-comparisons', 'PlusReports', 'Compare reports', 'Markets', 'CompanyNavy.dc.html'],
  ['9-interactive-scenarios', 'PlusScenarios', 'Financial scenarios', 'Learn', 'LearnNavy.dc.html'],
];
const read = (n) => fs.readFileSync(path.join(SITE, n), 'utf8');
const write = (n, s) => fs.writeFileSync(path.join(SITE, n), s);
function replaceMain(s, inner) { const i = s.indexOf('<main'), j = s.indexOf('>', i) + 1, k = s.indexOf('</main>', j); return s.slice(0, j) + inner + s.slice(k); }
function addScript(s, section) {
  s = s.replace(/<body([^>]*)>/, (m, a) => '<body' + a.replace(/ data-fv-section="[^"]*"/, '') + ' data-fv-section="' + section + '">');
  if (!s.includes('src="fvplus.js"')) s = s.replace('</body>', '<script src="fvplus.js"></script>\n</body>');
  return s;
}
// Links inside the drafts: "Learn what this means" and "Ask Finvora" open Ask Finvora; nothing else is a control.
const linkify = (h) => h.replace(/<span style="([^"]*)">Learn what this means<\/span>/g, '<a href="AskFinvoraNavy.dc.html" style="$1;text-decoration:none;display:inline-block;padding:12px 0;margin:-12px 0;align-self:flex-start">Learn what this means</a>')
  .replace(/<span style="([^"]*)">Ask Finvora<\/span>/g, '<a href="AskFinvoraNavy.dc.html" style="$1;text-decoration:none;display:inline-block;padding:14px 8px;margin:-14px -8px">Ask Finvora</a>');
const wrap = (html, lap) => '<div style="display:flex;flex-direction:column;gap:16px;' + (lap ? 'padding:32px 40px 40px;max-width:1120px' : 'padding:8px 16px 110px') + ';font-family:Geist,system-ui,sans-serif;color:#0B192C">' + linkify(html) + '</div>';

const home = read('HomeNavy.dc.html'), homeLap = read('HomeLaptopNavy.dc.html');
const BACK = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"></path></svg>';
const pairs = [];
for (const [key, board, title, section, back] of FEAT) {
  const parts = F[key]();
  // Phone: Home's header becomes a back bar with the screen's name.
  let p = home; const hi = p.indexOf('<header'), hj = p.indexOf('>', hi) + 1, hk = p.indexOf('</header>', hj);
  p = p.slice(0, hj) + '<span style="display:flex;align-items:center;gap:4px;margin-left:-12px"><a href="' + back + '" aria-label="Back" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center">' + BACK + '</a><span style="font-size:16px;font-weight:600">' + title + '</span></span>' + p.slice(hk);
  p = p.replace(/<title>[^<]*<\/title>/, '<title>' + title + ' · Finvora</title>');
  p = addScript(replaceMain(p, wrap(parts.phone.join(''), false)), section);
  write(board + 'Navy.dc.html', p);
  let l = homeLap.replace(/<title>[^<]*<\/title>/, '<title>' + title + ' · Finvora</title>');
  l = addScript(replaceMain(l, wrap(parts.laptop.join(''), true)), section);
  write(board + 'LaptopNavy.dc.html', l);
  pairs.push([board + 'Navy', board + 'LaptopNavy']);
}
// Phone and laptop pairs, so each screen opens its own layout at each width.
let r = read('responsive.js');
for (const [a, b] of pairs) if (!r.includes(a + ': "')) r = r.replace('var PAIRS = { ', 'var PAIRS = { ' + a + ': "' + b + '", ');
write('responsive.js', r);

// Ways in: a "Plus tools" row on the pages each feature belongs to.
const chip = (href, t) => '<a href="' + href + '" style="height:36px;padding:0 14px;border-radius:999px;display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500;background:#E7F6EF;color:#047857;text-decoration:none;white-space:nowrap">' + t + '</a>';
const tools = (items, pad) => '<div data-fv-plus-tools style="' + pad + 'display:flex;flex-direction:column;gap:10px"><span style="font-size:12px;font-weight:600;color:#5B6577;text-transform:uppercase;letter-spacing:.06em">Plus tools</span><div style="display:flex;gap:8px;flex-wrap:wrap">' + items.map(([h, t]) => chip(h, t)).join('') + '</div></div>';
const WAYS = [
  ['CompanyNavy.dc.html', /<h2[^>]*>Key statistics<\/h2>/, [['PlusRiskNavy.dc.html', 'Risk Signals'], ['PlusAnalysisNavy.dc.html', 'Analysis'], ['PlusHistoryNavy.dc.html', 'History'], ['PlusReportsNavy.dc.html', 'Compare reports']], 'margin:16px 0 4px;padding:0 20px;'],
  ['CompanyLaptopNavy.dc.html', /<h2[^>]*>Key statistics<\/h2>/, [['PlusRiskNavy.dc.html', 'Risk Signals'], ['PlusAnalysisNavy.dc.html', 'Analysis'], ['PlusHistoryNavy.dc.html', 'History'], ['PlusReportsNavy.dc.html', 'Compare reports']], 'margin:0 0 20px;'],
  ['LearnNavy.dc.html', /<h2[^>]*>Next courses<\/h2>/, [['PlusScenariosNavy.dc.html', 'Financial scenarios']], 'margin:0 0 20px;'],
  ['LearnLaptopNavy.dc.html', /<h2[^>]*>All courses<\/h2>/, [['PlusScenariosNavy.dc.html', 'Financial scenarios']], 'margin:0 0 20px;'],
];
for (const [f, re, items, pad] of WAYS) {
  let s = read(f).replace(/<div data-fv-plus-tools[\s\S]*?<\/a><\/div><\/div>/, '');
  const m = re.exec(s); if (!m) { console.log('no anchor in', f); continue; }
  // Put the row before the block that holds the heading, so it sits between sections.
  let i = m.index; const open = s.lastIndexOf('<', i - 1); const prev = s.slice(open, i); let at = /^<(div|section|span)\b/.test(prev) ? open : i;
  if (/^<sc-if\b/.test(prev)) at = open; else if (/^<(div|section|span)\b/.test(prev)) { const o2 = s.lastIndexOf('<', open - 1); if (/^<sc-if\b/.test(s.slice(o2, open))) at = o2; }
  s = s.slice(0, at) + tools(items, pad) + s.slice(at); write(f, s); console.log('ways in:', f);
}
// Laptop practice and watchlist pages: the row goes at the end of the main column.
for (const [f, items] of [['PracticeWatchlistNavy.dc.html', [['PlusWatchlistsNavy.dc.html', 'Watchlists']]], ['PracticeWatchlistLaptopNavy.dc.html', [['PlusWatchlistsNavy.dc.html', 'Watchlists']]]]) {
  let s = read(f); if (s.includes('data-fv-plus-tools')) continue;
  let k = s.indexOf('</main>'); if (k < 0) k = s.indexOf('<p style="margin: 14px 20px 0; font-size: 12px; color: #5B6577">Simulated money. Prices delayed.</p>'); if (k < 0) k = s.indexOf('<div style="margin-top: auto; padding: 16px 24px 28px;'); if (k < 0) { console.log('no place in', f); continue; }
  s = s.slice(0, k) + tools(items, /Laptop/.test(f) ? 'margin:20px 0 0;padding:0 0 24px;' : f === 'PracticeEmptyNavy.dc.html' ? 'margin:20px 0 0;padding:0 24px;' : 'margin:16px 0 0;padding:0 20px;') + s.slice(k); write(f, s); console.log('ways in:', f);
}

// Owner, 17 Nov 2026: portfolio intelligence, dividends and the crisis simulator live in the practice portfolio, as tabs
// (Holdings, Insights, Dividends, Crisis), not as their own screens.
for (const old of ['PlusPortfolio', 'PlusDividends', 'PlusCrisis']) for (const sfx of ['Navy', 'LaptopNavy']) { const f = path.join(SITE, old + sfx + '.dc.html'); if (fs.existsSync(f)) fs.unlinkSync(f); }
r = read('responsive.js').replace(/(PlusPortfolio|PlusDividends|PlusCrisis)Navy: "[A-Za-z]+", /g, ''); write('responsive.js', r);
const strip = (t) => t.replace(/<div data-fv-plus-tools[\s\S]*?<\/a><\/div><\/div>/g, '');
for (const f of ['PracticeEmptyNavy.dc.html', 'PracticeEmptyLaptopNavy.dc.html']) write(f, addScript(strip(read(f)), ''));
const TABS = [['holdings', 'Holdings'], ['insights', 'Insights'], ['dividends', 'Dividends'], ['crisis', 'Crisis']];
const tablist = (pad) => '<div data-fv-ptabs role="tablist" aria-label="Portfolio" style="' + pad + 'display:flex;background:#EEF0F3;border-radius:10px;padding:3px">' + TABS.map(([k, t], i) => '<button type="button" role="tab" data-fv-ptab="' + k + '" aria-selected="' + (i === 0) + '" style="flex:1;min-height:40px;border:0;border-radius:8px;font:inherit;font-size:14px;cursor:pointer;touch-action:manipulation;' + (i === 0 ? 'background:#FFFFFF;color:#0B192C;font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.08)' : 'background:transparent;color:#5B6577') + '">' + t + '</button>').join('') + '</div>';
const intro = { insights: 'What you own, how spread out it is, and how it moves compared with the market.', dividends: 'Upcoming payouts from your practice portfolio, and whether each company makes enough cash to keep paying.', crisis: 'Replay a real NGX downturn with ₦100,000, one month at a time, and choose what to do.' };
const panels = () => ['insights', 'dividends', 'crisis'].map((k) => '<div data-fv-panel="' + k + '" role="tabpanel" style="display:flex;flex-direction:column;gap:16px;margin-top:16px;font-family:Geist,system-ui,sans-serif;color:#0B192C"></div>').join(''); // filled from the practice account by fvplus.js
// Holdings (client review, 17 Nov 2026): the scenario view when one is running, average purchase price and the gain or loss in naira.
const holdingsDetail = (f, s) => {
  s = s.replace("const S = this.S(); if (!S) return {}; const v = S.valuation(),", "const S = this.S(); if (!S) return {}; const v = S.viewValuation ? S.viewValuation() : S.valuation(),");
  if (f === 'PracticeNavy.dc.html') s = s.replace("qty: p.quantity.toLocaleString('en-NG') + (p.quantity === 1 ? ' share' : ' shares'), val: this.n(p.valueKobo), ch: this.ch(r),", "qty: p.quantity.toLocaleString('en-NG') + (p.quantity === 1 ? ' share' : ' shares') + ' · avg ' + this.n(p.avgCostKobo), val: this.n(p.valueKobo), ch: (p.unrealizedPlKobo >= 0 ? '▲ ' : '▼ ') + this.n(Math.abs(p.unrealizedPlKobo)) + ' (' + Math.abs(r).toFixed(1) + '%)',");
  else s = s.replace("qty: x.quantity.toLocaleString('en-NG'), val: this.n(x.valueKobo), ch: (r >= 0 ? '▲ ' : '▼ ') + Math.abs(r).toFixed(1) + '%',", "qty: x.quantity.toLocaleString('en-NG') + ' · avg ' + this.n(x.avgCostKobo), val: this.n(x.valueKobo), ch: (x.unrealizedPlKobo >= 0 ? '▲ ' : '▼ ') + this.n(Math.abs(x.unrealizedPlKobo)) + ' (' + Math.abs(r).toFixed(1) + '%)',").replace('>Shares</span>', '>Shares · avg price</span>').replace('>Return</span>', '>Gain or loss</span>');
  return s;
};
{ // phone: the tabs sit above Holdings, inside the holdings section
  let s = strip(read('PracticeNavy.dc.html')).replace(/<div data-fv-ptabs[\s\S]*?<!--\/fv-ptabs-->/, '').replace(/<div data-fv-panel=[\s\S]*?<!--\/fv-panels-->/, '').replace(/<div data-fv-holdings>([\s\S]*?)<\/div><!--\/fv-holdings-->/, '$1');
  const i = s.search(/<div[^>]*><h2[^>]*>Holdings<\/h2>/), j = s.indexOf('</section>', i);
  s = s.slice(0, i) + tablist('margin:0 0 16px;') + '<!--/fv-ptabs--><div data-fv-holdings>' + s.slice(i, j) + '</div><!--/fv-holdings-->' + panels() + '<!--/fv-panels-->' + s.slice(j);
  write('PracticeNavy.dc.html', addScript(holdingsDetail('PracticeNavy.dc.html', s), ''));
}
{ // laptop: the tabs sit above the holdings table
  let s = strip(read('PracticeLaptopNavy.dc.html')).replace(/<div data-fv-ptabs[\s\S]*?<!--\/fv-ptabs-->/, '').replace(/<div data-fv-panel=[\s\S]*?<!--\/fv-panels-->/, '').replace(' data-fv-holdings', '');
  const m = /<section([^>]*)>\s*<div[^>]*><span[^>]*>Holding<\/span>/.exec(s); const end = s.indexOf('</section>', m.index) + 10;
  s = s.slice(0, m.index) + tablist('margin:24px 0 0;max-width:520px;') + '<!--/fv-ptabs-->' + s.slice(m.index, end).replace('<section', '<section data-fv-holdings') + panels() + '<!--/fv-panels-->' + s.slice(end);
  write('PracticeLaptopNavy.dc.html', addScript(holdingsDetail('PracticeLaptopNavy.dc.html', s), ''));
}
console.log('built', pairs.length * 2, 'boards; practice tabs added');
