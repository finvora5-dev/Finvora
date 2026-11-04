"""Wire the Library boards to window.FV.LIB (articles from packages/sample-data, search from packages/domain).
Usage: python3 wire_lib.py <site folder>"""
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
def listify(s, after, holes, var, extra_close=''):
    """Turn the run of <a class="li press"> rows in the first card after `after` into one sc-for row."""
    a = s.index('<a href="UPArticle.dc.html" class="li press">', s.index(after))
    first_end = s.index('</a>', a) + 4
    end = s.index('</a></div>', a) + 4
    row = s[a:first_end]
    for old, new in holes: row = sub1(row, old, new)
    row = row.replace('<a href="UPArticle.dc.html"', '<a href="{{r.href}}"', 1)
    return s[:a] + '<sc-for list="{{%s}}" as="r" hint-placeholder-count="3">' % var + row + '</sc-for>' + extra_close + s[end:]
MARK = 'window.FV && window.FV.LIB'
L = "  L() { return window.FV && window.FV.LIB; }\n  row(a) { const L = this.L(); return { href: 'UPArticle.dc.html?a=' + a.slug, title: a.title, def: a.definition, meta: L.topicOf(a).name + ' \\u00b7 ' + L.minutes(a) + ' min read' }; }\n"
SEARCHBOX = "<input type=\"search\" placeholder=\"Search terms, companies, lessons\""

