"""Wire the phone simulator boards to the real simulator store (window.FV.SIM, rules from fvd.js).
Run once on apps/prototype/site; it refuses to run twice on a board (marker check)."""
import re, sys, os, glob
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing in board: ' + a[:90])
    return s.replace(a, b, 1)
def logic(s, js):
    return sub1(s, s[s.index('class Component extends DCLogic {'):s.index('</script>', s.index('class Component extends DCLogic {'))], 'class Component extends DCLogic {\n' + js + '\n}\n')
LOGO = 'width: 44px; height: 44px; flex: none; border-radius: 12px; background: {{%s.color}}; color: #FFFFFF; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center'
TAG = '<span class="tag num" style="background: {{%s.tagBg}}; color: {{%s.tagFg}}">{{%s.chg}}</span>'
# Shared helpers for every simulator board.
H = '''  sim() { return window.FV && window.FV.SIM; }
  row(c, extra) {
    const S = this.sim(), ch = S.change(c.t), up = ch >= 0;
    return Object.assign({ t: c.t, name: c.name, label: c.label, color: c.color, href: 'USimCompany.dc.html?t=' + c.t,
      price: S.naira(S.price(c.t)), chg: (up ? '\\u25b2 ' : '\\u25bc ') + Math.abs(ch).toFixed(1) + '%',
      tagBg: up ? '#DCFAE6' : '#FFE4E2', tagFg: up ? '#0F6B39' : '#B42828' }, extra || {});
  }'''
MARK = 'window.FV && window.FV.SIM'

# ---------- Portfolio (USimHome) ----------
s = rd('USimHome')
if MARK not in s:
    s = sub1(s, '₦104,320</div>', '{{total}}</div>')
    s = sub1(s, '>▲ ₦4,320 (4.3%) since you started</span>', '>{{pl}} since you started</span>')
    s = sub1(s, '₦64,120</div>', '{{cash}}</div>')
    s = sub1(s, '₦40,200</div>', '{{invested}}</div>')
    a = s.index('<div class="card" style="overflow: hidden">', s.index('Your holdings')); b = s.index('</div>\n', s.index('</a>\n    </div>', a)) + 6
    s = s[:a] + '''<sc-if value="{{has}}" hint-placeholder-val="{{true}}"><div class="card" style="overflow: hidden">
      <sc-for list="{{rows}}" as="h" hint-placeholder-count="2"><a href="{{h.href}}" class="li press"><span style="''' + LOGO % 'h' + '''">{{h.t}}</span><span style="flex: 1"><strong style="display: block">{{h.name}}</strong><span class="muted num" style="font-size: 13px">{{h.qty}}</span></span><span style="text-align: right"><strong class="num" style="display: block">{{h.value}}</strong>''' + TAG % ('h', 'h', 'h') + '''</span></a></sc-for>
    </div></sc-if>
    <sc-if value="{{none}}" hint-placeholder-val="{{false}}"><p class="card muted" style="margin: 0; padding: 14px 16px; font-size: 14px">You don't own any shares right now. Find a company to practise with.</p></sc-if>
''' + s[b:]
    s = logic(s, H + '''
  componentDidMount() {
    const S = this.sim(), p = location.pathname;
    // First visit: show the welcome screen (not when this board sits behind a pop-up).
    if (S && !S.started() && /(USimHome|UDSimulator)\\.dc/.test(p)) location.replace('USimEmpty.dc.html');
  }
  renderVals() {
    const S = this.sim(); if (!S) return {};
    const v = S.valuation(), start = 10000000, pct = v.totalPlKobo / start * 100;
    const rows = v.positions.map((x) => this.row(S.company(x.ticker), { qty: x.quantity + (x.quantity === 1 ? ' share' : ' shares'), value: S.naira(x.valueKobo) }));
    return { total: S.naira(v.totalKobo), pl: (v.totalPlKobo >= 0 ? '\\u25b2 ' : '\\u25bc ') + S.naira(Math.abs(v.totalPlKobo)) + ' (' + Math.abs(pct).toFixed(1) + '%)',
      cash: S.naira(v.cashKobo), invested: S.naira(v.holdingsValueKobo), rows, has: rows.length > 0, none: rows.length === 0 };
  }''')
    wr('USimHome', s)

