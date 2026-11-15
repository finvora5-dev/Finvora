"""Wire the navy practice market to window.FV.SIM (simulator rules in packages/domain, build plan §4.5).
Companies: the real NGX list in packages/sample-data with illustrative seeded prices (owner, 15 Nov 2026).
Starting cash ₦100,000 (owner, ADR D4). Trade sheet: number of shares (owner). Market hours from the tested
market calendar; a closed market queues the order for the next open (earlier prototype behaviour).
Usage: python3 wire_navy_practice.py <site folder>"""
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
def rows(s, first_anchor, end_anchor, reps, loop='x', var='rows'):
    """Turn a run of drawn rows into one sc-for: the first row becomes the template."""
    a = s.index(first_anchor); b = s.index(end_anchor, a)
    first_end = s.index('</a>', a) + 4
    t = s[a:first_end]
    for old, new in reps: t = sub1(t, old, new)
    return s[:a] + '<sc-for list="{{' + var + '}}" as="' + loop + '" hint-placeholder-count="3">' + t + '</sc-for>' + s[b:]
MARK = '/* navy-practice */'
H = '''  S() { return window.FV && window.FV.SIM; }
  n(k) { return '₦' + (k / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  ch(p) { return (p >= 0 ? '▲ ' : '▼ ') + Math.abs(p).toFixed(1) + '%'; }
  up(p) { return p >= 0; }
  ab(t) { return t.slice(0, 3); }
  tk() { const m = /[?&]t=([A-Z]+)/.exec(location.search); return m ? m[1] : 'ZENITHBANK'; }
'''

# fv.js: the real company list, any-length tickers, Zenith as the default company.
f = open(path('fv.js')).read()
if 'NAVY_COMPANIES' not in f:
    f = sub1(f, 'var COMPANIES = window.FVD.PRACTICE_COMPANIES.map(function (c) { var y = c.years[c.years.length - 1];\n    return { t: c.ticker, name: c.name, sector: c.sector, label: c.label, base: c.basePriceKobo, div: y.dividendPerShareKobo, color: c.color }; });',
        '/* NAVY_COMPANIES: the real NGX list (owner, 15 Nov 2026), illustrative seeded prices. */\n  var COMPANIES = window.FVD.COMPANIES.map(function (c) { return { t: c.ticker, name: c.name, sector: c.sector, label: c.sector, base: c.demoBasePriceKobo, div: 0, color: "#0B192C" }; });')
    f = f.replace('/[?&]t=([A-Z]{3})/.exec(location.search); return SIM.company(m ? m[1] : "ADF")', '/[?&]t=([A-Z]+)/.exec(location.search); return SIM.company(m ? m[1] : "ZENITHBANK")')
    f = sub1(f, '    COMPANIES: COMPANIES, naira: naira, day: simDay,', '    COMPANIES: COMPANIES, naira: naira, day: simDay, get: function () { return simLoad(); },')
    open(path('fv.js'), 'w').write(f)

