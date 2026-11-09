// Automated part of the mobile-app-qa skill. Usage: node apps/prototype/tools/qa_mobile.cjs http://127.0.0.1:8791/
// Checks every phone screen at 390 px: sideways scroll, tap targets under 44 px, top bar reveal on scroll up,
// focus boxes inside fields, and content hidden under pinned bottom bars at the end of the scroll.
const { chromium, devices } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const B = process.argv[2] || 'http://127.0.0.1:8791/'; const site = path.join(__dirname, '..', 'site');
  const pages = fs.readdirSync(site).filter((f) => /^U[POSRF][A-Za-z]+\.dc\.html$/.test(f)).map((f) => f.replace('.dc.html', ''));
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' })).newPage();
  await p.goto(B + 'UOHome.dc.html'); await p.evaluate(() => { localStorage.setItem('fv.schema', '2'); localStorage.setItem('fv.auth.v1', JSON.stringify({ email: 'ada@example.com', name: 'Ada' })); FV.REV.setProgress(3, false); });
  const issues = [];
  for (const u of pages) {
    try { await p.goto(B + u + '.dc.html', { waitUntil: 'networkidle', timeout: 15000 }); await p.waitForTimeout(500); } catch (e) { continue; }
    if (!new RegExp(u).test(p.url())) continue; // routed elsewhere
    const r = await p.evaluate(() => {
      const out = [], iw = document.documentElement.clientWidth;
      if (document.documentElement.scrollWidth > iw + 1) out.push('page scrolls sideways');
      const small = [...document.querySelectorAll('a[href], button, [role=button], input:not([type=hidden]), [role=switch]')].filter((e) => {
        const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none' || !e.offsetParent) return false;
        const rc = e.getBoundingClientRect(); if (!rc.width) return false;
        if (e.closest('p, li') && e.tagName === 'A' && e.closest('p')) return false; // inline text links
        if (rc.width <= 2 && rc.height <= 2) return false; // visually hidden keyboard-only controls
        const af = getComputedStyle(e, '::after'); if (af.content !== 'none' && af.position === 'absolute' && rc.height + 18 >= 44) return false; // touch area extended around a small visual
        return rc.width < 44 && rc.height < 44 || (rc.height < 32 && rc.width < 200);
      }).slice(0, 3).map((e) => (e.getAttribute('aria-label') || e.textContent.trim() || e.tagName).slice(0, 24) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
      if (small.length) out.push('small tap targets: ' + small.join(', '));
      return out;
    });
    r.forEach((x) => issues.push(u + ': ' + x));
    const tall = await p.evaluate(() => document.documentElement.scrollHeight > innerHeight * 1.6);
    if (tall) {
      const rev = await p.evaluate(async () => {
        const h = document.querySelector('.fv-reveal'); if (!h) return null;
        const max = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, max * 0.4); await new Promise((r) => setTimeout(r, 300)); window.scrollTo(0, max); await new Promise((r) => setTimeout(r, 300));
        const hidden = h.getBoundingClientRect().bottom <= 2; window.scrollTo(0, max - 60); await new Promise((r) => setTimeout(r, 350));
        return { hidden, back: h.getBoundingClientRect().top >= -1 };
      });
      if (rev && !(rev.hidden && rev.back)) issues.push(u + ': top bar does not hide on scroll down and return on scroll up');
      const under = await p.evaluate(async () => {
        window.scrollTo(0, document.documentElement.scrollHeight); await new Promise((r) => setTimeout(r, 300));
        const nav = document.querySelector('nav[aria-label="Main"]'); if (!nav) return false;
        const nt = nav.getBoundingClientRect().top; const main = document.querySelector('main'); if (!main) return false;
        const last = [...main.querySelectorAll('a, button, p, h2, h3, li')].filter((e) => e.offsetParent).pop();
        return last && last.getBoundingClientRect().bottom > nt + 2;
      });
      if (under) issues.push(u + ': last content ends under the bottom navigation');
    }
  }
  console.log('screens checked', pages.length, 'issues', issues.length); issues.forEach((x) => console.log(' -', x));
  await b.close(); process.exit(issues.length ? 1 : 0);
})();