# ---------- Practice market (USimMarket): working sector filter ----------
s = rd('USimMarket')
if MARK not in s:
    s = sub1(s, '<span class="chip chip-on">All</span><span class="chip">Banking</span><span class="chip">Energy</span><span class="chip">Food</span>',
        '<sc-for list="{{chips}}" as="c" hint-placeholder-count="4"><button type="button" class="{{c.cls}}" aria-pressed="{{c.on}}" onClick="{{c.tap}}">{{c.label}}</button></sc-for>')
    a = s.index('<a href="USimCompany.dc.html" class="li press">'); b = s.index('</div>', s.rindex('</a>', a, s.index('Prices move')))
    s = s[:a] + '<sc-for list="{{rows}}" as="r" hint-placeholder-count="5"><a href="{{r.href}}" class="li press"><span style="' + LOGO % 'r' + '">{{r.t}}</span><span style="flex: 1; min-width: 0"><strong style="display: block">{{r.name}}</strong><span class="muted" style="font-size: 13px">{{r.label}}</span></span><span style="text-align: right"><strong class="num" style="display: block">{{r.price}}</strong>' + TAG % ('r', 'r', 'r') + '</span></a></sc-for>' + s[b:]
    s = logic(s, H + '''
  constructor(p) { super(p); this.state = { f: 'All' }; }
  renderVals() {
    const S = this.sim(); if (!S) return {};
    const f = this.state.f;
    const chips = ['All', 'Banking', 'Energy', 'Food'].map((label) => ({ label, on: String(label === f), cls: label === f ? 'chip chip-on' : 'chip', tap: () => this.setState({ f: label }) }));
    const rows = S.COMPANIES.filter((c) => f === 'All' || c.sector === f).map((c) => this.row(c));
    return { chips, rows };
  }''')
    wr('USimMarket', s)

# ---------- Company page (USimCompany): real price, chart ranges, holdings ----------
s = rd('USimCompany')
if MARK not in s:
    s = sub1(s, 'background: #5B21B6; color: #FFFFFF; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center">ADF</span><div><h1 style="font-size: 24px">Adire Foods</h1><span class="muted" style="font-size: 14px">Food and drink · ADF</span>',
        'background: {{c.color}}; color: #FFFFFF; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center">{{c.t}}</span><div><h1 style="font-size: 24px">{{c.name}}</h1><span class="muted" style="font-size: 14px">{{c.label}} · {{c.t}}</span>')
    s = sub1(s, '<span class="num" style="font-size: 32px; font-weight: 800">₦30.00</span> <span class="tag num" style="background: #DCFAE6; color: #0F6B39">▲ 1.8%</span>',
        '<span class="num" style="font-size: 32px; font-weight: 800">{{c.price}}</span> ' + TAG % ('c', 'c', 'c'))
    s = sub1(s, 'aria-label="Price rose over the last 3 months"><path d="M0,58 L30,62 L60,56 L90,60 L120,50 L150,54 L180,46 L210,48 L240,40 L270,42 L300,34 L330,30"', 'aria-label="{{chartLabel}}"><path d="{{chartPath}}"')
    s = sub1(s, '<span class="chip">1W</span><span class="chip">1M</span><span class="chip chip-on">3M</span><span class="chip">1Y</span>',
        '<sc-for list="{{ranges}}" as="g" hint-placeholder-count="4"><button type="button" class="{{g.cls}}" aria-pressed="{{g.on}}" onClick="{{g.tap}}">{{g.label}}</button></sc-for>')
    s = sub1(s, '<strong class="num">800 shares · ₦24,000</strong>', '<strong class="num">{{own}}</strong>')
    s = sub1(s, '<strong class="num">₦1.50</strong>', '<strong class="num">{{div}}</strong>')
    s = sub1(s, 'href="USimMarket.dc.html" class="press" aria-label="Back"', 'href="USimMarket.dc.html" class="press" aria-label="Back to the practice market"')
    s = sub1(s, '<a href="USimTrade.dc.html" class="btn">Buy</a><a href="USimSell.dc.html" class="btn btn-w">Sell</a>', '<a href="{{buyHref}}" class="btn">Buy</a><a href="{{sellHref}}" class="btn btn-w">Sell</a>')
    s = logic(s, H + '''
  constructor(p) { super(p); this.state = { r: '3M' }; }
  renderVals() {
    const S = this.sim(); if (!S) return {};
    const co = S.current(), c = this.row(co), r = this.state.r, n = { '1W': 7, '1M': 30, '3M': 90, '1Y': 365 }[r];
    const h = S.history(co.t, n), lo = Math.min(...h), hi = Math.max(...h), span = Math.max(1, hi - lo);
    const chartPath = h.map((p, i) => (i ? 'L' : 'M') + (i * 330 / Math.max(1, h.length - 1)).toFixed(1) + ',' + (110 - (p - lo) / span * 90).toFixed(1)).join(' ');
    const rose = h[h.length - 1] >= h[0], words = { '1W': 'week', '1M': 'month', '3M': '3 months', '1Y': 'year' }[r];
    const q = S.held(co.t), ranges = ['1W', '1M', '3M', '1Y'].map((label) => ({ label, on: String(label === r), cls: label === r ? 'chip chip-on' : 'chip', tap: () => this.setState({ r: label }) }));
    return { c, chartPath, chartLabel: 'Price ' + (rose ? 'rose' : 'fell') + ' over the last ' + words, ranges,
      own: q ? q + (q === 1 ? ' share \\u00b7 ' : ' shares \\u00b7 ') + S.naira(q * S.price(co.t)) : 'None yet',
      div: co.div ? S.naira(co.div) : 'None', buyHref: 'USimTrade.dc.html?t=' + co.t, sellHref: 'USimSell.dc.html?t=' + co.t };
  }''')
    wr('USimCompany', s)