# Practice home (portfolio)
s = rd('PracticeNavy')
if MARK not in s:
    for old, new in [('>₦1,051,750.00<', '>{{total}}<'), ('▲ ₦51,750.00 (5.18%)', '{{pl}}'), ('>since 28 Oct<', '>{{since}}<'), ('>₦412,600.00<', '>{{cash}}<'), ('>₦639,150.00<', '>{{invested}}<')]:
        s = sub1(s, old, new)
    s = rows(s, '<a href="PracticeCompanyNavy.dc.html" style="display: flex; align-items: center; gap: 12px; min-height: 60px;', '</section>',
        [('<a href="PracticeCompanyNavy.dc.html"', '<a href="{{x.href}}"'), ('>ZEN<', '>{{x.ab}}<'), ('>Zenith Bank<', '>{{x.name}}<'), ('>5,000 shares<', '>{{x.qty}}<'), ('>₦241,000.00<', '>{{x.val}}<'), ('background: #DDF3E6; color: #047857">▲ 6.2%', 'background: {{x.bg}}; color: {{x.c}}">{{x.ch}}')])
    s = logic(s, MARK + '\n' + H + '''  constructor(p) { super(p); const S = this.S(); if (S && !S.valuation().positions.length && !S.get().trades.length) location.replace('PracticeEmptyNavy.dc.html'); }
  renderVals() {
    const S = this.S(); if (!S) return {}; const v = S.valuation(), a = S.get(), start = a.startingCashKobo;
    const pct = start ? v.totalPlKobo / start * 100 : 0, t0 = (a.trades[0] || {}).at;
    return { total: this.n(v.totalKobo), pl: (v.totalPlKobo >= 0 ? '▲ ' : '▼ ') + this.n(Math.abs(v.totalPlKobo)) + ' (' + Math.abs(pct).toFixed(2) + '%)', since: t0 ? 'since ' + new Date(t0).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'since you started',
      cash: this.n(v.cashKobo), invested: this.n(v.holdingsValueKobo),
      rows: v.positions.map((p) => { const c = S.company(p.ticker), r = p.costBasisKobo ? p.unrealizedPlKobo / p.costBasisKobo * 100 : 0;
        return { href: 'PracticeCompanyNavy.dc.html?t=' + p.ticker, ab: this.ab(p.ticker), name: c.name, qty: p.quantity.toLocaleString('en-NG') + (p.quantity === 1 ? ' share' : ' shares'), val: this.n(p.valueKobo), ch: this.ch(r), bg: r >= 0 ? '#DDF3E6' : '#FCEDEB', c: r >= 0 ? '#047857' : '#B9473F' }; }) };
  }''')
    wr('PracticeNavy', s)

# Market list
s = rd('PracticeMarketNavy')
if MARK not in s:
    s = sub1(s, '>₦412,600.00<', '>{{cash}}<')
    s = rows(s, '<a href="PracticeCompanyNavy.dc.html" style="display: flex; align-items: center; gap: 12px; min-height: 64px;', '\n',
        [('<a href="PracticeCompanyNavy.dc.html"', '<a href="{{x.href}}"'), ('color: #0B192C">ZEN<', 'color: #0B192C">{{x.ab}}<'), ('>Zenith Bank<', '>{{x.name}}<'), ('>ZENITHBANK<', '>{{x.t}}<'), ('>₦48.20<', '>{{x.p}}<'), ('background: #DDF3E6; color: #047857">▲ 3.4%', 'background: {{x.bg}}; color: {{x.c}}">{{x.ch}}')])
    # drop the remaining drawn rows after the template
    a = s.index('</sc-for>') + 9; b = s.index('<nav', a) if '<nav' in s[a:] else s.index('</div>\n</x-dc>', a)
    seg = s[a:b]; seg2 = re.sub(r'<a href="PracticeCompanyNavy\.dc\.html" style="display: flex; align-items: center; gap: 12px; min-height: 64px;.*?</a>', '', seg, flags=re.S)
    s = s[:a] + seg2 + s[b:]
    s = logic(s, MARK + '\n' + H + '''  renderVals() {
    const S = this.S(); if (!S) return {};
    return { cash: this.n(S.get().cashKobo), rows: S.COMPANIES.map((c) => { const ch = S.change(c.t); return { href: 'PracticeCompanyNavy.dc.html?t=' + c.t, ab: this.ab(c.t), name: c.name, t: c.t, p: this.n(S.price(c.t)), ch: this.ch(ch), bg: ch >= 0 ? '#DDF3E6' : '#FCEDEB', c: ch >= 0 ? '#047857' : '#B9473F' }; }) };
  }''')
    wr('PracticeMarketNavy', s)

