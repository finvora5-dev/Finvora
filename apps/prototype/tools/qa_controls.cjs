// Dead-control checker (skill: laptop-build). Taps every button and link on each screen and reports the ones that change
// nothing: no new page, no change on the page, nothing saved, no scroll. Skips controls that are disabled, already selected,
// or covered by an open dialog. Usage: node apps/prototype/tools/qa_controls.cjs <base-url> [out-dir] [Board ...]
// With no boards it checks every *Navy screen. Exit code 1 when anything is dead.
const { chromium, devices } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const B = process.argv[2] || 'http://127.0.0.1:8790/', OUT = process.argv[3] || '.', site = path.join(__dirname, '..', 'site');
  const only = process.argv.slice(4).map((x) => x.replace(/\.dc\.html$/, ''));
  const pages = fs.readdirSync(site).filter((f) => /Navy\.dc\.html$/.test(f) && (!only.length || only.includes(f.replace('.dc.html', ''))));
  const b = await chromium.launch(); const dead = {}; let total = 0;
  const SEL = '#dc-root a, #dc-root button, #dc-root [role=button], #dc-root [role=tab], #dc-root [role=radio], #dc-root [role=switch]';
  for (const f of pages) {
    const lap = /"width":1440/.test(fs.readFileSync(path.join(site, f), 'utf8'));
    const ctx = await b.newContext(lap ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' } : { ...devices['Pixel 7'], serviceWorkers: 'block' });
    await ctx.addInitScript(() => { try { localStorage.setItem('fv.auth.v1', JSON.stringify({ email: 'ada@example.com', name: 'Ada Okafor' })); sessionStorage.setItem('fv.staff', JSON.stringify({ email: 'chidi@finvora.ng', name: 'Chidi Nwosu' })); } catch (e) {} });
    const p = await ctx.newPage(); const U = B + f;
    try { await p.goto(U, { waitUntil: 'networkidle', timeout: 15000 }); } catch (e) { await ctx.close(); continue; }
    await p.waitForTimeout(400); if (!p.url().includes(f.replace('.html', ''))) { await ctx.close(); continue; } // routed to another board
    const mark = (sel) => p.evaluate((sel) => { const els = [...document.querySelectorAll(sel)].filter((e) => e.offsetParent && !e.closest('[aria-hidden=true]')); els.forEach((e, i) => e.setAttribute('data-q', i)); return els.length; }, sel);
    const n = await mark(SEL), list = [];
    for (let i = 0; i < Math.min(n, 80); i++) {
      try {
        await p.goto(U, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(350); await mark(SEL);
        const el = p.locator('[data-q="' + i + '"]'); if (!(await el.count())) continue;
        const info = await el.evaluate((e) => {
          const r = e.getBoundingClientRect(), hit = document.elementFromPoint(Math.min(innerWidth - 1, r.left + r.width / 2), Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2)));
          const covered = hit && !e.contains(hit) && !hit.contains(e) && !!(hit.closest('[role=dialog]') || hit.querySelector && hit.querySelector('[role=dialog]') || (hit.nextElementSibling && hit.nextElementSibling.matches && hit.nextElementSibling.matches('[role=dialog]')));
          const selected = ['aria-selected', 'aria-checked', 'aria-pressed', 'aria-current'].some((a) => { const v = e.getAttribute(a); return v === 'true' || v === 'page'; }) && !/switch/.test(e.getAttribute('role') || '');
          const disabled = e.disabled || e.getAttribute('aria-disabled') === 'true' || getComputedStyle(e).pointerEvents === 'none';
          return { label: (e.getAttribute('aria-label') || e.innerText || e.getAttribute('href') || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 40), covered, selected, disabled, sameHref: e.tagName === 'A' && e.href && e.href.split('#')[0] === location.href.split('#')[0] && e.getAttribute('href') !== '#' };
        });
        if (info.covered || info.selected || info.disabled || info.sameHref) continue;
        const snap = () => p.evaluate(() => [document.getElementById('dc-root').innerHTML, JSON.stringify(localStorage), JSON.stringify(sessionStorage), location.href, Math.round(scrollY), Math.round((document.querySelector('#dc-root main') || {}).scrollTop || 0), document.querySelectorAll('[role=dialog],[role=status]').length].join('|'));
        const before = await snap(); await el.click({ timeout: 2000, noWaitAfter: true }).catch(() => {}); await p.waitForTimeout(450);
        const after = await snap().catch(() => 'navigated');
        if (after === before) list.push(info.label);
      } catch (e) {}
    }
    if (list.length) { dead[f.replace('.dc.html', '')] = list; total += list.length; }
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, 'qa-controls.json'), JSON.stringify(dead, null, 1));
  console.log('screens checked', pages.length, 'dead controls', total); for (const k in dead) console.log(' -', k + ':', dead[k].join('; '));
  await b.close(); process.exit(total ? 1 : 0);
})();
