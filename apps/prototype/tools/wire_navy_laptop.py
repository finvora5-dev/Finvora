"""Laptop screens behave like their wired phone twins inside the approved laptop mock-up (skill: laptop-build).
Each section edits one laptop board by string anchors and gives it logic taken from the phone board named in its comment.
Usage: python3 wire_navy_laptop.py <site folder>"""
import os, re, sys
SITE = sys.argv[1]; MARK = '/* navy-laptop */'
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing in board: ' + a[:110])
    return s.replace(a, b, 1)
def logic(s, js):
    a = s.index('class Component extends DCLogic'); b = s.index('</script>', a)
    return s[:a] + 'class Component extends DCLogic {\n' + MARK + '\n' + js + '\n}\n' + s[b:]
def todo(n): s = rd(n); return None if MARK in s else s

# Welcome (phone: MainNavy). Ticker rows show the practice prices and today's change.
s = todo('WelcomeLaptopNavy')
if s:
    for t, p, c in [('ZENITHBANK', '₦48.20', '▲ 3.4%'), ('DANGCEM', '₦480.00', '▲ 1.2%'), ('MTNN', '₦225.90', '▼ 1.4%')]:
        m = re.search(r'(<span[^>]*>' + t + r'</span>[^<]*</span><span[^>]*>)' + re.escape(p) + r' <span style="([^"]*)">' + re.escape(c) + '</span>', s)
        if not m: raise SystemExit('welcome row ' + t)
        st = re.sub(r'color: #[0-9A-F]{6}', 'color: {{fg_' + t + '}}', m.group(2), count=1)
        s = s[:m.start()] + m.group(1) + '{{p_' + t + '}} <span style="' + st + '">{{c_' + t + '}}</span>' + s[m.end():]
    s = logic(s, '''  renderVals() { const S = window.FV && window.FV.SIM, v = {}; ['ZENITHBANK', 'DANGCEM', 'MTNN'].forEach((t) => { const ch = S ? S.change(t) : 0;
    v['p_' + t] = S ? '₦' + (S.price(t) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''; v['c_' + t] = (ch >= 0 ? '▲ ' : '▼ ') + Math.abs(ch).toFixed(1) + '%'; v['fg_' + t] = ch >= 0 ? '#047857' : '#B9473F'; }); return v; }''')
    wr('WelcomeLaptopNavy', s)

# Sign in (phone: SignInNavy + SignInCodeNavy + CodeErrorNavy). The mock-up draws the email step; the code step and its
# errors reuse the phone states and copy inside the same card.
s = todo('SignInLaptopNavy')
if s:
    s = sub1(s, 'aria-label="Email" value="ada@example.com"', 'aria-label="Email" value="{{email}}" onInput="{{onEmail}}" onKeyDown="{{onKey}}" aria-invalid="{{bad}}"')
    s = sub1(s, '<a href="GoalLaptopNavy.dc.html"', '<a href="#" onClick="{{go}}"')
    s = sub1(s, '>Send code</a>', '>{{cta}}</a>')
    code = ('<sc-if value="{{sent}}" hint-placeholder-val="{{ false }}"><label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 500">{{sentTo}}'
            '<input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" enterkeyhint="go" aria-label="6-digit code" value="{{code}}" onInput="{{onCode}}" onKeyDown="{{onKey}}" '
            'style="width: 340px; height: 48px; border: 1px solid #D5D9E0; border-radius: 12px; padding: 0 14px; font: inherit; font-family: \'Geist Mono\', monospace; font-size: 20px; letter-spacing: .3em; box-sizing: border-box"></label>'
            '<a href="#" onClick="{{resend}}" style="font-size: 14px; color: #5B6577">{{resendLabel}}</a></sc-if>'
            '<sc-if value="{{hasErr}}" hint-placeholder-val="{{ false }}"><p role="alert" style="margin: 0; font-size: 14px; color: #B9473F">{{err}}</p></sc-if>')
    s = sub1(s, '<a href="#" onClick="{{go}}"', code + '<a href="#" onClick="{{go}}"')
    s = logic(s, '''  A() { return window.FV && window.FV.AUTH; }
  constructor(p) { super(p); const a = window.FV ? window.FV.AUTH.get() : {}; this.state = { email: a.pending || '', code: '', tried: false, err: '' }; }
  componentDidMount() { this.tick(); }
  tick() { clearTimeout(this.t); this.t = setTimeout(() => { if (this.A() && this.A().resendIn() > 0) { this.setState({ n: Date.now() }); this.tick(); } }, 1000); }
  sent() { const A = this.A(), a = A ? A.get() : {}; return !!(a.sentAt && a.pending && a.pending === this.state.email.trim().toLowerCase()); }
  send() { const A = this.A(); if (!A || !A.validEmail(this.state.email)) { this.setState({ tried: true }); return; } A.sendCode(this.state.email); this.setState({ err: '', n: Date.now() }); this.tick(); setTimeout(() => { const c = document.getElementById('code'); if (c) c.focus(); }, 30); }
  check(code) { const A = this.A(); if (!A || code.length < 6) return; const r = A.verify(code);
    if (r === 'ok') { location.href = 'GoalLaptopNavy.dc.html'; return; }
    const left = A.triesLeft(), lock = A.lockedFor();
    this.setState({ code: '', err: lock > 0 ? 'Too many wrong codes. Try again in ' + Math.ceil(lock / 60) + ' minutes.' : r === 'expired' ? 'That code has expired. Send a new code to try again.' : 'That code is wrong. You have ' + left + (left === 1 ? ' try' : ' tries') + ' left.' }); }
  go(e) { if (e) e.preventDefault(); if (!this.sent()) this.send(); else this.check(this.state.code); }
  renderVals() { const A = this.A(), a = A ? A.get() : {}, r = A ? A.resendIn() : 0, sent = this.sent();
    return { email: this.state.email, bad: String(!!A && this.state.tried && !A.validEmail(this.state.email)), sent, code: this.state.code, err: this.state.err || (A && this.state.tried && !A.validEmail(this.state.email) ? 'Enter a valid email address.' : ''), hasErr: !!(this.state.err || (A && this.state.tried && !A.validEmail(this.state.email))),
      sentTo: 'Sent to ' + (a.pending || ''), cta: sent ? 'Verify' : 'Send code', resendLabel: r > 0 ? 'Resend in 0:' + String(r).padStart(2, '0') : 'Resend code',
      onEmail: (e) => this.setState({ email: e.target.value, tried: false, err: '' }), onKey: (e) => { if (e.key === 'Enter') this.go(e); },
      onCode: (e) => { const c = e.target.value.replace(/\\D/g, '').slice(0, 6); this.setState({ code: c, err: '' }); if (c.length === 6) this.check(c); },
      resend: (e) => { e.preventDefault(); if (A && A.resendIn() > 0) return; this.send(); }, go: (e) => this.go(e) }; }''')
    wr('SignInLaptopNavy', s)

