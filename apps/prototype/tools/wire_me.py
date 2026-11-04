"""Wire Me, Progress, Achievements, History, Notifications, Settings and their sub-pages, and the Journey
World 2 state, to window.FV (activity log, badges, prefs, sign-in, plan). Usage: python3 wire_me.py <site folder>"""
import re, sys, os
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing in board: ' + a[:90])
    return s.replace(a, b, 1)
def resub(s, pat, rep):
    n = re.subn(pat, rep, s, count=1, flags=re.S)
    if not n[1]: raise SystemExit('pattern not found: ' + pat[:80])
    return n[0]
def logic(s, js):
    a = s.index('class Component extends DCLogic {'); b = s.index('</script>', a)
    return s[:a] + 'class Component extends DCLogic {\n' + js + '\n}\n' + s[b:]
MARK = 'window.FV.ME'
def done(s): return MARK in s or 'F.ME' in s or 'F.AUTH' in s or '{{faqs}}' in s
BTN = 'style="width: 100%; border: 0; cursor: pointer; font: inherit; font-weight: 700"'
COMMON = """  F() { return window.FV; }
  name() { const a = this.F().AUTH.get(); return a.name || 'You'; }
"""

# ---------- Me ----------
s = rd('UPMe')
if not done(s):
    s = sub1(s, 'justify-content: center">A</span><div style="flex: 1"><h2 style="font-size: 19px">Ada</h2><span class="muted" style="font-size: 14px">Level 2 · Finance Learner</span>', 'justify-content: center">{{initial}}</span><div style="flex: 1"><h2 style="font-size: 19px">{{name}}</h2><span class="muted" style="font-size: 14px">{{levelLine}}</span>')
    s = sub1(s, '<a href="USYourPlan.dc.html" class="card press"', '<a href="{{planHref}}" class="card press"')
    s = sub1(s, '>Finvora Plus · renews 2 Dec</span>', '>{{planLine}}</span>')
    s = resub(s, r'(<a href="UPStreak\.dc\.html" class="card press".*?<div class="num"[^>]*>)6(</div>)', r'\1{{streak}}\2')
    s = resub(s, r'(<a href="UPProgress\.dc\.html" class="card press".*?<div class="num"[^>]*>)174(</div>)', r'\1{{xp}}\2')
    s = resub(s, r'(<a href="UPAchievements\.dc\.html" class="card press".*?<div class="num"[^>]*>)3(</div>)', r'\1{{badges}}\2')
    s = sub1(s, '>3 of 9 earned</span>', '>{{badges}} of 9 earned</span>')
    s = sub1(s, '>1 new</span>', '>{{challengeLine}}</span>')
    s = sub1(s, '>3 articles</span>', '>{{savedLine}}</span>')
    s = sub1(s, '>2 new</span>', '>{{notifLine}}</span>')
    s = sub1(s, "  renderVals() { return { feedbackOn:", COMMON + """  renderVals() {
    const F = this.F(), v0 = { feedbackOn: (this.props.feedback || 'on') === 'on' && (!F || !F.ADMIN || F.ADMIN.on('suggest')) }; if (!F || !F.ME) return v0;
    const st = F.get(), L = F.LOOP.levelInfo(st.xp), plus = F.plan() === 'plus', sub = F.billing().sub, n = this.name(), saved = F.LIB.saved().length, notes = F.ME.notifications().length;
    return Object.assign(v0, { name: n, initial: n.charAt(0).toUpperCase(), levelLine: 'Level ' + L.n + ' \\u00b7 ' + L.name, streak: String(F.streak()), xp: String(st.xp),
      badges: String(F.ME.badges().filter((b) => b.earned).length), planHref: plus ? 'USYourPlan.dc.html' : 'USPlans.dc.html',
      planLine: plus ? 'Finvora Plus \\u00b7 ' + (sub.cancelled ? 'ends ' : 'renews ') + (sub.renewsOn ? F.PAY.date(sub.renewsOn) : '') : 'Free \\u00b7 see what Plus adds',
      challengeLine: F.LOOP.challenge('inflation') ? 'All done' : '1 new', savedLine: saved ? saved + (saved === 1 ? ' article' : ' articles') : 'Nothing saved yet', notifLine: notes ? notes + ' new' : 'All caught up' });
  }
  dummy() { return { feedbackOn:""")
    s = s.replace("  dummy() { return { feedbackOn:", "  _unused() { return { feedbackOn:", 1)
    wr('UPMe', s)

