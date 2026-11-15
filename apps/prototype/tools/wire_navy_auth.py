"""Wire the navy sign-in boards to window.FV.AUTH (simulated sign-in, rules in docs/PROTOTYPE_BUILD_PLAN.md §4.1).
Flow follows the board links as drawn (owner, 15 Nov 2026): Sign in (email and code on one screen) -> Goal -> Home;
'Check your email' -> Goal; wrong or expired codes open the Wrong code screen.
Also adds fvd.js and fv.js (the tested rules and the browser store) to every navy board.
Usage: python3 wire_navy_auth.py <site folder>"""
import os, re, sys, glob
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing in board: ' + a[:100])
    return s.replace(a, b, 1)
def logic(s, js):
    a = s.index('class Component extends DCLogic'); b = s.index('</script>', a)
    return s[:a] + 'class Component extends DCLogic {\n' + js + '\n}\n' + s[b:]
MARK = 'window.FV && window.FV.AUTH'
A = "  A() { return window.FV && window.FV.AUTH; }\n"

for f in glob.glob(os.path.join(SITE, '*Navy.dc.html')):
    s = open(f).read()
    if 'fv.js' not in s:
        s = s.replace('<script src="./responsive.js"></script>', '<script src="./responsive.js"></script>\n<script src="./fvd.js"></script>\n<script src="./fv.js"></script>', 1)
        open(f, 'w').write(s)

BOX = 'height: %dpx; border: {{x.bd}}; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-family: \'Geist Mono\', monospace; font-size: %dpx'
CODE_INPUT = '<input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" aria-label="6-digit code" value="{{code}}" onInput="{{onCode}}" onKeyDown="{{onKey}}" style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; font-size: 16px; border: 0; padding: 0">'
COMMON = '''  boxes(code) { return [0, 1, 2, 3, 4, 5].map((i) => ({ d: code[i] || '', bd: code[i] ? '1px solid #0B192C' : (i === code.length ? '2px solid #10B981' : '1px solid #D5D9E0') })); }
  tick() { clearTimeout(this.t); this.t = setTimeout(() => { if (this.A() && this.A().resendIn() > 0) { this.setState({ n: Date.now() }); this.tick(); } }, 1000); }
  resendLabel() { const A = this.A(), r = A ? A.resendIn() : 0; return r > 0 ? 'Resend in 0:' + String(r).padStart(2, '0') : 'Resend code'; }
  check(code) {
    const A = this.A(); if (!A || code.length < 6) return;
    const r = A.verify(code);
    if (r === 'ok') { location.href = 'GoalNavy.dc.html'; return; }
    try { sessionStorage.setItem('fv.lastCode', code); } catch (e) {}
    location.href = 'CodeErrorNavy.dc.html?why=' + r;
  }
'''

# Sign in: email and code on one screen (as drawn).
s = rd('SignInNavy')
if MARK not in s:
    s = sub1(s, '<input id="em" type="email" value="ada@example.com" style="', '<input id="em" type="email" autocomplete="email" inputmode="email" placeholder="ada@example.com" value="{{email}}" onInput="{{onEmail}}" aria-invalid="{{bad}}" aria-describedby="em-err" style="')
    s = sub1(s, '<label style="margin-top: 20px; font-size: 13px; font-weight: 500">6-digit code</label>', '<sc-if value="{{bad}}" hint-placeholder-val="{{false}}"><p id="em-err" role="alert" style="margin: 6px 0 0; font-size: 13px; color: #B9473F">Enter a valid email address, like ada@example.com.</p></sc-if>\n  <label for="code" style="margin-top: 20px; font-size: 13px; font-weight: 500">6-digit code</label>')
    a = s.index('<div style="margin-top: 6px; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px">'); b = s.index('</div>', a) + 6
    s = s[:a] + '<div style="margin-top: 6px; position: relative; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px"><sc-for list="{{boxes}}" as="x" hint-placeholder-count="6"><span aria-hidden="true" style="' + BOX % (54, 20) + '">{{x.d}}</span></sc-for>' + CODE_INPUT + '</div>' + s[b:]
    s = sub1(s, '<span>Sent to ada@example.com</span><span>Resend in 0:42</span>', '<span>{{sentTo}}</span><a href="#" onClick="{{resend}}" style="color: #5B6577">{{resendLabel}}</a>')
    s = sub1(s, '<a href="GoalNavy.dc.html" style="height: 52px;', '<a href="#" onClick="{{go}}" style="height: 52px;')
    s = logic(s, A + COMMON + '''  constructor(p) { super(p); const a = window.FV ? window.FV.AUTH.get() : {}; this.state = { email: a.pending || '', code: '', tried: false }; }
  componentDidMount() { this.tick(); }
  send() { const A = this.A(); if (!A || !A.validEmail(this.state.email)) { this.setState({ tried: true }); return false; } A.sendCode(this.state.email); this.setState({ n: Date.now() }); this.tick(); setTimeout(() => { const c = document.getElementById('code'); if (c) c.focus(); }, 0); return true; }
  go() { const A = this.A(); if (!A) return; const a = A.get(); if (!A.validEmail(this.state.email)) { this.setState({ tried: true }); return; } if (a.pending !== this.state.email.trim().toLowerCase() || !a.sentAt) { this.send(); return; } this.check(this.state.code); }
  renderVals() {
    const A = this.A(), a = A ? A.get() : {}, bad = !!A && this.state.tried && !A.validEmail(this.state.email);
    return { email: this.state.email, bad, boxes: this.boxes(this.state.code), code: this.state.code,
      sentTo: a.pending && a.sentAt ? 'Sent to ' + a.pending : 'We will email you a code',
      resendLabel: a.sentAt ? this.resendLabel() : 'Send code',
      onEmail: (e) => this.setState({ email: e.target.value }),
      onCode: (e) => { const c = e.target.value.replace(/\\D/g, '').slice(0, 6); this.setState({ code: c }); if (c.length === 6) this.check(c); },
      onKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); this.go(); } },
      resend: (e) => { e.preventDefault(); if (A && A.resendIn() > 0) return; this.send(); },
      go: (e) => { e.preventDefault(); this.go(); } };
  }''')
    wr('SignInNavy', s)

