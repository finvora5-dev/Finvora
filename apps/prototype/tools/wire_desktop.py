"""Desktop-only wiring that the generated desktop boards don't inherit from the phone boards:
the desktop article header (title, tag, Save) and the main desktop Library page.
Run after build_desktop.py and build_desktop_more.py. Usage: python3 wire_desktop.py <site folder>"""
import re, sys, os
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing in board: ' + a[:90])
    return s.replace(a, b, 1)

# Desktop article header: the phone board's logic already supplies tag, title, mins, saved and save.
s = rd('UDArticle')
if '{{tag}}</span><strong style="font-size: 44px' not in s:
    s = sub1(s, 'font-size: 13px; font-weight: 800">Investing · Beginner</span><strong style="font-size: 44px; line-height: 1.05">Dividend</strong><span style="font-size: 16px; color: #E9E3FB">2 min read</span>',
        'font-size: 13px; font-weight: 800">{{tag}}</span><strong style="font-size: 44px; line-height: 1.05">{{title}}</strong><span style="font-size: 16px; color: #E9E3FB">{{mins}} min read</span>')
    a = s.index('<a href="UPSaved.dc.html" class="btn"'); b = s.index('</a>', a) + 4
    inner = s[s.index('>', a) + 1:b - 4].replace('Save', '{{saveLabel}}')
    s = s[:a] + '<button type="button" onClick="{{save}}" aria-pressed="{{saved}}" class="btn" style="width: auto; padding: 0 20px; background: #FFFFFF; color: #4C1D95; box-shadow: 0 3px 0 #C4B5FD; border: 0; cursor: pointer; font: inherit; font-weight: 700">' + inner + '</button>' + s[b:]
    a = s.index('<a href="UFReport.dc.html" class="btn"'); b = s.index('</a>', a) + 4
    s = s[:a] + '<sc-if value="{{feedbackOn}}" hint-placeholder-val="{{true}}">' + s[a:b] + '</sc-if>' + s[b:]
    s = sub1(s, "saveFill: saved ? '#FFFFFF' : 'none',", "saveFill: saved ? '#FFFFFF' : 'none', saveLabel: saved ? 'Saved' : 'Save',")
    wr('UDArticle', s)

# Main desktop Library page.
s = rd('UDLibrary')
if '{{wTitle}}' not in s:
    k = s.rindex('<a href="UPArticle.dc.html" class="press"', 0, s.index('>Word of the day<'))
    s = s[:k] + '<a href="{{wHref}}" class="press"' + s[k + len('<a href="UPArticle.dc.html" class="press"'):]
    s = sub1(s, 'margin: 8px 0">Dividend</strong><span style="font-size: 18px; color: #D9D3E3">Part of a company\'s profit paid to its shareholders.</span>', 'margin: 8px 0">{{wTitle}}</strong><span style="font-size: 18px; color: #D9D3E3">{{wDef}}</span>')
    for w in ('Dividend', 'Inflation', 'NGX'):
        s = sub1(s, '<a href="UPDictionary.dc.html" class="chip" style="background: #FFFFFF">%s</a>' % w, '<a href="UPSearch.dc.html?q=%s" class="chip" style="background: #FFFFFF">%s</a>' % (w, w))
    for i, (name, n) in enumerate([('Money basics', '18'), ('Investing', '24'), ('Markets across Africa', '12'), ('Companies and reports', '15')]):
        j = s.index('>%s</strong>' % name, s.index('Browse by topic')); k = s.rindex('<a href="UPTopic.dc.html"', 0, j)
        s = s[:k] + '<a href="UPTopic.dc.html?t=%s"' % name.replace(' ', '+') + s[k + len('<a href="UPTopic.dc.html"'):]
        j = s.index('>%s</strong>' % name, s.index('Browse by topic')); m = s.index('%s guides' % n, j)
        s = s[:m] + '{{n%d}} guides' % i + s[m + len('%s guides' % n):]
    a = s.index('<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px"><a href="UPArticle.dc.html" class="card press"'); c = s.index('>', a) + 1
    first_end = s.index('</a>', c) + 4; end = s.index('</a></div>', c) + 4
    card = s[c:first_end].replace('<a href="UPArticle.dc.html"', '<a href="{{r.href}}"', 1)
    card = sub1(card, '>Investing · 2 min</span>', '>{{r.meta}}</span>'); card = sub1(card, '>Dividend</strong>', '>{{r.title}}</strong>')
    card = sub1(card, 'width: 60%;', 'width: {{r.pct}}%;'); card = sub1(card, '>60% read</span>', '>{{r.pct}}% read</span>')
    s = s[:c] + '<sc-for list="{{reading}}" as="r" hint-placeholder-count="2">' + card + '</sc-for>' + s[end:]
    a = s.rindex('<section', 0, s.index('Continue reading</h2>')); s = s[:a] + '<sc-if value="{{hasReading}}" hint-placeholder-val="{{true}}">' + s[a:]
    b = s.index('</section>', s.index('Continue reading</h2>')) + 10; s = s[:b] + '</sc-if>' + s[b:]
    for i, (t, m) in enumerate([('How the Nigerian Exchange works', 'Markets · 6 min'), ('Inflation and your savings', 'Money basics · 5 min'), ('Reading an annual report', 'Companies · 7 min')]):
        j = s.index('>%s</strong>' % t); k = s.rindex('<a href="UPArticle.dc.html"', 0, j)
        s = s[:k] + '<a href="{{p%dHref}}"' % i + s[k + len('<a href="UPArticle.dc.html"'):]
        s = sub1(s, '>%s</strong><span class="muted" style="font-size: 14px">%s</span>' % (t, m), '>{{p%dTitle}}</strong><span class="muted" style="font-size: 14px">{{p%dMeta}}</span>' % (i, i))
    s = sub1(s, '<div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; align-items: start">\n        <sc-if value="{{hasReading}}"', '<div style="display: grid; grid-template-columns: {{rowCols}}; gap: 24px; align-items: start">\n        <sc-if value="{{hasReading}}"')
    m = re.search(r'renderVals\(\) \{.*?\n  \}', s, flags=re.S)
    s = s[:m.start()] + '''renderVals() {
    const FV = window.FV, st = FV ? FV.get() : { xp: 0 }, L = FV && FV.LIB, v = { streak: FV ? FV.streak() : 0, xp: st.xp, level: FV ? FV.level(st.xp) : 1 };
    if (!L) return v;
    const w = L.wordOfDay(); Object.assign(v, { wHref: 'UPArticle.dc.html?a=' + w.slug, wTitle: w.title, wDef: w.definition });
    const reading = L.reading().slice(0, 2).map((x) => ({ href: 'UPArticle.dc.html?a=' + x.a.slug, title: x.a.title, meta: L.topicOf(x.a).name + ' \\u00b7 ' + L.minutes(x.a) + ' min', pct: String(x.pct) }));
    v.reading = reading; v.hasReading = reading.length > 0; v.rowCols = reading.length ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)';
    L.TOPICS.forEach((t, i) => { v['n' + i] = String(L.inTopic(t.name).items.length); });
    ['stock-exchange', 'inflation', 'revenue-and-profit'].forEach((slug, i) => { const a = L.article(slug); v['p' + i + 'Href'] = 'UPArticle.dc.html?a=' + slug; v['p' + i + 'Title'] = a.title; v['p' + i + 'Meta'] = L.topicOf(a).name + ' \\u00b7 ' + L.minutes(a) + ' min'; });
    return v;
  }''' + s[m.end():]
    wr('UDLibrary', s)