# Goal (phone: GoalNavy). Three options, one selected, saved on Continue.
s = todo('GoalLaptopNavy')
if s:
    i = [0]
    def opt(m):
        k = i[0]; i[0] += 1; st = re.sub(r'border: [^;]+;', 'border: {{bd%d}};' % k, m.group(1), count=1); st = re.sub(r'background: #[0-9A-F]{6}', 'background: {{bg%d}}' % k, st, count=1)
        return '<button type="button" role="radio" aria-checked="{{on%d}}" onClick="{{pick%d}}" style="cursor: pointer; %s">' % (k, k, st)
    s = re.sub(r'<button style="(text-align: left; padding: 20px;[^"]*)">', opt, s)
    s = sub1(s, '<a href="HomeLaptopNavy.dc.html"', '<a href="HomeLaptopNavy.dc.html" onClick="{{save}}"')
    s = s.replace('<div style="display: flex; gap: 14px', '<div role="radiogroup" aria-label="What interests you most?" style="display: flex; gap: 14px', 1)
    s = logic(s, '''  constructor(p) { super(p); const g = window.FV ? window.FV.AUTH.get().goal : null, i = ['Money basics', 'Investing', 'Nigerian market'].indexOf(g); this.state = { g: i < 0 ? 1 : i }; }
  renderVals() { const T = ['Money basics', 'Investing', 'Nigerian market'], v = { save: () => { if (window.FV) window.FV.AUTH.setGoal(T[this.state.g]); } };
    T.forEach((t, k) => { const on = this.state.g === k; v['on' + k] = String(on); v['bd' + k] = on ? '1.5px solid #0B192C' : '1px solid #D5D9E0'; v['bg' + k] = on ? '#EEF0F3' : '#FFFFFF'; v['pick' + k] = () => this.setState({ g: k }); }); return v; }''')
    wr('GoalLaptopNavy', s)
# Learn (phone: LearnNavy). Course progress, lesson rows and the Continue button come from the learner's progress.
s = todo('LearnLaptopNavy')
if s:
    a = s.index('<a href="LessonNavy.dc.html" style="display: flex; align-items: center; gap: 14px; height: 56px;'); b = s.index('</section>', a)
    row = ('<sc-for list="{{lessons}}" as="l" hint-placeholder-count="7"><a href="{{l.href}}" aria-disabled="{{l.locked}}" style="display: flex; align-items: center; gap: 14px; height: 56px; border-top: 1px solid #EDEFF2; text-decoration: none; color: {{l.ink}}">'
           '<span style="width: 28px; height: 28px; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-family: \'Geist Mono\', monospace; font-size: 12px; background: {{l.bg}}; color: {{l.fg}}; border: {{l.bd}}">{{l.mark}}</span>'
           '<span style="flex: 1; font-size: 15px; font-weight: {{l.w}}">{{l.t}}</span><span style="font-size: 13px; color: #5B6577">{{l.s}}</span></a></sc-for>\n      ')
    s = s[:a] + row + s[b:]
    s = sub1(s, '<a href="LessonNavy.dc.html" style="height: 44px; padding: 0 18px; border-radius: 10px; background: #0B192C;', '<a href="{{contHref}}" style="height: 44px; padding: 0 18px; border-radius: 10px; background: #0B192C;')
    s = sub1(s, '>Continue: Budgeting · 4 min</a>', '>{{cont}}</a>')
    s = sub1(s, 'width: 33%; height: 100%; background: #10B981"></span></span><span style="font-family: \'Geist Mono\', monospace; font-size: 12px; color: #5B6577">2/6</span>', 'width: {{donePct}}; height: 100%; background: #10B981"></span></span><span style="font-family: \'Geist Mono\', monospace; font-size: 12px; color: #5B6577">{{doneN}}</span>')
    s = s.replace('>2/6</span>', '>{{doneN}}</span>', 1)  # All courses: Money Foundations shows the same progress
    s = logic(s, """  renderVals() {
    const F = window.FV, st = F ? F.get() : { done: 2 }, done = st.done || 0, LS = F ? F.LESSONS : [];
    const L = LS.map((x, i) => [x.title, i < done ? 'done' : i === done ? 'next' : 'locked', x.min + ' min']).concat([['Course review', done >= LS.length ? 'next' : 'locked', '8 questions']]);
    let rv = {}; try { rv = JSON.parse(localStorage.getItem('fv.review.v1') || 'null') || {}; } catch (e) {}
    const passed = (rv.best || 0) >= 6; if (passed) L[L.length - 1][1] = 'done'; const cur = LS[done];
    return { contHref: cur ? 'LessonInfoNavy.dc.html' : 'CourseReviewNavy.dc.html', cont: passed ? 'Review the course again' : cur ? (done ? 'Continue: ' : 'Start: ') + cur.title + ' · ' + cur.min + ' min' : 'Start the course review',
      donePct: Math.round(done / (LS.length || 6) * 100) + '%', doneN: done + '/' + (LS.length || 6),
      lessons: L.map(([t, s0, d], i) => ({ t, s: s0 === 'done' ? 'Completed · ' + d : s0 === 'next' ? 'Up next · ' + d : d, mark: s0 === 'done' ? '✓' : String(i + 1),
        bg: s0 === 'done' ? '#DDF3E6' : s0 === 'next' ? '#0B192C' : '#FFFFFF', fg: s0 === 'done' ? '#047857' : s0 === 'next' ? '#FFFFFF' : '#5B6577', bd: s0 === 'locked' ? '1px solid #D5D9E0' : '0',
        ink: s0 === 'locked' ? '#5B6577' : '#0B192C', w: s0 === 'next' ? '600' : '500', locked: String(s0 === 'locked'),
        href: s0 === 'locked' ? '#' : i === LS.length ? 'CourseReviewNavy.dc.html' : s0 === 'next' ? 'LessonInfoNavy.dc.html' : 'LessonInfoNavy.dc.html?l=' + LS[i].id })) };
  }""")
    wr('LearnLaptopNavy', s)
