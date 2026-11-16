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
print('laptop wired')
