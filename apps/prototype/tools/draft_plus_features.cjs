// DRAFTS for owner approval (17 Nov 2026), not live. Mock-ups for the client's Plus features, drawn inside the real app
// (phone header and nav bar; laptop sidebar). Figures are made up and tagged Simulated. Usage:
// node tools/draft_plus_features.cjs <base url> <out dir>
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const [B, OUT] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });

const C = { navy: '#0B192C', em: '#047857', em2: '#10B981', emBg: '#E7F6EF', red: '#B9473F', redBg: '#FBEDEC', mute: '#5B6577', line: '#E3E6EB', card: '#FFFFFF', soft: '#EEF0F3' };
const mono = "font-family:'Geist Mono',monospace";
const card = (inner, extra = '') => `<div style="background:${C.card};border:1px solid ${C.line};border-radius:16px;padding:16px;${extra}">${inner}</div>`;
const h = (t, sub) => `<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px"><h2 style="margin:0;font-size:15px;font-weight:600">${t}</h2>${sub ? `<span style="font-size:12px;color:${C.mute}">${sub}</span>` : ''}</div>`;
const tag = (t, bg = C.soft, fg = C.mute) => `<span style="display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:999px;background:${bg};color:${fg};font-size:11px;font-weight:600;white-space:nowrap">${t}</span>`;
const SIM = tag('Simulated');
const PLUS = tag('Plus', C.emBg, C.em);
const top = (kicker, title, sub) => `<div style="display:flex;flex-direction:column;gap:6px"><div style="display:flex;gap:6px">${PLUS}${SIM}</div><span style="font-size:12px;color:${C.em};font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-top:4px">${kicker}</span><h1 style="margin:0;font-size:26px;font-weight:600;letter-spacing:-0.02em;line-height:1.2">${title}</h1>${sub ? `<p style="margin:0;font-size:14px;line-height:1.5;color:${C.mute}">${sub}</p>` : ''}</div>`;
const nfa = `<p style="margin:0;font-size:12px;color:${C.mute}">Not financial advice. For learning only.</p>`;
const btn = (t, primary = true) => `<span style="height:48px;padding:0 18px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:15px;${primary ? `background:${C.navy};color:#fff;font-weight:600` : `border:1px solid #D5D9E0;font-weight:500`}">${t}</span>`;
const seg = (opts, on = 0) => `<div style="display:flex;background:${C.soft};border-radius:10px;padding:3px">${opts.map((o, i) => `<span style="flex:1;text-align:center;padding:7px 10px;border-radius:8px;font-size:13px;${i === on ? 'background:#fff;font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.08)' : `color:${C.mute}`}">${o}</span>`).join('')}</div>`;
const row = (a, b, c = '', bold) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 0;border-top:1px solid ${C.line};font-size:14px"><span style="${bold ? 'font-weight:600' : ''}">${a}</span><span style="display:flex;gap:12px;align-items:center;${mono};font-size:13px">${b}${c ? `<span style="min-width:56px;text-align:right">${c}</span>` : ''}</span></div>`;
const up = (t) => `<span style="color:${C.em}">▲ ${t}</span>`, dn = (t) => `<span style="color:${C.red}">▼ ${t}</span>`;
const level = (l) => l === 'High' ? tag('High', C.redBg, C.red) : l === 'Medium' ? tag('Medium', '#E8ECF3', C.navy) : tag('Low', C.emBg, C.em);
const bars = (vals, labels, color = C.em2, h2 = 120, second) => { if (!second && vals[vals.length - 1] < vals[0]) color = C.red; const mx = Math.max(...vals, ...(second || [0])); const n = vals.length;
  const svg = `<svg viewBox="0 0 300 ${h2}" width="100%" height="${h2 + 30}" preserveAspectRatio="none" style="display:block">${vals.map((v, i) => { const x = i * 300 / n + 300 / n * 0.18, bw = 300 / n * 0.64 / (second ? 2 : 1);
    return `<rect x="${x}" y="${h2 - v / mx * h2}" width="${bw}" height="${v / mx * h2}" fill="${color}"/>` + (second ? `<rect x="${x + bw + 1}" y="${h2 - second[i] / mx * h2}" width="${bw - 1}" height="${second[i] / mx * h2}" fill="${C.navy}"/>` : ''); }).join('')}</svg>`;
  return svg + `<div style="display:flex;margin-top:6px">${labels.map((l) => `<span style="flex:1;text-align:center;font-size:11px;color:${C.mute}">${l}</span>`).join('')}</div>`; };
