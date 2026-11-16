// Button text check (break-ui, dev-only): flags buttons whose text touches the edges, spills out, or wraps inside a fixed height.
// Usage: node tools/break_ui/buttons.cjs <base url> <state: demo|worst> <width> <boards...>  (FV_DONE=n sets lessons done for demo)
const { chromium } = require('playwright');
const [B, state, W, ...boards] = process.argv.slice(2);
const fixture = require('./fixture.cjs');
(async () => {
  const b = await chromium.launch(); const w = +W, out = [];
  const p = await b.newPage({ viewport: { width: w, height: w >= 1024 ? 900 : 844 } });
  await p.goto(B + 'index.html'); await p.waitForTimeout(300);
  await p.evaluate((f) => { localStorage.clear(); Object.entries(f).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); const v = localStorage.getItem('fv.bill.v1'); if (v) localStorage.setItem('fv.billing.v1', v); }, fixture(state));
  for (const bd of boards) {
    await p.goto(B + bd + '.dc.html'); await p.waitForTimeout(1000);
    const r = await p.evaluate(() => { const bad = [];
      document.querySelectorAll('#dc-root a, #dc-root button, #dc-root [role="button"]').forEach((e) => {
        if (!e.offsetParent || e.offsetHeight < 28) return; const cs = getComputedStyle(e);
        const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let tn = 0; while (tw.nextNode()) if (tw.currentNode.textContent.trim()) tn++; if (tn !== 1) return; // a single label, not a row or card
        const filled = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(cs.borderTopWidth) > 0; if (!filled) return;
        const rg = document.createRange(); rg.selectNodeContents(e); const rs = [...rg.getClientRects()].filter((x) => x.width > 1); if (!rs.length) return;
        const box = e.getBoundingClientRect(), L = Math.min(...rs.map((x) => x.left)), R = Math.max(...rs.map((x) => x.right)), T = Math.min(...rs.map((x) => x.top)), Bt = Math.max(...rs.map((x) => x.bottom));
        const tops = new Set(rs.map((x) => Math.round(x.top / 4))), txt = e.textContent.trim().replace(/\s+/g, ' ').slice(0, 50); if (!txt) return;
        const why = [];
        if (L < box.left - 1 || R > box.right + 1 || T < box.top - 1 || Bt > box.bottom + 1) why.push('spills out');
        else if ((L - box.left < 6 || box.right - R < 6) && box.width > 60) why.push('touches edge');
        if (tops.size > 1 && /(^|;)\s*height:/.test(e.getAttribute('style') || '')) why.push('wraps in fixed height');
        if (why.length) bad.push(why.join(', ') + ': "' + txt + '"'); });
      return bad; });
    r.forEach((x) => out.push(bd + ' : ' + x));
  }
  console.log(out.length ? out.join('\n') : 'no button text faults'); await b.close();
})();