# ---------- Progress: level card, this week's XP, worlds ----------
s = rd('UPProgress')
if not done(s):
    s = sub1(s, '<h2 style="font-size: 19px">Finance Learner</h2><span class="muted num" style="font-size: 14px">174 / 250 XP · 76 XP to Market Explorer</span></div></div><div class="bar"><div class="fill" style="width: 49%; background: #7B4AF0">',
        '<h2 style="font-size: 19px">{{lvName}}</h2><span class="muted num" style="font-size: 14px">{{lvLine}}</span></div></div><div class="bar"><div class="fill" style="width: {{lvPct}}%; background: #7B4AF0">')
    s = sub1(s, '>104 XP this week. Wednesday was a rest day.</p>', '>{{weekLine}}</p>')
    s = sub1(s, '<span class="muted num">6/6</span></div><div class="bar"><div class="fill" style="width: 100%; background: #16884A">', '<span class="muted num">{{w1}}/6</span></div><div class="bar"><div class="fill" style="width: {{w1Pct}}%; background: #16884A">')
    s = sub1(s, '<span class="muted num">1/6</span></div><div class="bar"><div class="fill" style="width: 17%; background: #5B21B6">', '<span class="muted num">0/6</span></div><div class="bar"><div class="fill" style="width: 0%; background: #5B21B6">')
    s = logic(s, COMMON + """  componentDidMount() { this.paint(); }
  componentDidUpdate() { this.paint(); }
  paint() {
    const F = this.F(); if (!F || !F.ME) return; const lvN = String(F.LOOP.levelInfo(F.get().xp).n); document.querySelectorAll('#dc-root .card .row svg text').forEach((x) => { if (/^\\d$/.test(x.textContent.trim())) x.textContent = lvN; }); const W = F.ME.weekXp(), max = Math.max(30, ...W.map((d) => d.xp)), svg = document.querySelector('#dc-root svg[aria-label^="XP per day"]'); if (!svg) return;
    const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    svg.querySelectorAll('rect').forEach((r, i) => { const d = W[i]; if (!d) return; const h = d.xp ? Math.max(6, Math.round(d.xp / max * 76)) : 4; r.setAttribute('y', String(90 - h)); r.setAttribute('height', String(h)); r.setAttribute('rx', d.xp ? '6' : '2'); if (d.xp) r.removeAttribute('fill'); else r.setAttribute('fill', '#C9D6EA'); });
    svg.setAttribute('aria-label', 'XP per day this week: ' + W.map((d, i) => names[i] + ' ' + d.xp).join(', '));
  }
  renderVals() {
    const F = this.F(); if (!F || !F.ME) return {};
    const st = F.get(), L = F.LOOP.levelInfo(st.xp), W = F.ME.weekXp(), tot = W.reduce((n, d) => n + d.xp, 0), rest = F.LOOP.streakInfo().week.filter((d) => d.rest).map((d) => d.d);
    const dn = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long' }), done = Math.min(6, st.done);
    return { lvName: L.name, lvPct: String(L.pct), lvLine: L.next ? st.xp + ' / ' + L.next.at + ' XP \\u00b7 ' + (L.next.at - st.xp) + ' XP to ' + L.next.name : st.xp + ' XP \\u00b7 top level',
      weekLine: tot + ' XP this week.' + (rest.length ? ' ' + dn(rest[0]) + ' was a rest day.' : ''), w1: String(done), w1Pct: String(Math.round(done / 6 * 100)) };
  }""")
    wr('UPProgress', s)