# ---------- Buy sheet (USimTrade): price, approximate fees, places the trade once ----------
s = rd('USimTrade')
if MARK not in s:
    s = sub1(s, '>Buy Adire Foods</h2>', '>Buy {{name}}</h2>')
    s = sub1(s, '<span class="num">₦30.00</span></div>', '<span class="num">{{price}}</span></div>\n      <div style="display: flex; justify-content: space-between; padding: 12px 16px; border-top: 1px solid #E7E2F0"><span class="muted">Fees (approx.)</span><span class="num">{{fee}}</span></div>')
    a = s.index('<sc-if value="{{ok}}"'); b = s.index('</sc-if>', a) + 8
    s = s[:a] + '<sc-if value="{{ok}}" hint-placeholder-val="{{true}}"><button type="button" class="btn" onClick="{{buy}}" aria-disabled="{{busy}}">Buy {{q}} shares with virtual ₦</button></sc-if>' + s[b:]
    s = sub1(s, '<a href="USimCompany.dc.html"', '<a href="{{back}}"')
    s = logic(s, H + '''
  constructor(p) { super(p); this.state = { q: 10, busy: false }; this.key = 'buy-' + Date.now() + '-' + Math.random().toString(36).slice(2); }
  renderVals() {
    const S = this.sim(); if (!S) return {};
    const co = S.current(), P = S.price(co.t), CASH = S.account().cashKobo, q = this.state.q;
    const gross = P * q, fee = S.fee(gross), cost = gross + fee, over = cost > CASH;
    return { name: co.name, price: S.naira(P), fee: S.naira(fee), q: String(q), cost: S.naira(cost), left: over ? 'Not enough' : S.naira(CASH - cost), over, ok: !over, busy: String(this.state.busy),
      back: 'USimCompany.dc.html?t=' + co.t,
      dec: () => this.setState({ q: Math.max(1, q - 1) }), inc: () => this.setState({ q: q + 1 }), decOff: q <= 1 ? 'true' : 'false',
      buy: () => { if (this.state.busy) return; this.setState({ busy: true }); const r = S.trade('buy', co.t, q, this.key); if (r.ok) location.href = 'USimDone.dc.html?t=' + co.t; else this.setState({ busy: false }); } };
  }''')
    wr('USimTrade', s)