# Lesson choice step (phone: LessonNavy). Widened to the progress bar (owner, 16 Nov 2026); the A-D options, the inline
# result note and Continue follow the approved laptop board; question, options, answer and next step come from the lesson.
s = todo('LessonLaptopNavy')
if s:
    s = sub1(s, 'max-width: 640px; width: 100%; margin: 20px auto 0;', 'width: 100%; margin: 20px 0 0;')
    s = sub1(s, 'width: 60%; height: 100%; border-radius: 999px; background: #10B981"></span></span><span style="font-family: \'Geist Mono\', monospace; font-size: 12px; color: #5B6577">3/5', 'width: {{pct}}; height: 100%; border-radius: 999px; background: #10B981"></span></span><span style="font-family: \'Geist Mono\', monospace; font-size: 12px; color: #5B6577">{{nOf}}')
    s = sub1(s, '>Budgeting · Question 3</span>', '>{{kicker}}</span>')
    s = sub1(s, '>Ada earns ₦250,000 a month. Using the 50/30/20 rule, how much should she save?</h1>', '>{{q}}</h1>')
    a = s.index('<button style="display: flex; align-items: center; gap: 12px; min-height: 58px;'); b = s.index('<p style="margin: 0; padding: 14px 16px;', a)
    s = s[:a] + ('<div role="radiogroup" aria-label="Answers" style="display: flex; flex-direction: column; gap: 14px"><sc-for list="{{opts}}" as="o" hint-placeholder-count="4">'
                 '<button type="button" role="radio" aria-checked="{{o.on}}" onClick="{{o.pick}}" style="cursor: {{o.cur}}; display: flex; align-items: center; gap: 12px; min-height: 58px; padding: 0 18px; border-radius: 12px; border: {{o.bd}}; background: {{o.bg}}; font: inherit; font-size: 16px; text-align: left; color: #0B192C">'
                 '<span style="font-family: \'Geist Mono\', monospace; font-size: 13px; color: #5B6577; width: 16px">{{o.l}}</span><span style="flex: 1">{{o.t}}</span><strong style="font-size: 13px; color: {{o.mc}}">{{o.mark}}</strong></button></sc-for></div>') + s[b:]
    s = sub1(s, '<p style="margin: 0; padding: 14px 16px; border-radius: 12px; background: #DDF3E6;', '<sc-if value="{{answered}}" hint-placeholder-val="{{ false }}"><p role="status" style="margin: 0; padding: 14px 16px; border-radius: 12px; background: {{noteBg}};')
    s = sub1(s, '<strong style="color: #047857">Correct.</strong> 20% of ₦250,000 is ₦50,000.</p>', '<strong style="color: {{noteC}}">{{title}}.</strong> {{why}}</p></sc-if>')
    s = sub1(s, '<a href="LessonDoneLaptopNavy.dc.html" style="height: 44px;', '<a href="{{ctaHref}}" aria-disabled="{{notAnswered}}" style="opacity: {{ctaOp}}; height: 44px;')
    s = sub1(s, '>Continue</a></div></div>', '>{{cta}}</a></div></div>')
    s = logic(s, """  F() { return window.FV; }
  constructor(p) { super(p); this.state = { g: null }; }
  renderVals() {
    const F = this.F(), L = F ? F.lesson() : { title: '', c: null }, c = L.c, v = F ? F.flowVals('choice') : { fN: 3, fTotal: 5, nextHref: 'LessonDoneNavy.dc.html' }, n = +v.fN, t = +v.fTotal;
    const O = c ? c.opts.map((o) => o[0]) : ['₦25,000', '₦50,000', '₦75,000', '₦125,000'], R = c ? c.right : 1, why = c ? c.opts.map((o) => o[1]) : [];
    const g = this.state.g, done = g !== null, ok = g === R;
    const pick = (i) => { if (done) return; if (F) F.answer('choice', i === R, i); this.setState({ g: i }); };
    return { pct: (t ? Math.round(n / t * 100) : 0) + '%', nOf: n + '/' + t, kicker: L.title + ' · Question ' + n, q: c ? c.q : '',
      opts: O.map((x, i) => { const right = done && i === R, wrong = g === i && !ok;
        return { l: 'ABCD'[i] || '', t: x, on: String(g === i), pick: () => pick(i), cur: done ? 'default' : 'pointer', bd: right ? '1.5px solid #10B981' : wrong ? '1.5px solid #B9473F' : '1px solid #D5D9E0', bg: right ? '#DDF3E6' : wrong ? '#FCEDEB' : '#FFFFFF', mark: right ? 'Correct' : wrong ? 'Not quite' : '', mc: right ? '#047857' : '#B9473F' }; }),
      answered: done, notAnswered: String(!done), noteBg: ok ? '#DDF3E6' : '#FCEDEB', noteC: ok ? '#047857' : '#B9473F', title: ok ? 'Correct' : 'Not quite',
      why: ok ? (c ? c.rightText : '') : (((why[g] || '') + ' ' + (c ? c.rightText : '')).trim()),
      cta: ok || !done ? 'Continue' : 'Got it, continue', ctaHref: done ? v.nextHref : '#', ctaOp: done ? '1' : '.5' };
  }""")
    wr('LessonLaptopNavy', s)
# Lesson done (phone: LessonDoneNavy). Finishes the run, then shows its title, score, time, next lesson and takeaways.
s = todo('LessonDoneLaptopNavy')
if s:
    s = sub1(s, '>Budgeting complete<', '>{{title}} complete<')
    s = sub1(s, '>Lesson 3 of 6 in Money Foundations. Score 4/5 in 3:52.<', '>Lesson {{n}} of {{of}} in Money Foundations. Score {{score}} in {{time}}.<')
    s = sub1(s, '<a href="LessonLaptopNavy.dc.html"', '<a href="{{nextHref}}"')
    s = sub1(s, '>Next: Inflation · 5 min<', '>{{nextLabel}}<')
    s = sub1(s, '>Key takeaways: plan every naira, split 50/30/20, review monthly.<', '>Key takeaways: {{takeaways}}<')
    s = logic(s, """  constructor(p) { super(p); const F = window.FV; let r = F ? F.finishRun() : null; if (!r && F) r = F.lastRun(); this.state = { r }; }
  renderVals() {
    const F = window.FV, r = this.state.r, LS = F ? F.LESSONS : [], st = F ? F.get() : { done: 0 }, L = r ? r.lesson : (F ? F.lesson() : { title: 'Lesson', index: 0, c: null });
    const c = L.c || (F ? F.lesson().c : null), nx = LS[st.done], secs = r ? r.secs : 0, learned = (c && c.learned) || [];
    return { title: L.title, n: String((L.index || 0) + 1), of: String(LS.length || 6), score: r ? r.right + '/' + r.total : '0/0', time: Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0'),
      nextHref: nx ? 'LessonInfoNavy.dc.html' : 'LearnLaptopNavy.dc.html', nextLabel: nx ? 'Next: ' + nx.title + ' · ' + nx.min + ' min' : 'Back to Learn',
      takeaways: learned.map((t) => String(t).replace(/[.]$/, '')).join('; ').toLowerCase() || 'see the lesson summary' };
  }""")
    wr('LessonDoneLaptopNavy', s)
