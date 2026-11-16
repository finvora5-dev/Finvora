"""Laptop Practice board: live portfolio value, return, buy panel and holdings from the practice account,
the same data the phone Practice board shows (owner, 16 Nov 2026). Idempotent. Usage: wire_navy_practice_laptop.py <site>"""
import os, re, sys
SITE = sys.argv[1]; P = os.path.join(SITE, 'PracticeLaptopNavy.dc.html'); s = open(P).read()
# Practice company boards: the Return figure is red when the position is down (it was always green).
for n in ('PracticeCompanyNavy', 'PracticeCompanyLaptopNavy'):
    q = os.path.join(SITE, n + '.dc.html'); t = open(q).read()
    if 'retC' not in t:
        a = "<span style=\"font-family: 'Geist Mono', monospace; color: #047857\">{{ret}}</span>"; assert t.count(a) == 1, n
        t = t.replace(a, a.replace('#047857', '{{retC}}'))
        b = "      ret: pos ?"; assert t.count(b) == 1, n
        t = t.replace(b, "      retC: pos && pos.unrealizedPlKobo < 0 ? '#B9473F' : '#047857',\n" + b)
        open(q, 'w').write(t)
# Phone Practice header: a loss uses the navy board's down colour (#F2A39C, as on the welcome board), not green.
q = os.path.join(SITE, 'PracticeNavy.dc.html'); t = open(q).read()
if 'plC' not in t:
    a = '<div style="font-size: 13px; color: #00E676">{{pl}}'; assert t.count(a) == 1
    t = t.replace(a, '<div style="font-size: 13px; color: {{plC}}">{{pl}}')
    b = "    return { total: this.n(v.totalKobo),"; assert t.count(b) == 1
    t = t.replace(b, "    return { plC: v.totalPlKobo < 0 ? '#F2A39C' : '#00E676', total: this.n(v.totalKobo),"); open(q, 'w').write(t)
if '/* practice-laptop */' in s: print('already wired'); sys.exit()
def sub1(a, b):
    global s
    assert s.count(a) == 1, a[:80]; s = s.replace(a, b)
sub1('<span style="font-family: \'Geist Mono\', monospace; font-size: 36px; font-weight: 500">₦1,051,750.00</span><span style="font-size: 14px; color: #047857">▲ ₦51,750.00 (5.18%)</span>',
     '<span style="font-family: \'Geist Mono\', monospace; font-size: 36px; font-weight: 500">{{total}}</span><span style="font-size: 14px; color: {{plC}}">{{pl}}</span>')
sub1('<h2 style="margin: 0; font-size: 15px; font-weight: 600">Buy Zenith Bank</h2>', '<h2 style="margin: 0; font-size: 15px; font-weight: 600">Buy {{name}}</h2>')
sub1('<span style="font-family: \'Geist Mono\', monospace">₦48.20</span>', '<span style="font-family: \'Geist Mono\', monospace">{{price}}</span>')
sub1('aria-label="Shares" value="100"', 'aria-label="Shares" value="{{qIn}}" onInput="{{onQ}}"')
sub1('<span style="font-family: \'Geist Mono\', monospace">₦4,892.30</span>', '<span style="font-family: \'Geist Mono\', monospace">{{totBuy}}</span>')
sub1('<a href="TradeNavy.dc.html" style="height: 46px;', '<a href="{{tradeHref}}" style="height: 46px;')
sub1('Cash available ₦412,600.00', 'Cash available {{cash}}')
# holdings: keep the first drawn row as the template, drop the others
i = s.index('<a href="CompanyLaptopNavy.dc.html?t=ZENITHBANK"'); j = s.index('</section>', i)
row = s[i:s.index('</a>', i) + 4]
row = row.replace('CompanyLaptopNavy.dc.html?t=ZENITHBANK', '{{r.href}}').replace('>Zenith Bank<', '>{{r.name}}<').replace('>ZENITHBANK<', '>{{r.t}}<') \
         .replace('>5,000<', '>{{r.qty}}<').replace('>₦241,000.00<', '>{{r.val}}<').replace('<span style="color: #047857">▲ 6.2%</span>', '<span style="color: {{r.c}}">{{r.ch}}</span>')
assert '{{r.ch}}' in row and '{{r.qty}}' in row
s = s[:i] + '\n      <sc-for list="{{rows}}" as="r" hint-placeholder-count="3">' + row + '</sc-for>\n    ' + s[j:]
sub1('class Component extends DCLogic { renderVals() { return {}; } }', r'''class Component extends DCLogic {
/* practice-laptop */
  S() { return window.FV && window.FV.SIM; }
  n(k) { return '₦' + (k / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  tk() { const m = /[?&]t=([A-Z]+)/.exec(location.search); return m ? m[1] : 'ZENITHBANK'; }
  constructor(p) { super(p); this.state = { q: '100' }; const S = this.S(); if (S && !S.valuation().positions.length && !S.get().trades.length) location.replace('PracticeEmptyLaptopNavy.dc.html'); }
  renderVals() {
    const S = this.S(); if (!S) return {}; const v = S.valuation(), a = S.get(), start = a.startingCashKobo, t = this.tk(), p = S.price(t);
    const pct = start ? v.totalPlKobo / start * 100 : 0, q = Math.max(0, parseInt(this.state.q, 10) || 0), g = q * p, tot = q ? g + S.fee(g) : 0;
    return { total: this.n(v.totalKobo), pl: (v.totalPlKobo >= 0 ? '▲ ' : '▼ ') + this.n(Math.abs(v.totalPlKobo)) + ' (' + Math.abs(pct).toFixed(2) + '%)', plC: v.totalPlKobo >= 0 ? '#047857' : '#B9473F',
      name: S.company(t).name, price: this.n(p), qIn: this.state.q, onQ: (e) => this.setState({ q: e.target.value.replace(/\D/g, '').slice(0, 7) }),
      totBuy: this.n(tot), tradeHref: 'TradeNavy.dc.html?t=' + t + '&q=' + Math.max(1, q), cash: this.n(v.cashKobo),
      rows: v.positions.map((x) => { const r = x.costBasisKobo ? x.unrealizedPlKobo / x.costBasisKobo * 100 : 0;
        return { href: 'CompanyLaptopNavy.dc.html?t=' + x.ticker, name: S.company(x.ticker).name, t: x.ticker, qty: x.quantity.toLocaleString('en-NG'), val: this.n(x.valueKobo), ch: (r >= 0 ? '▲ ' : '▼ ') + Math.abs(r).toFixed(1) + '%', c: r >= 0 ? '#047857' : '#B9473F' }; }) };
  }
}''')
open(P, 'w').write(s); print('wired')