# ---------- Article ----------
s = rd('UPArticle')
if MARK not in s:
    s = sub1(s, '>Investing · Beginner</span>', '>{{tag}}</span>')
    s = sub1(s, 'color: #FFFFFF">Dividend</h1>', 'color: #FFFFFF">{{title}}</h1>')
    s = sub1(s, '>2 min read</span>', '>{{mins}} min read</span>')
    s = sub1(s, '<button type="button" aria-label="Save this article" class="press"', '<button type="button" aria-label="Save this article" aria-pressed="{{saved}}" onClick="{{save}}" class="press"')
    s = sub1(s, '<path d="M6 3h12v18l-6-4-6 4z" fill="none" stroke="#FFFFFF"', '<path d="M6 3h12v18l-6-4-6 4z" fill="{{saveFill}}" stroke="#FFFFFF"')
    a = s.index('<p style="margin: 0; font-size: 20px; line-height: 1.5; font-weight: 700; color: #0E0B14">'); b = s.index('</p>', a) + 4
    lead = s[a:b]
    s = s[:a] + '<sc-if value="{{isDiv}}" hint-placeholder-val="{{true}}">' + lead + '</sc-if><sc-if value="{{notDiv}}" hint-placeholder-val="{{false}}"><p style="margin: 0; font-size: 20px; line-height: 1.5; font-weight: 700; color: #0E0B14">{{definition}}</p></sc-if>' + s[b:]
    a = s.index('<ul style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; font-size: 16px; line-height: 1.5">'); a = s.index('>', a) + 1; b = s.index('</ul>', a)
    li = s[a:b].strip(); first = li[:li.index('</li>') + 5]
    tmpl = first.replace('<span>Dividends are usually paid as a fixed amount per share.</span>', '<span>{{k}}</span>')
    s = s[:a] + '<sc-if value="{{isDiv}}" hint-placeholder-val="{{true}}">' + li + '</sc-if><sc-if value="{{notDiv}}" hint-placeholder-val="{{false}}"><sc-for list="{{points}}" as="k" hint-placeholder-count="2">' + tmpl + '</sc-for></sc-if>' + s[b:]
    # Dividend-only sections: How dividends work, African example, Dividend yield.
    a = s.index('<section style="display: flex; flex-direction: column; gap: 10px">\n      <h2 style="font-size: 22px">How dividends work</h2>')
    b = s.index('<section style="display: flex; flex-direction: column; gap: 10px">\n      <h2 style="font-size: 18px">Related terms</h2>')
    generic = '''<sc-if value="{{notDiv}}" hint-placeholder-val="{{false}}"><section aria-labelledby="ex" style="border: 2px solid #E7E2F0; border-radius: 18px; overflow: hidden">
      <div style="background: #FFF1EC; padding: 12px 16px"><h2 id="ex" style="font-size: 13px; letter-spacing: .06em; text-transform: uppercase; color: #B42828">Example</h2></div>
      <p style="margin: 0; padding: 14px 16px; font-size: 16px; line-height: 1.55">{{example}}</p>
    </section>
    <section style="display: flex; flex-direction: column; gap: 10px">
      <h2 style="font-size: 22px">Why it matters</h2>
      <p style="margin: 0; font-size: 17px; line-height: 1.7; color: #1C1726">{{why}}</p>
    </section></sc-if>
    '''
    s = s[:a] + '<sc-if value="{{isDiv}}" hint-placeholder-val="{{true}}">' + s[a:b].rstrip() + '</sc-if>\n    ' + generic + s[b:]
    a = s.index('<div style="display: flex; flex-wrap: wrap; gap: 8px"><a href="UPArticle.dc.html" class="chip">Share</a>'); b = s.index('</div>', a) + 6
    s = s[:a] + '<div style="display: flex; flex-wrap: wrap; gap: 8px"><sc-for list="{{related}}" as="r" hint-placeholder-count="2"><a href="{{r.href}}" class="chip">{{r.title}}</a></sc-for></div>' + s[b:]
    s = sub1(s, '<section style="display: flex; flex-direction: column; gap: 10px">\n      <h2 style="font-size: 18px">Related terms</h2>', '<sc-if value="{{hasRelated}}" hint-placeholder-val="{{true}}"><section style="display: flex; flex-direction: column; gap: 10px">\n      <h2 style="font-size: 18px">Related terms</h2>')
    a = s.index('<h2 style="font-size: 18px">Related terms</h2>'); b = s.index('</section>', a) + 10
    s = s[:b] + '</sc-if>' + s[b:]
    s = logic(s, L + '''  constructor(p) { super(p); this.state = { n: 0 }; }
  componentDidMount() {
    const L = this.L(); if (!L) return; const a = L.current(); L.setRead(a.slug, 1);
    this.onScroll = () => { const h = document.documentElement, max = h.scrollHeight - h.clientHeight; L.setRead(a.slug, max > 0 ? Math.min(100, Math.round(h.scrollTop / max * 100)) : 100); };
    window.addEventListener('scroll', this.onScroll, { passive: true });
  }
  componentWillUnmount() { if (this.onScroll) window.removeEventListener('scroll', this.onScroll); }
  renderVals() {
    const L = this.L(), fb = (this.props.feedback || 'on') === 'on'; if (!L) return { feedbackOn: fb };
    const a = L.current(), div = a.slug === 'dividend', saved = L.isSaved(a.slug);
    const related = (a.related || []).map((s) => L.article(s)).filter(Boolean).map((r) => ({ href: 'UPArticle.dc.html?a=' + r.slug, title: r.title }));
    return { feedbackOn: fb, tag: L.topicOf(a).name, title: a.title, mins: String(L.minutes(a)), isDiv: div, notDiv: !div, definition: a.definition, points: a.explanation,
      example: a.example, why: a.whyItMatters, related, hasRelated: related.length > 0, saved: String(saved), saveFill: saved ? '#FFFFFF' : 'none',
      save: () => { L.toggleSave(a.slug); this.setState({ n: this.state.n + 1 }); } };
  }''')
    wr('UPArticle', s)