# Company (practice)
s = rd('PracticeCompanyNavy')
if MARK not in s:
    for old, new in [('>Zenith Bank<', '>{{name}}<'), ('>ZENITHBANK · Banking<', '>{{tkLine}}<'), ('>₦48.20<', '>{{price}}<'), ('▲ 3.4%', '{{chg}}'), ('>5,000<', '>{{qty}}<'), ('>₦45.39<', '>{{avg}}<'), ('>₦241,000.00<', '>{{val}}<'), ('▲ ₦14,050.00', '{{ret}}'), ('Ask Finvora why Zenith Bank is up today', '{{askT}}')]:
        s = sub1(s, old, new)
    s = s.replace('href="TradeNavy.dc.html"', 'href="TradeNavy.dc.html?t={{t}}"').replace('href="PracticeSellNavy.dc.html"', 'href="{{sellHref}}"').replace('href="AskFinvoraNavy.dc.html"', 'href="{{askHref}}"', 1)
    s = logic(s, MARK + '\n' + H + '''  renderVals() {
    const S = this.S(); if (!S) return {}; const t = this.tk(), c = S.company(t), p = S.price(t), q = S.held(t), pos = S.valuation().positions.filter((x) => x.ticker === t)[0], ch = S.change(t);
    return { t, name: c.name, tkLine: t + ' · ' + c.sector, price: this.n(p), chg: this.ch(ch), qty: q.toLocaleString('en-NG'), avg: pos ? this.n(pos.avgCostKobo) : '₦0.00', val: pos ? this.n(pos.valueKobo) : '₦0.00',
      ret: pos ? (pos.unrealizedPlKobo >= 0 ? '▲ ' : '▼ ') + this.n(Math.abs(pos.unrealizedPlKobo)) : '₦0.00', sellHref: q ? 'PracticeSellNavy.dc.html?t=' + t : '#',
      askT: 'Ask Finvora why ' + c.name + ' is ' + (ch >= 0 ? 'up' : 'down') + ' today', askHref: 'AskFinvoraNavy.dc.html?q=' + encodeURIComponent('Why is ' + c.name + ' ' + (ch >= 0 ? 'up' : 'down') + ' today?') };
  }''')
    wr('PracticeCompanyNavy', s)

TRADE_JS = H + '''  constructor(p) { super(p); const m = /[?&]q=(\\d+)/.exec(location.search); this.state = { q: m ? +m[1] : DEFQ, err: '' }; this.key = 'k-' + Date.now(); }
'''
# Buy
s = rd('TradeNavy')
if MARK not in s:
    for old, new in [('>Buy Zenith Bank<', '>Buy {{name}}<'), ('>ZEN<', '>{{ab}}<'), ('>Zenith Bank</', '>{{name}}</'), ('>Cash available ₦412,600.00<', '>Cash available {{cash}}<'), ('>₦72.30<', '>{{fee}}<'), ('>₦4,892.30<', '>{{total}}<')]:
        s = sub1(s, old, new)
    s = s.replace('>₦48.20<', '>{{price}}<').replace('▲ 3.4%', '{{chg}}')
    s = re.sub(r'(>)100(<)', r'\1{{q}}\2', s, count=1)
    s = sub1(s, '>−<', '>−<').replace('>−</button>', '>−</button>')
    s = re.sub(r'<button([^>]*)>−</button>', r'<button type="button" aria-label="Fewer shares" onClick="{{dec}}"\1>−</button>', s, count=1)
    s = re.sub(r'<button([^>]*)>\+</button>', r'<button type="button" aria-label="More shares" onClick="{{inc}}"\1>+</button>', s, count=1)
    for v in ['10', '50', '100', '500']:
        s = re.sub(r'<button([^>]*)>' + v + '</button>', r'<button type="button" onClick="{{set' + v + r'}}"\1>' + v + '</button>', s, count=1)
    s = re.sub(r'(Shares</span><span[^>]*>)100(<)', r'\1{{q}}\2', s, count=1)
    s = sub1(s, '>Simulated money. Nothing is bought on the NGX.</p>', '>Simulated money. Nothing is bought on the NGX.</p><sc-if value="{{hasErr}}" hint-placeholder-val="{{ false }}"><p role="alert" style="margin: 0; text-align: center; font-size: 13px; color: #B9473F">{{err}}</p></sc-if>')
    s = sub1(s, 'href="PracticeDoneNavy.dc.html"', 'href="#" onClick="{{go}}"')
    s = s.replace('href="PracticeCompanyNavy.dc.html"', 'href="PracticeCompanyNavy.dc.html?t={{t}}"')
    s = logic(s, MARK + '\n' + TRADE_JS.replace('DEFQ', '100') + '''  renderVals() {
    const S = this.S(); if (!S) return {}; const t = this.tk(), c = S.company(t), p = S.price(t), q = this.state.q, g = q * p, fee = S.fee(g), tot = g + fee, cash = S.get().cashKobo;
    let max = Math.floor(cash / p); while (max > 0 && max * p + S.fee(max * p) > cash) max--;
    const setQ = (x) => this.setState({ q: Math.max(1, x), err: '' });
    return { t, name: c.name, ab: this.ab(t), cash: this.n(cash), price: this.n(p), chg: this.ch(S.change(t)), q: q.toLocaleString('en-NG'), fee: this.n(fee), total: this.n(tot),
      dec: () => setQ(q - 1), inc: () => setQ(q + 1), set10: () => setQ(10), set50: () => setQ(50), set100: () => setQ(100), set500: () => setQ(500),
      hasErr: !!this.state.err || tot > cash, err: this.state.err || (tot > cash ? (max > 0 ? 'Not enough cash for ' + q.toLocaleString('en-NG') + ' shares. You can buy up to ' + max.toLocaleString('en-NG') + '.' : 'Not enough cash to buy this share.') : ''),
      go: (e) => { e.preventDefault(); if (tot > cash) return;
        if (!S.isOpen()) { location.href = 'MarketClosedNavy.dc.html?side=buy&t=' + t + '&q=' + q; return; }
        const r = S.trade('buy', t, q, this.key); if (r.ok) location.href = 'PracticeDoneNavy.dc.html'; else this.setState({ err: 'The order did not go through. Check the amount and try again.' }); } };
  }''')
    wr('TradeNavy', s)