# Home (phone: HomeNavy). Ask box and suggestion chips go to Ask with the question; Continue learning shows the next lesson
# and progress; the watchlist shows your watchlist companies (or popular ones while it is empty) with live prices.
s = rd('HomeLaptopNavy')
if MARK not in s:
    s = sub1(s, '<input enterkeyhint="send" aria-label="Ask Finvora"', '<input enterkeyhint="send" aria-label="Ask Finvora" value="{{q}}" onInput="{{onQ}}" onKeyDown="{{onKey}}"')
    s = sub1(s, '<a href="AskLaptopNavy.dc.html" aria-label="Send"', '<a href="{{askHref}}" aria-label="Send"')
    for t in ['How did Zenith Bank do this year?', 'What is a P/E ratio?', 'Which sectors moved today?']:
        s = sub1(s, '<a href="AskLaptopNavy.dc.html" style="height: 38px;', '<a href="AskLaptopNavy.dc.html?q=' + t.replace(' ', '%20').replace('?', '%3F').replace('/', '%2F') + '" style="height: 38px;')
    s = sub1(s, '>Money Foundations · Budgeting</span>', '>{{contTitle}}</span>')
    s = sub1(s, 'width: 33%; height: 100%; background: #10B981"></span></span><span style="font-family: \'Geist Mono\', monospace; font-size: 12px; color: #5B6577">2/6</span>', 'width: {{donePct}}; height: 100%; background: #10B981"></span></span><span style="font-family: \'Geist Mono\', monospace; font-size: 12px; color: #5B6577">{{doneN}}</span>')
    a = s.index('<a href="CompanyLaptopNavy.dc.html?t=ZENITHBANK" style="display: flex; align-items: center; gap: 12px; min-height: 52px;'); b = s.index('</section>', a)
    row = ('<sc-for list="{{wl}}" as="w" hint-placeholder-count="3"><a href="{{w.href}}" style="display: flex; align-items: center; gap: 12px; min-height: 52px; border-top: 1px solid #EDEFF2; text-decoration: none">'
           '<span style="width: 32px; height: 32px; flex: none; border-radius: 10px; background: #E8EBEF; display: flex; align-items: center; justify-content: center; font-family: \'Geist Mono\', monospace; font-size: 11px; font-weight: 500; color: #0B192C">{{w.ab}}</span>'
           '<span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><span style="font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{w.name}}</span><span style="font-family: \'Geist Mono\', monospace; font-size: 11px; color: #5B6577">{{w.t}}</span></span>'
           '<svg width="56" height="24" viewBox="0 0 56 24" aria-hidden="true"><path d="{{w.d}}" fill="none" stroke="{{w.sc}}" stroke-width="1.6" stroke-linecap="round"></path></svg>'
           '<span style="width: 78px; display: flex; flex-direction: column; align-items: flex-end; gap: 3px"><span style="font-family: \'Geist Mono\', monospace; font-size: 13px">{{w.p}}</span><span style="font-family: \'Geist Mono\', monospace; font-size: 12px; padding: 3px 6px; border-radius: 6px; background: {{w.bg}}; color: {{w.fg}}">{{w.c}}</span></span></a></sc-for>\n  ')
    s = s[:a] + row + s[b:]
    s = logic(s, """  constructor(p) { super(p); this.state = { q: '' }; }
  renderVals() {
    const F = window.FV, a = F ? F.AUTH.get() : {}, name = a.name || 'Ada', S = F && F.SIM, P = F && F.PLUS;
    const day = new Date(Date.now() + 3600000).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    const st = F ? F.get() : { done: 0 }, done = st.done || 0, LS = F ? F.LESSONS : [], cur = LS[done];
    let T = P ? P.lists()[0].tickers.filter((t) => S && S.COMPANIES.some((c) => c.t === t)).slice(0, 5) : [];
    if (!T.length) T = ['ZENITHBANK', 'GTCO', 'SEPLAT'];
    const wl = S ? T.map((t) => { const ch = S.change(t), h = S.history(t, 12), lo = Math.min.apply(null, h), hi = Math.max.apply(null, h), sp = hi - lo || 1;
      return { href: 'CompanyLaptopNavy.dc.html?t=' + t, ab: t.slice(0, 3), t, name: S.company(t).name, p: '₦' + (S.price(t) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        c: (ch >= 0 ? '▲ ' : '▼ ') + Math.abs(ch).toFixed(1) + '%', bg: ch >= 0 ? '#DDF3E6' : '#FCEDEB', fg: ch >= 0 ? '#047857' : '#B9473F', sc: ch >= 0 ? '#10B981' : '#B9473F',
        d: h.map((v, i) => (i ? 'L' : 'M') + Math.round(i * 56 / Math.max(1, h.length - 1)) + ' ' + Math.round(20 - (v - lo) / sp * 16)).join(' ') }; }) : [];
    const go = () => { const q = this.state.q.trim(); location.href = 'AskLaptopNavy.dc.html' + (q ? '?q=' + encodeURIComponent(q) : ''); };
    return { name, today: day.replace(/^(\\w+) /, '$1, '), full: a.name ? a.name : 'Ada Okafor', q: this.state.q, onQ: (e) => this.setState({ q: e.target.value }), onKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } },
      askHref: 'AskLaptopNavy.dc.html' + (this.state.q.trim() ? '?q=' + encodeURIComponent(this.state.q.trim()) : ''),
      contTitle: 'Money Foundations · ' + (cur ? cur.title : 'Course review'), donePct: Math.round(done / (LS.length || 6) * 100) + '%', doneN: done + '/' + (LS.length || 6), wl };
  }""")
    wr('HomeLaptopNavy', s)