# ---------- Library home ----------
s = rd('UPLibrary')
if MARK not in s:
    s = sub1(s, '<input type="search" placeholder="Search any money word"', '<input type="search" value="{{q}}" onInput="{{onQ}}" onKeyDown="{{onKey}}" enterkeyhint="search" placeholder="Search any money word"')
    for w in ('Dividend', 'Inflation', 'NGX'):
        s = sub1(s, '<a href="UPSearch.dc.html" class="press" style="min-height: 36px', '<a href="UPSearch.dc.html?q=%s" class="press" style="min-height: 36px' % w)
    s = sub1(s, '<a href="UPArticle.dc.html" class="press" style="background: #0E0B14', '<a href="{{wHref}}" class="press" style="background: #0E0B14')
    s = sub1(s, 'margin: 4px 0 2px">Dividend</strong>', 'margin: 4px 0 2px">{{wTitle}}</strong>')
    s = sub1(s, 'line-height: 1.45">Part of a company\'s profit paid to its shareholders.</span>', 'line-height: 1.45">{{wDef}}</span>')
    # Continue reading: only articles you have started.
    a = s.index('<section style="display: flex; flex-direction: column; gap: 12px">\n      <div style="display: flex; justify-content: space-between; align-items: baseline"><h2 style="font-size: 20px">Continue reading</h2>')
    c = s.index('<div style="display: flex; gap: 12px">', a); c2 = s.index('>', c) + 1; first_end = s.index('</a>', c2) + 4; end = s.index('</a></div>', c2) + 4
    card = s[c2:first_end].replace('<a href="UPArticle.dc.html"', '<a href="{{r.href}}"', 1)
    card = sub1(card, '>Investing · 2 min</span>', '>{{r.meta}}</span>')
    card = sub1(card, 'min-height: 42px">Dividend</strong>', 'min-height: 42px">{{r.title}}</strong>')
    card = sub1(card, '<div style="width: 60%; height: 100%;', '<div style="width: {{r.pct}}%; height: 100%;')
    card = sub1(card, '>60% read</span>', '>{{r.pct}}% read</span>')
    s = s[:c2] + '<sc-for list="{{reading}}" as="r" hint-placeholder-count="2">' + card + '</sc-for>' + s[end:]
    s = s[:a] + '<sc-if value="{{hasReading}}" hint-placeholder-val="{{true}}">' + s[a:]
    b = s.index('</section>', s.index('Continue reading</h2>')) + 10
    s = s[:b] + '</sc-if>' + s[b:]
    for i, (name, n) in enumerate([('Money basics', '18'), ('Investing', '24'), ('Markets across Africa', '12'), ('Companies and reports', '15')]):
        j = s.index('line-height: 1.25">%s</strong><span style="font-size: 13px; opacity: .9">%s guides</span>' % (name, n))
        k = s.rindex('<a href="UPTopic.dc.html"', 0, j)
        s = s[:k] + '<a href="UPTopic.dc.html?t=%s"' % name.replace(' ', '+') + s[k + len('<a href="UPTopic.dc.html"'):]
        s = sub1(s, 'line-height: 1.25">%s</strong><span style="font-size: 13px; opacity: .9">%s guides</span>' % (name, n), 'line-height: 1.25">%s</strong><span style="font-size: 13px; opacity: .9">{{n%d}} guides</span>' % (name, i))
    for i, (t, m) in enumerate([('How the Nigerian Exchange works', 'Markets · 6 min'), ('Inflation and your savings', 'Money basics · 5 min'), ('Reading an annual report', 'Companies · 7 min')]):
        j = s.index('line-height: 1.3">%s</strong>' % t); k = s.rindex('<a href="UPArticle.dc.html"', 0, j)
        s = s[:k] + '<a href="{{p%dHref}}"' % i + s[k + len('<a href="UPArticle.dc.html"'):]
        s = sub1(s, 'line-height: 1.3">%s</strong><span style="font-size: 13px; color: #615A6E">%s</span>' % (t, m), 'line-height: 1.3">{{p%dTitle}}</strong><span style="font-size: 13px; color: #615A6E">{{p%dMeta}}</span>' % (i, i))
    s = logic(s, L + '''  constructor(p) { super(p); this.state = { q: '' }; }
  renderVals() {
    const L = this.L(), fb = (this.props.feedback || 'on') === 'on'; if (!L) return { feedbackOn: fb };
    const w = L.wordOfDay(), v = { feedbackOn: fb, q: this.state.q, wHref: 'UPArticle.dc.html?a=' + w.slug, wTitle: w.title, wDef: w.definition,
      onQ: (e) => this.setState({ q: e.target.value }), onKey: (e) => { if (e.key === 'Enter' && this.state.q.trim()) location.href = 'UPSearch.dc.html?q=' + encodeURIComponent(this.state.q.trim()); } };
    const reading = L.reading().slice(0, 2).map((x) => ({ href: 'UPArticle.dc.html?a=' + x.a.slug, title: x.a.title, meta: L.topicOf(x.a).name + ' \\u00b7 ' + L.minutes(x.a) + ' min', pct: String(x.pct) }));
    v.reading = reading; v.hasReading = reading.length > 0;
    L.TOPICS.forEach((t, i) => { v['n' + i] = String(L.inTopic(t.name).items.length); });
    ['stock-exchange', 'inflation', 'revenue-and-profit'].forEach((slug, i) => { const a = L.article(slug); v['p' + i + 'Href'] = 'UPArticle.dc.html?a=' + slug; v['p' + i + 'Title'] = a.title; v['p' + i + 'Meta'] = L.topicOf(a).name + ' \\u00b7 ' + L.minutes(a) + ' min'; });
    return v;
  }''')
    wr('UPLibrary', s)

