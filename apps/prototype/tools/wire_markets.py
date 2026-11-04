"""Wire the Markets screens to window.FV.MK: exchanges, companies (with filters) and company pages.
Usage: python3 wire_markets.py <site folder>"""
import re, sys, os
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing in board: ' + a[:90])
    return s.replace(a, b, 1)
def logic(s, js):
    a = s.index('class Component extends DCLogic {'); b = s.index('</script>', a)
    return s[:a] + 'class Component extends DCLogic {\n' + js + '\n}\n' + s[b:]
def rows(s, first_marker, holes, var):
    """Replace a run of <a ...>…</a> rows (starting at first_marker) inside one card with one sc-for row."""
    a = s.index(first_marker); first_end = s.index('</a>', a) + 4; end = s.index('</a></div>', a) + 4
    row = s[a:first_end]
    for old, new in holes: row = sub1(row, old, new)
    return s[:a] + '<sc-for list="{{%s}}" as="r" hint-placeholder-count="3">' % var + row + '</sc-for>' + s[end:]
MARK = 'window.FV.MK'
M = "  M() { return window.FV && window.FV.MK; }\n"

# Markets tab: each exchange opens its own page; Start here opens real content.
s = rd('UPMarkets')
if MARK not in s:
    for t in ('NGX', 'JSE', 'NSE', 'GSE', 'BRVM'):
        j = s.index('>%s</span>' % t); k = s.rindex('<a href="UPExchange.dc.html"', 0, j)
        s = s[:k] + '<a href="UPExchange.dc.html?x=%s"' % t + s[k + len('<a href="UPExchange.dc.html"'):]
    for title, href in (('What a stock exchange does', 'UPArticle.dc.html?a=stock-exchange'), ('How to read a share price', 'UPLearnSteps.dc.html')):
        j = s.index('>%s</span>' % title); k = s.rindex('<a href="UPArticle.dc.html"', 0, j)
        s = s[:k] + '<a href="%s"' % href + s[k + len('<a href="UPArticle.dc.html"'):]
    s = sub1(s, '>How to read a share price</span><span class="muted" style="font-size: 14px">Guide · 4 min read</span>', '>How to read a share price</span><span class="muted" style="font-size: 14px">Micro module · 1 min</span>')
    s = logic(s, "  renderVals() { return {}; } // " + MARK)
    wr('UPMarkets', s)

# Companies: working filters, each row opens its own page.
s = rd('URCompanies')
if MARK not in s:
    s = sub1(s, '<span class="chip chip-on">All</span><span class="chip">Banking</span><span class="chip">Telecoms</span><span class="chip">Nigeria</span><span class="chip">Kenya</span>',
        '<sc-for list="{{chips}}" as="c" hint-placeholder-count="5"><button type="button" class="{{c.cls}}" aria-pressed="{{c.on}}" onClick="{{c.tap}}" style="cursor: pointer; font: inherit">{{c.label}}</button></sc-for>')
    s = rows(s, '<a href="URCompany.dc.html" class="li press">', [
        ('<a href="URCompany.dc.html"', '<a href="{{r.href}}"'), ('background: #7B4AF0; color: #FFFFFF', 'background: {{r.color}}; color: #FFFFFF'),
        ('justify-content: center">ZB</span>', 'justify-content: center">{{r.t}}</span>'), ('<strong style="display: block">Zenith Bank</strong>', '<strong style="display: block">{{r.name}}</strong>'),
        ('font-size: 13px">Banking · NGX: ZENITHBANK</span>', 'font-size: 13px">{{r.line}}</span>')], 'rows')
    s = logic(s, M + '''  constructor(p) { super(p); this.state = { f: 'All' }; }
  renderVals() {
    const M = this.M(); if (!M) return {};
    const f = this.state.f, ok = (c) => f === 'All' || c.tag === f || c.country === f;
    return { chips: ['All', 'Banking', 'Telecoms', 'Nigeria', 'Kenya'].map((label) => ({ label, on: String(label === f), cls: label === f ? 'chip chip-on' : 'chip', tap: () => this.setState({ f: label }) })),
      rows: M.COMPANIES.filter(ok).map((c) => ({ href: 'URCompany.dc.html?c=' + c.t, t: c.t, name: c.name, line: c.line, color: c.color })) };
  }''')
    wr('URCompanies', s)

