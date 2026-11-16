// DRAFTS for owner approval (16 Nov 2026), not live: a redesigned phone Topic screen and laptop Library screen, drawn inside
// the real app frame (real sidebar and bottom bar) with the real guides from packages/sample-data. Skill: emil-design-eng.
// Usage: node tools/draft_library_redesign.cjs <base url> <out dir>
const { chromium, devices } = require('playwright');
const [B, OUT] = process.argv.slice(2);
const mono = "'Geist Mono', monospace";
const ICON = {
  'Money basics': '<path d="M3 7h18v10H3z"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4M18 10v4"/>',
  'Investing': '<path d="M4 19h16M6 15l4-4 3 3 5-6"/><path d="M15 8h3v3"/>',
  'The Nigerian market': '<path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/>',
  'Companies and reports': '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
};
const ico = (t, c = '#0B192C', s = 20) => '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICON[t] + '</svg>';
const chev = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E9AAE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
const check = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>';

function topicPhone(name, items, readSlugs) {
  const total = items.reduce((a, x) => a + x.min, 0), done = items.filter((x) => readSlugs.includes(x.slug)).length;
  const rows = items.map((x, i) => { const r = readSlugs.includes(x.slug);
    return '<a style="display:flex;gap:14px;align-items:flex-start;padding:16px;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:16px;text-decoration:none;color:#0B192C">'
      + '<span style="width:30px;height:30px;flex:none;border-radius:999px;display:flex;align-items:center;justify-content:center;font-family:' + mono + ';font-size:12px;' + (r ? 'background:#10B981' : 'background:#E8EBEF;color:#0B192C') + '">' + (r ? check : i + 1) + '</span>'
      + '<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px"><span style="font-size:16px;font-weight:600;line-height:1.3">' + x.title + '</span>'
      + '<span style="font-size:13px;line-height:1.45;color:#5B6577;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + x.def + '</span>'
      + '<span style="margin-top:4px;display:flex;gap:8px;font-size:12px;color:#5B6577"><span style="padding:2px 8px;border-radius:999px;background:#F1F3F5;font-family:' + mono + '">' + x.min + ' min</span><span style="padding:2px 8px;border-radius:999px;background:#F1F3F5">' + x.pts + ' key points</span>' + (r ? '<span style="padding:2px 8px;border-radius:999px;background:#DDF3E6;color:#047857">Read</span>' : '') + '</span></span>'
      + '<span style="align-self:center">' + chev + '</span></a>'; }).join('');
  // v2 (owner: "too heavy on top"): a light header, one meta line and a thin progress bar; the guides start high on the screen.
  return '<header style="padding:10px 20px 6px;display:flex;flex-direction:column;gap:10px"><div style="height:44px;display:flex;align-items:center;margin-left:-10px"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B192C" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg></div>'
    + '<div style="display:flex;align-items:center;gap:12px"><span style="width:40px;height:40px;flex:none;border-radius:12px;background:#E8EBEF;display:flex;align-items:center;justify-content:center">' + ico(name, '#0B192C', 20) + '</span><h1 style="margin:0;font-size:26px;font-weight:600;letter-spacing:-.02em">' + name + '</h1></div>'
    + '<div style="display:flex;align-items:center;gap:12px"><span style="font-size:14px;color:#5B6577;white-space:nowrap">' + items.length + ' guides · ' + total + ' min · <span style="color:#047857;font-weight:500">' + done + ' read</span></span><span style="flex:1;height:4px;border-radius:999px;background:#E5E7EB;overflow:hidden"><span style="display:block;height:100%;width:' + Math.round(done / items.length * 100) + '%;background:#10B981"></span></span></div></header>'
    + '<main style="padding:12px 16px 120px;display:flex;flex-direction:column;gap:10px">' + rows
    + '<a style="margin-top:6px;display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;background:#E8EBEF;text-decoration:none;color:#0B192C;font-size:15px;font-weight:500"><span style="width:28px;height:28px;border-radius:8px;background:#0B192C;display:flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="2"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/></svg></span><span style="flex:1">Ask Finvora about ' + name.toLowerCase() + '</span>' + chev + '</a></main>';
}