# Sell
s = rd('PracticeSellNavy')
if MARK not in s:
    for old, new in [('>Sell Zenith Bank<', '>Sell {{name}}<'), ('>ZEN<', '>{{ab}}<'), ('>Zenith Bank</', '>{{name}}</'), ('>You own 5,000 shares<', '>You own {{own}}<'), ('>1,250<', '>{{q}}<'), ('>₦60,250.00<', '>{{gross}}<'), ('>₦903.75<', '>{{fee}}<'), ('>₦59,346.25<', '>{{net}}<'), ('▲ ₦3,512.50', '{{gain}}')]:
        s = sub1(s, old, new)
    s = s.replace('>₦48.20<', '>{{price}}<').replace('▲ 3.4%', '{{chg}}')
    s = re.sub(r'<button([^>]*)>−</button>', r'<button type="button" aria-label="Fewer shares" onClick="{{dec}}"\1>−</button>', s, count=1)
    s = re.sub(r'<button([^>]*)>\+</button>', r'<button type="button" aria-label="More shares" onClick="{{inc}}"\1>+</button>', s, count=1)
    for v, k in [('25%', 'p25'), ('50%', 'p50'), ('75%', 'p75'), ('All', 'pAll')]:
        s = re.sub(r'<button([^>]*)>' + re.escape(v) + '</button>', r'<button type="button" onClick="{{' + k + r'}}"\1>' + v + '</button>', s, count=1)
    s = sub1(s, 'href="PracticeDoneNavy.dc.html"', 'href="#" onClick="{{go}}"')
    s = s.replace('href="PracticeCompanyNavy.dc.html"', 'href="PracticeCompanyNavy.dc.html?t={{t}}"')
    s = logic(s, MARK + '\n' + H + '''  constructor(p) { super(p); const S = this.S(), h = S ? S.held(this.tk()) : 0; this.state = { q: Math.max(1, Math.round(h / 4)) }; this.key = 'k-' + Date.now(); }
  renderVals() {
    const S = this.S(); if (!S) return {}; const t = this.tk(), c = S.company(t), p = S.price(t), h = S.held(t), q = Math.min(this.state.q, h), g = q * p, fee = S.fee(g), pos = S.valuation().positions.filter((x) => x.ticker === t)[0];
    const gain = pos ? g - Math.round(pos.avgCostKobo * q) - fee : 0, setQ = (x) => this.setState({ q: Math.max(1, Math.min(h, x)) });
    return { t, name: c.name, ab: this.ab(t), own: h.toLocaleString('en-NG') + (h === 1 ? ' share' : ' shares'), price: this.n(p), chg: this.ch(S.change(t)), q: q.toLocaleString('en-NG'), gross: this.n(g), fee: this.n(fee), net: this.n(g - fee),
      gain: (gain >= 0 ? '▲ ' : '▼ ') + this.n(Math.abs(gain)), dec: () => setQ(q - 1), inc: () => setQ(q + 1), p25: () => setQ(Math.round(h / 4)), p50: () => setQ(Math.round(h / 2)), p75: () => setQ(Math.round(h * 3 / 4)), pAll: () => setQ(h),
      go: (e) => { e.preventDefault(); if (!q) return; if (!S.isOpen()) { location.href = 'MarketClosedNavy.dc.html?side=sell&t=' + t + '&q=' + q; return; } const r = S.trade('sell', t, q, this.key); if (r.ok) location.href = 'PracticeDoneNavy.dc.html'; } };
  }''')
    wr('PracticeSellNavy', s)