# ---------- Achievements ----------
s = rd('UPAchievements')
if not done(s):
    s = sub1(s, '>3 of 9 earned</p>', '>{{count}} of 9 earned</p>')
    for i, t in enumerate(['First step', 'Clean sheet', 'Foundations laid', 'A week of learning', 'Daily habit', 'Problem solver', 'Curious mind', 'Came back stronger', "Investor's mindset"]):
        j = s.index('>%s</strong>' % t); a = s.rindex('<div class="card"', 0, j); b = s.index('</div>', j) + 6
        card = s[a:b]
        card = re.sub(r'(<div class="card" style=")', r'\1opacity: {{op%d}}; ' % i, card, count=1)
        card = re.sub(r'(<span style="width: 52px; height: 52px; border-radius: 999px; background: )#[0-9A-Fa-f]{6}', r'\1{{bg%d}}' % i, card, count=1)
        card = re.sub(r'stroke="#[0-9A-Fa-f]{6}"', 'stroke="{{fg%d}}"' % i, card)
        card = card.replace('<strong style="font-size: 13px; line-height: 1.25">%s</strong>' % t, '<strong style="font-size: 13px; line-height: 1.25">%s</strong><span class="sr">{{st%d}}</span>' % (t, i))
        s = s[:a] + card + s[b:]
    s = logic(s, COMMON + """  componentDidMount() { this.paint(); }
  componentDidUpdate() { this.paint(); }
  paint() { const F = this.F(); if (!F || !F.ME) return; const B = F.ME.badges(); document.querySelectorAll('#dc-root svg path, #dc-root svg circle').forEach((p) => { const k = /\\{\\{fg(\\d)\\}\\}/.exec(p.getAttribute('stroke') || ''); if (k) p.setAttribute('stroke', B[+k[1]].earned ? '#FFFFFF' : '#8E879A'); }); }
  renderVals() {
    const F = this.F(); if (!F || !F.ME) return {};
    const B = F.ME.badges(), v = { count: String(B.filter((b) => b.earned).length) };
    B.forEach((b, i) => { v['op' + i] = b.earned ? '1' : '.6'; v['bg' + i] = b.earned ? '#7B4AF0' : '#E7E2F0'; v['fg' + i] = b.earned ? '#FFFFFF' : '#8E879A'; v['st' + i] = b.earned ? ', earned' : ', not earned yet'; });
    return v;
  }""")
    wr('UPAchievements', s)