const line = (a, b, h2 = 110) => { const mx = Math.max(...a, ...(b || a)), mn = Math.min(...a, ...(b || a)); const pt = (v, i, n) => `${i * 300 / (n - 1)},${8 + (1 - (v - mn) / (mx - mn || 1)) * (h2 - 16)}`;
  return `<svg viewBox="0 0 300 ${h2}" width="100%" preserveAspectRatio="none" style="display:block"><polyline fill="none" stroke="${a[a.length - 1] < a[0] ? C.red : C.em2}" stroke-width="2.5" points="${a.map((v, i) => pt(v, i, a.length)).join(' ')}"/>${b ? `<polyline fill="none" stroke="${C.navy}" stroke-width="2" stroke-dasharray="4 4" points="${b.map((v, i) => pt(v, i, b.length)).join(' ')}"/>` : ''}</svg>`; };
const legend = (items) => `<div style="display:flex;gap:14px;font-size:12px;color:${C.mute}">${items.map(([c, t, d]) => `<span style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:${d ? 0 : 3}px;border-top:${d ? `2px dashed ${c}` : 'none'};background:${d ? 'none' : c};border-radius:2px"></span>${t}</span>`).join('')}</div>`;
const stack = (parts) => `<div style="display:flex;height:12px;border-radius:999px;overflow:hidden">${parts.map(([p, c]) => `<span style="width:${p}%;background:${c}"></span>`).join('')}</div>`;