print('desktop wired')

# Desktop Markets: each exchange card opens its own page; the guides open real content.
s = rd('UDMarkets')
if 'UPExchange.dc.html?x=' not in s:
    for t in ('NGX', 'JSE', 'NSE', 'GSE', 'BRVM'):
        k = s.index('<a href="UPExchange.dc.html" class="card press"')
        s = s[:k] + '<a href="UPExchange.dc.html?x=%s" class="card press"' % t + s[k + len('<a href="UPExchange.dc.html" class="card press"'):]
    for title, href in (('What a stock exchange does', 'UPArticle.dc.html?a=stock-exchange'), ('How to read a share price', 'UPLearnSteps.dc.html'), ('What moves a share price', 'UPArticle.dc.html?a=what-is-a-share')):
        j = s.index(title); k = s.rindex('<a href="UPArticle.dc.html" class="card press"', 0, j)
        s = s[:k] + '<a href="%s" class="card press"' % href + s[k + len('<a href="UPArticle.dc.html" class="card press"'):]
    wr('UDMarkets', s)
print('desktop markets wired')

# Desktop Me: the same real values as the phone Me page.
s = rd('UDMe')
if '{{planLine}}' not in s:
    s = s.replace('>A</span>', '>{{initial}}</span>').replace('>Ada</strong>', '>{{name}}</strong>')
    s = sub1(s, '>Finvora Plus · renews 2 Dec<', '>{{planLine}}<')
    s = s.replace('<a href="USYourPlan.dc.html"', '<a href="{{planHref}}"', 1)
    for a, b in (('>3 of 9 earned<', '>{{badges}} of 9 earned<'), ('>1 new<', '>{{challengeLine}}<'), ('>3 articles<', '>{{savedLine}}<'), ('>2 new<', '>{{notifLine}}<')):
        s = sub1(s, a, b)
    m = re.search(r'\n\s*return v;\n\s*\}', s)
    s = s[:m.start()] + """
    if (FV && FV.ME) { const n = (FV.AUTH.get().name || 'You'), plus = FV.plan() === 'plus', sub = FV.billing().sub, saved = FV.LIB.saved().length, notes = FV.ME.notifications().length;
      Object.assign(v, { name: n, initial: n.charAt(0).toUpperCase(), badges: FV.ME.badges().filter((b) => b.earned).length, planHref: plus ? 'USYourPlan.dc.html' : 'USPlans.dc.html',
        planLine: plus ? 'Finvora Plus \\u00b7 ' + (sub.cancelled ? 'ends ' : 'renews ') + (sub.renewsOn ? FV.PAY.date(sub.renewsOn) : '') : 'Free \\u00b7 see what Plus adds',
        challengeLine: FV.LOOP.challenge('inflation') ? 'All done' : '1 new', savedLine: saved ? saved + (saved === 1 ? ' article' : ' articles') : 'Nothing saved yet', notifLine: notes ? notes + ' new' : 'All caught up' }); }""" + s[m.start():]
    wr('UDMe', s)
print('desktop me wired')