# ---------- History ----------
s = rd('UPHistory')
if not done(s):
    s = sub1(s, '<a href="#clear" style="', '<a href="#clear" onClick="{{clear}}" style="')
    s = sub1(s, '<a href="#a" class="chip chip-on">All</a><a href="#r" class="chip">Reading</a><a href="#l" class="chip">Lessons</a>',
        '<sc-for list="{{chips}}" as="c" hint-placeholder-count="3"><button type="button" class="{{c.cls}}" aria-pressed="{{c.on}}" onClick="{{c.tap}}" style="cursor: pointer; font: inherit">{{c.label}}</button></sc-for>')
    a = s.index('<section style="display: flex; flex-direction: column; gap: 10px">', s.index('</sc-for>')); b = s.index('<p class="muted"', a)
    first = s[a:s.index('</section>', a) + 10]
    row = re.search(r'<a href="UPArticle\.dc\.html" class="li press">.*?</a>', first, flags=re.S).group(0)
    row = row.replace('<a href="UPArticle.dc.html"', '<a href="{{r.href}}"', 1)
    row = resub(row, r'(line-height: 1\.3">)Dividend(</span>)', r'\1{{r.title}}\2')
    row = resub(row, r'(font-size: 14px">)Article · read 2 min ago(</span>)', r'\1{{r.meta}}\2')
    sec = first[:first.index('<div class="card"')].replace('>Today</h2>', '>{{g.label}}</h2>')
    sec += '<div class="card" style="overflow: hidden"><sc-for list="{{g.rows}}" as="r" hint-placeholder-count="2">' + row + '</sc-for></div></section>'
    s = s[:a] + '<sc-for list="{{groups}}" as="g" hint-placeholder-count="2">' + sec + '</sc-for><sc-if value="{{empty}}" hint-placeholder-val="{{false}}"><p class="card muted" style="margin: 0; padding: 14px 16px">Nothing here yet. Lessons you finish and articles you read will show up here.</p></sc-if>\n    ' + s[b:]
    s = logic(s, COMMON + """  constructor(p) { super(p); this.state = { f: 'All', n: 0 }; }
  renderVals() {
    const F = this.F(); if (!F || !F.ME) return {};
    const f = this.state.f, today = F.LOOP.streakInfo().week.find((d) => d.today), mon = F.LOOP.streakInfo().week[0].d, td = today ? today.d : '';
    const kindName = { article: 'Article', lesson: 'Lesson', micro: 'Micro module', daily: 'Daily question', challenge: 'Challenge', boss: 'Boss challenge' };
    const keep = (e) => f === 'All' || (f === 'Reading' ? e.kind === 'article' : e.kind !== 'article');
    const when = (e) => { const m = Math.round((Date.now() - e.at) / 60000); return e.day === td ? (m < 1 ? 'just now' : m < 60 ? m + ' min ago' : Math.round(m / 60) + 'h ago') : new Date(e.at).toLocaleDateString('en-GB', e.day >= mon ? { weekday: 'long' } : { day: 'numeric', month: 'short' }); };
    const G = [['Today', (e) => e.day === td], ['This week', (e) => e.day !== td && e.day >= mon], ['Earlier', (e) => e.day < mon]];
    const log = F.ME.log().filter(keep), groups = G.map(([label, t]) => ({ label, rows: log.filter(t).map((e) => ({ href: e.href, title: e.title, meta: kindName[e.kind] + (e.xp ? ' \\u00b7 +' + e.xp + ' XP' : '') + ' \\u00b7 ' + when(e) })) })).filter((g) => g.rows.length);
    return { groups, empty: !groups.length, chips: ['All', 'Reading', 'Lessons'].map((label) => ({ label, on: String(label === f), cls: label === f ? 'chip chip-on' : 'chip', tap: () => this.setState({ f: label }) })),
      clear: (e) => { if (e && e.preventDefault) e.preventDefault(); F.ME.clearHistory(); this.setState({ n: this.state.n + 1 }); } };
  }""")
    wr('UPHistory', s)

# ---------- Notifications ----------
s = rd('UPNotifications')
if not done(s):
    a = s.index('<a href="#n" class="li press"'); first_end = s.index('</a>', a) + 4; end = s.index('</a></div>', a) + 4
    row = s[a:first_end].replace('<a href="#n"', '<a href="{{r.href}}"', 1)
    row = resub(row, r'(line-height: 1\.3">|<span[^>]*>)New badge: Foundations laid(</span>)', r'\1{{r.title}}\2')
    row = resub(row, r'(>)You passed the World 1 boss\.(</span>)', r'\1{{r.sub}}\2')
    row = resub(row, r'(>)2h(</span>)', r'\1{{r.ago}}\2')
    s = s[:a] + '<sc-for list="{{rows}}" as="r" hint-placeholder-count="3">' + row + '</sc-for>' + s[end:]
    s = logic(s, COMMON + """  componentDidMount() { const F = this.F(); if (F && F.ME && !F.ME.notifications().length && /Notifications/.test(location.pathname)) location.replace('UMEmptyNotif.dc.html'); }
  renderVals() {
    const F = this.F(); if (!F || !F.ME) return {};
    const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'Now' : m < 60 ? m + 'm' : m < 1440 ? Math.round(m / 60) + 'h' : m < 2880 ? 'Yesterday' : Math.round(m / 1440) + 'd'; };
    return { rows: F.ME.notifications().map((n) => ({ href: n.href, title: n.title, sub: n.sub, ago: ago(n.at) })) };
  }""")
    wr('UPNotifications', s)

