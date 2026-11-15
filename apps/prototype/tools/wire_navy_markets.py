"""Wire Markets, Companies, the Company page, Compare, the practice watchlist, the inflation calculator,
Search prices and Home's 'Your companies' (build plan §4.9) to window.FV.
Prices: the same illustrative seeded prices as the practice market (FV.SIM), for the companies in
packages/sample-data. Rows for companies not in the data keep their drawn figures.
Company page: the drawn statistics, statements and news are Zenith Bank's, so they show only for Zenith;
other companies show their own description from the data. Views, compares and the watchlist are kept in
fv.activity.v1 / FV.PLUS for 'Your companies'. Usage: python3 wire_navy_markets.py <site folder>"""
import os, re, sys
SITE = sys.argv[1]
def path(n): return os.path.join(SITE, n)
def rd(n): return open(path(n + '.dc.html')).read()
def wr(n, s): open(path(n + '.dc.html'), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing in board: ' + a[:120])
    return s.replace(a, b, 1)
def logic(s, js):
    a = s.index('class Component extends DCLogic'); b = s.index('</script>', a)
    return s[:a] + 'class Component extends DCLogic {\n' + js + '\n}\n' + s[b:]
MARK = '/* navy-markets */'
TICKERS = ['MTNN', 'DANGCEM', 'ZENITHBANK', 'GTCO', 'NESTLE', 'AIRTELAFRI', 'SEPLAT', 'NB']
PRICE_JS = '''  S() { return window.FV && window.FV.SIM; }
  n(k) { return '₦' + (k / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  px() { const S = this.S(), v = { p: {}, c: {}, bg: {}, fg: {} }; if (!S) return v;
    S.COMPANIES.forEach((co) => { const ch = S.change(co.t); v.p[co.t] = this.n(S.price(co.t)); v.c[co.t] = (ch >= 0 ? '▲ ' : '▼ ') + Math.abs(ch).toFixed(1) + '%'; v.bg[co.t] = ch >= 0 ? '#DDF3E6' : '#FCEDEB'; v.fg[co.t] = ch >= 0 ? '#047857' : '#B9473F'; }); return v; }
'''
def bind_rows(s, tag='a'):
    """Each drawn row that names a ticker we have data for: link it to the company page and bind its price and change."""
    out, pos = [], 0
    for m in re.finditer(r'<a href="(?:CompanyNavy|PracticeCompanyNavy)\.dc\.html"[^>]*>.*?</a>', s, flags=re.S):
        row = m.group(0); t = next((x for x in TICKERS if '>' + x + '<' in row), None)
        out.append(s[pos:m.start()]); pos = m.end()
        if not t: out.append(row); continue
        row = re.sub(r'href="(CompanyNavy|PracticeCompanyNavy)\.dc\.html"', r'href="\1.dc.html?t=' + t + '"', row, count=1)
        row = re.sub(r'>₦[0-9,]+\.\d\d<', '>{{p.' + t + '}}<', row, count=1)
        row = re.sub(r'background: #(?:DDF3E6|FCEDEB); color: #(?:047857|B9473F)">[▲▼] [0-9.]+%', 'background: {{bg.' + t + '}}; color: {{fg.' + t + '}}">{{c.' + t + '}}', row, count=1)
        row = re.sub(r'color: #(?:10B981|047857|B9473F)">[▲▼] [0-9.]+%', 'color: {{fg.' + t + '}}">{{c.' + t + '}}', row, count=1)
        out.append(row)
    out.append(s[pos:]); return ''.join(out)

for name in ['MarketsNavy', 'CompaniesNavy', 'MarketsLaptopNavy']:
    s = rd(name)
    if MARK in s: continue
    s = bind_rows(s)
    if name == 'MarketsNavy':
        s = sub1(s, '<a href="CompanyNavy.dc.html"', '<a href="CompanyNavy.dc.html"') if '<a href="CompanyNavy.dc.html"' in s else s
    js = MARK + '\n' + PRICE_JS + '  renderVals() { return this.px(); }'
    if 'renderVals() { return {}; }' in s or 'renderVals() {\n    return {};' in s:
        s = logic(s, js)
    else:
        s = logic(s, js)
    wr(name, s)

# Company page
s = rd('CompanyNavy')
if MARK not in s:
    for old, new in [('padding: 3px 7px; border: 1px solid #D5D9E0; border-radius: 6px">ZENITHBANK<', 'padding: 3px 7px; border: 1px solid #D5D9E0; border-radius: 6px">{{t}}<'), ('>NGX · Banking<', '>NGX · {{sector}}<'), ('>Zenith Bank Plc</h1>', '>{{name}}</h1>'),
                     ('font-size: 32px; font-weight: 500; letter-spacing: -0.02em">₦48.20<', 'font-size: 32px; font-weight: 500; letter-spacing: -0.02em">{{price}}<'), ('font-size: 14px; color: #047857">▲ 1.58 (3.4%)<', 'font-size: 14px; color: {{fg}}">{{chg}}<'), ('Ask Finvora about Zenith Bank</a>', '{{askT}}</a>')]:
        s = sub1(s, old, new)
    s = sub1(s, '<button aria-label="Add to watchlist" style="', '<button type="button" aria-label="{{watchLabel}}" aria-pressed="{{watched}}" onClick="{{toggleWatch}}" style="cursor: pointer; opacity: {{watchOp}}; ')
    a = s.index('<section style="padding: 26px 20px 0">\n    <h2 style="margin: 0 0 12px; font-size: 16px; font-weight: 600">Key statistics</h2>')
    b = s.rindex('</section>', 0, s.index('</x-dc>')) + len('</section>')
    other = '<section style="padding: 26px 20px 0"><h2 style="margin: 0 0 8px; font-size: 16px; font-weight: 600">About</h2><p style="margin: 0; font-size: 15px; line-height: 1.6; color: #334155">{{about}}</p><h2 style="margin: 20px 0 8px; font-size: 16px; font-weight: 600">How it makes money</h2><p style="margin: 0; font-size: 15px; line-height: 1.6; color: #334155">{{how}}</p><p style="margin: 14px 0 0; font-size: 12px; color: #5B6577">Finvora explains companies; it does not tell you what to buy or sell.</p></section>'
    s = s[:a] + '<sc-if value="{{isZen}}" hint-placeholder-val="{{ true }}">' + s[a:b] + '</sc-if><sc-if value="{{notZen}}" hint-placeholder-val="{{ false }}">' + other + '</sc-if>' + s[b:]
    s = s.replace('<a href="AskFinvoraNavy.dc.html"', '<a href="{{askHref}}"', 1)
    a = s.index('class Component extends DCLogic'); body = s[a:s.index('</script>', a)]
    old_render = body[body.index('renderVals() {') + len('renderVals() {'):body.rindex('}', 0, body.rindex('}'))]
    s = logic(s, MARK + '\n' + PRICE_JS + '''  tk() { const m = /[?&]t=([A-Z]+)/.exec(location.search); return m ? m[1] : 'ZENITHBANK'; }
  constructor(p) { super(p); this.state = { n: 0 }; try { const k = 'fv.activity.v1', a = JSON.parse(localStorage.getItem(k) || '{}'), d = new Date(Date.now() + 3600000).toISOString().slice(0, 10), t = this.tk(); a.views = a.views || {}; a.views[t] = (a.views[t] || []).concat([d]).slice(-50); localStorage.setItem(k, JSON.stringify(a)); } catch (e) {} }
  drawn() {''' + old_render + '''}
  renderVals() {
    const S = this.S(), t = this.tk(), base = this.drawn(); if (!S) return base;
    const co = (window.FVD.COMPANIES || []).filter((x) => x.ticker === t)[0] || {}, p = S.price(t), q = S.prev(t), ch = S.change(t), P = window.FV.PLUS, w = P ? P.lists()[0].tickers.indexOf(t) >= 0 : false;
    return Object.assign(base, { t, sector: co.sector || '', name: co.name || t, price: this.n(p), chg: (p >= q ? '▲ ' : '▼ ') + (Math.abs(p - q) / 100).toFixed(2) + ' (' + Math.abs(ch).toFixed(1) + '%)', fg: ch >= 0 ? '#047857' : '#B9473F',
      isZen: t === 'ZENITHBANK', notZen: t !== 'ZENITHBANK', about: co.about || '', how: co.howItMakesMoney || '',
      askT: 'Ask Finvora about ' + (co.name || t), askHref: 'AskFinvoraNavy.dc.html?q=' + encodeURIComponent('How does ' + (co.name || t) + ' make money?'),
      watched: String(w), watchLabel: w ? 'Remove from watchlist' : 'Add to watchlist', watchOp: w ? '1' : '.75', toggleWatch: () => { if (P) P.toggle(0, t); this.setState({ n: this.state.n + 1 }); } });
  }''')
    wr('CompanyNavy', s)

# Compare: live prices for the two drawn companies; records the comparison for Your companies.
s = rd('CompareNavy')
if MARK not in s:
    s = re.sub(r'>₦48\.20<', '>{{p.ZENITHBANK}}<', s, count=1); s = re.sub(r'>₦52\.10<', '>{{p.GTCO}}<', s, count=1)
    s = logic(s, MARK + '\n' + PRICE_JS + "  constructor(p) { super(p); try { const k = 'fv.activity.v1', a = JSON.parse(localStorage.getItem(k) || '{}'); a.compared = { ZENITHBANK: 'GTCO', GTCO: 'ZENITHBANK' }; localStorage.setItem(k, JSON.stringify(a)); } catch (e) {} }\n  renderVals() { return this.px(); }")
    wr('CompareNavy', s)

# Search: prices for the drawn bank list.
s = rd('SearchNavy')
if 'pxS' not in s:
    s = sub1(s, "      co: c.map(([n, t, p, d, up]) => ({ n, t, p, d, col: up ? '#10B981' : '#B9473F' })),", "      co: c.map(([n, t, p, d, up]) => { const S = window.FV && window.FV.SIM, has = S && S.COMPANIES.some((x) => x.t === t), ch = has ? S.change(t) : 0; return has ? { n, t, p: '₦' + (S.price(t) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 }), d: (ch >= 0 ? '▲ ' : '▼ ') + Math.abs(ch).toFixed(1) + '%', col: ch >= 0 ? '#10B981' : '#B9473F' } : { n, t, p, d, col: up ? '#10B981' : '#B9473F' }; }), pxS: 1,")
    wr('SearchNavy', s)

# Watchlist (practice)
s = rd('PracticeWatchlistNavy')
if MARK not in s:
    a = s.index('<a href="PracticeCompanyNavy.dc.html"'); last = a
    for m in re.finditer(r'<a href="PracticeCompanyNavy\.dc\.html".*?</a>', s[a:], flags=re.S): last = a + m.end()
    row = re.search(r'<a href="PracticeCompanyNavy\.dc\.html".*?</a>', s[a:], flags=re.S).group(0)
    row = row.replace('<a href="PracticeCompanyNavy.dc.html"', '<a href="{{x.href}}"', 1)
    row = re.sub(r'>ZEN<', '>{{x.ab}}<', row, count=1); row = row.replace('>Zenith Bank<', '>{{x.name}}<', 1).replace('>ZENITHBANK<', '>{{x.t}}<', 1)
    row = re.sub(r'>Alert ₦50\.00<', '>{{x.alert}}<', row, count=1); row = re.sub(r'>₦48\.20<', '>{{x.p}}<', row, count=1)
    row = re.sub(r'background: #DDF3E6; color: #047857">▲ 3\.4%', 'background: {{x.bg}}; color: {{x.fg}}">{{x.c}}', row, count=1)
    s = s[:a] + '<sc-for list="{{rows}}" as="x" hint-placeholder-count="3">' + row + '</sc-for>' + s[last:]
    s = sub1(s, "Watching</span><span style=\"font-family: 'Geist Mono', monospace; font-size: 18px\">3</span>", "Watching</span><span style=\"font-family: 'Geist Mono', monospace; font-size: 18px\">{{nW}}</span>")
    s = sub1(s, "Up today</span><span style=\"font-family: 'Geist Mono', monospace; font-size: 18px; color: #00E676\">2</span>", "Up today</span><span style=\"font-family: 'Geist Mono', monospace; font-size: 18px; color: #00E676\">{{nUp}}</span>")
    s = sub1(s, "Alerts on</span><span style=\"font-family: 'Geist Mono', monospace; font-size: 18px\">1</span>", "Alerts on</span><span style=\"font-family: 'Geist Mono', monospace; font-size: 18px\">{{nAl}}</span>")
    s = logic(s, MARK + '\n' + PRICE_JS + '''  renderVals() {
    const S = this.S(), P = window.FV && window.FV.PLUS; if (!S || !P) return { rows: [] };
    let T = P.lists()[0].tickers.filter((t) => S.COMPANIES.some((c) => c.t === t)); const sug = !T.length; if (sug) T = ['ZENITHBANK', 'GTCO', 'SEPLAT'];
    return { nUp: String(sug ? 0 : T.filter((t) => S.change(t) >= 0).length), nAl: '0', nW: String(sug ? 0 : T.length), rows: T.map((t) => { const c = S.company(t), ch = S.change(t); return { href: 'PracticeCompanyNavy.dc.html?t=' + t, ab: t.slice(0, 3), name: c.name, t, alert: sug ? 'Tap to add' : 'Set alert', p: this.n(S.price(t)), c: (ch >= 0 ? '▲ ' : '▼ ') + Math.abs(ch).toFixed(1) + '%', bg: ch >= 0 ? '#DDF3E6' : '#FCEDEB', fg: ch >= 0 ? '#047857' : '#B9473F' }; }) };
  }''')
    wr('PracticeWatchlistNavy', s)

# Inflation calculator
s = rd('InflationToolNavy')
if MARK not in s:
    s = sub1(s, 'padding: 0 14px; font-family: \'Geist Mono\', monospace; font-size: 18px">₦100,000</span>', 'padding: 0 14px; font-family: \'Geist Mono\', monospace; font-size: 18px">₦<input inputmode="numeric" aria-label="Amount" value="{{amt}}" onInput="{{onAmt}}" style="flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font: inherit; font-size: 18px; color: #0B192C"></span>')
    s = sub1(s, 'padding: 0 14px; font-family: \'Geist Mono\', monospace; font-size: 18px">25%</span>', 'padding: 0 14px; font-family: \'Geist Mono\', monospace; font-size: 18px"><input inputmode="decimal" aria-label="Inflation a year, percent" value="{{rate}}" onInput="{{onRate}}" style="flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font: inherit; font-size: 18px; color: #0B192C">%</span>')
    a = s.index('<span style="margin-top: 10px; display: flex; gap: 6px">'); b = s.index('</span></label>', a)
    s = s[:a] + '<span role="radiogroup" aria-label="Years" style="margin-top: 10px; display: flex; gap: 6px"><sc-for list="{{yrs}}" as="y" hint-placeholder-count="4"><button type="button" role="radio" aria-checked="{{y.on}}" onClick="{{y.pick}}" style="flex: 1; height: 40px; border-radius: 10px; border: 1px solid {{y.bd}}; background: {{y.bg}}; color: {{y.fg}}; display: flex; align-items: center; justify-content: center; font: inherit; font-size: 14px; cursor: pointer">{{y.n}}</button></sc-for></span>' + s[b + 7:]
    s = sub1(s, '>In 3 years ₦100,000 buys what<', '>{{lbl}}<')
    s = sub1(s, 'font-size: 30px; font-weight: 500">₦51,200<', 'font-size: 30px; font-weight: 500">{{res}}<')
    s = re.sub(r'buys today\. It loses 48\.8% of its value\.', '{{tail}}', s, count=1)
    s = logic(s, MARK + '''
  constructor(p) { super(p); this.state = { amt: '100,000', rate: '25', y: 3 }; }
  renderVals() {
    const a = +String(this.state.amt).replace(/[^0-9]/g, '') || 0, r = Math.max(0, +this.state.rate || 0), y = this.state.y;
    const val = Math.round(a / Math.pow(1 + r / 100, y)), loss = a ? (1 - val / a) * 100 : 0, f = (x) => '₦' + x.toLocaleString('en-NG');
    return { amt: this.state.amt, rate: this.state.rate, onAmt: (e) => { const d = e.target.value.replace(/[^0-9]/g, ''); this.setState({ amt: d ? Number(d).toLocaleString('en-NG') : '' }); }, onRate: (e) => this.setState({ rate: e.target.value.replace(/[^0-9.]/g, '').slice(0, 5) }),
      yrs: [1, 3, 5, 10].map((n) => ({ n: String(n), on: String(n === y), bd: n === y ? '#0B192C' : '#E5E7EB', bg: n === y ? '#0B192C' : '#FFFFFF', fg: n === y ? '#FFFFFF' : '#0B192C', pick: () => this.setState({ y: n }) })),
      lbl: 'In ' + y + (y === 1 ? ' year ' : ' years ') + f(a) + ' buys what', res: f(val), tail: 'buys today. It loses ' + loss.toFixed(1) + '% of its value.' };
  }''')
    wr('InflationToolNavy', s)

# Home: Your companies from views, the watchlist and compares (build plan §4.9).
s = rd('HomeNavy')
if 'yourCompanies' not in s:
    a = s.index('<div style="display: flex; gap: 10px; overflow-x: auto; margin: 0 -20px; padding: 0 20px 2px">'); b = s.index('</div>', s.index('You compared it with Zenith', a)) + 6
    seg = s[a:b]; card = re.search(r'<a href="CompanyNavy\.dc\.html".*?</a>', seg, flags=re.S).group(0)
    card = card.replace('<a href="CompanyNavy.dc.html"', '<a href="{{y.href}}"', 1).replace('>ZEN<', '>{{y.ab}}<', 1).replace('>Zenith Bank<', '>{{y.name}}<', 1).replace('>₦48.20<', '>{{y.p}}<', 1).replace('<span style="font-size: 12px; color: #047857">▲ 3.4%</span>', '<span style="font-size: 12px; color: {{y.fg}}">{{y.c}}</span>', 1).replace('>Viewed 6 times this week<', '>{{y.why}}<', 1)
    s = s[:a] + '<div style="display: flex; gap: 10px; overflow-x: auto; margin: 0 -20px; padding: 0 20px 2px"><sc-for list="{{yours}}" as="y" hint-placeholder-count="3">' + card + '</sc-for></div>' + s[b:]
    s = sub1(s, 'Zenith Bank declared an interim dividend of ₦1.00', '{{newsLine}}')
    s = sub1(s, "return { askDraft:", "const yourCompanies = this.yc();\n    return { yours: yourCompanies.list, newsLine: 'Zenith Bank declared an interim dividend of ₦1.00', askDraft:")
    s = sub1(s, "  constructor(p) { super(p); this.state = { q: '' }; }", """  constructor(p) { super(p); this.state = { q: '' }; }
  yc() {
    const S = window.FV && window.FV.SIM, P = window.FV && window.FV.PLUS; if (!S) return { list: [] };
    let a = {}; try { a = JSON.parse(localStorage.getItem('fv.activity.v1') || '{}'); } catch (e) {}
    const wk = new Date(Date.now() + 3600000 - 6 * 86400000).toISOString().slice(0, 10), score = {}, why = {};
    Object.keys(a.views || {}).forEach((t) => { const n = a.views[t].filter((d) => d >= wk).length; if (n) { score[t] = n * 2; why[t] = 'Viewed ' + n + (n === 1 ? ' time' : ' times') + ' this week'; } });
    (P ? P.lists()[0].tickers : []).forEach((t) => { score[t] = (score[t] || 0) + 3; why[t] = why[t] || 'On your watchlist'; });
    Object.keys(a.compared || {}).forEach((t) => { if (!why[t]) { score[t] = (score[t] || 0) + 1; why[t] = 'You compared it with ' + S.company(a.compared[t]).name.split(' ')[0]; } });
    let T = Object.keys(score).filter((t) => S.COMPANIES.some((c) => c.t === t)).sort((x, y) => score[y] - score[x]).slice(0, 3);
    if (!T.length) { T = ['ZENITHBANK', 'MTNN', 'GTCO']; T.forEach((t) => { why[t] = 'Popular this week'; }); }
    return { list: T.map((t) => { const ch = S.change(t); return { href: 'CompanyNavy.dc.html?t=' + t, ab: t.slice(0, 3), name: S.company(t).name, p: '₦' + (S.price(t) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 }), c: (ch >= 0 ? '▲ ' : '▼ ') + Math.abs(ch).toFixed(1) + '%', fg: ch >= 0 ? '#047857' : '#B9473F', why: why[t] }; }) };
  }""")
    wr('HomeNavy', s)
print('wired')