# Ask (phone: AskFinvoraNavy + AskLimitNavy). The conversation, sources and follow-ups come from FV.ASK; ?q= asks on
# arrival; the drawn company card shows for a question that names a company the app has data for.
s = rd('AskLaptopNavy')
if MARK not in s:
    a = s.index('<div style="align-self: flex-end; max-width: 520px;'); b = s.index('<span style="flex: 1"></span>', a)
    convo = ('<sc-if value="{{empty}}" hint-placeholder-val="{{ false }}"><p style="margin: 0; font-size: 15px; color: #5B6577">Ask about any NGX company, price or money idea.</p></sc-if>'
      '<sc-for list="{{msgs}}" as="m" hint-placeholder-count="1"><div style="display: flex; flex-direction: column; gap: 20px">'
      '<div style="align-self: flex-end; max-width: 520px; padding: 12px 16px; border-radius: 16px 16px 4px 16px; background: #E8EBEF; font-size: 15px; overflow-wrap: anywhere">{{m.q}}</div>'
      '<div style="display: flex; gap: 12px"><span role="img" aria-label="Finvora" style="width: 28px; height: 28px; flex: none; border-radius: 6px; background: #0B192C; display: flex; align-items: center; justify-content: center"><svg width="20" height="20" viewBox="75 55 490 560" aria-hidden="true"><path fill="#FFFFFF" d="M242 604C170 561 66 398 140 241c12-12 29-26 29-24-8 41-11 82-11 121 33-48 91-70 198-99 76-18 126-33 168-52-20 70-62 106-108 138-100 50-200 30-260 20 3 90 33 170 87 235z"/><path fill="#00E676" d="M296 217c-19-1-58-6-64-8 17-21 46-41 82-53 80-27 170-50 247-97-30 110-120 166-265 158z"/></svg></span>'
      '<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; font-size: 15px; line-height: 1.6; color: #334155">'
      '<sc-for list="{{m.paras}}" as="x" hint-placeholder-count="1"><p style="margin: 0">{{x.t}}</p></sc-for>'
      '<sc-if value="{{m.hasCo}}" hint-placeholder-val="{{ false }}"><a href="{{m.coHref}}" style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; padding: 16px 18px; text-decoration: none; display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 12px; color: #0B192C">'
      '<span style="display: flex; flex-direction: column"><span style="font-weight: 600">{{m.coName}}</span><span style="font-family: \'Geist Mono\', monospace; font-size: 12px; color: #5B6577">{{m.coT}}</span></span>'
      '<span style="display: flex; flex-direction: column"><span style="font-size: 12px; color: #5B6577">Price</span><span style="font-family: \'Geist Mono\', monospace">{{m.coP}}</span></span>'
      '<span style="display: {{m.zenShow}}; flex-direction: column"><span style="font-size: 12px; color: #5B6577">EPS FY2024</span><span style="font-family: \'Geist Mono\', monospace">₦15.40</span></span>'
      '<span style="display: {{m.zenShow}}; flex-direction: column"><span style="font-size: 12px; color: #5B6577">P/E</span><span style="font-family: \'Geist Mono\', monospace">3.1</span></span></a></sc-if>'
      '<span style="font-size: 12px; color: #5B6577">{{m.src}}</span></div></div></div></sc-for>'
      '<sc-if value="{{limited}}" hint-placeholder-val="{{ false }}"><div role="status" style="padding: 16px 18px; border-radius: 16px; background: #FFFFFF; border: 1px solid #E5E7EB; display: flex; flex-direction: column; gap: 8px">'
      '<strong style="font-size: 16px; color: #0B192C">You have used today\'s 5 questions</strong><span style="font-size: 14px; color: #5B6577">Free includes 5 Finvora AI questions a day. More tomorrow at 00:00, or get unlimited with Plus.</span>'
      '<a href="PlansLaptopNavy.dc.html" style="align-self: flex-start; height: 40px; padding: 0 16px; border-radius: 10px; background: #0B192C; color: #FFFFFF; display: inline-flex; align-items: center; text-decoration: none; font-weight: 600; font-size: 14px">See Plus</a></div></sc-if>\n      ')
    s = s[:a] + convo + s[b:]
    i = s.index('<div style="display: flex; gap: 8px"><button style="height: 36px;'); j = s.index('</div>', i) + 6
    s = s[:i] + ('<div style="display: flex; gap: 8px; flex-wrap: wrap"><sc-for list="{{chips}}" as="c" hint-placeholder-count="3"><button type="button" onClick="{{c.go}}" style="cursor: pointer; height: 36px; padding: 0 14px; border: 1px solid #E5E7EB; border-radius: 999px; background: #FFFFFF; font: inherit; font-size: 13px; color: #0B192C">{{c.t}}</button></sc-for></div>') + s[j:]
    s = sub1(s, '<input enterkeyhint="send" aria-label="Ask a follow-up" placeholder="Ask a follow-up"', '<input id="ask" enterkeyhint="send" aria-label="{{ph}}" placeholder="{{ph}}" value="{{draft}}" onInput="{{onDraft}}" onKeyDown="{{onKey}}"')
    s = sub1(s, '<button aria-label="Send" style="width: 44px;', '<button type="button" aria-label="Send" aria-disabled="{{noDraft}}" onClick="{{send}}" style="cursor: pointer; width: 44px;')
    s = s.replace('<span style="flex: 1"></span>\n      <div style="display: flex; gap: 8px; flex-wrap: wrap">', '<span style="flex: 1"></span>\n      <span style="font-size: 12px; color: #5B6577">{{left}}</span>\n      <div style="display: flex; gap: 8px; flex-wrap: wrap">', 1)
    s = logic(s, """  A() { return window.FV && window.FV.ASK; }
  constructor(p) { super(p); this.state = { draft: '', n: 0, limited: false }; }
  componentDidMount() { const m = /[?&]q=([^&]+)/.exec(location.search); if (m) { history.replaceState(null, '', location.pathname); this.ask(decodeURIComponent(m[1].replace(/\\+/g, ' '))); } this.bottom(); }
  bottom() { setTimeout(() => { const el = document.querySelector('main'); if (el) el.scrollTop = el.scrollHeight; }, 30); }
  ask(q) { const A = this.A(); q = String(q || '').trim(); if (!A || !q) return; if (!A.status().allowed) { this.setState({ limited: true, draft: '' }); return; } A.ask(q); this.setState({ draft: '', n: this.state.n + 1, limited: false }); this.bottom(); }
  renderVals() {
    const A = this.A(), S = window.FV && window.FV.SIM, msgs = A ? A.messages() : [], st = A ? A.status() : { remaining: 5 }, lim = A ? A.limit() : 5;
    const co = (q) => { if (!S) return null; const ql = q.toLowerCase(); return S.COMPANIES.map((c) => S.company(c.t)).filter((c) => c && (ql.indexOf(c.name.toLowerCase().split(' ')[0].toLowerCase()) >= 0 || ql.indexOf(c.t.toLowerCase()) >= 0))[0] || null; };
    const last = msgs[msgs.length - 1], fol = last ? (last.r.choices || []).map((c) => c.title).concat(last.r.followUps || []).slice(0, 3) : (A ? A.suggestions().slice(0, 3) : []);
    return { empty: !msgs.length && !this.state.limited, limited: this.state.limited,
      msgs: msgs.map((m) => { const c = co(m.q); return { q: m.q, paras: String(m.r.answer || '').split(/\\n\\n+/).map((t) => ({ t })),
        src: (m.r.citations || []).length ? 'Sources: ' + m.r.citations.map((x) => x.title).join(', ') + '. Not financial advice.' : 'Not financial advice.',
        hasCo: !!c, coHref: c ? 'CompanyLaptopNavy.dc.html?t=' + c.t : '#', coName: c ? c.name : '', coT: c ? c.t : '', coP: c ? '₦' + (S.price(c.t) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '', zenShow: c && c.t === 'ZENITHBANK' ? 'flex' : 'none' }; }),
      chips: fol.map((t) => ({ t, go: () => this.ask(t) })), ph: msgs.length ? 'Ask a follow-up' : 'Ask Finvora a question', draft: this.state.draft, noDraft: String(!this.state.draft.trim()),
      left: lim === null ? 'Unlimited questions with Plus' : st.remaining + ' of ' + lim + ' free questions left today',
      onDraft: (e) => this.setState({ draft: e.target.value }), onKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); this.ask(this.state.draft); } }, send: () => this.ask(this.state.draft) };
  }""")
    wr('AskLaptopNavy', s)