# Order filled
s = rd('PracticeDoneNavy')
if MARK not in s:
    for old, new in [('>You bought 100 Zenith Bank shares at ₦48.20.<', '>{{line}}<'), ('>₦4,892.30<', '>{{net}}<'), ('>100 × ₦48.20<', '>{{calc}}<'), ('>₦72.30<', '>{{fee}}<'), ('>₦407,707.70<', '>{{cash}}<'), ('>SIM-10482<', '>{{no}}<'), ('Ask Finvora what to watch on Zenith Bank', '{{askT}}')]:
        s = sub1(s, old, new)
    s = s.replace('href="AskFinvoraNavy.dc.html"', 'href="{{askHref}}"', 1)
    s = logic(s, MARK + '\n' + H + '''  renderVals() {
    const S = this.S(); if (!S) return {}; const tr = S.last() || { side: 'buy', ticker: 'ZENITHBANK', quantity: 0, priceKobo: 0, feesKobo: 0, netKobo: 0, id: 'tr-0' }, c = S.company(tr.ticker);
    return { line: 'You ' + (tr.side === 'buy' ? 'bought ' : 'sold ') + tr.quantity.toLocaleString('en-NG') + ' ' + c.name + ' shares at ' + this.n(tr.priceKobo) + '.', net: this.n(tr.netKobo), calc: tr.quantity.toLocaleString('en-NG') + ' × ' + this.n(tr.priceKobo), fee: this.n(tr.feesKobo), cash: this.n(S.get().cashKobo),
      no: 'SIM-' + String(tr.id).replace(/\\D/g, '').slice(-5), askT: 'Ask Finvora what to watch on ' + c.name, askHref: 'AskFinvoraNavy.dc.html?q=' + encodeURIComponent('What should I watch on ' + c.name + '?') };
  }''')
    wr('PracticeDoneNavy', s)

