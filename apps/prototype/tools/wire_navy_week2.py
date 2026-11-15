"""Wire Ask Finvora, the daily question and Progress to window.FV.
Ask: scripted answers, sources and follow-ups from packages/domain (FV.ASK), the Free daily limit (5, open-questions Q4)
opening the question limit screen, ?q= prefill from lessons and Home; first visit shows starter questions (build-backlog B2).
Daily: today's question from FV (admin-editable), answer once a Lagos day; the result shows in the bottom sheet.
Progress: days in a row, lessons and courses done, this week's activity, per-course progress.
Usage: python3 wire_navy_week2.py <site folder>"""
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
MARK = '/* navy-week2 */'

# ---- Ask Finvora
s = rd('AskFinvoraNavy')
if MARK not in s:
    a = s.index('<div style="flex: 1; padding: 16px 20px 0; display: flex; flex-direction: column; gap: 14px; overflow: hidden">'); b = s.index('<div style="padding: 10px 16px 124px; flex: none">', a)
    chip = '<button type="button" onClick="{{c.go}}" style="min-height: 36px; padding: 0 12px; border-radius: 999px; border: 1px solid #10B981; background: #FFFFFF; color: #047857; font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; text-align: left">{{c.t}}</button>'
    src = '<span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 8px; background: #E8EBEF; font-size: 12px">{{c.t}}</span>'
    s = s[:a] + '''<div id="chat" style="flex: 1; padding: 16px 20px 0; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; overscroll-behavior: contain">
  <sc-if value="{{empty}}" hint-placeholder-val="{{ false }}"><div style="display: flex; flex-direction: column; gap: 10px"><p style="margin: 0; font-size: 15px; line-height: 1.55">Ask about any NGX company, price or money idea.</p><div style="display: flex; gap: 8px; flex-wrap: wrap"><sc-for list="{{starters}}" as="c" hint-placeholder-count="4">''' + chip + '''</sc-for></div></div></sc-if>
  <sc-for list="{{msgs}}" as="m" hint-placeholder-count="1">
  <div style="align-self: flex-end; max-width: 80%; background: #0B192C; color: #FFFFFF; border-radius: 18px 18px 4px 18px; padding: 10px 14px; font-size: 15px; line-height: 1.45">{{m.q}}</div>
  <div style="display: flex; flex-direction: column; gap: 10px; font-size: 15px; line-height: 1.55">
    <sc-for list="{{m.paras}}" as="p" hint-placeholder-count="1"><p style="margin: 0; white-space: pre-line">{{p.t}}</p></sc-for>
    <sc-if value="{{m.hasSrc}}" hint-placeholder-val="{{ false }}"><div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center"><span style="font-size: 12px; color: #5B6577">Sources</span><sc-for list="{{m.src}}" as="c" hint-placeholder-count="2"><a href="{{c.href}}" style="text-decoration: none; color: #0B192C">''' + src + '''</a></sc-for></div></sc-if>
    <div style="display: flex; align-items: center; gap: 2px"><span style="margin-left: auto; font-size: 11px; color: #5B6577">Illustrative · not advice</span></div>
    <sc-if value="{{m.hasFollow}}" hint-placeholder-val="{{ false }}"><div style="display: flex; gap: 8px; flex-wrap: wrap"><sc-for list="{{m.follow}}" as="c" hint-placeholder-count="2">''' + chip + '''</sc-for></div></sc-if>
  </div>
  </sc-for>
</div>
''' + s[b:]
    s = sub1(s, '<textarea id="ask" rows="1" placeholder="Ask a follow-up" style="', '<textarea id="ask" rows="1" placeholder="{{ph}}" value="{{draft}}" onInput="{{onDraft}}" onKeyDown="{{onKey}}" style="')
    s = sub1(s, '<button aria-label="Send" style="width: 40px; height: 40px; border-radius: 999px; border: 0; background: #10B981;', '<button type="button" aria-label="Send" onClick="{{send}}" style="cursor: pointer; width: 40px; height: 40px; border-radius: 999px; border: 0; background: #10B981;')
    s = sub1(s, '>4 of 5 free questions left today</p>', '>{{left}}</p>')
    s = sub1(s, '<button aria-label="New conversation" style="', '<button type="button" aria-label="New conversation" onClick="{{fresh}}" style="cursor: pointer; ')
    s = logic(s, MARK + '''
  A() { return window.FV && window.FV.ASK; }
  constructor(p) { super(p); this.state = { draft: '', n: 0 }; }
  componentDidMount() {
    const m = /[?&]q=([^&]+)/.exec(location.search);
    if (m) { history.replaceState(null, '', location.pathname); this.ask(decodeURIComponent(m[1].replace(/\\+/g, ' '))); }
    this.bottom();
  }
  bottom() { setTimeout(() => { const c = document.getElementById('chat'); if (c) c.scrollTop = c.scrollHeight; }, 30); }
  ask(q) {
    const A = this.A(); q = String(q || '').trim(); if (!A || !q) return;
    if (!A.status().allowed) { location.href = 'AskLimitNavy.dc.html'; return; }
    A.ask(q); this.setState({ draft: '', n: this.state.n + 1 }); this.bottom();
  }
  renderVals() {
    const A = this.A(), msgs = A ? A.messages() : [], st = A ? A.status() : { remaining: 5 }, lim = A ? A.limit() : 5;
    const chips = (arr) => arr.map((t) => ({ t, go: () => this.ask(t) }));
    return { empty: !msgs.length, starters: chips(A ? A.suggestions().slice(0, 4) : []),
      msgs: msgs.map((m) => ({ q: m.q, paras: String(m.r.answer || '').split(/\\n\\n+/).map((t) => ({ t })),
        src: (m.r.citations || []).map((c) => ({ t: c.title, href: 'ArticleNavy.dc.html?a=' + c.articleSlug })), hasSrc: !!(m.r.citations || []).length,
        follow: chips((m.r.choices || []).map((c) => c.title).concat(m.r.followUps || []).slice(0, 3)), hasFollow: !!((m.r.followUps || []).length || (m.r.choices || []).length) })),
      ph: msgs.length ? 'Ask a follow-up' : 'Ask Finvora a question', draft: this.state.draft,
      left: lim === null ? 'Unlimited questions with Plus' : st.remaining + ' of ' + lim + ' free questions left today',
      onDraft: (e) => this.setState({ draft: e.target.value }),
      onKey: (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.ask(this.state.draft); } },
      send: () => this.ask(this.state.draft), fresh: () => { if (A) A.clear(); this.setState({ n: this.state.n + 1 }); } };
  }''')
    wr('AskFinvoraNavy', s)