# ---------- Settings ----------
s = rd('UPSettings')
if not done(s):
    for i, label in enumerate(['Daily reminder', 'Sound effects', 'Reduce motion']):
        j = s.index('>%s</span>' % label); a = s.rindex('<button type="button" role="switch"', 0, j); b = s.index('</button>', j) + 9
        btn = s[a:b]
        btn = re.sub(r'aria-checked="(true|false)"', 'aria-checked="{{on%d}}" onClick="{{tap%d}}"' % (i, i), btn, count=1)
        btn = re.sub(r'(width: 48px; height: 28px; border-radius: 999px; background: )#[0-9A-Fa-f]{6}', r'\1{{sw%d}}' % i, btn, count=1)
        btn = re.sub(r'position: absolute; top: 3px; (?:right|left): 3px;', 'position: absolute; top: 3px; left: {{kn%d}};' % i, btn, count=1)
        s = s[:a] + btn + s[b:]
    s = sub1(s, '>7:00 pm, Lagos time</span>', '>{{remLine}}</span>')
    s = sub1(s, '>ada@example.com</span>', '>{{email}}</span>')
    s = sub1(s, '>Understand money basics</span>', '>{{goal}}</span>')
    s = logic(s, COMMON + """  constructor(p) { super(p); this.state = { n: 0 }; }
  renderVals() {
    const F = this.F(); if (!F || !F.ME) return {};
    const A = F.AUTH.get(), P = F.ME.prefs(), on = [!!A.reminder, P.sound !== false, !!P.reduceMotion], v = { email: A.email || 'Not signed in', goal: A.goalText || A.goal || 'Not set', remLine: A.reminder ? '7:00 pm, Lagos time' : 'Off' };
    const flip = [() => F.AUTH.setReminder(!A.reminder), () => F.ME.setPref('sound', !(P.sound !== false)), () => F.ME.setPref('reduceMotion', !P.reduceMotion)];
    on.forEach((x, i) => { v['on' + i] = String(x); v['sw' + i] = x ? '#5B21B6' : '#D3CDE0'; v['kn' + i] = x ? '23px' : '3px'; v['tap' + i] = () => { flip[i](); this.setState({ n: this.state.n + 1 }); }; });
    return v;
  }""")
    wr('UPSettings', s)

# ---------- Email change: reuses the code check ----------
s = rd('URSetEmail')
if not done(s):
    s = sub1(s, 'value="ada@example.com" readonly', 'value="{{cur}}" readonly')
    s = sub1(s, '<input class="field" type="email" value="ada.okafor@example.com">', '<input class="field" type="email" value="{{nw}}" onInput="{{onNew}}" placeholder="name@example.com"></label><sc-if value="{{bad}}" hint-placeholder-val="{{false}}"><p role="alert" style="margin: 0; color: #B42828; font-weight: 700; font-size: 14px">Enter a valid email address, like ada@example.com.</p></sc-if><label style="display: none">')
    s = sub1(s, '<a href="UPSignInCode.dc.html" class="btn">Send code</a>', '<button type="button" class="btn" onClick="{{send}}" ' + BTN + '>Send code</button>')
    s = logic(s, COMMON + """  constructor(p) { super(p); this.state = { nw: '', tried: false }; }
  renderVals() {
    const F = this.F(); if (!F || !F.ME) return {};
    const A = F.AUTH, bad = this.state.tried && !A.validEmail(this.state.nw);
    return { cur: A.get().email || 'Not signed in', nw: this.state.nw, bad, onNew: (e) => this.setState({ nw: e.target.value }),
      send: () => { if (!A.validEmail(this.state.nw)) { this.setState({ tried: true }); return; } A.sendCode(this.state.nw, true); location.href = 'UPSignInCode.dc.html'; } };
  }""")
    wr('URSetEmail', s)