ROWH = [('line-height: 1.3">Bond</span>', 'line-height: 1.3">{{r.title}}</span>'), ('font-size: 14px">A loan you give to a government or company, paid back with interest.</span>', 'font-size: 14px">{{r.def}}</span>')]
# ---------- Topic ----------
s = rd('UPTopic')
if MARK not in s:
    s = sub1(s, '<h1 style="font-size: 20px">Investing</h1>' if '<h1 style="font-size: 20px">Investing</h1>' in s else '>Investing</h1>', '>{{name}}</h1>' if '<h1 style="font-size: 20px">Investing</h1>' not in s else '<h1 style="font-size: 20px">{{name}}</h1>')
    s = sub1(s, '<strong style="font-size: 17px">Investing</strong>', '<strong style="font-size: 17px">{{name}}</strong>')
    s = sub1(s, '>24 guides · from first share to building a mix</p>', '>{{count}} guides \\u00b7 {{blurb}}</p>'.replace('\\u00b7', '·'))
    s = sub1(s, '<a href="#f" class="chip chip-on">All</a><a href="#f" class="chip">Beginner</a><a href="#f" class="chip">Guides</a><a href="#f" class="chip">Terms</a>',
        '<sc-for list="{{chips}}" as="c" hint-placeholder-count="2"><button type="button" class="{{c.cls}}" aria-pressed="{{c.on}}" onClick="{{c.tap}}" style="cursor: pointer; font: inherit">{{c.label}}</button></sc-for>')
    s = listify(s, '<div class="card" style="overflow: hidden">', ROWH, 'rows')
    s = logic(s, L + '''  constructor(p) { super(p); this.state = { f: 'All' }; }
  renderVals() {
    const L = this.L(); if (!L) return {};
    const m = /[?&]t=([^&]+)/.exec(location.search), name = m ? decodeURIComponent(m[1].replace(/\\+/g, ' ')) : 'Investing', t = L.inTopic(name), f = this.state.f;
    const labels = ['All'].concat(t.topic.cats.length > 1 ? t.topic.cats : []);
    return { name: t.topic.name, count: String(t.items.length), blurb: t.topic.blurb,
      chips: labels.map((label) => ({ label, on: String(label === f), cls: label === f ? 'chip chip-on' : 'chip', tap: () => this.setState({ f: label }) })),
      rows: t.items.filter((a) => f === 'All' || a.category === f).map((a) => this.row(a)) };
  }''')
    wr('UPTopic', s)

