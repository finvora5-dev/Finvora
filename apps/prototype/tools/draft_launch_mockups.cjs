// DRAFTS for owner approval (16 Nov 2026), not live. Draws the proposed screens for the five parked launch items on top of
// the real phone screens, using the two approved patterns: the "is a Plus feature" sheet (UpgradeNavy) and the confirm
// sheet (CancelPlanNavy). Usage: node tools/draft_launch_mockups.cjs <base url> <out dir>
const { chromium, devices } = require('playwright');
const [B, OUT] = process.argv.slice(2);
const LOCK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B192C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>';
const BELL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B192C" stroke-width="1.8" stroke-linecap="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0"></path></svg>';
const CARD = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B192C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"></rect><path d="M3 10h18M7 15h4"></path></svg>';
const btn = (t, primary) => '<span style="height:52px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:16px;' + (primary ? 'background:#0B192C;color:#FFFFFF;font-weight:600' : 'border:1px solid #D5D9E0;font-weight:500') + '">' + t + '</span>';
const sheet = (icon, title, body, extra, b1, b2) => '<div style="position:fixed;inset:0;background:rgba(11,11,15,.45);z-index:90"></div><div style="position:fixed;left:0;right:0;bottom:0;z-index:91;background:#FFFFFF;color:#0B192C;border-radius:20px 20px 0 0;padding:10px 24px 28px;display:flex;flex-direction:column;font-family:Geist,system-ui,sans-serif"><span style="align-self:center;width:36px;height:4px;border-radius:999px;background:#D5D9E0"></span>'
  + (icon ? '<span style="margin-top:18px;width:44px;height:44px;border-radius:999px;background:#E8EBEF;display:flex;align-items:center;justify-content:center">' + icon + '</span>' : '')
  + '<h2 style="margin:14px 0 0;font-size:22px;font-weight:600;letter-spacing:-0.01em">' + title + '</h2><p style="margin:8px 0 0;font-size:15px;line-height:1.5;color:#5B6577">' + body + '</p>' + (extra || '')
  + '<div style="margin-top:22px;display:flex;flex-direction:column;gap:10px">' + btn(b1, true) + btn(b2, false) + '</div></div>';
const chips = '<div style="margin-top:16px;display:flex;gap:8px">' + ['2%', '5%', '10%'].map((t, i) => '<span style="flex:1;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:\'Geist Mono\',monospace;font-size:15px;' + (i === 1 ? 'border:1.5px solid #0B192C;background:#EEF0F3;font-weight:600' : 'border:1px solid #D5D9E0') + '">' + t + '</span>').join('') + '</div>';
const SHOTS = [
  ['1-compare-locked', 'CompareNavy', 'free', sheet(LOCK, 'Comparing companies is a Plus feature', 'Free shows one company at a time. Plus compares NGX companies side by side, plus unlimited Finvora AI questions.', '', 'See Plus', 'Not now')],
  ['2-dividends-locked', 'PracticeDividendsNavy', 'free', sheet(LOCK, 'Dividend history is a Plus feature', 'Plus shows the dividend history for every NGX company, plus unlimited Finvora AI questions.', '', 'See Plus', 'Not now')],
  ['3-statements-free', 'CompanyNavy', 'free', null],
  ['4-alert-set', 'PracticeWatchlistNavy', 'free', sheet(BELL, 'Price alert for Zenith Bank', 'Tell me when the price moves in a day by:', chips, 'Save alert', 'Not now')],
  ['5-alert-limit', 'PracticeWatchlistNavy', 'free', sheet(LOCK, 'More price alerts is a Plus feature', 'Free includes 1 price alert. Plus has unlimited price alerts, plus unlimited Finvora AI questions.', '', 'See Plus', 'Not now')],
  ['6-switch-yearly', 'YourPlanNavy', 'plus', sheet(null, 'Switch to yearly?', 'You stay on monthly until 16 December 2026. From then you pay ₦65,989 a year, which is one month free.', '', 'Switch to yearly', 'Keep monthly')],
  ['7-update-card', 'YourPlanNavy', 'plus', sheet(CARD, 'Update your card', 'Cards are handled by Paystack. Finvora never sees or stores your card number.', '', 'Continue to Paystack', 'Not now')],
];
(async () => {
  const b = await chromium.launch();
  for (const [name, board, plan, html] of SHOTS) {
    const c = await b.newContext({ ...devices['Pixel 7'], deviceScaleFactor: 2, serviceWorkers: 'block' }); const p = await c.newPage();
    await p.goto(B + 'MainNavy.dc.html');
    await p.evaluate((plus) => { localStorage.setItem('fv.auth.v1', JSON.stringify({ email: 'ada@example.com', name: 'Ada Okafor', goal: 'Investing', birth: '2001-03-14', asked: true }));
      localStorage.setItem('fv.plus.v1', JSON.stringify({ lists: [{ name: 'My watchlist', tickers: ['ZENITHBANK', 'GTCO', 'MTNN'], notes: {} }], alertBps: 500, seenAlerts: {} }));
      if (plus) localStorage.setItem('fv.billing.v1', JSON.stringify({ sub: { plan: 'plus', period: 'monthly', renewsOn: '2026-12-16' }, orders: [{ id: 'ord-a24117', period: 'monthly', amountKobo: 599900, status: 'confirmedSuccess', attempts: 1, createdAt: '2026-11-16T09:00:00Z', updatedAt: '2026-11-16T09:00:00Z' }] })); }, plan === 'plus');
    await p.goto(B + board + '.dc.html'); await p.waitForTimeout(1500);
    if (html) await p.evaluate((h) => { const d = document.createElement('div'); d.innerHTML = h; document.body.appendChild(d); }, html);
    else await p.evaluate(() => { // Free statements: only the latest year, with a row that opens the existing "Five years" Plus sheet.
      const tl = document.querySelector('[role="tablist"][aria-label="Statement"]'); if (!tl) return; const card = tl.closest('section') || tl.parentElement;
      card.querySelectorAll('*').forEach((e) => { if (e.children.length === 0 && /^FY202[23]$/.test(e.textContent.trim())) { const idx = [...e.parentElement.children].indexOf(e); card.querySelectorAll('div, tr').forEach((row) => { if (row.children.length > idx && row.children.length === e.parentElement.children.length) row.children[idx].style.display = 'none'; }); } });
      const a = document.createElement('div'); a.style.cssText = 'display:flex;align-items:center;justify-content:space-between;min-height:48px;padding:0 16px;border-top:1px solid #EDEFF2;font-size:14px;font-weight:600;color:#0B192C';
      a.innerHTML = '<span style="display:flex;align-items:center;gap:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B192C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>See five years</span><span style="padding:3px 8px;border-radius:999px;background:#DDF3E6;color:#047857;font-size:12px">Plus</span>';
      card.appendChild(a); a.scrollIntoView({ block: 'center' }); });
    await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/' + name + '.png' }); await c.close(); console.log('drawn', name);
  }
  await b.close();
})();
