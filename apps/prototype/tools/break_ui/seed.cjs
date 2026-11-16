// Break UI fixtures (skill: break-ui), dev-only. Seeds the browser store through the same boundary the app uses
// (localStorage keys read by fv.js), so screens render worst-case data without touching their markup.
// Usage: node tools/break_ui/seed.cjs <base url> <state: demo|worst|one|empty> <out dir> <boards...>
const { chromium } = require('playwright');
const [B, state, out, ...boards] = process.argv.slice(2);
const fixture = require('./fixture.cjs');
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
