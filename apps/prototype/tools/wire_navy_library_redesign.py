"""Owner-approved redesign, 16 Nov 2026 (drafts in mockups/drafts-library; skill: emil-design-eng):
- Topic screens (phone and laptop, every topic): a light compact header (icon, title, "N guides · N min · N read" and a thin
  progress bar) and guide cards (number or a green tick once read, description, time and key-point chips), then an Ask row.
- Laptop Library: header with search, word of the day as a navy feature card, continue reading, topic cards listing their
  guides, popular this week as cards. Read times are counted, never typed in.
Idempotent. Usage: wire_navy_library_redesign.py <site>"""
import os, re, sys
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n)).read()
def wr(n, s): open(os.path.join(SITE, n), 'w').write(s)
MONO = "'Geist Mono', monospace"

# Read progress per guide (the article screens already record it as you scroll).
s = rd('fv.js')
if 'readPct:' not in s:
    a = "    reading: function () {"
    assert s.count(a) == 1
    s = s.replace(a, "    /** How far this guide has been read, 0 to 100 (90 or more counts as read). */\n    readPct: function (slug) { var r = (libLoad().read || {})[slug]; return r ? r.pct : 0; },\n" + a)
    wr('fv.js', s); print('fv.js: LIB.readPct')

ICONS = [  # one per topic, in LIB.TOPICS order: Money basics, Investing, The Nigerian market, Companies and reports
    '<path d="M3 7h18v10H3z"></path><circle cx="12" cy="12" r="2.5"></circle><path d="M6 10v4M18 10v4"></path>',
    '<path d="M4 19h16M6 15l4-4 3 3 5-6"></path><path d="M15 8h3v3"></path>',
    '<path d="M4 20V10l8-6 8 6v10"></path><path d="M9 20v-6h6v6"></path>',
    '<rect x="5" y="3" width="14" height="18" rx="2"></rect><path d="M9 8h6M9 12h6M9 16h3"></path>',
]
def icon(flag_prefix, size, colour='#0B192C'):
    return ''.join('<sc-if value="{{' + flag_prefix + str(i) + '}}" hint-placeholder-val="{{ ' + ('true' if i == 1 else 'false') + ' }}"><svg width="' + str(size) + '" height="' + str(size) + '" viewBox="0 0 24 24" fill="none" stroke="' + colour + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg></sc-if>' for i, p in enumerate(ICONS))
CHEV = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E9AAE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: none; align-self: center"><path d="M9 6l6 6-6 6"></path></svg>'
TICK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"></path></svg>'
SPARK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"></path></svg>'
CHIP = 'padding: 2px 8px; border-radius: 999px; background: #F1F3F5'

def topic_html(pad, grid):
    card = ('<a href="{{x.href}}" style="display: flex; gap: 14px; align-items: flex-start; padding: 16px; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; text-decoration: none; color: #0B192C">'
            '<span style="width: 30px; height: 30px; flex: none; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-family: ' + MONO + '; font-size: 12px; background: {{x.dotBg}}; color: #0B192C">'
            '<sc-if value="{{x.done}}" hint-placeholder-val="{{ false }}">' + TICK + '</sc-if><sc-if value="{{x.todo}}" hint-placeholder-val="{{ true }}">{{x.n}}</sc-if></span>'
            '<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 16px; font-weight: 600; line-height: 1.3">{{x.t}}</span>'
            '<span class="fv-clamp2" style="font-size: 13px; line-height: 1.45; color: #5B6577; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden">{{x.d}}</span>'
            '<span style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; color: #5B6577"><span style="' + CHIP + '; font-family: ' + MONO + '">{{x.min}}</span><span style="' + CHIP + '">{{x.pts}}</span>'
            '<sc-if value="{{x.done}}" hint-placeholder-val="{{ false }}"><span style="padding: 2px 8px; border-radius: 999px; background: #DDF3E6; color: #047857">Read</span></sc-if></span></span>' + CHEV + '</a>')
    return ('<!-- topic-redesign --><header style="padding: ' + pad + '; display: flex; flex-direction: column; gap: 10px; flex: none">'
            '<div style="display: flex; align-items: center; gap: 12px"><span style="width: 40px; height: 40px; flex: none; border-radius: 12px; background: #E8EBEF; display: flex; align-items: center; justify-content: center">' + icon('ic', 20) + '</span>'
            '<h1 style="margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.2">{{name}}</h1></div>'
            '<div style="display: flex; align-items: center; gap: 12px"><span style="font-size: 14px; color: #5B6577; white-space: nowrap">{{meta}} · <span style="color: #047857; font-weight: 500">{{readLine}}</span></span>'
            '<span role="progressbar" aria-label="Guides read" aria-valuemin="0" aria-valuemax="100" aria-valuenow="{{pctN}}" style="flex: 1; height: 4px; border-radius: 999px; background: #E5E7EB; overflow: hidden"><span style="display: block; height: 100%; width: {{pct}}; background: #10B981"></span></span></div></header>'
            '<section style="padding: ' + ('12px 16px 0' if not grid else '8px 0 0') + '; display: ' + ('flex; flex-direction: column' if not grid else 'grid; grid-template-columns: repeat(2, minmax(0, 1fr))') + '; gap: ' + ('10px' if not grid else '16px') + '; flex: none"><sc-for list="{{items}}" as="x" hint-placeholder-count="4">' + card + '</sc-for></section>')

def ask_html(pad):
    return ('<a href="{{askHref}}" style="margin: ' + pad + '; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 16px; background: #E8EBEF; text-decoration: none; color: #0B192C; font-size: 15px; font-weight: 500; flex: none">'
            '<span style="width: 28px; height: 28px; flex: none; border-radius: 8px; background: #0B192C; display: flex; align-items: center; justify-content: center">' + SPARK + '</span><span style="flex: 1">{{askT}}</span>' + CHEV + '</a>')

TOPIC_JS = r'''class Component extends DCLogic {
/* navy-library */
  renderVals() {
    const L = window.FV ? window.FV.LIB : null; if (!L) return {};
    const m = /[?&]t=([^&]+)/.exec(location.search), name = m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : 'The Nigerian market';
    const r = L.inTopic(name), mins = r.items.reduce((a, x) => a + L.minutes(x), 0), ti = L.TOPICS.map((t) => t.name).indexOf(r.topic.name);
    const done = r.items.filter((x) => L.readPct(x.slug) >= 90).length, pctN = r.items.length ? Math.round(done / r.items.length * 100) : 0, v = {};
    [0, 1, 2, 3].forEach((i) => { v['ic' + i] = i === ti; });
    return Object.assign(v, { name: r.topic.name, meta: r.items.length + (r.items.length === 1 ? ' guide' : ' guides') + ' · ' + mins + ' min', readLine: done + ' read', pct: pctN + '%', pctN: String(pctN),
      showCourse: r.topic.name === 'The Nigerian market', askT: 'Ask Finvora about ' + r.topic.name.toLowerCase(), askHref: '__ASK__?q=' + encodeURIComponent('Explain ' + r.topic.name.toLowerCase() + ' simply'),
      items: r.items.map((x, i) => { const rd = L.readPct(x.slug) >= 90, k = ((x.deep || {}).takeaways || []).length;
        return { t: x.title, d: x.definition, n: String(i + 1), done: rd, todo: !rd, dotBg: rd ? '#10B981' : '#E8EBEF', min: L.minutes(x) + ' min', pts: k + (k === 1 ? ' key point' : ' key points'), href: 'ArticleNavy.dc.html?a=' + x.slug }; }) });
  }
}'''

for f, pad, grid, ask in (('TopicNavy.dc.html', '6px 20px 0', False, 'AskFinvoraNavy.dc.html'), ('TopicLaptopNavy.dc.html', '4px 0 0', True, 'AskLaptopNavy.dc.html')):
    s = rd(f)
    if '<!-- topic-redesign -->' in s: continue
    i = s.index('<span style="padding: 4px ' + ('24px' if not grid else '0') + ' 0; font-size: 12px; font-weight: 600; color: #5B6577; text-transform: uppercase; letter-spacing: .06em; display: block">Topic</span>')
    j = s.index('<sc-if value="{{showCourse}}"', i)
    s = s[:i] + topic_html(pad, grid) + s[j:]
    k = s.index('</sc-if>', s.index('<sc-if value="{{showCourse}}"')) + len('</sc-if>')
    s = s[:k] + ask_html('18px 16px 0' if not grid else '20px 0 0') + s[k:]
    if not grid: s = s.replace('padding: 18px 24px 0; flex: none"><h2 style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #5B6577; text-transform: uppercase; letter-spacing: .06em">Related course', 'padding: 18px 20px 0; flex: none"><h2 style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #5B6577; text-transform: uppercase; letter-spacing: .06em">Related course', 1)
    a = s[s.index('class Component extends DCLogic {'):s.index('</script>', s.index('data-dc-script'))].rstrip() + '\n'
    s = s.replace(a, TOPIC_JS.replace('__ASK__', ask) + '\n', 1)
    if not grid: s = s.replace('overflow: hidden; padding-bottom: 88px;">', 'overflow-y: auto; padding-bottom: 120px;">', 1)
    wr(f, s); print('redesigned', f)

# ---- Laptop Library main content.
CARD = 'background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px'
LABEL = 'font-size: 12px; font-weight: 600; color: #5B6577; text-transform: uppercase; letter-spacing: .06em'
SEARCH_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B6577" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4-4"></path></svg>'
LIB_MAIN = ('<!-- library-redesign -->'
    '<div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap"><div><h1 style="margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.02em">Library</h1><p style="margin: 6px 0 0; font-size: 14px; color: #5B6577">{{sub}}</p></div>'
    '<label style="flex: 0 1 520px; min-width: 280px; height: 48px; display: flex; align-items: center; gap: 10px; padding: 0 16px; border: 1px solid #D5D9E0; border-radius: 12px; background: #FFFFFF">' + SEARCH_ICON +
    '<input type="search" enterkeyhint="search" autocorrect="off" aria-label="Search the library" placeholder="Search any money word" value="{{q}}" onInput="{{onQ}}" onKeyDown="{{onKey}}" style="flex: 1; min-width: 0; border: 0; font: inherit; font-size: 16px; outline: none; background: transparent">'
    '<a href="DictionaryNavy.dc.html" style="font-family: ' + MONO + '; font-size: 12px; padding: 3px 8px; border-radius: 6px; background: #F1F3F5; color: #334155; text-decoration: none">A–Z</a></label></div>'
    '<div style="display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 20px">'
    '<a href="{{wHref}}" style="border-radius: 20px; background: #0B192C; color: #FFFFFF; padding: 26px 28px; display: flex; flex-direction: column; gap: 12px; text-decoration: none"><span style="' + LABEL + '; color: #00E676">Word of the day</span><span style="font-size: 30px; font-weight: 600; letter-spacing: -0.02em">{{wTitle}}</span><span style="font-size: 16px; line-height: 1.55; color: #C7D0DD; max-width: 56ch">{{wDef}}</span><span style="margin-top: 6px; align-self: flex-start; height: 40px; padding: 0 16px; border-radius: 10px; background: #10B981; color: #FFFFFF; font-weight: 600; font-size: 14px; display: flex; align-items: center">{{wCta}}</span></a>'
    '<a href="{{cHref}}" style="' + CARD + '; padding: 22px 24px; display: flex; flex-direction: column; gap: 10px; text-decoration: none; color: #0B192C"><span style="' + LABEL + '">{{cLabel}}</span><span style="font-size: 20px; font-weight: 600">{{cTitle}}</span><span style="font-size: 14px; line-height: 1.5; color: #5B6577">{{cDef}}</span>'
    '<span style="margin-top: auto; display: flex; align-items: center; gap: 10px"><span style="flex: 1; height: 6px; border-radius: 999px; background: #EDEFF2; overflow: hidden"><span style="display: block; height: 100%; width: {{cPct}}; background: #10B981"></span></span><span style="font-family: ' + MONO + '; font-size: 12px; color: #5B6577">{{cPct}}</span></span></a></div>'
    '<section style="display: flex; flex-direction: column; gap: 12px"><h2 style="margin: 0; ' + LABEL + '">Browse by topic</h2><div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px"><sc-for list="{{topics}}" as="tp" hint-placeholder-count="4">'
    '<a href="{{tp.href}}" style="' + CARD + '; padding: 20px; display: flex; flex-direction: column; gap: 14px; text-decoration: none; color: #0B192C"><span style="display: flex; align-items: center; gap: 12px"><span style="width: 40px; height: 40px; flex: none; border-radius: 12px; background: #E8EBEF; display: flex; align-items: center; justify-content: center">' + icon('tp.i', 20) + '</span>'
    '<span style="display: flex; flex-direction: column; min-width: 0"><span style="font-size: 16px; font-weight: 600">{{tp.name}}</span><span style="font-size: 12px; color: #5B6577">{{tp.meta}}</span></span></span>'
    '<span style="display: flex; flex-direction: column; gap: 8px; border-top: 1px solid #EDEFF2; padding-top: 12px"><sc-for list="{{tp.first}}" as="g"><span style="font-size: 14px; color: #334155; display: flex; justify-content: space-between; gap: 8px"><span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{g.t}}</span><span style="flex: none; font-family: ' + MONO + '; font-size: 12px; color: #8E9AAE">{{g.m}}</span></span></sc-for>'
    '<sc-if value="{{tp.hasMore}}" hint-placeholder-val="{{ true }}"><span style="font-size: 13px; color: #047857; font-weight: 500">{{tp.more}}</span></sc-if></span></a></sc-for></div></section>'
    '<section style="display: flex; flex-direction: column; gap: 12px"><h2 style="margin: 0; ' + LABEL + '">Popular this week</h2><div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px"><sc-for list="{{pop}}" as="pp" hint-placeholder-count="3">'
    '<a href="{{pp.href}}" style="' + CARD + '; padding: 18px 20px; display: flex; gap: 16px; align-items: flex-start; text-decoration: none; color: #0B192C"><span style="font-family: ' + MONO + '; font-size: 28px; line-height: 1; color: #C0C6D0">{{pp.n}}</span><span style="display: flex; flex-direction: column; gap: 6px; min-width: 0"><span style="font-size: 16px; font-weight: 600">{{pp.t}}</span>'
    '<span style="font-size: 13px; line-height: 1.45; color: #5B6577; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden">{{pp.d}}</span><span style="font-size: 12px; color: #5B6577">{{pp.s}}</span></span></a></sc-for></div></section>')

LIB_JS = r'''class Component extends DCLogic {
/* navy-laptop */ /* library-redesign */
  constructor(p) { super(p); this.state = { q: '' }; }
  renderVals() {
    const L = window.FV ? window.FV.LIB : null; if (!L) return {}; const w = L.wordOfDay(), all = L.all();
    const go = () => { const q = this.state.q.trim(); if (q) location.href = 'SearchNavy.dc.html?q=' + encodeURIComponent(q); };
    const r = L.reading()[0], next = r ? null : all.filter((x) => L.readPct(x.slug) < 90)[0] || all[0], c = r ? r.a : next, cp = r ? Math.round(r.pct) : 0;
    const topics = L.TOPICS.map((t, ti) => { const it = L.inTopic(t.name).items, v = { name: t.name, href: 'TopicNavy.dc.html?t=' + encodeURIComponent(t.name).replace(/%20/g, '+'),
      meta: it.length + (it.length === 1 ? ' guide' : ' guides') + ' · ' + it.reduce((a, x) => a + L.minutes(x), 0) + ' min', first: it.slice(0, 3).map((x) => ({ t: x.title, m: L.minutes(x) + 'm' })), hasMore: it.length > 3, more: '+ ' + (it.length - 3) + ' more' };
      [0, 1, 2, 3].forEach((i) => { v['i' + i] = i === ti; }); return v; });
    const pop = ['stock-exchange', 'inflation', 'revenue-and-profit'].map((s) => L.article(s)).filter(Boolean).map((a, i) => ({ n: String(i + 1), t: a.title, d: a.definition, s: L.topicOf(a).name + ' · ' + L.minutes(a) + ' min', href: 'ArticleNavy.dc.html?a=' + a.slug }));
    return { q: this.state.q, onQ: (e) => this.setState({ q: e.target.value }), onKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } },
      sub: all.length + ' short guides on money, investing and the NGX, in plain words.',
      wTitle: w.title, wDef: w.definition, wHref: 'ArticleNavy.dc.html?a=' + w.slug, wCta: 'Read in ' + L.minutes(w) + ' min',
      cLabel: r ? 'Continue reading' : 'Next to read', cTitle: c.title, cDef: c.definition, cPct: cp + '%', cHref: 'ArticleNavy.dc.html?a=' + c.slug, topics, pop };
  }
}'''
s = rd('LibraryLaptopNavy.dc.html')
if '<!-- library-redesign -->' not in s:
    i = s.index('<main'); i = s.index('>', i) + 1; j = s.index('</main>', i)
    s = s[:i] + LIB_MAIN + s[j:]
    s = s.replace('<main style="flex: 1; min-width: 0; padding: 28px 40px; box-sizing: border-box; display: flex; flex-direction: column; gap: 20px">', '<main style="flex: 1; min-width: 0; padding: 28px 40px; box-sizing: border-box; display: flex; flex-direction: column; gap: 28px">', 1)
    a = s[s.index('class Component extends DCLogic {'):s.index('</script>', s.index('data-dc-script'))].rstrip() + '\n'
    s = s.replace(a, LIB_JS + '\n', 1)
    wr('LibraryLaptopNavy.dc.html', s); print('redesigned LibraryLaptopNavy.dc.html')

# ---- Phone Library (owner approved, 16 Nov 2026: match the laptop design; the Courses/Library switch stays).
PH_MAIN = ('<!-- library-phone-redesign --><header style="padding: 18px 20px 4px; display: flex; flex-direction: column; gap: 12px; flex: none">'
    '<div style="display: flex; background: #E8EBEF; border-radius: 12px; padding: 3px"><a href="LearnNavy.dc.html" style="flex: 1; height: 38px; border-radius: 9px; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 14px; font-weight: 500; color: #5B6577">Courses</a>'
    '<a href="LibraryNavy.dc.html" aria-current="page" style="flex: 1; height: 38px; border-radius: 9px; background: #FFFFFF; box-shadow: 0 1px 3px rgba(11,25,44,.12); display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 14px; font-weight: 600; color: #0B192C">Library</a></div>'
    '<div><h1 style="margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.02em">Library</h1><p style="margin: 4px 0 0; font-size: 14px; color: #5B6577">{{sub}}</p></div>'
    '<label for="lib" style="height: 48px; display: flex; align-items: center; gap: 10px; padding: 0 14px; border: 1px solid #D5D9E0; border-radius: 12px; background: #FFFFFF">' + SEARCH_ICON +
    '<input id="lib" type="search" enterkeyhint="search" autocorrect="off" aria-label="Search the library" placeholder="Search any money word" value="{{q}}" onInput="{{onQ}}" onKeyDown="{{onKey}}" style="flex: 1; min-width: 0; border: 0; font: inherit; font-size: 16px; outline: none; background: transparent">'
    '<a href="DictionaryNavy.dc.html" style="font-family: ' + MONO + '; font-size: 12px; padding: 3px 8px; border-radius: 6px; background: #F1F3F5; color: #334155; text-decoration: none">A–Z</a></label></header>'
    '<div style="padding: 10px 16px 0; display: flex; flex-direction: column; gap: 12px; flex: none">'
    '<a href="{{wHref}}" style="border-radius: 20px; background: #0B192C; color: #FFFFFF; padding: 20px; display: flex; flex-direction: column; gap: 10px; text-decoration: none"><span style="' + LABEL + '; color: #00E676">Word of the day</span><span style="font-size: 24px; font-weight: 600; letter-spacing: -0.02em">{{wTitle}}</span><span style="font-size: 15px; line-height: 1.5; color: #C7D0DD">{{wDef}}</span><span style="margin-top: 4px; align-self: flex-start; height: 40px; padding: 0 16px; border-radius: 10px; background: #10B981; color: #FFFFFF; font-weight: 600; font-size: 14px; display: flex; align-items: center">{{wCta}}</span></a>'
    '<a href="{{cHref}}" style="' + CARD + '; padding: 16px; display: flex; flex-direction: column; gap: 8px; text-decoration: none; color: #0B192C"><span style="' + LABEL + '">{{cLabel}}</span><span style="font-size: 17px; font-weight: 600">{{cTitle}}</span><span style="display: flex; align-items: center; gap: 10px"><span style="flex: 1; height: 6px; border-radius: 999px; background: #EDEFF2; overflow: hidden"><span style="display: block; height: 100%; width: {{cPct}}; background: #10B981"></span></span><span style="font-family: ' + MONO + '; font-size: 12px; color: #5B6577">{{cPct}}</span></span></a>'
    '<section style="margin-top: 8px; display: flex; flex-direction: column; gap: 10px"><h2 style="margin: 0; padding: 0 4px; ' + LABEL + '">Browse by topic</h2><sc-for list="{{topics}}" as="tp" hint-placeholder-count="4">'
    '<a href="{{tp.href}}" style="' + CARD + '; padding: 14px 16px; display: flex; align-items: center; gap: 12px; text-decoration: none; color: #0B192C"><span style="width: 40px; height: 40px; flex: none; border-radius: 12px; background: #E8EBEF; display: flex; align-items: center; justify-content: center">' + icon('tp.i', 20) + '</span>'
    '<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 16px; font-weight: 600">{{tp.name}}</span><span style="font-size: 12px; color: #5B6577">{{tp.meta}}</span><span style="font-size: 13px; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{tp.line}}</span></span>' + CHEV + '</a></sc-for></section>'
    '<section style="margin-top: 8px; display: flex; flex-direction: column; gap: 10px"><h2 style="margin: 0; padding: 0 4px; ' + LABEL + '">Popular this week</h2><sc-for list="{{pop}}" as="pp" hint-placeholder-count="3">'
    '<a href="{{pp.href}}" style="' + CARD + '; padding: 14px 16px; display: flex; gap: 14px; align-items: flex-start; text-decoration: none; color: #0B192C"><span style="font-family: ' + MONO + '; font-size: 24px; line-height: 1; color: #C0C6D0; width: 16px; flex: none">{{pp.n}}</span><span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 16px; font-weight: 600">{{pp.t}}</span>'
    '<span style="font-size: 13px; line-height: 1.45; color: #5B6577; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden">{{pp.d}}</span><span style="font-size: 12px; color: #5B6577">{{pp.s}}</span></span></a></sc-for></section></div>')

s = rd('LibraryNavy.dc.html')
if '<!-- library-phone-redesign -->' not in s:
    i = s.index('<header'); j = s.index('<nav aria-label="Main"')
    s = s[:i] + PH_MAIN + '\n  ' + s[j:]
    js = LIB_JS.replace('/* navy-laptop */ /* library-redesign */', '/* navy-library */ /* library-phone-redesign */').replace("sub: all.length + ' short guides on money, investing and the NGX, in plain words.',", "sub: all.length + ' short guides in plain words.',")
    js = js.replace("more: '+ ' + (it.length - 3) + ' more' };", "more: '+ ' + (it.length - 3) + ' more', line: it.slice(0, 3).map((x) => x.title).join(' · ') };")
    a = s[s.index('class Component extends DCLogic {'):s.index('</script>', s.index('data-dc-script'))].rstrip() + '\n'
    s = s.replace(a, js + '\n', 1)
    wr('LibraryNavy.dc.html', s); print('redesigned LibraryNavy.dc.html')
