// Responsive web-app checker (skill: responsive-webapp-qa). Checks every screen at phone, tablet and laptop sizes
// and writes a report of objective problems. Usage:
//   node apps/prototype/tools/qa_responsive.cjs <base-url> <width> [out-dir]
// Run once per width (280, 390, 820, 1440); each run writes <out-dir>/qa-<width>.json and contact-sheet shots.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const B = process.argv[2] || 'http://127.0.0.1:8791/'; const W = +process.argv[3] || 390; const OUT = process.argv[4] || '.';
  const site = path.join(__dirname, '..', 'site');
  const pages = fs.readdirSync(site).filter((f) => f.endsWith('.dc.html') && !/^(GKobo|UGKobo|UMComponents|UPKoboMoods)\./.test(f)).map((f) => f.replace('.dc.html', ''));
  const touch = W <= 820, H = W < 600 ? 844 : W < 1024 ? 1180 : 900;
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: touch, serviceWorkers: 'block' }); const p = await ctx.newPage();
  let cur = ''; const found = []; const add = (kind, detail) => found.push({ page: cur, width: W, kind, detail });
  p.on('pageerror', (e) => add('script error', e.message.slice(0, 160)));
  p.on('response', (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) add('missing file', r.status() + ' ' + r.url().replace(B, '')); });
  await p.goto(B + 'UOHome.dc.html');
  await p.evaluate(() => { localStorage.setItem('fv.schema', '2'); localStorage.setItem('fv.auth.v1', JSON.stringify({ email: 'ada@example.com', name: 'Ada' })); sessionStorage.setItem('fv.staff', JSON.stringify({ email: 'tobi@finvora.app', name: 'Tobi' })); localStorage.setItem('fv.pathSeen', '99'); FV.REV.setProgress(3, false); FV.SIM.trade('buy', 'ADF', 20, 'qa1'); });
  const seen = new Set();
  for (const u of pages) {
    cur = u;
    try { await p.goto(B + u + '.dc.html', { waitUntil: 'networkidle', timeout: 20000 }); await p.waitForTimeout(700); } catch (e) { add('page did not load', e.message.slice(0, 80)); continue; }
    const landed = (p.url().match(/([A-Za-z]+)\.dc/) || [])[1] || u; if (seen.has(landed)) continue; seen.add(landed); cur = landed;
    await p.mouse.move(W - 5, H - 5);
    const r = await p.evaluate((touch) => {
      const out = []; const iw = document.documentElement.clientWidth, ih = innerHeight;
      const vis = (e) => { const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
      const inScroller = (e) => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (/(auto|scroll|hidden)/.test(s.overflowX)) return a; } return null; };
      const label = (e) => (e.getAttribute('aria-label') || e.textContent || e.tagName).replace(/\s+/g, ' ').trim().slice(0, 40);
      if (document.documentElement.scrollWidth > iw + 1) out.push(['sideways scroll', 'page is ' + document.documentElement.scrollWidth + 'px wide']);
      const t = document.body.innerText;
      (t.match(/\{\{[^}]{0,30}\}\}/g) || []).slice(0, 2).forEach((x) => out.push(['template text showing', x]));
      (t.match(/\b(undefined|NaN|\[object Object\])\b/g) || []).slice(0, 2).forEach((x) => out.push(['bad text showing', x]));
      const leaves = [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && e.textContent.trim() && vis(e) && !e.closest('svg'));
      leaves.forEach((e) => {
        const s = getComputedStyle(e), r = e.getBoundingClientRect();
        if (r.right > iw + 2 && !inScroller(e)) out.push(['runs off the edge', label(e)]);
        if (parseFloat(s.fontSize) < 12 && !e.closest('[aria-hidden="true"]')) out.push(['text under 12px', label(e) + ' ' + s.fontSize]);
        if ((e.scrollWidth > e.clientWidth + 2 && /(hidden|clip)/.test(s.overflowX) && s.textOverflow !== 'ellipsis') || (e.scrollHeight > e.clientHeight + 4 && /(hidden|clip)/.test(s.overflowY) && e.clientHeight > 0)) out.push(['text cut off', label(e)]);
      });
      const L = leaves.filter((e) => { const r = e.getBoundingClientRect(); return r.top < ih * 2 && r.bottom > 0; }).slice(0, 400);
      for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
        const a = L[i].getBoundingClientRect(), c = L[j].getBoundingClientRect();
        const ix = Math.min(a.right, c.right) - Math.max(a.left, c.left), iy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
        if (ix > 4 && iy > 4 && ix * iy > 0.3 * Math.min(a.width * a.height, c.width * c.height)) {
          const fa = getComputedStyle(L[i]).position, fb = getComputedStyle(L[j]).position;
          const pinned = (e) => { for (let a = e; a && a !== document.body; a = a.parentElement) { const st = getComputedStyle(a); if (st.position === 'fixed' || st.position === 'sticky' || +st.opacity === 0 || st.visibility === 'hidden') return true; } return false; };
          if (pinned(L[i]) || pinned(L[j])) continue; // content scrolling under a pinned bar, or a hidden sheet
          const blk = (e) => { let a = e; while (a && getComputedStyle(a).display.startsWith('inline')) a = a.parentElement; return a; };
          if (blk(L[i]) === blk(L[j])) continue; // inline runs in one wrapped paragraph
          const hit = [...L[i].getClientRects()].some((x) => [...L[j].getClientRects()].some((y) => Math.min(x.right, y.right) - Math.max(x.left, y.left) > 4 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 4));
          if (!hit) continue; // wrapped text: the outer box overlaps but no line does
          if (L[i].closest('[role=dialog],[role=alertdialog]') || L[j].closest('[role=dialog],[role=alertdialog]')) continue;
          out.push(['text overlaps text', label(L[i]) + ' / ' + label(L[j])]); if (out.filter((x) => x[0] === 'text overlaps text').length > 4) break;
        }
      }
      const ctrls = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=switch]')].filter(vis);
      ctrls.forEach((e) => {
        const r = e.getBoundingClientRect(); if (r.bottom < 0 || r.top > ih || r.right < 0 || r.left > iw) return;
        if (r.width <= 2 && r.height <= 2) return;
        const x = Math.min(iw - 1, Math.max(0, r.left + r.width / 2)), y = Math.min(ih - 1, Math.max(0, r.top + r.height / 2)); const hit = document.elementFromPoint(x, y);
        if (hit && hit !== e && !e.contains(hit) && !hit.contains(e)) { let fixed = false; for (let a = hit; a && a !== document.body; a = a.parentElement) { const ps = getComputedStyle(a).position; if (ps === 'fixed' || ps === 'sticky') { fixed = true; break; } } if (!fixed && !hit.closest('[role=dialog],[role=alertdialog]') && !e.closest('[aria-hidden="true"]')) out.push(['control covered by something', label(e) + ' (under ' + label(hit) + ')']); }
        if (touch) { const af = getComputedStyle(e, '::after'); const ext = af.content !== 'none' && af.position === 'absolute' ? (parseFloat(af.top) < 0 ? -2 * parseFloat(af.top) * (e.currentCSSZoom || 1) : 18) : 0; const inline = e.tagName === 'A' && e.closest('p'); if (!inline && r.width + ext < 44 && r.height + ext < 44 && !e.closest('[role=dialog] .fv-rbox')) out.push(['tap target under 44px', label(e) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)]); }
      });
      [...document.images].forEach((im) => { if (im.complete && im.naturalWidth === 0 && vis(im)) out.push(['broken image', im.getAttribute('src')]); });
      return out;
    }, touch);
    const uniq = new Set(); r.forEach(([k, d]) => { const key = k + d; if (!uniq.has(key)) { uniq.add(key); add(k, d); } });
    try { await p.screenshot({ path: path.join(OUT, 'qa-' + W + '-' + landed + '.png') }); } catch (e) {}
  }
  fs.writeFileSync(path.join(OUT, 'qa-' + W + '.json'), JSON.stringify(found, null, 1));
  const byKind = {}; found.forEach((f) => { byKind[f.kind] = (byKind[f.kind] || 0) + 1; });
  console.log('width', W, 'screens', seen.size, 'problems', found.length, JSON.stringify(byKind));
  await b.close();
})();