# ---------- Search ----------
s = rd('UPSearch')
if MARK not in s:
    s = sub1(s, SEARCHBOX + ' value="dividend"', SEARCHBOX + ' value="{{q}}" onInput="{{onQ}}" onKeyDown="{{onKey}}" enterkeyhint="search"')
    s = sub1(s, '<a href="#a" class="chip chip-on">All</a><a href="#t" class="chip">Terms</a><a href="#g" class="chip">Guides</a><a href="#l" class="chip">Lessons</a>',
        '<sc-for list="{{chips}}" as="c" hint-placeholder-count="3"><button type="button" class="{{c.cls}}" aria-pressed="{{c.on}}" onClick="{{c.tap}}" style="cursor: pointer; font: inherit">{{c.label}}</button></sc-for>')
    s = sub1(s, '>4 results for "dividend"</p>', '>{{count}}</p>')
    s = listify(s, '<div class="card" style="overflow: hidden">', [('line-height: 1.3">Dividend</span>', 'line-height: 1.3">{{r.title}}</span>'), ('font-size: 14px">Term · Investing</span>', 'font-size: 14px">{{r.sub}}</span>')], 'rows')
    s = sub1(s, '<a href="UPAskKobo.dc.html" class="card press"', '<sc-if value="{{has}}" hint-placeholder-val="{{true}}"><a href="UPAskKobo.dc.html" class="card press"')
    s = sub1(s, '<strong>Ask Fin about dividends</strong>', '<strong>Ask Fin about {{qShort}}</strong>')
    j = s.index('Answers come from the library</span>'); k = s.index('</a>', j) + 4
    s = s[:k] + '</sc-if>' + s[k:]
    a = s.index('<a href="#r" class="chip">'); b = s.index('</div></section>', a)
    chip = s[a:s.index('</a>', a) + 4].replace('<a href="#r" class="chip">', '<a href="{{x.href}}" class="chip">').replace('inflation</a>', '{{x.q}}</a>')
    s = s[:a] + '<sc-for list="{{recent}}" as="x" hint-placeholder-count="3">' + chip + '</sc-for>' + s[b:]
    s = sub1(s, '<section style="display: flex; flex-direction: column; gap: 8px"><h2 style="font-size: 16px">Recent searches</h2>', '<sc-if value="{{hasRecent}}" hint-placeholder-val="{{true}}"><section style="display: flex; flex-direction: column; gap: 8px"><h2 style="font-size: 16px">Recent searches</h2>')
    j = s.index('Recent searches</h2>'); k = s.index('</section>', j) + 10
    s = s[:k] + '</sc-if>' + s[k:]
    s = logic(s, '''  constructor(p) { super(p); const m = /[?&]q=([^&]*)/.exec(location.search); this.state = { q: m ? decodeURIComponent(m[1].replace(/\\+/g, ' ')) : '', f: 'All', typed: false }; }
  L() { return window.FV && window.FV.LIB; }
  componentDidMount() { const L = this.L(), q = this.state.q.trim(); if (!L || !q) return; const r = L.search(q); if (r.results.length) L.addRecent(q); else location.replace('UPEmptySearch.dc.html?q=' + encodeURIComponent(q)); }
  go() { const q = this.state.q.trim(); if (q) location.href = 'UPSearch.dc.html?q=' + encodeURIComponent(q); }
  renderVals() {
    const L = this.L(); if (!L) return {};
    const q = this.state.q.trim(), res = q ? L.search(q).results : [], f = this.state.f;
    const kind = { All: null, Terms: 'article', Lessons: 'lesson' }[f], rows = res.filter((r) => !kind || r.kind === kind).map((r) => ({ href: r.href, title: r.title, sub: r.subtitle }));
    return { q: this.state.q, has: !!q, qShort: q.length > 24 ? q.slice(0, 24) + '\\u2026' : q || 'this',
      count: q ? rows.length + (rows.length === 1 ? ' result' : ' results') + ' for "' + q + '"' : 'Type a word and press Enter',
      chips: ['All', 'Terms', 'Lessons'].map((label) => ({ label, on: String(label === f), cls: label === f ? 'chip chip-on' : 'chip', tap: () => this.setState({ f: label }) })),
      rows, recent: L.recent().map((x) => ({ q: x, href: 'UPSearch.dc.html?q=' + encodeURIComponent(x) })), hasRecent: L.recent().length > 0,
      onQ: (e) => this.setState({ q: e.target.value }), onKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); this.go(); } } };
  }''')
    wr('UPSearch', s)

# ---------- No results ----------
s = rd('UPEmptySearch')
if MARK not in s:
    s = sub1(s, SEARCHBOX + ' value="dividnd"', SEARCHBOX + ' value="{{q}}" onInput="{{onQ}}" onKeyDown="{{onKey}}" enterkeyhint="search"')
    s = sub1(s, '>No results for "dividnd"</h1>', '>No results for "{{q0}}"</h1>')
    s = sub1(s, '>Check the spelling, or try a shorter word. Did you mean dividend?</p>', '>{{hint}}</p>')
    s = sub1(s, '<a href="UPSearch.dc.html" class="btn">Search for dividend</a>', '<sc-if value="{{hasDym}}" hint-placeholder-val="{{true}}"><a href="{{dymHref}}" class="btn">Search for {{dym}}</a></sc-if>')
    s = logic(s, '''  constructor(p) { super(p); const m = /[?&]q=([^&]*)/.exec(location.search); this.q0 = m ? decodeURIComponent(m[1].replace(/\\+/g, ' ')) : ''; this.state = { q: this.q0 }; }
  L() { return window.FV && window.FV.LIB; }
  renderVals() {
    const L = this.L(), fb = (this.props.feedback || 'on') === 'on'; if (!L) return { feedbackOn: fb };
    const dym = this.q0 ? L.search(this.q0).didYouMean : null;
    return { feedbackOn: fb, q: this.state.q, q0: this.q0, dym: dym || '', hasDym: !!dym, dymHref: 'UPSearch.dc.html?q=' + encodeURIComponent(dym || ''),
      hint: 'Check the spelling, or try a shorter word.' + (dym ? ' Did you mean ' + dym + '?' : ''),
      onQ: (e) => this.setState({ q: e.target.value }), onKey: (e) => { if (e.key === 'Enter' && this.state.q.trim()) location.href = 'UPSearch.dc.html?q=' + encodeURIComponent(this.state.q.trim()); } };
  }''')
    wr('UPEmptySearch', s)