# ---------- Sell sheet (USimSell) ----------
s = rd('USimSell')
if MARK not in s:
    s = sub1(s, '>Sell Adire Foods</h2>', '>Sell {{name}}</h2>')
    s = sub1(s, '<div style="border: 1.5px solid #E7E2F0; border-radius: 16px; overflow: hidden"><div style="display: flex; justify-content: space-between; padding: 12px 16px"><span class="muted">You get (virtual)</span>',
        '<sc-if value="{{none}}" hint-placeholder-val="{{false}}"><p role="alert" style="margin: 0; padding: 12px 14px; border-radius: 14px; background: #F8F6FC; font-weight: 600">You don\'t own any {{name}} shares yet, so there is nothing to sell.</p></sc-if>\n    <sc-if value="{{has}}" hint-placeholder-val="{{true}}"><div style="border: 1.5px solid #E7E2F0; border-radius: 16px; overflow: hidden"><div style="display: flex; justify-content: space-between; padding: 12px 16px"><span class="muted">Fees (approx.)</span><span class="num">{{fee}}</span></div><div style="display: flex; justify-content: space-between; padding: 12px 16px; border-top: 1px solid #E7E2F0"><span class="muted">You get (virtual)</span>')
    s = sub1(s, '<span class="num">{{own}}</span></div></div>\n    <a href="USimDone.dc.html" class="btn">Sell {{q}} shares</a>',
        '<span class="num">{{own}}</span></div></div>\n    <button type="button" class="btn" onClick="{{sell}}" aria-disabled="{{busy}}">Sell {{q}} shares</button></sc-if>')
    s = sub1(s, '<a href="USimCompany.dc.html" style="min-height: 44px', '<a href="{{back}}" style="min-height: 44px')
    s = logic(s, H + '''
  constructor(p) { super(p); this.state = { q: 1, busy: false }; this.key = 'sell-' + Date.now() + '-' + Math.random().toString(36).slice(2); }
  renderVals() {
    const S = this.sim(); if (!S) return {};
    const co = S.current(), OWN = S.held(co.t), q = Math.min(Math.max(1, this.state.q), Math.max(1, OWN)), gross = S.price(co.t) * q, fee = S.fee(gross);
    return { name: co.name, q: String(q), fee: S.naira(fee), get: S.naira(Math.max(0, gross - fee)), own: String(OWN - q), has: OWN > 0, none: OWN === 0, busy: String(this.state.busy),
      back: 'USimCompany.dc.html?t=' + co.t,
      dec: () => this.setState({ q: Math.max(1, q - 1) }), inc: () => this.setState({ q: Math.min(OWN, q + 1) }),
      sell: () => { if (this.state.busy || !OWN) return; this.setState({ busy: true }); const r = S.trade('sell', co.t, q, this.key); if (r.ok) location.href = 'USimDone.dc.html?t=' + co.t; else this.setState({ busy: false }); } };
  }''')
    wr('USimSell', s)

# ---------- Trade result (USimDone): the trade you just placed ----------
s = rd('USimDone')
if MARK not in s:
    s = sub1(s, '>You bought 10 shares</h1>', '>{{title}}</h1>')
    s = sub1(s, '>Adire Foods at ₦30.00 each. ₦300 of virtual cash used.</p>', '>{{line}}</p>')
    s = sub1(s, '>You now own a small part of the company. If it pays a dividend of ₦1.50, you would get ₦15 for these 10 shares.</span>', '>{{what}}</span>')
    s = logic(s, H + '''
  renderVals() {
    const S = this.sim(); if (!S) return {};
    const t = S.last(); if (!t) return { title: 'No trade yet', line: 'Pick a made-up company to place your first practice trade.', what: 'Nothing has changed in your portfolio.' };
    const c = S.company(t.ticker), n = t.quantity + (t.quantity === 1 ? ' share' : ' shares');
    if (t.side === 'buy') return { title: 'You bought ' + n, line: c.name + ' at ' + S.naira(t.priceKobo) + ' each. ' + S.naira(t.netKobo) + ' of virtual cash used, including ' + S.naira(t.feesKobo) + ' in fees.',
      what: c.div ? 'You now own a small part of the company. If it pays a dividend of ' + S.naira(c.div) + ', you would get ' + S.naira(c.div * t.quantity) + ' for these ' + n + '.' : 'You now own a small part of the company. Its price will move as the made-up market moves.' };
    return { title: 'You sold ' + n, line: c.name + ' at ' + S.naira(t.priceKobo) + ' each. ' + S.naira(t.netKobo) + ' of virtual cash added, after ' + S.naira(t.feesKobo) + ' in fees.',
      what: 'Compared with what you paid, this sale ' + (t.realizedPlKobo >= 0 ? 'made ' + S.naira(t.realizedPlKobo) : 'lost ' + S.naira(-t.realizedPlKobo)) + ' after fees.' };
  }''')
    wr('USimDone', s)

