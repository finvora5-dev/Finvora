"""Wire the Ask Fin boards (UPAskKobo, UMAskLimit) to window.FV.ASK (scripted answers from packages/domain).
Usage: python3 wire_ask.py <site folder>"""
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
MARK = 'window.FV && window.FV.ASK'
USER = '<div style="display: flex; justify-content: flex-end"><p style="margin: 0; max-width: 78%; padding: 12px 14px; border-radius: 18px 18px 4px 18px; background: #5B21B6; color: #FFFFFF">'
FIN = '<div style="display: flex; gap: 8px; align-items: flex-end"><span style="width: 36px; height: 36px; flex: none"><dc-import name="GKobo" mood="happy" size="36" hint-size="36px,36px"></dc-import></span><div class="card" style="max-width: 82%; padding: 12px 14px; border-radius: 18px 18px 18px 4px; display: flex; flex-direction: column; gap: 8px">'

s = rd('UPAskKobo')
if MARK not in s:
    a = s.index('<main'); a = s.index('>', a) + 1; b = s.index('</main>')
    typing = s[s.index('<div style="display: flex; gap: 8px; align-items: flex-end"><span style="width: 36px; height: 36px; flex: none"><dc-import name="GKobo" mood="think"'):b].strip()
    s = s[:a] + '''
    <sc-if value="{{empty}}" hint-placeholder-val="{{false}}">''' + FIN + '''<p style="margin: 0">Hi, I'm Fin. Ask me what a money word means, or how something like inflation or dividends works. I explain things. I never tell you what to buy or sell.</p></div></div></sc-if>
    <sc-for list="{{msgs}}" as="m" hint-placeholder-count="2">''' + USER + '''{{m.q}}</p></div>
    ''' + FIN + '''<p style="margin: 0">{{m.a}}</p><sc-for list="{{m.cites}}" as="c" hint-placeholder-count="1"><a href="{{c.href}}" style="font-size: 13px; font-weight: 700; text-decoration: none">Source: Library · {{c.title}}</a></sc-for></div></div></sc-for>
    <sc-if value="{{pending}}" hint-placeholder-val="{{false}}">''' + USER + '''{{pendingQ}}</p></div>
    ''' + typing + '''</sc-if>
  ''' + s[b:]
    s = sub1(s, '<div style="display: flex; flex-wrap: wrap; gap: 8px"><a href="#s" class="chip">Explain it more simply</a><a href="#s" class="chip">Quiz me</a></div>',
        '<div style="display: flex; flex-wrap: wrap; gap: 8px"><sc-for list="{{chips}}" as="c" hint-placeholder-count="2"><button type="button" class="chip" onClick="{{c.tap}}" style="cursor: pointer; font: inherit">{{c.label}}</button></sc-for></div>')
    s = sub1(s, '<input type="text" placeholder="Ask about any money word"', '<input type="text" value="{{text}}" onInput="{{onText}}" onKeyDown="{{onKey}}" enterkeyhint="send" placeholder="Ask about any money word"')
    s = sub1(s, '<button type="button" aria-label="Send" class="press"', '<button type="button" aria-label="Send" onClick="{{send}}" class="press"')
    s = sub1(s, '<a href="UMAskLimit.dc.html" style="align-self: center; font-size: 13px; font-weight: 700; text-decoration: none">4 of 5 free questions left today</a>',
        '<a href="{{limitHref}}" style="align-self: center; font-size: 13px; font-weight: 700; text-decoration: none">{{left}}</a>')
    s = sub1(s, '<a href="UPLessonInfo.dc.html" class="press" aria-label="Back"', '<a href="{{backHref}}" class="press" aria-label="Back"')
    s = logic(s, '''  constructor(p) { super(p); this.state = { text: '', pending: '', tick: 0 }; }
  A() { return window.FV && window.FV.ASK; }
  componentDidMount() {
    try { const r = document.referrer ? new URL(document.referrer) : null; if (r && r.origin === location.origin && !/Ask/.test(r.pathname)) this.back = r.pathname.split('/').pop(); } catch (e) {}
    this.setState({ tick: 1 }); setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 50);
  }
  send(q) {
    const A = this.A(); q = String(q || '').trim(); if (!A || !q || this.state.pending) return;
    if (!A.status().allowed) { location.href = 'UMAskLimit.dc.html'; return; }
    this.setState({ pending: q, text: '' });
    setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 30);
    setTimeout(() => { A.ask(q); this.setState({ pending: '' }); setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 30); }, 700);
  }
  renderVals() {
    const A = this.A(); if (!A) return {};
    const all = A.messages(), st = A.status(), limit = A.limit();
    const msgs = all.map((m) => ({ q: m.q, a: m.r.answer, cites: m.r.citations.map((c) => ({ title: c.title, href: 'UPArticle.dc.html?a=' + c.articleSlug })) }));
    const last = all[all.length - 1], ideas = last ? last.r.followUps : A.suggestions();
    return { msgs, empty: !all.length && !this.state.pending, pending: !!this.state.pending, pendingQ: this.state.pending, text: this.state.text,
      chips: ideas.slice(0, 3).map((label) => ({ label, tap: () => this.send(label) })),
      left: limit === null ? 'Unlimited questions with Plus' : st.remaining + ' of ' + limit + ' free questions left today',
      limitHref: limit === null ? 'USYourPlan.dc.html' : 'UMAskLimit.dc.html', backHref: this.back || 'UOHome.dc.html',
      onText: (e) => this.setState({ text: e.target.value }), onKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); this.send(this.state.text); } },
      send: () => this.send(this.state.text) };
  }''')
    wr('UPAskKobo', s)

s = rd('UMAskLimit')
if MARK not in s:
    s = sub1(s, ">That's 5 questions today</h2>", ">That's {{n}} questions today</h2>")
    s = sub1(s, '>Free gives you 5 Ask Fin questions a day. More tomorrow at midnight.</p>', '>Free gives you {{n}} Ask Fin questions a day. More tomorrow at midnight.</p>')
    s = logic(s, '''  renderVals() { const A = window.FV && window.FV.ASK; return { n: String((A && A.limit()) || 5) }; }''')
    wr('UMAskLimit', s)
print('ask fin wired')