// Owner rule (17 Nov 2026): a falling chart (a crash, a loss, money losing value) is drawn in red; rising stays emerald.
// Each feature: phone body (one column) and laptop body (grid). Both made from the same blocks.
const F = {};
F['1-risk-signals'] = () => {
  const head = top('Finvora Risk Signals', 'MTN Nigeria', 'Plain-English flags from the latest reports. Signals point to things worth reading about, not to buy or sell.');
  const sig = [['High', 'Debt is growing faster than profit', 'Borrowing rose 41% while profit after tax fell. Interest takes a bigger share of earnings.'],
    ['Medium', 'Price moves more than the market', 'Over 12 months the share swung about 1.6 times as much as the NGX All-Share Index.'],
    ['Medium', 'Foreign exchange losses', 'Naira weakness cut reported profit. Results depend on the exchange rate.'],
    ['Low', 'Steady customer growth', 'Subscribers grew for 8 quarters in a row.']];
  const list = card(h('Signals', 'FY2024 report') + sig.map(([l, t, d]) => `<div style="padding:12px 0;border-top:1px solid ${C.line};display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b style="font-size:14px;font-weight:600">${t}</b>${level(l)}</div><span style="font-size:13px;line-height:1.5;color:${C.mute}">${d}</span><span style="font-size:13px;color:${C.em};font-weight:500">Learn what this means</span></div>`).join(''), 'padding-bottom:4px');
  const sum = card(h('Overall') + `<div style="margin-top:12px;display:flex;gap:8px">${[['High', 1], ['Medium', 2], ['Low', 1]].map(([l, n]) => `<div style="flex:1;border-radius:12px;background:${C.soft};padding:10px"><div style="${mono};font-size:20px">${n}</div>${level(l)}</div>`).join('')}</div>`);
  const wl = card(h('Your watchlist') + [['Zenith Bank', 'Low'], ['GTCO', 'Low'], ['Dangote Cement', 'Medium'], ['MTN Nigeria', 'High']].map(([n, l]) => `<div style="display:flex;justify-content:space-between;padding:10px 0;border-top:1px solid ${C.line};font-size:14px">${n}${level(l)}</div>`).join(''));
  return { phone: [head, sum, list, nfa], laptop: [head, `<div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;align-items:start">${list}<div style="display:flex;flex-direction:column;gap:16px">${sum}${wl}</div></div>`, nfa] };
};
F['2-dividend-cashflow'] = () => {
  const head = top('Dividend and cash flow tracker', 'Your dividend income', 'Upcoming payouts from your practice portfolio, and whether each company makes enough cash to keep paying.');
  const sum = card(`<div style="display:flex;justify-content:space-between;align-items:flex-end"><div><div style="font-size:12px;color:${C.mute}">Expected in the next 3 months</div><div style="${mono};font-size:26px;margin-top:4px">₦38,400.00</div></div>${tag('After 10% tax', C.soft)}</div>`);
  const upc = card(h('Upcoming', 'Qualification date') + [['Zenith Bank', '₦4.00 a share', '12 Dec', '₦18,000.00'], ['GTCO', '₦2.80 a share', '20 Jan', '₦12,600.00'], ['MTN Nigeria', '₦3.50 a share', '4 Feb', '₦7,800.00']].map(([n, ps, d, amt]) => `<div style="display:flex;justify-content:space-between;gap:10px;padding:11px 0;border-top:1px solid ${C.line}"><span style="display:flex;flex-direction:column;gap:2px"><b style="font-size:14px;font-weight:600">${n}</b><span style="font-size:12px;color:${C.mute}">${ps} · ${d}</span></span><span style="${mono};font-size:14px">${amt}</span></div>`).join(''));
  const cf = card(h('Zenith Bank: cash vs dividends', '₦ billion') + `<div style="margin-top:12px">${bars([310, 420, 515, 690, 880], ['2020', '2021', '2022', '2023', '2024'], C.em2, 120, [94, 100, 100, 125, 157])}</div>${legend([[C.em2, 'Cash from operations'], [C.navy, 'Dividends paid']])}<p style="margin:10px 0 0;font-size:13px;line-height:1.5;color:${C.mute}">Cash covered dividends 5.6 times in 2024. Below 1 time would mean paying out more than it earns in cash.</p>`);
  return { phone: [head, sum, upc, cf, nfa], laptop: [head, `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start"><div style="display:flex;flex-direction:column;gap:16px">${sum}${upc}</div>${cf}</div>`, nfa] };
};
F['3-advanced-watchlists'] = () => {
  const head = top('Advanced watchlists', 'Watchlists', 'Group companies into lists, see the numbers that matter side by side, and set alerts on any of them.');
  const tabs = `<div style="display:flex;gap:8px;flex-wrap:wrap">${['Banks · 4', 'Telecoms · 2', 'Dividend picks · 5', '+ New list'].map((t, i) => `<span style="height:34px;padding:0 14px;border-radius:999px;display:flex;align-items:center;font-size:13px;${i === 0 ? `background:${C.navy};color:#fff;font-weight:600` : i === 3 ? `border:1px dashed #C3C8D1;color:${C.mute}` : `background:${C.soft}`}">${t}</span>`).join('')}</div>`;
  const D = [['Zenith Bank', '₦47.33', '+0.3%', '3.1', '8.3%', 'Alert at ₦50'], ['GTCO', '₦52.10', '−0.6%', '4.6', '7.7%', ''], ['Access Holdings', '₦21.85', '+1.2%', '2.4', '9.1%', 'Alert at ₦20'], ['UBA', '₦28.40', '+0.4%', '2.9', '8.8%', '']];
  const ph = card(D.map(([n, p, c, pe, y, a]) => `<div style="padding:11px 0;border-top:1px solid ${C.line};display:flex;flex-direction:column;gap:4px"><div style="display:flex;justify-content:space-between"><b style="font-size:14px;font-weight:600">${n}</b><span style="${mono};font-size:14px">${p}</span></div><div style="display:flex;justify-content:space-between;font-size:12px;color:${C.mute}"><span>P/E ${pe} · Yield ${y}${a ? ' · ' + a : ''}</span>${c.startsWith('+') ? up(c.slice(1)) : dn(c.slice(1))}</div></div>`).join(''), 'padding-top:4px');
  const th = (t, r) => `<span style="font-size:12px;color:${C.mute};${r ? 'text-align:right' : ''}">${t}</span>`;
  const grid = 'display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr 1.4fr;gap:10px;align-items:center;padding:11px 0;border-top:1px solid ' + C.line;
  const lap = card(`<div style="${grid};border-top:0">${th('Company')}${th('Price', 1)}${th('Today', 1)}${th('P/E', 1)}${th('Yield', 1)}${th('Alert', 1)}</div>` + D.map(([n, p, c, pe, y, a]) => `<div style="${grid};font-size:14px"><b style="font-weight:600">${n}</b><span style="${mono};text-align:right">${p}</span><span style="${mono};text-align:right">${c.startsWith('+') ? up(c.slice(1)) : dn(c.slice(1))}</span><span style="${mono};text-align:right">${pe}</span><span style="${mono};text-align:right">${y}</span><span style="text-align:right;font-size:13px;color:${a ? C.navy : C.mute}">${a || 'Set alert'}</span></div>`).join(''));
  const note = card(h('Your note on Zenith Bank') + `<p style="margin:8px 0 0;font-size:14px;line-height:1.5;color:${C.mute}">Watching the dividend after the 2024 results. Check cash cover again in March.</p>`);
  return { phone: [head, tabs, ph, note], laptop: [head, tabs, `<div style="display:grid;grid-template-columns:2.4fr 1fr;gap:16px;align-items:start">${lap}${note}</div>`] };
};
F['4-portfolio-intelligence'] = () => {
  const head = top('Portfolio intelligence', 'How your portfolio is built', 'What you own, how spread out it is, and how it moves compared with the market.');
  const kp = (l, v, s) => `<div style="flex:1;min-width:120px;border-radius:12px;background:${C.soft};padding:12px"><div style="font-size:12px;color:${C.mute}">${l}</div><div style="${mono};font-size:20px;margin-top:4px">${v}</div><div style="font-size:12px;color:${C.mute};margin-top:2px">${s}</div></div>`;
  const k = card(`<div style="display:flex;gap:8px;flex-wrap:wrap">${kp('Total return', '+5.18%', 'NGX ASI +3.9%')}${kp('Income yield', '7.9%', 'a year')}${kp('Spread score', '4 / 10', 'Concentrated')}</div>`);
  const mix = card(h('By sector') + `<div style="margin-top:12px">${stack([[39, C.navy], [22, C.em2], [12, '#7C8AA0'], [27, '#C9D3DF']])}</div>` + [['Banking', '39%', C.navy], ['Telecoms', '22%', C.em2], ['Industrial', '12%', '#7C8AA0'], ['Cash', '27%', '#C9D3DF']].map(([n, p, c]) => `<div style="display:flex;justify-content:space-between;padding:9px 0;border-top:1px solid ${C.line};font-size:14px;margin-top:4px"><span style="display:flex;gap:8px;align-items:center"><span style="width:10px;height:10px;border-radius:3px;background:${c}"></span>${n}</span><span style="${mono}">${p}</span></div>`).join(''));
  const ch = card(h('You vs the market', '6 months') + `<div style="margin-top:12px">${line([100, 101, 99, 102, 104, 103, 105.2], [100, 100.5, 99.8, 101, 102.4, 103.1, 103.9])}</div>${legend([[C.em2, 'Your portfolio'], [C.navy, 'NGX All-Share', 1]])}`);
  const ins = card(h('Worth knowing') + ['Banking is 39% of your money. One bad year for banks would hit you hard.', 'Your cash is earning nothing in practice. Inflation lowers what it can buy.', 'Two holdings give most of your income.'].map((t) => `<div style="padding:10px 0;border-top:1px solid ${C.line};font-size:14px;line-height:1.5;display:flex;gap:10px"><span style="color:${C.em}">●</span>${t}</div>`).join(''));
  return { phone: [head, k, mix, ch, ins, nfa], laptop: [head, k, `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;align-items:start">${mix}${ch}${ins}</div>`, nfa] };
};
F['5-advanced-company-analysis'] = () => {
  const head = top('Advanced company analysis', 'Zenith Bank', 'The key numbers, what they mean, and how they compare with other Nigerian banks.');
  const r = (n, v, s, good) => `<div style="border-radius:12px;background:${C.soft};padding:12px;display:flex;flex-direction:column;gap:4px"><span style="font-size:12px;color:${C.mute}">${n}</span><span style="${mono};font-size:20px">${v}</span><span style="font-size:12px;color:${good ? C.em : C.red}">${s}</span></div>`;
  const g = card(h('Key ratios', 'vs bank average') + `<div style="margin-top:12px;display:grid;grid-template-columns:repeat(2,1fr);gap:8px">${r('Return on equity', '34.1%', 'Above 24.6%', 1)}${r('Profit margin', '41.2%', 'Above 33.0%', 1)}${r('Cost to income', '38.5%', 'Better than 47%', 1)}${r('Bad loans', '4.9%', 'Above 4.1%', 0)}${r('P/E', '3.1', 'Below 3.8', 1)}${r('Dividend yield', '8.3%', 'Above 7.2%', 1)}</div>`);
  const sw = card(h('Strengths') + ['Earns more on shareholder money than most banks.', 'Keeps costs low for its size.'].map((t) => `<div style="padding:9px 0;border-top:1px solid ${C.line};font-size:14px;display:flex;gap:10px"><span style="color:${C.em}">▲</span>${t}</div>`).join('') + `<div style="height:12px"></div>` + h('Watch') + ['More loans are going bad than the bank average.'].map((t) => `<div style="padding:9px 0;border-top:1px solid ${C.line};font-size:14px;display:flex;gap:10px"><span style="color:${C.red}">▼</span>${t}</div>`).join(''));
  const ask = card(`<div style="display:flex;gap:10px;align-items:center;justify-content:space-between"><span style="font-size:14px">Not sure what a ratio means?</span><span style="font-size:14px;color:${C.em};font-weight:600">Ask Finvora</span></div>`);
  return { phone: [head, g, sw, ask, nfa], laptop: [head, `<div style="display:grid;grid-template-columns:1.6fr 1fr;gap:16px;align-items:start">${g}<div style="display:flex;flex-direction:column;gap:16px">${sw}${ask}</div></div>`, nfa] };
};
F['6-historical-comparisons'] = () => {
  const head = top('Historical comparisons', 'Zenith Bank over time', 'See how a company has changed over five years, and how it compares with its sector.');
  const ch = card(`<div style="display:flex;flex-direction:column;gap:12px">${seg(['Revenue', 'Profit', 'Dividend', 'Share price'], 1)}${h('Profit after tax', '₦ billion')}${line([175, 230, 235, 676, 1030], [120, 140, 165, 380, 610], 140)}<div style="display:flex;justify-content:space-between;font-size:11px;color:${C.mute}">${['2020', '2021', '2022', '2023', '2024'].map((y) => `<span>${y}</span>`).join('')}</div>${legend([[C.em2, 'Zenith Bank'], [C.navy, 'Bank average', 1]])}</div>`);
  const t = card(h('Change over 5 years') + row('Revenue', '₦689bn → ₦2.4tn', up('248%')) + row('Profit after tax', '₦175bn → ₦1.0tn', up('489%')) + row('Dividend a share', '₦3.00 → ₦4.00', up('33%')) + row('Share price', '₦24.0 → ₦47.3', up('97%')) + `<p style="margin:10px 0 0;font-size:13px;line-height:1.5;color:${C.mute}">Some of this growth comes from naira weakness, not more business. Prices also rose a lot over these years.</p>`);
  return { phone: [head, ch, t, nfa], laptop: [head, `<div style="display:grid;grid-template-columns:1.5fr 1fr;gap:16px;align-items:start">${ch}${t}</div>`, nfa] };
};
F['7-financial-report-comparisons'] = () => {
  const head = top('Financial report comparisons', 'Compare reports', 'Put two income statements side by side, by company or by year.');
  const pick = `<div style="display:flex;gap:8px;align-items:center"><span style="flex:1;height:42px;border-radius:12px;border:1px solid #D5D9E0;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 12px;font-size:14px">Zenith Bank FY2024<span>▾</span></span><span style="color:${C.mute};font-size:13px">vs</span><span style="flex:1;height:42px;border-radius:12px;border:1px solid #D5D9E0;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 12px;font-size:14px">GTCO FY2024<span>▾</span></span></div>`;
  const L = [['Interest income', '₦2.4tn', '₦1.3tn'], ['Interest expense', '₦0.9tn', '₦0.3tn'], ['Net interest income', '₦1.5tn', '₦1.0tn'], ['Operating costs', '₦0.7tn', '₦0.4tn'], ['Profit before tax', '₦1.3tn', '₦1.2tn'], ['Profit after tax', '₦1.0tn', '₦1.0tn'], ['Earnings a share', '₦33.23', '₦35.02']];
  const grid = `display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:10px;padding:11px 0;border-top:1px solid ${C.line};font-size:14px;align-items:center`;
  const tb = card(`<div style="${grid};border-top:0;font-size:12px;color:${C.mute}"><span>Income statement</span><span style="text-align:right">Zenith</span><span style="text-align:right">GTCO</span></div>` + L.map(([a, b, c], i) => `<div style="${grid}${i === 5 ? ';font-weight:600' : ''}"><span>${a}</span><span style="${mono};text-align:right">${b}</span><span style="${mono};text-align:right">${c}</span></div>`).join(''));
  const take = card(h('What stands out') + ['Zenith earns more interest, but also pays much more on deposits.', 'GTCO turns more of its income into profit: similar profit from a smaller business.'].map((t) => `<div style="padding:10px 0;border-top:1px solid ${C.line};font-size:14px;line-height:1.5">${t}</div>`).join(''));
  return { phone: [head, pick, tb, take, nfa], laptop: [head, pick, `<div style="display:grid;grid-template-columns:1.6fr 1fr;gap:16px;align-items:start">${tb}${take}</div>`, nfa] };
};
F['8-market-crisis-simulator'] = () => {
  const head = top('Market crisis simulator', 'Live through a crash', 'Replay a real NGX downturn with your practice portfolio, one month at a time, and choose what to do.');
  const pick = `<div style="display:flex;gap:8px;flex-wrap:wrap">${['2008 to 2009 crash', '2016 recession', '2020 pandemic'].map((t, i) => `<span style="height:34px;padding:0 14px;border-radius:999px;display:flex;align-items:center;font-size:13px;${i === 0 ? `background:${C.navy};color:#fff;font-weight:600` : `background:${C.soft}`}">${t}</span>`).join('')}</div>`;
  const ch = card(`${h('Month 7 of 24', 'NGX All-Share')}<div style="margin-top:12px">${line([100, 96, 88, 79, 70, 61, 54], null, 130)}</div><div style="margin-top:8px;height:6px;border-radius:999px;background:${C.soft}"><div style="width:29%;height:100%;border-radius:999px;background:${C.navy}"></div></div><div style="display:flex;justify-content:space-between;margin-top:14px"><span><span style="font-size:12px;color:${C.mute}">Your portfolio</span><br><span style="${mono};font-size:22px">₦54,300</span></span><span style="text-align:right"><span style="font-size:12px;color:${C.mute}">Since start</span><br><span style="${mono};font-size:22px;color:${C.red}">−45.7%</span></span></div>`);
  const dec = card(h('What do you do this month?') + `<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">${['Sell everything', 'Hold and wait', 'Buy a little more each month'].map((t, i) => `<span style="min-height:48px;border-radius:12px;border:${i === 1 ? `1.5px solid ${C.navy}` : '1px solid #D5D9E0'};background:${i === 1 ? C.soft : '#fff'};display:flex;align-items:center;padding:0 14px;font-size:14px">${t}</span>`).join('')}</div><div style="margin-top:12px">${btn('Next month')}</div><p style="margin:10px 0 0;font-size:12px;color:${C.mute}">At the end you see how each choice would have turned out.</p>`);
  return { phone: [head, pick, ch, dec], laptop: [head, pick, `<div style="display:grid;grid-template-columns:1.5fr 1fr;gap:16px;align-items:start">${ch}${dec}</div>`] };
};
F['9-interactive-scenarios'] = () => {
  const head = top('Interactive financial scenarios', 'What if inflation stays high?', 'Move the sliders to see what happens to ₦500,000 over 5 years.');
  const sl = (l, v, p) => `<div style="display:flex;flex-direction:column;gap:8px"><div style="display:flex;justify-content:space-between;font-size:14px"><span>${l}</span><span style="${mono}">${v}</span></div><div style="position:relative;height:6px;border-radius:999px;background:${C.soft}"><div style="width:${p}%;height:100%;border-radius:999px;background:${C.navy}"></div><span style="position:absolute;left:calc(${p}% - 11px);top:-8px;width:22px;height:22px;border-radius:50%;background:#fff;border:2px solid ${C.navy}"></span></div></div>`;
  const ctl = card(`<div style="display:flex;flex-direction:column;gap:22px">${sl('Inflation a year', '25%', 62)}${sl('Savings interest a year', '12%', 30)}${sl('Years', '5', 50)}</div>`);
  const out = card(h('After 5 years') + row('In the bank', '₦881,171') + row('What it can buy in today\'s money', '<span style="color:' + C.red + '">₦288,746</span>', '', 1) + `<div style="margin-top:12px">${bars([500, 434, 376, 333, 300, 289], ['Now', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5'], C.navy, 100)}</div><p style="margin:10px 0 0;font-size:13px;line-height:1.5;color:${C.mute}">When inflation is above your interest rate, your money buys less each year, even as the balance grows.</p>`);
  const more = `<div style="display:flex;gap:8px;flex-wrap:wrap">${['Rent goes up', 'Salary rises 10%', 'Naira weakens'].map((t) => `<span style="height:34px;padding:0 14px;border-radius:999px;display:flex;align-items:center;font-size:13px;background:${C.soft}">${t}</span>`).join('')}</div>`;
  return { phone: [head, ctl, out, h('More scenarios'), more, nfa], laptop: [head, `<div style="display:grid;grid-template-columns:1fr 1.2fr;gap:16px;align-items:start"><div style="display:flex;flex-direction:column;gap:16px">${ctl}${h('More scenarios')}${more}</div>${out}</div>`, nfa] };
};