# Library (phone: LibraryNavy). Search goes to Search, A-Z to the dictionary, topics to their topic page, word of the day
# and topic counts come from the Library; the drawn popular guides open their own articles.
s = rd('LibraryLaptopNavy')
if MARK not in s:
    s = sub1(s, 'aria-label="Search the library" placeholder="Search any money word"', 'aria-label="Search the library" placeholder="Search any money word" value="{{q}}" onInput="{{onQ}}" onKeyDown="{{onKey}}"')
    s = sub1(s, '<a href="#" style="font-size: 13px; font-weight: 600; text-decoration: none">A–Z</a>', '<a href="DictionaryNavy.dc.html" style="font-size: 13px; font-weight: 600; text-decoration: none">A–Z</a>')
    s = sub1(s, '<a href="ArticleLaptopNavy.dc.html" style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; padding: 20px 22px; text-decoration: none; display: flex; flex-direction: column; gap: 8px">', '<a href="{{wHref}}" style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; padding: 20px 22px; text-decoration: none; display: flex; flex-direction: column; gap: 8px">')
    s = sub1(s, '>Dividend yield</span><span style="font-size: 15px; line-height: 1.55; color: #334155">The yearly dividend as a share of the price. A ₦50 share paying ₦4 a year yields 8%.</span>', '>{{wTitle}}</span><span style="font-size: 15px; line-height: 1.55; color: #334155">{{wDef}}</span>')
    for i, (t, n) in enumerate([('Money basics', '4'), ('Investing', '5'), ('The Nigerian market', '3'), ('Companies and reports', '3')]):
        s = sub1(s, '<a href="#" style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; padding: 20px 22px; padding: 16px 18px; text-decoration: none; display: flex; flex-direction: column; gap: 4px"><strong style="font-size: 15px; font-weight: 600">' + t + '</strong><span style="font-size: 12px; color: #5B6577">' + n + ' guides</span>',
                    '<a href="TopicNavy.dc.html?t=' + t.replace(' ', '+') + '" style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; padding: 20px 22px; padding: 16px 18px; text-decoration: none; display: flex; flex-direction: column; gap: 4px"><strong style="font-size: 15px; font-weight: 600">' + t + '</strong><span style="font-size: 12px; color: #5B6577">{{n' + str(i) + '}} guides</span>')
    for i, t in enumerate(['Stock exchange', 'Inflation', 'Revenue and profit']):
        s = re.sub(r'<a href="ArticleLaptopNavy\.dc\.html"(( style="display: flex; align-items: center; gap: 16px; height: 52px;[^"]*")>(?:(?!</a>).)*?>' + t + '<)', lambda m: '<a href="{{p' + str(i) + '}}"' + m.group(1), s, count=1, flags=re.S)
    s = logic(s, """  constructor(p) { super(p); this.state = { q: '' }; }
  renderVals() {
    const L = window.FV ? window.FV.LIB : null; if (!L) return {}; const w = L.wordOfDay(), all = L.all(), v = {};
    L.TOPICS.forEach((t, i) => { v['n' + i] = String(L.inTopic(t.name).items.length); });
    const art = (title) => { const a = all.filter((x) => x.title.toLowerCase() === title.toLowerCase())[0]; return a ? 'ArticleNavy.dc.html?a=' + a.slug : 'SearchNavy.dc.html?q=' + encodeURIComponent(title); };
    ['Stock exchange', 'Inflation', 'Revenue and profit'].forEach((t, i) => { v['p' + i] = art(t); });
    const go = () => { const q = this.state.q.trim(); if (q) location.href = 'SearchNavy.dc.html?q=' + encodeURIComponent(q); };
    return Object.assign(v, { q: this.state.q, onQ: (e) => this.setState({ q: e.target.value }), onKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } },
      wTitle: w.title, wDef: w.definition, wHref: 'ArticleNavy.dc.html?a=' + w.slug });
  }""")
    wr('LibraryLaptopNavy', s)
# Money path (phones: PlusNavy, PayPendingNavy, PaySuccessNavy, PayFailedNavy; build-backlog B5). A failed response is
# never a failed payment: only the simulated server check moves an order to success or failure; retries reuse the order.
s = rd('PlansLaptopNavy')
if MARK not in s:
    s = sub1(s, '<a href="PayLaptopNavy.dc.html"', '<a href="#" aria-disabled="true"')
    s = sub1(s, '<a href="PayLaptopNavy.dc.html"', '<a href="#" onClick="{{payM}}"'); s = sub1(s, '<a href="PayLaptopNavy.dc.html"', '<a href="#" onClick="{{payY}}"')
    s = logic(s, """  constructor(p) { super(p); if (window.FV && window.FV.PAY) window.FV.PAY.remember(); }
  renderVals() { const go = (per) => (e) => { e.preventDefault(); const PAY = window.FV && window.FV.PAY; if (!PAY) return; const r = PAY.start(per);
      if (r.ok || r.reason === 'pending') location.href = 'PayPendingNavy.dc.html?o=' + r.orderId; else location.href = 'YourPlanNavy.dc.html'; };
    return { payM: go('monthly'), payY: go('yearly') }; }""")
    wr('PlansLaptopNavy', s)
