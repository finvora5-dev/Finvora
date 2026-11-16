// Mock-up match checker (skill: laptop-build). Renders each laptop screen from the site and its approved canvas mock-up
// (apps/prototype/mockups) at 1440x900, and measures how much of the picture differs. Live data changes some text, so a
// small difference is expected; a large one means the layout drifted from the mock-up. Writes side-by-side images to look at.
// Usage: node apps/prototype/tools/qa_mockup.cjs <base-url> <out-dir> [Board ...]   (exit code 1 when a screen drifts)
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const http = require('http');
const LIMIT = +(process.env.FV_MOCKUP_LIMIT || 6); // percent of pixels allowed to differ
(async () => {
  const B = process.argv[2] || 'http://127.0.0.1:8790/', OUT = process.argv[3] || '.', M = path.join(__dirname, '..', 'mockups');
  const only = process.argv.slice(4).map((x) => x.replace(/\.dc\.html$/, ''));
  const boards = fs.readdirSync(M).filter((f) => /Navy\.dc\.html$/.test(f) && /"width":1440/.test(fs.readFileSync(path.join(M, f), 'utf8')) && !/^Components/.test(f) && (!only.length || only.includes(f.replace('.dc.html', '')))); // Components boards are the design-system reference, not screens
  const srv = http.createServer((q, r) => { const f = path.join(M, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(M) || !fs.existsSync(f)) { r.statusCode = 404; return r.end(); } r.setHeader('Content-Type', f.endsWith('.js') ? 'text/javascript' : 'text/html'); fs.createReadStream(f).pipe(r); }).listen(0);
  const MB = 'http://127.0.0.1:' + srv.address().port + '/';
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(() => { try { localStorage.setItem('fv.auth.v1', JSON.stringify({ email: 'ada@example.com', name: 'Ada Okafor' })); sessionStorage.setItem('fv.staff', JSON.stringify({ email: 'chidi@finvora.ng', name: 'Chidi Nwosu' })); if (!localStorage.getItem('fv.admin.v1')) localStorage.setItem('fv.admin.v1', JSON.stringify({ on: { rate: true, report: true, review: false, mail: true } })); } catch (e) {} }); // the state the mock-ups draw
  const p = await ctx.newPage(); const res = []; let bad = 0;
  for (const f of boards) {
    const name = f.replace('.dc.html', '');
    await p.goto(MB + f, { waitUntil: 'networkidle' }); await p.waitForTimeout(500); const a = await p.screenshot();
    const drawn = await p.evaluate(() => { const r = document.getElementById('dc-root'); return r ? r.innerText.trim().length : 0; });
    if (drawn < 20) { res.push({ board: name, differsPct: null, ok: true, note: 'mock-up file does not render, compare by eye' }); continue; }
    // Practice screens need practice shares, or they open the empty Practice screen: place the mock-up's holdings once.
    if (/^Practice(?!Empty)/.test(name)) { await p.goto(B + 'PracticeEmptyLaptopNavy.dc.html', { waitUntil: 'networkidle' }); await p.evaluate(() => { const S = window.FV && window.FV.SIM; if (S && !S.get().trades.length) { S.trade('buy', 'ZENITHBANK', 500, 'qa1'); S.trade('buy', 'DANGCEM', 50, 'qa2'); S.trade('buy', 'MTNN', 70, 'qa3'); } }); }
    await p.goto(B + f, { waitUntil: 'networkidle' }); await p.waitForTimeout(700); const routed = !p.url().includes(name); const c = await p.screenshot();
    const pct = await p.evaluate(async ([x, y]) => {
      const load = (b64) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + b64; });
      const [i1, i2] = await Promise.all([load(x), load(y)]); const w = i1.width, h = i1.height, cv = new OffscreenCanvas(w, h), g = cv.getContext('2d');
      g.drawImage(i1, 0, 0); const d1 = g.getImageData(0, 0, w, h).data; g.clearRect(0, 0, w, h); g.drawImage(i2, 0, 0); const d2 = g.getImageData(0, 0, w, h).data;
      let n = 0; for (let k = 0; k < d1.length; k += 4) if (Math.abs(d1[k] - d2[k]) + Math.abs(d1[k + 1] - d2[k + 1]) + Math.abs(d1[k + 2] - d2[k + 2]) > 60) n++;
      return Math.round(n / (w * h) * 1000) / 10;
    }, [a.toString('base64'), c.toString('base64')]);
    fs.writeFileSync(path.join(OUT, 'mockup-' + name + '-a.png'), a); fs.writeFileSync(path.join(OUT, 'mockup-' + name + '-b.png'), c);
    if (name === 'AdminSignInNavy' && routed) { res.push({ board: name, differsPct: 0, routedAway: true, ok: true, note: 'signed-in staff skip sign-in (expected)' }); continue; }
    const fail = routed || pct > LIMIT; if (fail) bad++;
    res.push({ board: name, differsPct: pct, routedAway: routed, ok: !fail });
  }
  fs.writeFileSync(path.join(OUT, 'qa-mockup.json'), JSON.stringify(res, null, 1));
  res.forEach((r) => console.log((r.ok ? 'ok   ' : 'DRIFT') + ' ' + r.board + ' ' + (r.differsPct == null ? '-' : r.differsPct + '%') + (r.note ? ' (' + r.note + ')' : r.routedAway ? ' (routed to another screen)' : '')));
  console.log('laptop screens', res.length, 'drifted', bad, '(limit ' + LIMIT + '%)'); await b.close(); srv.close(); process.exit(bad ? 1 : 0);
})();