# Check your email: the code step on its own screen.
s = rd('SignInCodeNavy')
if MARK not in s:
    s = sub1(s, '>We sent a 6-digit code to ada@example.com.</p>', '>We sent a 6-digit code to {{email}}.</p>')
    a = s.index('<div style="padding: 24px 24px 0; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px">'); b = s.index('</div>', a) + 6
    s = s[:a] + '<div style="margin: 24px 24px 0; position: relative; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px"><sc-for list="{{boxes}}" as="x" hint-placeholder-count="6"><span aria-hidden="true" style="' + BOX % (56, 22) + '">{{x.d}}</span></sc-for>' + CODE_INPUT + '</div>' + s[b:]
    s = sub1(s, '<span>Resend in 0:42</span>', '<a href="#" onClick="{{resend}}" style="color: #5B6577">{{resendLabel}}</a>')
    s = sub1(s, '<a href="GoalNavy.dc.html" style="height: 52px;', '<a href="#" onClick="{{go}}" style="height: 52px;')
    s = logic(s, A + COMMON + '''  constructor(p) { super(p); this.state = { code: '' }; }
  componentDidMount() { this.tick(); setTimeout(() => { const c = document.getElementById('code'); if (c) c.focus(); }, 0); }
  renderVals() {
    const A = this.A(), a = A ? A.get() : {};
    return { email: a.pending || 'your email', boxes: this.boxes(this.state.code), code: this.state.code, resendLabel: this.resendLabel(),
      onCode: (e) => { const c = e.target.value.replace(/\\D/g, '').slice(0, 6); this.setState({ code: c }); if (c.length === 6) this.check(c); },
      onKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); this.check(this.state.code); } },
      resend: (e) => { e.preventDefault(); if (!A || A.resendIn() > 0 || !a.pending) return; A.sendCode(a.pending); this.setState({ code: '' }); this.tick(); },
      go: (e) => { e.preventDefault(); this.check(this.state.code); } };
  }''')
    wr('SignInCodeNavy', s)

# Wrong code: real tries left, the 15-minute lock, and a new code.
s = rd('CodeErrorNavy')
if MARK not in s:
    s = sub1(s, 'That code is wrong or has expired. You have 4 tries left.', '{{msg}}')
    s = sub1(s, 'We sent a 6-digit code to ada@example.com.', 'We sent a 6-digit code to {{email}}.')
    D = '<span style="height: 56px; border: 1.5px solid #B9473F; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-family: \'Geist Mono\', monospace; font-size: 22px">'
    a = s.index(D); b = s.index('</div>', a)
    s = s[:a] + '<sc-for list="{{digits}}" as="x" hint-placeholder-count="6">' + D + '{{x.d}}</span></sc-for>' + s[b:]
    s = sub1(s, '<a href="SignInCodeNavy.dc.html" style="height: 52px;', '<a href="#" onClick="{{again}}" style="height: 52px;')
    s = logic(s, A + '''  renderVals() {
    const A = this.A(), why = (/why=(\\w+)/.exec(location.search) || [])[1], left = A ? A.triesLeft() : 3, lock = A ? A.lockedFor() : 0;
    const msg = lock > 0 ? 'Too many wrong codes. Try again in ' + Math.ceil(lock / 60) + ' minutes.' : why === 'expired' ? 'That code has expired. Send a new code to try again.' : 'That code is wrong. You have ' + left + (left === 1 ? ' try' : ' tries') + ' left.';
    let last = ''; try { last = sessionStorage.getItem('fv.lastCode') || ''; } catch (e) {}
    const a0 = A ? A.get() : {};
    return { msg, email: a0.pending || 'your email', digits: [0, 1, 2, 3, 4, 5].map((i) => ({ d: last[i] || '' })), again: (e) => { e.preventDefault(); if (!A || A.lockedFor() > 0) return; const a = A.get(); if (a.pending) A.sendCode(a.pending); location.href = 'SignInCodeNavy.dc.html'; } };
  }''')
    wr('CodeErrorNavy', s)

# Goal: the choice is saved, then Home.
s = rd('GoalNavy')
if MARK not in s:
    s = sub1(s, '<a href="HomeNavy.dc.html" style="margin-top: auto;', '<a href="HomeNavy.dc.html" onClick="{{save}}" style="margin-top: auto;')
    s = sub1(s, "constructor(p) { super(p); this.state = { g: 1 }; }", A + "  constructor(p) { super(p); const g = window.FV ? window.FV.AUTH.get().goal : null, i = ['Money basics', 'Investing', 'Nigerian market'].indexOf(g); this.state = { g: i < 0 ? 1 : i }; }")
    s = sub1(s, "    return { opts:", "    const T = ['Money basics', 'Investing', 'Nigerian market'];\n    return { save: () => { if (this.A()) this.A().setGoal(T[this.state.g]); }, opts:")
    wr('GoalNavy', s)
print('wired')