# ---------- History (USimHistory) ----------
s = rd('USimHistory')
if MARK not in s:
    a = s.index('<div class="card" style="overflow: hidden"><div class="li"><span class="tag"'); b = s.index('<section class="card"', a)
    s = s[:a] + '''<sc-if value="{{has}}" hint-placeholder-val="{{true}}"><div class="card" style="overflow: hidden"><sc-for list="{{rows}}" as="r" hint-placeholder-count="4"><div class="li"><span class="tag" style="background: {{r.bg}}; color: {{r.fg}}; min-width: 64px; justify-content: center">{{r.kind}}</span><span style="flex: 1"><strong style="display: block">{{r.name}}</strong><span class="muted" style="font-size: 13px">{{r.meta}}</span></span><strong class="num">{{r.amt}}</strong></div></sc-for></div></sc-if>
    <sc-if value="{{none}}" hint-placeholder-val="{{false}}"><p class="card muted" style="margin: 0; padding: 14px 16px; font-size: 14px">No trades yet. Your buys and sells will show up here.</p></sc-if>
    ''' + s[b:]
    CHECK = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" fill="none" stroke="#16884A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"></path></svg>'
    a = s.index('<span style="display: flex; gap: 8px; align-items: center">' + CHECK + 'Buying'); b = s.index('</section>', a)
    s = s[:a] + '<sc-for list="{{skills}}" as="k" hint-placeholder-count="3"><span class="{{k.cls}}" style="display: flex; gap: 8px; align-items: center"><sc-if value="{{k.done}}" hint-placeholder-val="{{true}}">' + CHECK + '</sc-if><sc-if value="{{k.todo}}" hint-placeholder-val="{{false}}"><span style="width: 20px; height: 20px; border-radius: 999px; border: 2px solid #D3CDE0; box-sizing: border-box"></span></sc-if>{{k.label}}</span></sc-for>' + s[b:]
    s = logic(s, H + '''
  renderVals() {
    const S = this.sim(); if (!S) return {};
    const tr = S.account().trades.slice().reverse(), today = S.day();
    const when = (t) => t.day === today ? 'Today' : t.day === today - 1 ? 'Yesterday' : new Date(t.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const rows = tr.map((t) => ({ kind: t.side === 'buy' ? 'Bought' : 'Sold', bg: t.side === 'buy' ? '#F1EBFB' : '#F5F3F8', fg: t.side === 'buy' ? '#4C1D95' : '#38323F',
      name: S.company(t.ticker).name, meta: t.quantity + (t.quantity === 1 ? ' share' : ' shares') + ' \\u00b7 ' + when(t), amt: S.naira(t.netKobo) }));
    const bought = tr.some((t) => t.side === 'buy'), sold = tr.some((t) => t.side === 'sell');
    const sectors = new Set(S.account().holdings.map((h) => S.company(h.ticker).sector)).size;
    const skills = [['Buying shares', bought], ['Selling shares', sold], ['Spreading money across sectors', sectors >= 2]].map(([label, d]) => ({ label, done: d, todo: !d, cls: d ? '' : 'muted' }));
    return { rows, has: rows.length > 0, none: rows.length === 0, skills };
  }''')
    wr('USimHistory', s)

# ---------- Reset (UMSimReset) ----------
s = rd('UMSimReset')
if 'onClick="{{reset}}"' not in s:
    s = sub1(s, '<a href="USimHome.dc.html" class="btn btn-r" style="', '<button type="button" onClick="{{reset}}" class="btn btn-r" style="width: 100%; border: 0; cursor: pointer; font: inherit; font-weight: 700; ')
    s = sub1(s, 'text-decoration: none">Reset portfolio</a>', 'text-decoration: none">Reset portfolio</button>')
    s = logic(s, '''  renderVals() {
    return { reset: () => { if (window.FV && window.FV.SIM) window.FV.SIM.reset(); location.href = 'USimEmpty.dc.html'; } };
  }''')
    wr('UMSimReset', s)

# ---------- Every board loads the domain rules before fv.js ----------
for f in glob.glob(os.path.join(SITE, '*.dc.html')):
    t = open(f).read()
    if '<script src="./fv.js"></script>' in t and 'fvd.js' not in t:
        open(f, 'w').write(t.replace('<script src="./fv.js"></script>', '<script src="./fvd.js"></script>\n<script src="./fv.js"></script>', 1))
print('simulator boards wired')