s = rd('PayPendingLaptopNavy')
if MARK not in s:
    s = sub1(s, 'FV-24117 · ₦5,999', '{{orderNo}} · {{amt}}')
    s = logic(s, """  P() { return window.FV && window.FV.PAY; }
  o() { const P = this.P(); if (!P) return null; const m = /[?&]o=([\\w-]+)/.exec(location.search); const b = window.FV.billing(); return (m && b.orders.filter((x) => x.id === m[1])[0]) || P.current() || b.orders[0] || null; }
  n(k) { return '₦' + (k / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 }); }
  d(day) { return day ? new Date(day + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''; }
  base() { const P = this.P(), o = this.o(); if (!P || !o) return { amt: '₦5,999', orderNo: 'FV-24117' }; return { amt: this.n(o.amountKobo), orderNo: P.orderNo(o) }; }
  componentDidMount() { const P = this.P(), o = this.o(); if (!P || !o) return;
    if (o.status === 'confirmedSuccess') { location.replace('PayAlreadyNavy.dc.html?o=' + o.id); return; }
    if (o.status === 'confirmedFailed') { location.replace('PayFailedNavy.dc.html?o=' + o.id); return; }
    this.t = setTimeout(() => { const r = P.check(o.id, /[?&]again=1/.test(location.search)); if (!r) return;
      if (r.offline) location.replace('PayOfflineNavy.dc.html?o=' + o.id); else if (r.order.status === 'confirmedSuccess') location.replace('PaySuccessNavy.dc.html?o=' + o.id);
      else if (r.order.status === 'confirmedFailed') location.replace('PayFailedNavy.dc.html?o=' + o.id); else location.replace('PaySlowNavy.dc.html?o=' + o.id); }, 1800); }
  componentWillUnmount() { clearTimeout(this.t); }
  renderVals() { return this.base(); }""")
    wr('PayPendingLaptopNavy', s)
s = rd('PayLaptopNavy')
if MARK not in s:
    s = sub1(s, 'ada@example.com', '{{email}}'); s = sub1(s, 'FV-24117 · ₦5,999 · Renews 10 Dec', '{{orderNo}} · {{amt}} · Renews {{renews}}')
    s = logic(s, """  P() { return window.FV && window.FV.PAY; }
  o() { const P = this.P(); if (!P) return null; const m = /[?&]o=([\\w-]+)/.exec(location.search); const b = window.FV.billing(); return (m && b.orders.filter((x) => x.id === m[1])[0]) || P.current() || b.orders[0] || null; }
  n(k) { return '₦' + (k / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 }); }
  d(day) { return day ? new Date(day + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''; }
  base() { const P = this.P(), o = this.o(); if (!P || !o) return { amt: '₦5,999', orderNo: 'FV-24117' }; return { amt: this.n(o.amountKobo), orderNo: P.orderNo(o) }; }
  renderVals() { const F = window.FV, a = F ? F.AUTH.get() : {}, b = F ? F.billing() : { sub: {} }; return Object.assign(this.base(), { email: a.email || 'your email', renews: this.d(b.sub.renewsOn) }); }""")
    wr('PayLaptopNavy', s)
s = rd('PayFailedLaptopNavy')
if MARK not in s:
    s = sub1(s, '>Order FV-24117<', '>Order {{orderNo}}<') if '>Order FV-24117<' in s else s.replace('FV-24117', '{{orderNo}}', 1)
    s = sub1(s, '<a href="PlansLaptopNavy.dc.html"', '<a href="#" onClick="{{retry}}"'); s = sub1(s, '<a href="PlansLaptopNavy.dc.html"', '<a href="#" onClick="{{retry}}"')
    s = logic(s, """  P() { return window.FV && window.FV.PAY; }
  o() { const P = this.P(); if (!P) return null; const m = /[?&]o=([\\w-]+)/.exec(location.search); const b = window.FV.billing(); return (m && b.orders.filter((x) => x.id === m[1])[0]) || P.current() || b.orders[0] || null; }
  n(k) { return '₦' + (k / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 }); }
  d(day) { return day ? new Date(day + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''; }
  base() { const P = this.P(), o = this.o(); if (!P || !o) return { amt: '₦5,999', orderNo: 'FV-24117' }; return { amt: this.n(o.amountKobo), orderNo: P.orderNo(o) }; }
  renderVals() { return Object.assign(this.base(), { retry: (e) => { e.preventDefault(); const P = this.P(), o = this.o(); if (!P || !o) { location.href = 'PlansLaptopNavy.dc.html'; return; } P.retry(o.id); location.href = 'PayPendingNavy.dc.html?o=' + o.id + '&again=1'; } }); }""")
    wr('PayFailedLaptopNavy', s)
# Sign out (phone: SignOutNavy): signs out, then the welcome screen as drawn.
s = rd('SignOutLaptopNavy')
if MARK not in s:
    s = sub1(s, '<a href="WelcomeLaptopNavy.dc.html"', '<a href="WelcomeLaptopNavy.dc.html" onClick="{{out}}"')
    s = logic(s, "  renderVals() { return { out: () => { if (window.FV) window.FV.AUTH.signOut(); } }; }"); wr('SignOutLaptopNavy', s)