# Home's Ask box sends its question to Ask Finvora.
s = rd('HomeNavy')
if 'askDraft' not in s:
    s = sub1(s, '<textarea id="hq" rows="3" placeholder=', '<textarea id="hq" rows="3" value="{{askDraft}}" onInput="{{onAsk}}" placeholder=')
    s = sub1(s, '<a href="AskFinvoraNavy.dc.html" aria-label="Send"', '<a href="{{askHref}}" aria-label="Send"')
    for q in ['What is a dividend?', "Explain MTN Nigeria's results", 'Why is inflation high?']:
        s = sub1(s, '<a href="AskFinvoraNavy.dc.html" style="min-height: 36px; display: flex; align-items: center; padding: 0 12px; border: 1px solid #D5D9E0; border-radius: 999px; font-size: 13px; text-decoration: none">' + q + '</a>',
                 '<a href="AskFinvoraNavy.dc.html?q=' + q.replace(' ', '+').replace(' ', '+').replace(' ', '+').replace(' ', '+') + '" style="min-height: 36px; display: flex; align-items: center; padding: 0 12px; border: 1px solid #D5D9E0; border-radius: 999px; font-size: 13px; text-decoration: none">' + q + '</a>')
    s = sub1(s, "  renderVals() {\n    const a = window.FV", "  constructor(p) { super(p); this.state = { q: '' }; }\n  renderVals() {\n    const a = window.FV")
    s = sub1(s, "return { name, today:", "return { askDraft: this.state.q, onAsk: (e) => this.setState({ q: e.target.value }), askHref: 'AskFinvoraNavy.dc.html' + (this.state.q.trim() ? '?q=' + encodeURIComponent(this.state.q.trim()) : ''), name, today:")
    wr('HomeNavy', s)