(async () => {
  const b = await chromium.launch();
  const auth = () => { try { localStorage.setItem('fv.auth.v1', JSON.stringify({ email: 'ada@example.com', name: 'Ada', goal: 'Investing', birth: '2001-03-14', asked: true })); } catch (x) {} };
  const shots = [];
  const BASE = { '1': 'Company', '2': 'Practice', '3': 'PracticeWatchlist', '4': 'Practice', '5': 'Company', '6': 'Company', '7': 'Compare', '8': 'Practice', '9': 'Learn' };
  for (const [kind, sfx, opts] of [['phone', 'Navy.dc.html', { ...devices['iPhone 13'], deviceScaleFactor: 2 }], ['laptop', 'LaptopNavy.dc.html', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }]]) {
    const c = await b.newContext({ ...opts, serviceWorkers: 'block' }); await c.addInitScript(auth);
    const p = await c.newPage();
    for (const [name, fn] of Object.entries(F)) {
      await p.goto(B + (kind === 'phone' ? 'Home' : BASE[name[0]]) + sfx + (kind !== 'phone' && BASE[name[0]] === 'Company' ? '?t=GTCO' : ''));
      await p.waitForSelector('#dc-root main', { timeout: 8000 }); await p.waitForTimeout(1200);
      const parts = fn()[kind];
      await p.evaluate(([html, lap, base]) => { const m = document.querySelector('#dc-root main'); m.innerHTML = '<div style="display:flex;flex-direction:column;gap:16px;' + (lap ? 'padding:32px 40px 40px;max-width:1120px' : 'padding:8px 16px 110px') + ';font-family:Geist,system-ui,sans-serif;color:#0B192C">' + html + '</div>'; m.scrollTop = 0;
        if (!lap) { const tab = { Company: 'Markets', Compare: 'Markets', Practice: 'Practice', PracticeWatchlist: 'Practice', Learn: 'Learn' }[base];
          const links = [...document.querySelectorAll('#dc-root nav a')]; const home = links.find((a) => /Home/.test(a.textContent)), to = links.find((a) => a.textContent.trim() === tab);
          if (home && to) { const col = (a) => { const t = [...a.querySelectorAll('span,div')].find((e) => e.textContent.trim() && !e.children.length) || a; return getComputedStyle(t).color; };
            const on = col(home), off = col(to);
            const paint = (a, c) => { a.querySelectorAll('*').forEach((e) => { if (e.textContent.trim() && !e.children.length) e.style.color = c; if (e.getAttribute('stroke') && e.getAttribute('stroke') !== 'none') e.setAttribute('stroke', c); }); a.style.color = c; };
            paint(home, off); paint(to, on); } } }, [parts.join(''), kind === 'laptop', BASE[name[0]]]);
      await p.waitForTimeout(300);
      const f = path.join(OUT, `${name}-${kind}.png`); if (kind === 'phone') { const hgt = await p.evaluate(() => { const m = document.querySelector('#dc-root main'); return Math.ceil(m.getBoundingClientRect().top + m.scrollHeight); }); await p.setViewportSize({ width: 390, height: Math.max(844, hgt) }); await p.waitForTimeout(300); }
      await p.screenshot({ path: f });
      if (kind === 'phone') await p.setViewportSize({ width: 390, height: 664 }); shots.push(f);
    }
    await c.close();
  }
  await b.close(); console.log(shots.length, 'drafts in', OUT);
})();