# ---------- Learning goal: saved ----------
s = rd('URSetGoal')
if not done(s):
    s = sub1(s, '<a href="UPSettings.dc.html" class="btn">Save</a>', '<a href="UPSettings.dc.html" onClick="{{save}}" class="btn">Save</a>')
    s = sub1(s, "constructor(p) { super(p); this.state = { g: 0, m: 1 }; }", "constructor(p) { super(p); const A = window.FV ? window.FV.AUTH.get() : {}; const G = ['Understand money basics', 'Save better', 'Start investing', 'Understand African markets'], M = ['3 min', '5 min', '10 min', '15 min']; this.state = { g: Math.max(0, G.indexOf(A.goalText)), m: Math.max(0, M.indexOf(A.minutes || '5 min')) }; }\n  // " + MARK)
    s = re.sub(r"(return \{ goals:)", r"const F = window.FV, save = () => { if (!F) return; const a = F.AUTH.get(); a.goalText = G[this.state.g]; a.minutes = M[this.state.m]; localStorage.setItem('fv.auth.v1', JSON.stringify(a)); };\n    return { save, goals:", s, count=1)
    wr('URSetGoal', s)

# ---------- Privacy: saved choices, a real data download ----------
s = rd('URSetPrivacy')
if not done(s):
    for i, label in enumerate(['Usage analytics', 'Personalised tips', 'Use my Ask Fin questions to improve answers']):
        a = s.index('aria-label="%s"' % label); a0 = s.rindex('<span class="sw"', 0, a)
        s = s[:a0] + re.sub(r'aria-checked="(true|false)"', 'aria-checked="{{p%d}}" onClick="{{t%d}}" tabindex="0" style="cursor: pointer; background: {{b%d}}"' % (i, i, i), s[a0:a], count=1) + s[a:]
    s = sub1(s, '<a href="#export" class="li press">', '<a href="#export" onClick="{{download}}" class="li press">')
    s = sub1(s, '>We email you a file within 48 hours</span>', '>Saves a file of everything Finvora keeps in this browser</span>')
    s = logic(s, COMMON + """  constructor(p) { super(p); this.state = { n: 0 }; }
  renderVals() {
    const F = this.F(); if (!F || !F.ME) return {};
    const P = F.ME.prefs(), K = ['analytics', 'tips', 'askImprove'], D = { analytics: true, tips: false, askImprove: true }, v = {};
    K.forEach((k, i) => { const on = k in P ? !!P[k] : D[k]; v['p' + i] = String(on); v['b' + i] = on ? '#5B21B6' : '#D3CDE0'; v['t' + i] = () => { F.ME.setPref(k, !on); this.setState({ n: this.state.n + 1 }); }; });
    v.download = (e) => { if (e && e.preventDefault) e.preventDefault(); const out = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^fv\\./.test(k)) { try { out[k] = JSON.parse(localStorage.getItem(k)); } catch (x) { out[k] = localStorage.getItem(k); } } }
      const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })), a = document.createElement('a'); a.href = url; a.download = 'finvora-my-data.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
    return v;
  }""")
    wr('URSetPrivacy', s)

# ---------- Help: answers open in place, search filters ----------
s = rd('URHelp')
if not done(s):
    a = s.index('<a href="#faq" class="li press">'); end = s.index('</a></div>', a) + 4
    row = s[a:s.index('</a>', a) + 4]
    row = row.replace('<a href="#faq" class="li press">', '<button type="button" class="li press" aria-expanded="{{q.open}}" onClick="{{q.tap}}" style="width: 100%; border: 0; background: transparent; text-align: left; font: inherit; cursor: pointer">', 1)[:-4] + '</button>'
    row = resub(row, r'(<span[^>]*>)Is Finvora free\?(</span>)', r'\1{{q.q}}\2')
    s = s[:a] + '<sc-for list="{{faqs}}" as="q" hint-placeholder-count="5">' + row + '<sc-if value="{{q.open}}" hint-placeholder-val="{{false}}"><p style="margin: 0; padding: 0 16px 14px; font-size: 15px; line-height: 1.5; color: #38323F">{{q.a}}</p></sc-if></sc-for>' + s[end - 4:].replace('</a>', '', 1)
    s = sub1(s, '<input type="search" placeholder="Search help"', '<input type="search" value="{{q}}" onInput="{{onQ}}" placeholder="Search help"')
    s = sub1(s, '<a href="#mail" class="li press">', '<a href="mailto:help@finvora.app" class="li press">')
    s = logic(s, COMMON + """  constructor(p) { super(p); this.state = { open: -1, q: '' }; }
  renderVals() {
    const Q = [['Is Finvora free?', 'Yes. Lessons, the Library, the simulator and 5 Ask Fin questions a day are free. Plus adds every world, unlimited Ask Fin and more.'],
      ['Does Finvora tell me what to buy?', 'No. Finvora explains how money and markets work. It never tells you what to buy or sell.'],
      ['How do I cancel Plus?', 'Go to Me, then Your plan, then Cancel Plus. Plus stays on until the end of the period you paid for.'],
      ['Is the simulator real money?', 'No. The simulator uses virtual naira and made-up companies, so nothing you do there costs real money.'],
      ["I didn't get my sign-in code", 'Check your spam folder, wait a minute, then tap Resend code. Codes last 10 minutes.']];
    const t = this.state.q.trim().toLowerCase();
    return { q: this.state.q, onQ: (e) => this.setState({ q: e.target.value, open: -1 }),
      faqs: Q.map((x, i) => ({ q: x[0], a: x[1], i })).filter((x) => !t || (x.q + ' ' + x.a).toLowerCase().includes(t)).map((x) => ({ q: x.q, a: x.a, open: this.state.open === x.i, tap: () => this.setState({ open: this.state.open === x.i ? -1 : x.i }) })) };
  }""")
    wr('URHelp', s)