# ---- Daily question
s = rd('DailyNavy')
if MARK not in s:
    a = s.index('<div style="margin: 14px 24px 0; padding: 16px; border-radius: 16px; background: #FFFFFF;'); b = s.index('<h1 ', a)
    s = s[:a] + '<p style="margin: 14px 24px 0; font-size: 12px; color: #5B6577; flex: none">{{today}}</p>' + s[b:]
    s = sub1(s, '>What is its P/E ratio?</h1>', '>{{q}}</h1>')
    a = s.index('<div role="radiogroup"'); b = s.index('</div>', a) + 6
    s = s[:a] + '<div role="radiogroup" aria-label="Answer" style="margin: 14px 24px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex: none"><sc-for list="{{opts}}" as="o" hint-placeholder-count="4"><button type="button" role="radio" aria-checked="{{o.on}}" onClick="{{o.pick}}" style="min-height: 58px; padding: 8px 12px; border-radius: 14px; border: {{o.bd}}; background: {{o.bg}}; font: inherit; font-size: 15px; color: #0B192C; cursor: pointer">{{o.t}}</button></sc-for></div>' + s[b:]
    s = sub1(s, '<p style="margin: 12px 24px 0; font-size: 13px; line-height: 1.6; color: #334155; flex: none">P/E = price ÷ earnings per share.</p>', '<sc-if value="{{showHint}}" hint-placeholder-val="{{ false }}"><p style="margin: 12px 24px 0; font-size: 13px; line-height: 1.6; color: #334155; flex: none">{{hint}}</p></sc-if>')
    s = sub1(s, '<button style="flex: none; min-height: 54px;', '<sc-if value="{{hasHint}}" hint-placeholder-val="{{ false }}"><button type="button" onClick="{{toggleHint}}" aria-expanded="{{hintOpen}}" style="cursor: pointer; flex: none; min-height: 54px;')
    s = sub1(s, 'Hint</button><a href="DailyNavy.dc.html" style="flex: 1; height: 54px; border-radius: 14px; background: #334155; opacity: .4;', 'Hint</button></sc-if><a href="#" onClick="{{check}}" aria-disabled="{{noPick}}" style="flex: 1; height: 54px; border-radius: 14px; background: {{ctaBg}}; opacity: {{op}};')
    sheet = rd('LessonNavy'); i = sheet.index('<sc-if value="{{answered}}"'); j = sheet.index('</sc-if>', sheet.index('</section>', i)) + len('</sc-if>')
    k = s.rindex('</div>', 0, s.index('</x-dc>')); s = s[:k] + sheet[i:j] + s[k:]
    s = logic(s, MARK + '''
  constructor(p) { super(p); this.state = { pick: null, res: null, hint: false }; }
  renderVals() {
    const F = window.FV, D = F ? F.LOOP.daily() : null; if (!D) return {};
    const r = this.state.res, ok = !!(r && r.ok), already = D.done && !r;
    const today = new Date(Date.now() + 3600000).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    const p = this.state.pick;
    return { today, q: D.q, hint: D.hint, hasHint: !!D.hint && !already, showHint: this.state.hint && !r, hintOpen: String(this.state.hint), toggleHint: () => this.setState({ hint: !this.state.hint }),
      opts: D.opts.map((t, i) => ({ t, on: String(p === i), bd: r && i === D.right ? '2px solid #10B981' : r && p === i ? '2px solid #B9473F' : p === i ? '2px solid #0B192C' : '1px solid #D5D9E0', bg: r && i === D.right ? '#EAF6EF' : r && p === i ? '#FCEFED' : '#FFFFFF',
        pick: () => { if (!r && !already) this.setState({ pick: i }); } })),
      noPick: String(p === null), ctaBg: p === null && !already ? '#334155' : '#0B192C', op: p === null || already ? '.4' : '1',
      check: (e) => { e.preventDefault(); if (p === null || r || already) return; const good = p === D.right; F.LOOP.dailyAnswer(good); this.setState({ res: { ok: good } }); },
      answered: !!r || already, iconBg: ok || already ? '#DDF3E6' : '#FCEDEB', tone: ok || already ? '#10B981' : '#B9473F', icon: ok || already ? '✓' : '×',
      title: already ? 'Done for today' : ok ? 'Correct' : 'Not quite', sub: already || ok ? 'Daily question' : 'The right answer is ' + D.opts[D.right],
      why: already ? "You've done today's question. Come back tomorrow for a new one." : ok ? D.explain : ((D.whys && D.whys[p]) || D.explain),
      askTitle: 'Ask Finvora about this', askQ: encodeURIComponent(D.q), cta: 'Back to Home', ctaHref: 'HomeNavy.dc.html', ctaBg2: '#0B192C' };
  }''')
    wr('DailyNavy', s)