# History
s = rd('PracticeHistoryNavy')
if MARK not in s:
    a = s.index('<section style="padding: 16px 24px 0; flex: none"><h2 style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #5B6577; text-transform: uppercase; letter-spacing: .06em">November</h2>'); b = s.rindex('</section>') + 10
    s = s[:a] + '<sc-for list="{{months}}" as="g" hint-placeholder-count="2"><section style="padding: 18px 24px 0; flex: none"><h2 style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #5B6577; text-transform: uppercase; letter-spacing: .06em">{{g.m}}</h2><sc-for list="{{g.items}}" as="x" hint-placeholder-count="2"><a href="{{x.href}}" style="display: flex; align-items: center; gap: 12px; min-height: 54px; border-bottom: 1px solid #EDEFF2; text-decoration: none"><span style="flex: 1; display: flex; flex-direction: column; gap: 1px"><span style="font-size: 15px; font-weight: 500">{{x.t}}</span><span style="font-size: 12px; color: #5B6577">{{x.s}}</span></span><span style="font-family: \'Geist Mono\', monospace; font-size: 14px; color: #334155; text-align: right"><span style="color: {{x.c}}">{{x.v}}</span> <span style="margin-left: 6px">›</span></span></a></sc-for></section></sc-for>' + s[b:]
    s = logic(s, MARK + '\n' + H + '''  renderVals() {
    const S = this.S(); if (!S) return { months: [] }; const a = S.get(), g = {}, order = [];
    const add = (at, item) => { const m = new Date(at).toLocaleDateString('en-GB', { month: 'long' }); if (!g[m]) { g[m] = []; order.push(m); } g[m].push(item); };
    a.trades.slice().reverse().forEach((tr) => { const c = S.company(tr.ticker), d = new Date(tr.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      add(tr.at, { t: (tr.side === 'buy' ? 'Bought ' : 'Sold ') + c.name, s: tr.quantity.toLocaleString('en-NG') + ' shares at ' + this.n(tr.priceKobo) + ' · ' + d, v: (tr.side === 'buy' ? '−' : '+') + this.n(tr.netKobo), c: tr.side === 'buy' ? '#0B192C' : '#047857', href: 'PracticeCompanyNavy.dc.html?t=' + tr.ticker }); });
    const t0 = (a.trades[0] || {}).at || new Date().toISOString();
    add(t0, { t: 'Started practice', s: new Date(t0).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), v: this.n(a.startingCashKobo), c: '#334155', href: '#' });
    return { months: order.map((m) => ({ m, items: g[m] })) };
  }''')
    wr('PracticeHistoryNavy', s)

# Empty, reset and market closed: the starting cash from config.
s = rd('PracticeEmptyNavy')
if MARK not in s:
    s = sub1(s, '>Try the market with ₦1,000,000<', '>Try the market with {{start}}<')
    s = logic(s, MARK + "\n  renderVals() { const D = window.FVD; return { start: D ? '₦' + (D.CONFIG.SIM_STARTING_CASH_KOBO / 100).toLocaleString('en-NG') : '₦100,000' }; }")
    wr('PracticeEmptyNavy', s)
s = rd('SimResetNavy')
if MARK not in s:
    s = sub1(s, '>₦1,051,750.00<', '>{{total}}<')
    s = sub1(s, 'gives you ₦1,000,000 of simulated cash again.', 'gives you {{start}} of simulated cash again.')
    s = sub1(s, 'href="PracticeEmptyNavy.dc.html"', 'href="PracticeEmptyNavy.dc.html" onClick="{{reset}}"')
    s = logic(s, MARK + '\n' + H + "  renderVals() { const S = this.S(), D = window.FVD; return { total: S ? this.n(S.valuation().totalKobo) : '', start: D ? '₦' + (D.CONFIG.SIM_STARTING_CASH_KOBO / 100).toLocaleString('en-NG') : '₦100,000', reset: () => { if (S) S.reset(); } }; }")
    wr('SimResetNavy', s)
s = rd('MarketClosedNavy')
if MARK not in s:
    s = sub1(s, '>Buy Zenith Bank<', '>{{title}}<')
    s = sub1(s, '>100 shares · ₦48.20<', '>{{sub}}<')
    s = sub1(s, 'Your practice order will fill at the next open, Wednesday 10:00.', 'Your practice order will fill at the next open, {{next}}.')
    s = sub1(s, 'href="PracticeDoneNavy.dc.html"', 'href="PracticeNavy.dc.html" onClick="{{place}}"')
    s = s.replace('href="TradeNavy.dc.html"', 'href="{{back}}"')
    s = logic(s, MARK + '\n' + H + '''  renderVals() {
    const S = this.S(); if (!S) return {}; const t = this.tk(), c = S.company(t), side = (/side=(buy|sell)/.exec(location.search) || [])[1] || 'buy', q = +((/[?&]q=(\\d+)/.exec(location.search) || [])[1] || 1);
    return { title: (side === 'buy' ? 'Buy ' : 'Sell ') + c.name, sub: q.toLocaleString('en-NG') + ' shares · ' + this.n(S.price(t)), next: S.nextOpen(), back: (side === 'buy' ? 'TradeNavy' : 'PracticeSellNavy') + '.dc.html?t=' + t + '&q=' + q, place: () => S.queue(side, t, q) };
  }''')
    wr('MarketClosedNavy', s)
print('wired')
