// App icons for the installable app: the Finvora leaf mark on the app's navy. Usage: node tools/build_pwa_icons.cjs <site>
// "maskable" keeps the mark inside the middle 60% so Android can crop it to any shape.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const SITE = process.argv[2]; const src = fs.readFileSync(path.join(SITE, 'HomeLaptopNavy.dc.html'), 'utf8');
const i = src.indexOf('aria-label="Finvora"'); const svg = src.slice(src.indexOf('<svg', i), src.indexOf('</svg>', i) + 6).replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"');
(async () => {
  fs.mkdirSync(path.join(SITE, 'icons'), { recursive: true }); const b = await chromium.launch();
  for (const [name, size, pct] of [['icon-192', 192, 58], ['icon-512', 512, 58], ['icon-maskable-512', 512, 46], ['apple-touch-icon', 180, 58]]) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent('<body style="margin:0;width:100vw;height:100vh;background:#0B192C;display:flex;align-items:center;justify-content:center"><div style="width:' + pct + '%;height:' + pct + '%">' + svg + '</div></body>');
    await p.screenshot({ path: path.join(SITE, 'icons', name + '.png') }); await p.close(); console.log('icon', name);
  }
  await b.close();
})();
