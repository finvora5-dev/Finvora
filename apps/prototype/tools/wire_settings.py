"""Design Part 1 (docs/designs/prototype-settings-labels-storage.md), step 3: screens for one price
source, the Practice Market label and entrance line, the closed-market sheet, and the Ask Fin source
label. Values and words come from packages/domain (CONFIG, LABELS) through fv.js. Safe to re-run.
Usage: python3 wire_settings.py <site folder>"""
import os, re, sys
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)

STORE = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style="flex: none"><path d="M4 10l1.5-5h13L20 10M4 10v9h16v-9M4 10h16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"></path></svg>'
BOOK = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style="flex: none"><path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path></svg>'
CLOCK = '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" style="flex: none"><circle cx="12" cy="12" r="9" fill="none" stroke="#147D44" stroke-width="2.2"></circle><path d="M12 7v5l3 2" fill="none" stroke="#147D44" stroke-width="2.2" stroke-linecap="round"></path></svg>'

# 1. Prices: one source (fv.js PAY.PRICE from CONFIG), "1 month free" on yearly.
for n in ['USCompare', 'UDxSCompare']:
    s = rd(n)
    if '{{plusPrice}}' not in s:
        s = s.replace('>₦1,500/mo</span>', '>{{plusPrice}}/mo</span>', 1)
        s = s.replace('renderVals() { return {}; }', "renderVals() { const F = window.FV, D = window.FVD; return { plusPrice: F && D ? D.formatNaira(F.PAY.PRICE.monthly).replace(/\\.00$/, '') : '' }; }", 1)
        wr(n, s)
for n in ['USPlans', 'UDxSPlans']:
    s = rd(n)
    if '2 months free' in s: wr(n, s.replace('2 months free', '1 month free'))
s = rd('UREmailReceipt')
if "total: '₦1,500.00'" in s:
    wr('UREmailReceipt', s.replace("total: '₦1,500.00'", "total: window.FVD && window.FV ? window.FVD.formatNaira(window.FV.PAY.PRICE.monthly) : ''"))

# 2. Practice Market label replaces the "Made-up company" chip.
for n in ['USimCompany', 'UDxSimCompany']:
    s = rd(n)
    old = '<span class="tag" style="background: #EFE8FF; color: #5B2FC9">Made-up company</span>'
    if old in s: wr(n, s.replace(old, '<span class="fv-label">' + STORE + 'Practice Market</span>'))

# 3. Entrance line at the top of the Practice Market's first screens.
ENT = ('<div class="fv-entrance" role="note">' + STORE.replace('16', '26', 2) +
       '<span><strong>Practice Market</strong>Made-up companies, virtual naira, no money at risk.</span></div>')
for n in ['USimEmpty', 'UDxSimEmpty', 'USimHome', 'UDSimulator']:
    s = rd(n)
    if 'fv-entrance' not in s:
        i = s.index('<main'); j = s.index('>', i) + 1
        wr(n, s[:j] + ENT + s[j:])

# 4. Closed market: when it opens, and a way forward (queue the order, or do a lesson).
for n in ['UMOrderClosed', 'UDzMOrderClosed']:
    s = rd(n)
    if '{{opens}}' not in s:
        s = s.replace('>The practice market is closed</h2>', '>Practice Market closed</h2>', 1)
        s = s.replace('<p class="muted" style="margin: 2px 0 0; font-size: 14px">It follows real trading hours: {{hours}}. Your order will be placed when it opens.</p>',
                      '<p class="muted" style="margin: 2px 0 0; font-size: 14px">Your order can wait in the queue until then.</p>', 1)
        s = s.replace('<button type="button" class="btn" onClick="{{queue}}"',
                      '<div class="fv-opens">' + CLOCK + '<span><b>Opens {{opens}}</b>Real trading hours: {{hours}}.</span></div><button type="button" class="btn" onClick="{{queue}}"', 1)
        s = s.replace('Queue my order</button>', 'Queue my order</button><a href="UPLessonInfo.dc.html" class="btn btn-w" style="width: 100%; text-decoration: none">Do a lesson while you wait</a>', 1)
        s = s.replace("return { hours: S.hours(),", "return { hours: S.hours(), opens: S.nextOpen(),", 1)
        wr(n, s)

# 5. Ask Fin: every answer says where it comes from, with a link when there is a Library article.
for n in ['UPAskKobo', 'UDxAskKobo']:
    s = rd(n)
    if 'fv-source' not in s:
        old = '<a href="{{c.href}}" style="font-size: 13px; font-weight: 700; text-decoration: none">Source: Library · {{c.title}}</a></sc-for>'
        new = ('<span class="fv-source">' + BOOK + '<span>Example answer from the Finvora Library · <a href="{{c.href}}">{{c.title}}</a></span></span></sc-for>'
               '<sc-if value="{{m.noCite}}" hint-placeholder-val="{{false}}"><span class="fv-source">' + BOOK + '<span>Example answer from the Finvora Library</span></span></sc-if>')
        if old not in s: raise SystemExit('Ask Fin source line not found in ' + n)
        s = s.replace(old, new, 1)
        s = s.replace("cites: m.r.citations.map((c) => ({ title: c.title, href: 'UPArticle.dc.html?a=' + c.articleSlug })) }))",
                      "cites: m.r.citations.map((c) => ({ title: c.title, href: 'UPArticle.dc.html?a=' + c.articleSlug })), noCite: !m.r.citations.length }))", 1)
        wr(n, s)
print('settings screens wired')