# ---------- Delete account: clears everything in this browser ----------
s = rd('URDeleteAccount')
if not done(s):
    s = resub(s, r'(<div[^>]*>)You have Plus until 2 Dec 2026\. Deleting doesn\'t refund the rest of this period\. Cancel Plus first if you don\'t want it to renew\.(</div>)', r'<sc-if value="{{plus}}" hint-placeholder-val="{{true}}">\1{{plusLine}}\2</sc-if>')
    s = sub1(s, '<a href="URDeleted.dc.html" class="btn" style="background: #D92B2B; box-shadow: 0 3px 0 #A51D1D">Delete my account</a>', '<button type="button" class="btn" onClick="{{del}}" style="width: 100%; border: 0; cursor: pointer; font: inherit; font-weight: 700; background: #D92B2B; color: #FFFFFF; box-shadow: 0 3px 0 #A51D1D">Delete my account</button>')
    s = sub1(s, "return { ok: ok, no: !ok,", "const F = window.FV, plus = !!F && F.plan() === 'plus', sub = F ? F.billing().sub : {}; /* " + MARK + " */\n    return { plus, plusLine: 'You have Plus until ' + (sub.renewsOn && F ? F.PAY.date(sub.renewsOn) : 'the end of this period') + \". Deleting doesn't refund the rest of this period. Cancel Plus first if you don't want it to renew.\",\n      del: () => { if (!ok) return; Object.keys(localStorage).filter((k) => /^fv\\./.test(k)).forEach((k) => localStorage.removeItem(k)); location.href = 'URDeleted.dc.html'; }, ok: ok, no: !ok,")
    wr('URDeleteAccount', s)

# ---------- Journey: World 2 opens when the World 1 boss is passed ----------
for n in ('UPJourney', 'UDJourney'):
    s = rd(n)
    if '{{w2Tag}}' not in s:
        s = resub(s, r'(</svg>)World 2 · Locked(</span>)', r'\1{{w2Tag}}\2')
        s = sub1(s, '>Beat the World 1 boss, The ₦100,000 plan, to open this world.</p>', '>{{w2Line}}</p>')
        m = re.search(r'\n\s*return v;\n\s*\}', s)
        if not m: raise SystemExit('no return v in ' + n)
        s = s[:m.start()] + "\n    v.w2Tag = st.bossPassed ? 'World 2 \\u00b7 Unlocked' : 'World 2 \\u00b7 Locked'; v.w2Line = st.bossPassed ? 'You opened this world by passing the World 1 boss. Its lessons are being written and will appear here.' : 'Beat the World 1 boss, The \\u20a6100,000 plan, to open this world.';" + s[m.start():]
        wr(n, s)
print('me and settings wired')