# Company page: the company you tapped.
s = rd('URCompany')
if MARK not in s:
    s = sub1(s, 'background: #7B4AF0; color: #FFFFFF; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center">ZB</span><div><h1 style="font-size: 24px">Zenith Bank</h1><span class="muted" style="font-size: 14px">Banking · NGX: ZENITHBANK</span>',
        'background: {{color}}; color: #FFFFFF; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center">{{t}}</span><div><h1 style="font-size: 24px">{{name}}</h1><span class="muted" style="font-size: 14px">{{line}}</span>')
    s = sub1(s, '>It lends money at a higher rate than it pays savers. The gap is its main income. It also earns fees on transfers and cards.</p>', '>{{how}}</p>')
    s = sub1(s, '<strong style="display: block">Profit last year</strong><span class="muted" style="font-size: 13px">Money left after all costs</span>', '<strong style="display: block">{{k1}}</strong><span class="muted" style="font-size: 13px">{{k1d}}</span>')
    s = sub1(s, '<strong style="display: block">Bad loans</strong><span class="muted" style="font-size: 13px">Loans not being repaid</span>', '<strong style="display: block">{{k2}}</strong><span class="muted" style="font-size: 13px">{{k2d}}</span>')
    s = sub1(s, '<a href="UPLessonInfo.dc.html" class="btn">Learn: how banks make money</a>', '<a href="{{learnHref}}" class="btn">Learn: {{learnTitle}}</a>')
    s = logic(s, M + '''  renderVals() {
    const M = this.M(); if (!M) return {};
    const c = M.company(), L = window.FV.LIB, a = L && L.article(c.learn);
    return { t: c.t, name: c.name, line: c.line, color: c.color, how: c.how,
      k1: c.bank ? 'Profit last year' : 'Revenue last year', k1d: c.bank ? 'Money left after all costs' : 'Money from sales before costs',
      k2: c.bank ? 'Bad loans' : 'Profit last year', k2d: c.bank ? 'Loans not being repaid' : 'Money left after all costs',
      learnHref: 'UPArticle.dc.html?a=' + c.learn, learnTitle: a ? a.title : 'how companies make money' };
  }''')
    wr('URCompany', s)

# Exchange page: the exchange you tapped.
s = rd('UPExchange')
if MARK not in s:
    s = re.sub(r'(<h1[^>]*>)Nigerian Exchange(</h1>)', r'\1{{name}}\2', s, count=1)
    s = sub1(s, 'font-weight: 800">NGX</span><div><h2 style="font-size: 20px">Nigerian Exchange</h2><span class="muted" style="font-size: 14px">Lagos · prices in naira (₦)</span>', 'font-weight: 800">{{t}}</span><div><h2 style="font-size: 20px">{{name}}</h2><span class="muted" style="font-size: 14px">{{where}}</span>')
    s = sub1(s, ">Nigeria's main stock exchange, where shares of listed companies are bought and sold. It was known as the Nigerian Stock Exchange until 2021.</p>", '>{{about}}</p>')
    s = sub1(s, '<strong>Naira (₦)</strong>', '<strong>{{currency}}</strong>')
    s = sub1(s, '<strong>SEC Nigeria</strong>', '<strong>{{regulator}}</strong>')
    s = sub1(s, '>Learn about the NGX</h2>', '>Learn about the {{t}}</h2>')
    s = rows(s, '<a href="UPLessonInfo.dc.html" class="li press">', [
        ('<a href="UPLessonInfo.dc.html"', '<a href="{{r.href}}"'), ('background: #DDF5F1', 'background: {{r.bg}}'),
        ('line-height: 1.3">Meet the Nigerian Exchange</span>', 'line-height: 1.3">{{r.title}}</span>'), ('font-size: 14px">Micro module · 1 min · done</span>', 'font-size: 14px">{{r.meta}}</span>')], 'learn')
    s = logic(s, M + '''  renderVals() {
    const M = this.M(); if (!M) return {};
    const x = M.exchange(), LP = window.FV.LOOP, L = window.FV.LIB, art = (slug) => { const a = L && L.article(slug); return { href: 'UPArticle.dc.html?a=' + slug, title: a ? a.title : slug, meta: 'Guide \\u00b7 ' + (a ? L.minutes(a) : 2) + ' min read', bg: '#F1EBFB' }; };
    const learn = (x.micro ? [{ href: 'UPLearnMarket.dc.html', title: 'Meet the Nigerian Exchange', meta: 'Micro module \\u00b7 1 min' + (LP && LP.micro('market') ? ' \\u00b7 done' : ''), bg: '#DDF5F1' }] : []).concat([art('stock-exchange'), art('what-is-a-share')]);
    return { t: x.t, name: x.name, where: x.where, about: x.about, currency: x.currency, regulator: x.regulator, learn };
  }''')
    wr('UPExchange', s)
print('markets wired')