# ---------- Desktop simulator page (UDSimulator, built by build_desktop.py) ----------
s = rd('UDSimulator')
if MARK not in s:
    s = sub1(s, '₦104,320</strong>', '{{total}}</strong>')
    s = sub1(s, '<span style="font-size: 16px">▲ ₦4,320 (4.3%) since you started</span>', '<span style="font-size: 16px">{{pl}} since you started</span>')
    s = sub1(s, '₦64,120</strong>', '{{cash}}</strong>')
    s = sub1(s, '₦40,200</strong>', '{{invested}}</strong>')
    ROW = 'display: grid; grid-template-columns: 2.2fr 1fr 1fr 1fr 1fr; gap: 12px; align-items: center; padding: 14px 18px; border-top: 1px solid #E7E2F0; text-decoration: none; color: #0E0B14; font-size: 16px'
    a = s.index('<a href="USimCompany.dc.html" class="press" style="' + ROW); b = s.index('</section></section>', a)
    s = s[:a] + '<sc-for list="{{rows}}" as="h" hint-placeholder-count="2"><a href="{{h.href}}" class="press" style="' + ROW + '"><span style="display: flex; align-items: center; gap: 12px"><span class="tile" style="background: {{h.color}}; color: #FFFFFF; font-weight: 800; font-size: 13px">{{h.t}}</span><strong>{{h.name}}</strong></span><span class="num">{{h.qty}}</span><span class="num">{{h.price}}</span><strong class="num">{{h.value}}</strong><span><span style="display: inline-flex; padding: 3px 9px; border-radius: 999px; background: {{h.tagBg}}; color: {{h.tagFg}}; font-weight: 800; font-size: 13px">{{h.chg}}</span></span></a></sc-for><sc-if value="{{none}}" hint-placeholder-val="{{false}}"><p class="muted" style="margin: 0; padding: 16px 18px; border-top: 1px solid #E7E2F0; font-size: 15px">You don\'t own any shares right now. Find a company to practise with.</p></sc-if>' + s[b:]
    CARD = 'class="card press" style="padding: 18px; display: flex; flex-direction: column; gap: 10px; text-decoration: none; color: #0E0B14"'
    s = sub1(s, '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px">', '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px">')
    a = s.index('<a href="USimCompany.dc.html" ' + CARD); b = s.index('</div></section>', a)
    s = s[:a] + '<sc-for list="{{market}}" as="m" hint-placeholder-count="5"><a href="{{m.href}}" ' + CARD + '><span class="tile" style="background: #F1EBFB; color: #4C1D95; font-weight: 800; font-size: 13px">{{m.t}}</span><strong style="font-size: 17px">{{m.name}}</strong><span class="muted" style="font-size: 14px">{{m.label}}</span><span style="display: flex; align-items: center; justify-content: space-between; gap: 8px"><strong class="num" style="font-size: 20px">{{m.price}}</strong><span style="display: inline-flex; padding: 3px 9px; border-radius: 999px; background: {{m.tagBg}}; color: {{m.tagFg}}; font-weight: 800; font-size: 13px">{{m.chg}}</span></span></a></sc-for>' + s[b:]
    m = re.search(r'renderVals\(\) \{.*?\n  \}', s, flags=re.S)
    s = s[:m.start()] + H.strip() + '''
  componentDidMount() { const S = this.sim(); if (S && !S.started() && /UDSimulator\\.dc/.test(location.pathname)) location.replace('USimEmpty.dc.html'); }
  renderVals() {
    const FV = window.FV, st = FV ? FV.get() : { xp: 0 }, S = this.sim();
    const v0 = { streak: FV ? FV.streak() : 0, xp: st.xp, level: FV ? FV.level(st.xp) : 1 };
    if (!S) return v0;
    const v = S.valuation(), pct = v.totalPlKobo / 10000000 * 100;
    const rows = v.positions.map((x) => this.row(S.company(x.ticker), { qty: String(x.quantity), value: S.naira(x.valueKobo) }));
    return Object.assign(v0, { total: S.naira(v.totalKobo), pl: (v.totalPlKobo >= 0 ? '\\u25b2 ' : '\\u25bc ') + S.naira(Math.abs(v.totalPlKobo)) + ' (' + Math.abs(pct).toFixed(1) + '%)',
      cash: S.naira(v.cashKobo), invested: S.naira(v.holdingsValueKobo), rows, none: rows.length === 0, market: S.COMPANIES.map((c) => this.row(c)) });
  }''' + s[m.end():]
    wr('UDSimulator', s)
print('desktop simulator wired')