# No results (phone: EmptySearchNavy): the words searched, a suggestion when the Library has one, Ask with the words.
s = rd('EmptyLaptopNavy')
if MARK not in s:
    s = sub1(s, 'aria-label="Search" value="zenit bnk"', 'aria-label="Search" value="{{q}}" onInput="{{onQ}}" onKeyDown="{{onKey}}"')
    s = s.replace('zenit bnk', '{{q0}}')
    s = sub1(s, '<a href="CompanyLaptopNavy.dc.html"', '<sc-if value="{{hasDym}}" hint-placeholder-val="{{ true }}"><a href="{{dymHref}}"')
    s = sub1(s, '>Did you mean Zenith Bank?</a>', '>{{dymLabel}}</a></sc-if>')
    s = sub1(s, '<a href="AskLaptopNavy.dc.html"', '<a href="{{askHref}}"')
    s = logic(s, """  constructor(p) { super(p); const m = /[?&]q=([^&]*)/.exec(location.search); const q = m ? decodeURIComponent(m[1].replace(/[+]/g, ' ')) : ''; this.state = { q, q0: q }; }
  renderVals() { const L = window.FV && window.FV.LIB, q0 = this.state.q0, d = L && q0 ? L.search(q0).didYouMean : null;
    const zen = /zen|zenit/i.test(q0), art = d && L ? (L.article(String(d)) || L.all().filter((x) => x.title.toLowerCase() === String(d).toLowerCase())[0]) : null, dym = zen ? 'Zenith Bank' : art ? art.title : d ? String(d) : '';
    return { q: this.state.q, q0, onQ: (e) => this.setState({ q: e.target.value }), onKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); location.href = 'SearchNavy.dc.html?q=' + encodeURIComponent(this.state.q); } },
      hasDym: !!dym, dymLabel: 'Did you mean ' + dym + '?', dymHref: zen ? 'CompanyLaptopNavy.dc.html?t=ZENITHBANK' : art ? 'ArticleNavy.dc.html?a=' + art.slug : 'SearchNavy.dc.html?q=' + encodeURIComponent(dym), askHref: 'AskLaptopNavy.dc.html?q=' + encodeURIComponent(q0) }; }""")
    wr('EmptyLaptopNavy', s)
# Search (phone: SearchNavy). Companies are the ones the app has data for whose name, ticker or sector matches, with live
# prices; guides come from the Library search; nothing found goes to No results; Ask carries the words.
s = rd('SearchLaptopNavy')
if MARK not in s:
    s = sub1(s, 'aria-label="Search" value="bank"', 'aria-label="Search" value="{{q}}" onInput="{{onQ}}" onKeyDown="{{onKey}}"')
    row = '<div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; min-height: 54px; align-items: center; padding: 0 20px; border-top: 1px solid #EDEFF2; font-size: 14px">'
    a = s.index(row); b = s.index('</section>', a)
    s = s[:a] + ('<sc-for list="{{cos}}" as="c" hint-placeholder-count="4"><a href="{{c.href}}" style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; min-height: 54px; align-items: center; padding: 0 20px; border-top: 1px solid #EDEFF2; font-size: 14px; text-decoration: none; color: #0B192C">'
        '<span style="text-align: left"><span style="display: flex; flex-direction: column"><span style="font-weight: 500">{{c.name}}</span><span style="font-family: \'Geist Mono\', monospace; font-size: 12px; color: #5B6577">{{c.t}}</span></span></span>'
        '<span style="text-align: right"><span style="font-family: \'Geist Mono\', monospace">{{c.p}}</span></span><span style="text-align: right"><span style="font-family: \'Geist Mono\', monospace"><span style="color: {{c.fg}}">{{c.c}}</span></span></span></a></sc-for>'
        '<sc-if value="{{noCos}}" hint-placeholder-val="{{ false }}"><p style="margin: 0; padding: 16px 20px; border-top: 1px solid #EDEFF2; font-size: 14px; color: #5B6577">No companies match.</p></sc-if>') + s[b:]
    g = '<div style="display: flex; justify-content: space-between; align-items: center; min-height: 48px; border-top: 1px solid #EDEFF2; font-size: 14px">'
    a = s.index(g); b = s.index('</section>', a)
    s = s[:a] + ('<sc-for list="{{guides}}" as="x" hint-placeholder-count="2"><a href="{{x.href}}" style="display: flex; justify-content: space-between; align-items: center; min-height: 48px; border-top: 1px solid #EDEFF2; font-size: 14px; text-decoration: none">'
        '<span style="color: #5B6577">{{x.t}}</span><span style="font-family: \'Geist Mono\', monospace">{{x.m}}</span></a></sc-for>') + s[b:]
    s = sub1(s, '<a href="AskLaptopNavy.dc.html" style="background: #FFFFFF;', '<a href="{{askHref}}" style="background: #FFFFFF;')
    s = sub1(s, 'Ask Finvora AI: "Which bank pays the best dividend?"</a>', 'Ask Finvora AI: "{{q0}}"</a>')
    s = logic(s, """  constructor(p) { super(p); const m = /[?&]q=([^&]*)/.exec(location.search); this.state = { q: m ? decodeURIComponent(m[1].replace(/[+]/g, ' ')) : '' }; }
  componentDidMount() { this.check(); }
  cos(q) { const S = window.FV && window.FV.SIM; q = q.trim().toLowerCase(); if (!S || q.length < 2) return []; const bank = /bank/.test(q);
    return S.COMPANIES.map((c) => S.company(c.t)).filter((c) => c && (c.name.toLowerCase().indexOf(q) >= 0 || c.t.toLowerCase().indexOf(q) >= 0 || (c.sector || '').toLowerCase().indexOf(q) >= 0 || (bank && c.sector === 'Banking'))); }
  res() { const L = window.FV && window.FV.LIB; return L && this.state.q.trim() ? L.search(this.state.q) : { results: [] }; }
  check() { const q = this.state.q.trim(); if (q.length < 2) return; if (!this.cos(q).length && !this.res().results.length) location.replace('EmptySearchNavy.dc.html?q=' + encodeURIComponent(q)); }
  renderVals() { const S = window.FV && window.FV.SIM, L = window.FV && window.FV.LIB, c = this.cos(this.state.q), r = this.res(), q = this.state.q.trim();
    return { q: this.state.q, q0: q || 'Ask anything about money', onQ: (e) => this.setState({ q: e.target.value }),
      onKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); location.href = 'SearchNavy.dc.html?q=' + encodeURIComponent(this.state.q.trim()); } },
      cos: c.map((x) => { const ch = S.change(x.t); return { href: 'CompanyLaptopNavy.dc.html?t=' + x.t, name: x.name, t: x.t, p: '₦' + (S.price(x.t) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), c: (ch >= 0 ? '▲ ' : '▼ ') + Math.abs(ch).toFixed(1) + '%', fg: ch >= 0 ? '#047857' : '#B9473F' }; }),
      noCos: !c.length, guides: (r.results || []).filter((x) => x.kind === 'article').slice(0, 6).map((x) => { const a = L.article(x.id); return { href: x.href.replace('UPArticle', 'ArticleNavy'), t: x.title, m: a ? L.minutes(a) + ' min' : '' }; }),
      askHref: 'AskLaptopNavy.dc.html?q=' + encodeURIComponent(q) }; }""")
    wr('SearchLaptopNavy', s)
print('laptop wired')