function libraryLaptop(T, wod, reading) {
  const all = Object.values(T).flat(), w = all.find((x) => x.slug === wod), r = all.find((x) => x.slug === reading);
  const card = 'background:#FFFFFF;border:1px solid #E5E7EB;border-radius:16px';
  const label = (t) => '<span style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#5B6577">' + t + '</span>';
  const topics = Object.entries(T).map(([n, items]) => '<a style="' + card + ';padding:20px;display:flex;flex-direction:column;gap:14px;text-decoration:none;color:#0B192C">'
    + '<span style="display:flex;align-items:center;gap:12px"><span style="width:40px;height:40px;border-radius:12px;background:#E8EBEF;display:flex;align-items:center;justify-content:center">' + ico(n) + '</span><span style="display:flex;flex-direction:column"><span style="font-size:16px;font-weight:600">' + n + '</span><span style="font-size:12px;color:#5B6577">' + items.length + ' guides · ' + items.reduce((a, x) => a + x.min, 0) + ' min</span></span></span>'
    + '<span style="display:flex;flex-direction:column;gap:8px;border-top:1px solid #EDEFF2;padding-top:12px">' + items.slice(0, 3).map((x) => '<span style="font-size:14px;color:#334155;display:flex;justify-content:space-between;gap:8px"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + x.title + '</span><span style="font-family:' + mono + ';font-size:12px;color:#8E9AAE">' + x.min + 'm</span></span>').join('') + (items.length > 3 ? '<span style="font-size:13px;color:#047857;font-weight:500">+ ' + (items.length - 3) + ' more</span>' : '') + '</span></a>').join('');
  const pop = [['stock-exchange', 'The Nigerian market'], ['inflation', 'Money basics'], ['revenue-and-profit', 'Companies and reports']].map(([s, t], i) => { const x = all.find((y) => y.slug === s);
    return '<a style="' + card + ';padding:18px 20px;display:flex;gap:16px;align-items:flex-start;text-decoration:none;color:#0B192C"><span style="font-family:' + mono + ';font-size:28px;line-height:1;color:#C0C6D0">' + (i + 1) + '</span><span style="display:flex;flex-direction:column;gap:6px;min-width:0"><span style="font-size:16px;font-weight:600">' + x.title + '</span><span style="font-size:13px;line-height:1.45;color:#5B6577;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + x.def + '</span><span style="font-size:12px;color:#5B6577">' + t + ' · ' + x.min + ' min</span></span></a>'; }).join('');
  return '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:24px"><div><h1 style="margin:0;font-size:28px;font-weight:600;letter-spacing:-.02em">Library</h1><p style="margin:6px 0 0;font-size:14px;color:#5B6577">' + all.length + ' short guides on money, investing and the NGX, in plain words.</p></div>'
    + '<label style="flex:0 1 520px;height:48px;display:flex;align-items:center;gap:10px;padding:0 16px;' + card + ';border-radius:12px;color:#8E9AAE;font-size:15px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B6577" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><span style="flex:1">Search any money word</span><span style="font-family:' + mono + ';font-size:12px;padding:3px 8px;border-radius:6px;background:#F1F3F5;color:#334155">A–Z</span></label></div>'
    + '<div style="display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:20px">'
    + '<a style="border-radius:20px;background:#0B192C;color:#FFFFFF;padding:26px 28px;display:flex;flex-direction:column;gap:12px;text-decoration:none"><span style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#00E676">Word of the day</span><span style="font-size:30px;font-weight:600;letter-spacing:-.02em">' + w.title + '</span><span style="font-size:16px;line-height:1.55;color:#C7D0DD;max-width:56ch">' + w.def + '</span><span style="margin-top:6px;align-self:flex-start;height:40px;padding:0 16px;border-radius:10px;background:#10B981;color:#FFFFFF;font-weight:600;font-size:14px;display:flex;align-items:center">Read in ' + w.min + ' min</span></a>'
    + '<a style="' + card + ';padding:22px 24px;display:flex;flex-direction:column;gap:10px;text-decoration:none;color:#0B192C">' + label('Continue reading') + '<span style="font-size:20px;font-weight:600">' + r.title + '</span><span style="font-size:14px;line-height:1.5;color:#5B6577">' + r.def + '</span><span style="margin-top:auto;display:flex;align-items:center;gap:10px"><span style="flex:1;height:6px;border-radius:999px;background:#EDEFF2;overflow:hidden"><span style="display:block;height:100%;width:40%;background:#10B981"></span></span><span style="font-family:' + mono + ';font-size:12px;color:#5B6577">40%</span></span></a></div>'
    + '<div style="display:flex;flex-direction:column;gap:12px">' + label('Browse by topic') + '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px">' + topics + '</div></div>'
    + '<div style="display:flex;flex-direction:column;gap:12px">' + label('Popular this week') + '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px">' + pop + '</div></div>';
}

(async () => {
  const b = await chromium.launch();
  const seed = (c) => c.addInitScript(() => { try { localStorage.setItem('fv.auth.v1', JSON.stringify({ email: 'ada@example.com', name: 'Ada Okafor', goal: 'Investing', birth: '2001-03-14', asked: true })); } catch (e) {} });
  const pc = await b.newContext({ ...devices['Pixel 7'], deviceScaleFactor: 2, serviceWorkers: 'block' }); await seed(pc); const p = await pc.newPage();
  await p.goto(B + 'TopicNavy.dc.html?t=Investing'); await p.waitForTimeout(1300);
  const data = await p.evaluate(() => { const L = FV.LIB, T = {}; L.all().forEach((a) => { const t = L.topicOf(a).name; (T[t] = T[t] || []).push({ slug: a.slug, title: a.title, def: a.definition, min: L.minutes(a), pts: ((a.deep || {}).takeaways || []).length }); }); return { T, wod: L.wordOfDay().slug }; });
  await p.evaluate((h) => { const root = document.querySelector('#dc-root > .sc-host > :first-child'), nav = root.querySelector('nav[aria-label="Main"]');
    [...root.children].forEach((k) => { if (k !== nav) k.remove(); }); root.style.overflowY = 'auto'; root.insertAdjacentHTML('afterbegin', h); }, topicPhone('Investing', data.T.Investing, ['compound-interest', 'risk-and-return']));
  await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/topic-phone-draft.png' });
  for (const W of [1440, 1920]) {
    const lc = await b.newContext({ viewport: { width: W, height: W > 1500 ? 1080 : 900 }, serviceWorkers: 'block' }); await seed(lc); const q = await lc.newPage();
    await q.goto(B + 'LibraryLaptopNavy.dc.html'); await q.waitForTimeout(1300);
    await q.evaluate((h) => { const m = document.querySelector('#dc-root aside + main'); m.innerHTML = h; m.style.gap = '28px'; }, libraryLaptop(data.T, data.wod, 'inflation'));
    await q.waitForTimeout(300); await q.screenshot({ path: OUT + '/library-laptop-draft-' + W + '.png' }); await lc.close();
  }
  await b.close(); console.log('drafts drawn');
})();
