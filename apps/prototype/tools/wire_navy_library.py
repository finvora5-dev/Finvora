"""Wire the navy Library boards to window.FV.LIB (the 15 Library articles in packages/sample-data, as the
earlier prototype used them): Library home, topic pages, articles (save, reading progress), A to Z and search.
Article worked example: the article's own formula (rule and sum) in the drawn three-box card; hidden when an
article has none. The 'On the NGX' company row shows only on the Dividend article it was drawn for.
Search: companies from the drawn list filtered by the query (prices are wired with Markets), guides from the
tested search rules; no match opens No results with the search's 'did you mean'.
Usage: python3 wire_navy_library.py <site folder>"""
import os, re, sys
SITE = sys.argv[1]
def path(n): return os.path.join(SITE, n)
def rd(n): return open(path(n + '.dc.html')).read()
def wr(n, s): open(path(n + '.dc.html'), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing in board: ' + a[:110])
    return s.replace(a, b, 1)
def logic(s, js):
    a = s.index('class Component extends DCLogic'); b = s.index('</script>', a)
    return s[:a] + 'class Component extends DCLogic {\n' + js + '\n}\n' + s[b:]
MARK = '/* navy-library */'
CHEV_RE = re.compile(r'<svg[^>]*>(?:(?!</svg>).)*?m9 6 6 6-6 6(?:(?!</svg>).)*?</svg>', re.S)

# Library home
s = rd('LibraryNavy')
if MARK not in s:
    s = sub1(s, '<input id="lib" placeholder="Search 120 money words" style="', '<input id="lib" type="search" enterkeyhint="search" placeholder="Search {{nWords}} money words" value="{{q}}" onInput="{{onQ}}" onKeyDown="{{onKey}}" style="')
    s = sub1(s, '<a href="ArticleNavy.dc.html" style="display: flex; flex-direction: column; gap: 6px; padding: 16px;', '<a href="{{wHref}}" style="display: flex; flex-direction: column; gap: 6px; padding: 16px;')
    s = sub1(s, '<span style="font-size: 20px; font-weight: 600">Dividend yield</span>', '<span style="font-size: 20px; font-weight: 600">{{wTitle}}</span>')
    s = sub1(s, '>The yearly dividend as a share of the price. A ₦50 share paying ₦4 a year yields 8%.</span>', '>{{wDef}}</span>')
    a = s.index('<a href="ArticleNavy.dc.html" style="display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: 16px; background: #0B192C;'); b = s.index('</a>', a) + 4
    card = s[a:b].replace('<a href="ArticleNavy.dc.html"', '<a href="{{rHref}}"').replace('conic-gradient(#00E676 0 60%, #2C3D5B 60% 100%)', 'conic-gradient(#00E676 0 {{rPct}}, #2C3D5B {{rPct}} 100%)').replace('font-size: 11px">60%</span>', 'font-size: 11px">{{rPct}}</span>').replace('>Reading an income statement<', '>{{rTitle}}<').replace('>2 min left<', '>{{rLeft}}<')
    s = s[:a] + '<sc-if value="{{hasRead}}" hint-placeholder-val="{{ false }}">' + card + '</sc-if>' + s[b:]
    s = sub1(s, '>15 guides</span>', '>{{nGuides}} guides</span>')
    for i, (t, n) in enumerate([('Money basics', '4'), ('Investing', '5'), ('The Nigerian market', '3'), ('Companies and reports', '3')]):
        s = sub1(s, '<a href="TopicNavy.dc.html" style="padding: 14px;', '<a href="TopicNavy.dc.html?t=' + t.replace(' ', '+') + '" style="padding: 14px;')
        k = s.index('>' + t + '</strong>'); j = s.index('>' + n + ' guides</span>', k)
        s = s[:j] + '>{{n' + str(i) + '}} guides</span>' + s[j + len('>' + n + ' guides</span>'):]
    for w in ['P/E ratio', 'Market cap', 'Bull market', 'Treasury bill', 'EPS', 'Rights issue']:
        s = sub1(s, '<a href="DictionaryNavy.dc.html" style="min-height: 38px; display: inline-flex; align-items: center; padding: 0 14px; border-radius: 999px; background: #FFFFFF; border: 1px solid #E5E7EB; font-size: 13px; text-decoration: none">' + w + '</a>',
                 '<a href="SearchNavy.dc.html?q=' + w.replace(' ', '+').replace('/', '%2F') + '" style="min-height: 38px; display: inline-flex; align-items: center; padding: 0 14px; border-radius: 999px; background: #FFFFFF; border: 1px solid #E5E7EB; font-size: 13px; text-decoration: none">' + w + '</a>')
    s = logic(s, MARK + '''
  constructor(p) { super(p); this.state = { q: '' }; }
  renderVals() {
    const L = window.FV ? window.FV.LIB : null; if (!L) return {};
    const w = L.wordOfDay(), r = L.reading()[0], all = L.all(), T = L.TOPICS, v = {};
    T.forEach((t, i) => { v['n' + i] = String(L.inTopic(t.name).items.length); });
    const go = () => { const q = this.state.q.trim(); if (q) location.href = 'SearchNavy.dc.html?q=' + encodeURIComponent(q); };
    return Object.assign(v, { nWords: String(all.length), nGuides: String(all.length), q: this.state.q, onQ: (e) => this.setState({ q: e.target.value }), onKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } },
      wTitle: w.title, wDef: w.definition, wHref: 'ArticleNavy.dc.html?a=' + w.slug,
      hasRead: !!r, rTitle: r ? r.a.title : '', rPct: r ? Math.round(r.pct) + '%' : '0%', rHref: r ? 'ArticleNavy.dc.html?a=' + r.a.slug : '#', rLeft: r ? Math.max(1, Math.round(L.minutes(r.a) * (1 - r.pct / 100))) + ' min left' : '' });
  }''')
    wr('LibraryNavy', s)

# Topic
s = rd('TopicNavy')
if MARK not in s:
    s = sub1(s, '>The Nigerian market</h1>', '>{{name}}</h1>')
    s = sub1(s, '>3 guides · 7 min in total</p>', '>{{meta}}</p>')
    a = s.index('<section style="padding: 16px 24px 0; flex: none">'); b = s.index('</section>', a)
    row = s[a:b]; chev = CHEV_RE.search(row).group(0)
    s = s[:a] + '<section style="padding: 16px 24px 0; flex: none"><sc-for list="{{items}}" as="x" hint-placeholder-count="3"><a href="{{x.href}}" style="display: flex; align-items: center; gap: 12px; min-height: 54px; border-bottom: 1px solid #EDEFF2; text-decoration: none"><span style="flex: 1; display: flex; flex-direction: column; gap: 1px"><span style="font-size: 15px; font-weight: 500">{{x.t}}</span><span style="font-size: 12px; color: #5B6577">{{x.s}}</span></span>' + chev + '</a></sc-for>' + s[b:]
    a = s.index('<section style="padding: 18px 24px 0; flex: none"><h2 style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #5B6577; text-transform: uppercase; letter-spacing: .06em">Related course</h2>'); b = s.index('</section>', a) + 10
    s = s[:a] + '<sc-if value="{{showCourse}}" hint-placeholder-val="{{ false }}">' + s[a:b] + '</sc-if>' + s[b:]
    s = logic(s, MARK + '''
  renderVals() {
    const L = window.FV ? window.FV.LIB : null; if (!L) return {};
    const m = /[?&]t=([^&]+)/.exec(location.search), name = m ? decodeURIComponent(m[1].replace(/\\+/g, ' ')) : 'The Nigerian market';
    const r = L.inTopic(name), mins = r.items.reduce((a, x) => a + L.minutes(x), 0);
    return { name: r.topic.name, meta: r.items.length + (r.items.length === 1 ? ' guide' : ' guides') + ' · ' + mins + ' min in total', showCourse: r.topic.name === 'The Nigerian market',
      items: r.items.map((x) => ({ t: x.title, s: L.minutes(x) + ' min · ' + x.definition, href: 'ArticleNavy.dc.html?a=' + x.slug })) };
  }''')
    wr('TopicNavy', s)

# Article
s = rd('ArticleNavy')
if MARK not in s:
    s = sub1(s, '<a href="#" aria-label="Save" style="', '<a href="#" aria-label="{{saveLabel}}" aria-pressed="{{saved}}" onClick="{{toggle}}" style="color: {{saveC}}; ')
    s = sub1(s, '>The Nigerian market · 2 min read</span>', '>{{kicker}}</span>')
    s = sub1(s, '>Dividend yield</h1>', '>{{title}}</h1>')
    s = sub1(s, '>Dividend yield is the yearly dividend a company pays, shown as a share of its current price.</p>', '>{{def}}</p>')
    a = s.index('<figure aria-label="Worked example: dividend yield"'); b = s.index('</figure>', a) + 9
    fig = s[a:b].replace('aria-label="Worked example: dividend yield"', 'aria-label="Worked example: {{title}}"').replace('>Yield = Dividend ÷ Price</span>', '>{{rule}}</span>')
    fig = fig.replace('>Dividend</span><span style="font-family: \'Geist Mono\', monospace; font-size: 16px">₦4.00</span>', '>{{l1}}</span><span style="font-family: \'Geist Mono\', monospace; font-size: 16px">{{v1}}</span>')
    fig = fig.replace('>Price</span><span style="font-family: \'Geist Mono\', monospace; font-size: 16px">₦50.00</span>', '>{{l2}}</span><span style="font-family: \'Geist Mono\', monospace; font-size: 16px">{{v2}}</span>')
    fig = fig.replace('>Yield</span><span style="font-family: \'Geist Mono\', monospace; font-size: 16px; color: #00E676">8.0%</span>', '>{{l3}}</span><span style="font-family: \'Geist Mono\', monospace; font-size: 16px; color: #00E676">{{v3}}</span>')
    fig = fig.replace('aria-hidden="true">÷</span>', 'aria-hidden="true">{{op}}</span>')
    fig = fig.replace('>A ₦50 share that pays ₦4 a year returns 8% of its price in cash.</p>', '>{{fNote}}</p>')
    s = s[:a] + '<sc-if value="{{hasFig}}" hint-placeholder-val="{{ false }}">' + fig + '</sc-if>' + s[b:]
    s = sub1(s, '>It shows how much cash a share returns while you hold it. A very high yield can also mean the price has fallen, so check why.</p>', '>{{why}}</p>')
    a = s.index('<h2 style="margin: 24px 0 0; font-size: 18px; font-weight: 600">On the NGX</h2>'); b = s.index('</a>', a) + 4
    s = s[:a] + '<sc-if value="{{showCo}}" hint-placeholder-val="{{ false }}">' + s[a:b] + '</sc-if>' + s[b:]
    s = sub1(s, '<a href="AskFinvoraNavy.dc.html" style="margin-top: 20px;', '<a href="{{askHref}}" style="margin-top: 20px;')
    s = sub1(s, '<article style="padding: 20px 24px 28px; display: flex; flex-direction: column">', '<article id="art" style="padding: 20px 24px 28px; display: flex; flex-direction: column">')
    s = logic(s, MARK + '''
  constructor(p) { super(p); this.state = { n: 0 }; }
  componentDidMount() {
    const L = window.FV && window.FV.LIB; if (!L) return; const a = L.current(); L.setRead(a.slug, 10);
    this.onScroll = () => { const h = document.documentElement, max = Math.max(1, h.scrollHeight - innerHeight); L.setRead(a.slug, Math.min(100, Math.round((scrollY + innerHeight) / h.scrollHeight * 100))); };
    addEventListener('scroll', this.onScroll, { passive: true }); setTimeout(this.onScroll, 300);
  }
  componentWillUnmount() { removeEventListener('scroll', this.onScroll); }
  renderVals() {
    const L = window.FV ? window.FV.LIB : null; if (!L) return {};
    const a = L.current(), f = a.deep && a.deep.formula, saved = L.isSaved(a.slug);
    let fig = { hasFig: false };
    if (f && f.rule && f.calc) {
      const op = f.rule.indexOf('÷') >= 0 ? '÷' : f.rule.indexOf('×') >= 0 ? '×' : null;
      const sp = (x) => op ? x.split('=').map((y) => y.trim()).reduce((acc, y, i) => i === 0 ? y.split(op).map((z) => z.trim()) : acc.concat([y]), []) : [];
      const L3 = sp(f.rule), V3 = sp(f.calc);
      if (L3.length === 3 && V3.length === 3) fig = { hasFig: true, rule: L3[2] + ' = ' + L3[0] + ' ' + op + ' ' + L3[1], op, l1: L3[0], l2: L3[1], l3: L3[2], v1: V3[0], v2: V3[1], v3: V3[2], fNote: f.note || f.intro || '' };
    }
    return Object.assign({ rule: '', op: '÷', l1: '', l2: '', l3: '', v1: '', v2: '', v3: '', fNote: '' }, fig, {
      kicker: L.topicOf(a).name + ' · ' + L.minutes(a) + ' min read', title: a.title, def: a.definition, why: a.whyItMatters || (a.explanation || []).join(' '),
      showCo: a.slug === 'dividend', saved: String(saved), saveLabel: saved ? 'Saved. Remove from saved' : 'Save', saveC: saved ? '#047857' : '#0B192C',
      toggle: (e) => { e.preventDefault(); L.toggleSave(a.slug); this.setState({ n: this.state.n + 1 }); },
      askHref: 'AskFinvoraNavy.dc.html?q=' + encodeURIComponent('What is ' + a.title.toLowerCase() + '?') });
  }''')
    wr('ArticleNavy', s)

# A to Z
s = rd('DictionaryNavy')
if MARK not in s:
    s = sub1(s, '<input aria-label="Search words" placeholder="Search 120 words" style="', '<input aria-label="Search words" type="search" placeholder="Search {{n}} words" value="{{q}}" onInput="{{onQ}}" style="')
    a = s.index('<section style="padding: 14px 0 0 24px; flex: none">'); b = s.rindex('</section>') + 10
    row = s[a:b]; chev = CHEV_RE.search(row).group(0)
    s = s[:a] + '<sc-for list="{{groups}}" as="g" hint-placeholder-count="3"><section style="padding: 14px 24px 0 24px; flex: none"><h2 style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #5B6577; text-transform: uppercase; letter-spacing: .06em">{{g.l}}</h2><sc-for list="{{g.items}}" as="x" hint-placeholder-count="2"><a href="{{x.href}}" style="display: flex; align-items: center; gap: 12px; min-height: 54px; border-bottom: 1px solid #EDEFF2; text-decoration: none"><span style="flex: 1; display: flex; flex-direction: column; gap: 1px"><span style="font-size: 15px; font-weight: 500">{{x.t}}</span><span style="font-size: 12px; color: #5B6577">{{x.s}}</span></span>' + chev + '</a></sc-for></section></sc-for>' + s[b:]
    s = sub1(s, '<div style="flex: 1; overflow: hidden">', '<div style="flex: 1; overflow-y: auto">')
    s = logic(s, MARK + '''
  constructor(p) { super(p); this.state = { q: '' }; }
  renderVals() {
    const L = window.FV ? window.FV.LIB : null; if (!L) return {};
    const q = this.state.q.trim().toLowerCase(), all = L.all().slice().sort((x, y) => x.title.localeCompare(y.title)).filter((x) => !q || (x.title + ' ' + x.definition).toLowerCase().indexOf(q) >= 0);
    const g = {}; all.forEach((x) => { const l = x.title.replace(/^[^A-Za-z]+/, '').charAt(0).toUpperCase(); (g[l] = g[l] || []).push({ t: x.title, s: x.definition, href: 'ArticleNavy.dc.html?a=' + x.slug }); });
    return { n: String(L.all().length), q: this.state.q, onQ: (e) => this.setState({ q: e.target.value }), groups: Object.keys(g).sort().map((l) => ({ l, items: g[l] })) };
  }''')
    wr('DictionaryNavy', s)

# Search
s = rd('SearchNavy')
if MARK not in s:
    s = sub1(s, '<input aria-label="Search" value="bank" style="', '<input aria-label="Search" type="search" enterkeyhint="search" value="{{q}}" onInput="{{onQ}}" style="')
    s = sub1(s, '<section style="padding: 18px 20px 0">\n    <h2 style="margin: 0 0 2px; font-size: 13px; font-weight: 600; color: #5B6577; text-transform: uppercase; letter-spacing: .06em">Companies</h2>', '<sc-if value="{{hasCo}}" hint-placeholder-val="{{ false }}"><section style="padding: 18px 20px 0">\n    <h2 style="margin: 0 0 2px; font-size: 13px; font-weight: 600; color: #5B6577; text-transform: uppercase; letter-spacing: .06em">Companies</h2>')
    s = sub1(s, '    </sc-for>\n  </section>\n  <section style="padding: 18px 20px 0">', '    </sc-for>\n  </section></sc-if>\n  <sc-if value="{{hasG}}" hint-placeholder-val="{{ false }}"><section style="padding: 18px 20px 0">')
    a = s.index('<a href="ArticleNavy.dc.html" style="display: flex; flex-direction: column; justify-content: center; min-height: 52px;'); b = s.index('</a>', a) + 4
    s = s[:a] + '<sc-for list="{{guides}}" as="x" hint-placeholder-count="2"><a href="{{x.href}}" style="display: flex; flex-direction: column; justify-content: center; min-height: 52px; border-bottom: 1px solid #EDEFF2; text-decoration: none"><span style="font-size: 15px; font-weight: 500">{{x.t}}</span><span style="font-size: 12px; color: #5B6577">{{x.s}}</span></a></sc-for>' + s[b:]
    s = sub1(s, '</sc-for>\n  </section>\n  <a href="AskFinvoraNavy.dc.html"', '</sc-for>\n  </section></sc-if>\n  <a href="{{askHref}}"')
    s = sub1(s, 'Ask Finvora AI: "Which bank pays the best dividend?"</a>', '{{askLabel}}</a>')
    s = logic(s, MARK + '''
  constructor(p) { super(p); const m = /[?&]q=([^&]*)/.exec(location.search); this.state = { q: m ? decodeURIComponent(m[1].replace(/\\+/g, ' ')) : 'bank' }; }
  componentDidMount() { this.check(); }
  componentDidUpdate() { clearTimeout(this.t); this.t = setTimeout(() => this.check(), 700); }
  co(q) {
    const C = [['Zenith Bank', 'ZENITHBANK', '₦48.20', '▲ 3.4%', 1], ['Guaranty Trust Holding', 'GTCO', '₦52.10', '▲ 0.8%', 1], ['Access Holdings', 'ACCESSCORP', '₦22.40', '▼ 0.9%', 0], ['United Bank for Africa', 'UBA', '₦27.85', '▲ 1.1%', 1]];
    q = q.trim().toLowerCase(); const bank = /bank/.test(q);
    return C.filter(([n, t]) => q && (bank || n.toLowerCase().indexOf(q) >= 0 || t.toLowerCase().indexOf(q) >= 0));
  }
  res() { const L = window.FV && window.FV.LIB; return L && this.state.q.trim() ? L.search(this.state.q) : { results: [], didYouMean: null }; }
  check() { const q = this.state.q.trim(); if (q.length < 2) return; if (!this.co(q).length && !this.res().results.length) location.replace('EmptySearchNavy.dc.html?q=' + encodeURIComponent(q)); }
  renderVals() {
    const r = this.res(), c = this.co(this.state.q);
    const g = r.results.filter((x) => x.kind === 'article').slice(0, 5);
    return { q: this.state.q, onQ: (e) => this.setState({ q: e.target.value }), hasCo: !!c.length, hasG: !!g.length,
      co: c.map(([n, t, p, d, up]) => ({ n, t, p, d, col: up ? '#10B981' : '#B9473F' })),
      guides: g.map((x) => ({ t: x.title, s: x.subtitle.replace('Term · ', ''), href: 'ArticleNavy.dc.html?a=' + x.id })),
      askHref: 'AskFinvoraNavy.dc.html?q=' + encodeURIComponent(this.state.q), askLabel: 'Ask Finvora AI: "' + this.state.q.trim() + '"' };
  }''')
    wr('SearchNavy', s)

# No results
s = rd('EmptySearchNavy')
if MARK not in s:
    s = sub1(s, '<input aria-label="Search" value="zenit bnk" style="', '<input aria-label="Search" type="search" value="{{q}}" onInput="{{onQ}}" onKeyDown="{{onKey}}" style="')
    s = sub1(s, '>No results for "zenit bnk"</h1>', '>No results for "{{q0}}"</h1>')
    s = sub1(s, '<a href="CompanyNavy.dc.html" style="height: 52px;', '<sc-if value="{{hasDym}}" hint-placeholder-val="{{ false }}"><a href="{{dymHref}}" style="height: 52px;')
    s = sub1(s, '>Did you mean Zenith Bank?</a>', '>{{dymLabel}}</a></sc-if>')
    s = sub1(s, '<a href="AskFinvoraNavy.dc.html" style="height: 52px;', '<a href="{{askHref}}" style="height: 52px;')
    s = logic(s, MARK + '''
  constructor(p) { super(p); const m = /[?&]q=([^&]*)/.exec(location.search); const q = m ? decodeURIComponent(m[1].replace(/\\+/g, ' ')) : 'zenit bnk'; this.state = { q, q0: q }; }
  renderVals() {
    const L = window.FV && window.FV.LIB, q0 = this.state.q0, d = L ? L.search(q0).didYouMean : null;
    const zen = /zen|zenit/i.test(q0), art = d && L ? (L.article(String(d)) || L.all().filter((x) => x.title.toLowerCase() === String(d).toLowerCase())[0]) : null, dym = zen ? 'Zenith Bank' : art ? art.title : d ? String(d) : '';
    return { q: this.state.q, q0, onQ: (e) => this.setState({ q: e.target.value }), onKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); location.href = 'SearchNavy.dc.html?q=' + encodeURIComponent(this.state.q); } },
      hasDym: !!dym, dym, dymLabel: 'Did you mean ' + dym + '?', dymHref: zen ? 'CompanyNavy.dc.html' : art ? 'ArticleNavy.dc.html?a=' + art.slug : 'SearchNavy.dc.html?q=' + encodeURIComponent(dym),
      askHref: 'AskFinvoraNavy.dc.html?q=' + encodeURIComponent(q0) };
  }''')
    wr('EmptySearchNavy', s)
print('wired')