# ---- Progress
s = rd('ProgressNavy')
if MARK not in s:
    s = sub1(s, 'font-size: 18px">7</dd>', 'font-size: 18px">{{days}}</dd>')
    s = sub1(s, '>3/36<', '>{{lessons}}<')
    s = sub1(s, '>0/6<', '>{{courses}}<')
    a = s.index('<div style="display: flex; align-items: flex-end; gap: 10px; height: 110px; padding-top: 8px">'); b = s.index('</div>', a) + 6
    s = s[:a] + '<div style="display: flex; align-items: flex-end; gap: 10px; height: 110px; padding-top: 8px"><sc-for list="{{week}}" as="d" hint-placeholder-count="7"><span style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px"><span style="width: 100%; height: {{d.h}}; border-radius: 6px; background: {{d.c}}"></span><span style="font-size: 12px; color: #5B6577">{{d.l}}</span></span></sc-for></div>' + s[b:]
    s = sub1(s, '12 minutes of learning this week', '{{mins}}')
    s = sub1(s, '>3/6<', '>{{c1}}<'); s = sub1(s, 'width: 50%', 'width: {{c1w}}')
    s = logic(s, MARK + '''
  renderVals() {
    const F = window.FV, st = F ? F.get() : { done: 0, days: [], log: [] }, LS = F ? F.LESSONS : [];
    const now = new Date(Date.now() + 3600000), dow = (now.getUTCDay() + 6) % 7, mon = new Date(now.getTime() - dow * 86400000);
    const iso = (t) => t.toISOString().slice(0, 10), days = st.days || [];
    const mins = {}; (st.log || []).forEach((e) => { if (e.kind === 'lesson' || e.kind === 'practice') { const L = LS.filter((x) => x.title === e.title)[0]; mins[e.day] = (mins[e.day] || 0) + (L ? L.min : 0); } if (e.kind === 'daily') mins[e.day] = (mins[e.day] || 0) + 1; });
    const max = Math.max(1, ...Object.values(mins));
    const week = 'MTWTFSS'.split('').map((l, i) => { const d = iso(new Date(mon.getTime() + i * 86400000)), m = mins[d] || (days.indexOf(d) >= 0 ? 1 : 0); return { l, h: Math.round(m / max * 72) + 'px', c: d === iso(now) ? '#0B192C' : '#D5D9E0' }; });
    const total = week.reduce((a, _, i) => a + (mins[iso(new Date(mon.getTime() + i * 86400000))] || 0), 0), done = st.done || 0;
    return { days: String(F ? F.streak() : 0), lessons: done + '/36', courses: (done >= LS.length && LS.length ? 1 : 0) + '/6', week,
      mins: total + (total === 1 ? ' minute' : ' minutes') + ' of learning this week', c1: done + '/' + (LS.length || 6), c1w: Math.round(done / (LS.length || 6) * 100) + '%' };
  }''')
    wr('ProgressNavy', s)
print('wired')