# ---------- A to Z ----------
s = rd('UPDictionary')
if MARK not in s:
    s = sub1(s, '<input type="search" placeholder="Find a term"', '<input type="search" value="{{q}}" onInput="{{onQ}}" placeholder="Find a term"')
    a = s.index('<nav aria-label="Jump to letter"'); a = s.index('>', a) + 1; b = s.index('</nav>', a)
    s = s[:a] + '<sc-for list="{{letters}}" as="l" hint-placeholder-count="26"><a href="{{l.href}}" aria-disabled="{{l.off}}" style="min-width: 22px; min-height: 22px; text-align: center; font-size: 12px; font-weight: 700; text-decoration: none; color: {{l.ink}}">{{l.c}}</a></sc-for>' + s[b:]
    a = s.index('<section style="display: flex; flex-direction: column; gap: 8px"><h2 style="font-size: 15px; color: #4C1D95">B</h2>'); b = s.index('</main>', a)
    s = s[:a] + '''<sc-for list="{{groups}}" as="g" hint-placeholder-count="3"><section id="{{g.c}}" style="display: flex; flex-direction: column; gap: 8px; scroll-margin-top: 16px"><h2 style="font-size: 15px; color: #4C1D95">{{g.c}}</h2><div class="card" style="overflow: hidden"><sc-for list="{{g.items}}" as="r" hint-placeholder-count="2"><a href="{{r.href}}" class="li press"><span style="flex: 1; font-weight: 600">{{r.title}}</span><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="#8E879A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg></a></sc-for></div></section></sc-for>
    <sc-if value="{{none}}" hint-placeholder-val="{{false}}"><p class="muted" style="margin: 0">No terms match "{{q}}".</p></sc-if>
  ''' + s[b:]
    s = logic(s, '''  constructor(p) { super(p); this.state = { q: '' }; }
  L() { return window.FV && window.FV.LIB; }
  renderVals() {
    const L = this.L(); if (!L) return {};
    const q = this.state.q.trim().toLowerCase(), list = L.all().filter((a) => !q || a.title.toLowerCase().includes(q)).sort((a, b) => a.title.localeCompare(b.title));
    const groups = []; list.forEach((a) => { const c = a.title[0].toUpperCase(); let g = groups[groups.length - 1]; if (!g || g.c !== c) groups.push(g = { c, items: [] }); g.items.push({ href: 'UPArticle.dc.html?a=' + a.slug, title: a.title }); });
    const have = new Set(groups.map((g) => g.c));
    return { q: this.state.q, groups, none: !groups.length, onQ: (e) => this.setState({ q: e.target.value }),
      letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c) => ({ c, href: have.has(c) ? '#' + c : '#', off: String(!have.has(c)), ink: have.has(c) ? '#4C1D95' : '#8E879A' })) };
  }''')
    wr('UPDictionary', s)

# ---------- Saved ----------
s = rd('UPSaved')
if MARK not in s:
    s = listify(s, '<div class="card" style="overflow: hidden">', [('line-height: 1.3">Dividend</span>', 'line-height: 1.3">{{r.title}}</span>'), ('font-size: 14px">Investing · 2 min read</span>', 'font-size: 14px">{{r.meta}}</span>')], 'rows')
    s = logic(s, L + '''  componentDidMount() { const L = this.L(); if (L && !L.saved().length && /UPSaved|UDxSaved/.test(location.pathname)) location.replace('UMEmptySaved.dc.html'); }
  renderVals() { const L = this.L(); return L ? { rows: L.saved().map((a) => this.row(a)) } : {}; }''')
    wr('UPSaved', s)
print('library wired')
