"""Wire onboarding and sign-in boards to window.FV.AUTH (simulated sign-in).
Usage: python3 wire_auth.py <site folder>"""
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
MARK = 'window.FV && window.FV.AUTH'
A = "  A() { return window.FV && window.FV.AUTH; }\n"
BTN = 'style="width: 100%; border: 0; cursor: pointer; font: inherit; font-weight: 700"'

# Goal: the cards are a real choice; Continue saves it.
s = rd('UPOnbGoal')
if MARK not in s:
    for i, g in enumerate(['Money basics', 'Investing', 'Nigerian market', 'Ghana market', 'Kenya market', 'South Africa']):
        m = re.search(r'<a href="UPSignIn\.dc\.html" class="dcard press" style="([^"]*)">((?:(?!</a>).)*?<span style="font-weight: 800; font-size: 16px">' + re.escape(g) + r'</span>.*?)</a>', s, flags=re.S)
        if not m: raise SystemExit('goal card missing: ' + g)
        s = s[:m.start()] + '<button type="button" class="dcard press" role="radio" aria-checked="{{g%d}}" onClick="{{pick%d}}" style="%s; cursor: pointer; font: inherit; color: inherit; background: {{bg%d}}; border-color: {{bd%d}}; box-shadow: {{sh%d}}">%s</button>' % (i, i, m.group(1).replace('border-color: #5B21B6; box-shadow: 0 4px 0 #3B0F7A; background: #F8F6FC; ', ''), i, i, i, m.group(2)) + s[m.end():]
    s = sub1(s, '<a href="UPSignIn.dc.html" class="btn">Continue</a>', '<button type="button" class="btn" onClick="{{go}}" ' + BTN + '>Continue</button>')
    s = logic(s, A + '''  constructor(p) { super(p); const a = window.FV ? window.FV.AUTH.get() : {}; this.state = { g: a.goal || 'Investing' }; }
  renderVals() {
    const G = ['Money basics', 'Investing', 'Nigerian market', 'Ghana market', 'Kenya market', 'South Africa'], v = {};
    G.forEach((g, i) => { const on = g === this.state.g; v['g' + i] = String(on); v['bg' + i] = on ? '#F8F6FC' : '#FFFFFF'; v['sh' + i] = on ? '0 4px 0 #3B0F7A' : '0 4px 0 #E7E2F0'; v['bd' + i] = on ? '#5B21B6' : '#E7E2F0'; v['pick' + i] = () => this.setState({ g }); });
    v.go = () => { if (this.A()) this.A().setGoal(this.state.g); location.href = this.A() && this.A().signedIn() ? 'UOHome.dc.html' : 'UPSignIn.dc.html'; };
    return v;
  }''')
    wr('UPOnbGoal', s)

# Email: checked before a code is "sent".
s = rd('UPSignIn')
if MARK not in s:
    s = sub1(s, '<input class="field" type="email" autocomplete="email" inputmode="email" value="ada@example.com">', '<input class="field" type="email" autocomplete="email" inputmode="email" value="{{email}}" onInput="{{onEmail}}" onKeyDown="{{onKey}}" aria-invalid="{{bad}}" aria-describedby="em-err" placeholder="ada@example.com"></label>\n    <sc-if value="{{showErr}}" hint-placeholder-val="{{false}}"><p id="em-err" role="alert" style="margin: -6px 0 0; color: #B42828; font-weight: 700; font-size: 14px">Enter a valid email address, like ada@example.com.</p></sc-if><label style="display: none">')
    s = sub1(s, '<a href="UPSignInCode.dc.html" class="btn">Send code</a>', '<button type="button" class="btn" onClick="{{send}}" ' + BTN + '>Send code</button>')
    s = logic(s, A + '''  constructor(p) { super(p); const a = window.FV ? window.FV.AUTH.get() : {}; this.state = { email: a.pending || '', tried: false }; }
  send() { const A = this.A(); if (!A) return; if (!A.validEmail(this.state.email)) { this.setState({ tried: true }); return; } A.sendCode(this.state.email); location.href = 'UPSignInCode.dc.html'; }
  renderVals() {
    const A = this.A(), bad = !!A && this.state.tried && !A.validEmail(this.state.email);
    return { email: this.state.email, bad: String(bad), showErr: bad, onEmail: (e) => this.setState({ email: e.target.value }),
      onKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); this.send(); } }, send: () => this.send() };
  }''')
    wr('UPSignIn', s)

# Code: six boxes show what you type; all six digits check the code.
s = rd('UPSignInCode')
if MARK not in s:
    BOX = 'flex: 1; height: 58px; border-radius: 14px; background: #FFFFFF; border: 1.5px solid %s; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700'
    a = s.index('<span style="display: flex; gap: 8px" aria-hidden="true">'); b = s.index('<input class="sr"', a)
    s = s[:a] + '<span style="display: flex; gap: 8px" aria-hidden="true"><sc-for list="{{boxes}}" as="x" hint-placeholder-count="6"><span style="' + BOX % '{{x.bd}}' + '" class="num">{{x.d}}</span></sc-for></span>' + s[b:]
    s = sub1(s, '<input class="sr" inputmode="numeric" autocomplete="one-time-code" maxlength="6" aria-label="6-digit code">', '<input id="code" class="sr" inputmode="numeric" autocomplete="one-time-code" maxlength="6" aria-label="6-digit code" value="{{code}}" onInput="{{onCode}}">')
    s = sub1(s, 'We sent a 6-digit code to <strong', 'We sent a 6-digit code to <strong data-x')
    s = re.sub(r'(<strong data-x[^>]*>)ada@example\.com(</strong>)', r'\1{{email}}\2', s, count=1)
    s = sub1(s, '<a href="#resend" style="', '<a href="#resend" onClick="{{resend}}" style="')
    s = sub1(s, '>Resend code</a>', '>{{resendLabel}}</a>')
    s = sub1(s, '<span class="btn btn-off" aria-disabled="true">Enter all 6 digits</span>', '<span class="btn btn-off" aria-disabled="true">{{hint}}</span>')
    s = sub1(s, '<a href="UOHome.dc.html" class="muted"', '<a href="UPSignIn.dc.html" class="muted"')
    s = logic(s, A + '''  constructor(p) { super(p); this.state = { code: '', n: 0 }; }
  componentDidMount() { const A = this.A(); if (A && !A.get().pending) { location.replace('UPSignIn.dc.html'); return; } this.iv = setInterval(() => this.setState({ n: this.state.n + 1 }), 1000); setTimeout(() => { const i = document.getElementById('code'); if (i) i.focus(); }, 300); }
  componentWillUnmount() { clearInterval(this.iv); }
  onCode(v) {
    const code = String(v).replace(/\\D/g, '').slice(0, 6); this.setState({ code });
    if (code.length < 6) return;
    const r = this.A().verify(code);
    setTimeout(() => {
      if (r === 'ok') { const a = this.A().get(); location.href = !a.birth ? 'URAgeCheck.dc.html' : !a.asked ? 'URNotifAsk.dc.html' : 'UOHome.dc.html'; }
      else location.href = 'URCodeError.dc.html?s=' + r;
    }, 250);
  }
  renderVals() {
    const A = this.A(); if (!A) return {};
    const c = this.state.code, wait = A.resendIn();
    return { email: A.get().pending || '', code: c, boxes: [0, 1, 2, 3, 4, 5].map((i) => ({ d: c[i] || '', bd: i === c.length ? '#5B21B6' : '#E7E2F0' })),
      hint: c.length < 6 ? 'Enter all 6 digits' : 'Checking\\u2026', resendLabel: wait ? 'Resend in ' + Math.floor(wait / 60) + ':' + String(wait % 60).padStart(2, '0') : 'Resend code',
      onCode: (e) => this.onCode(e.target.value),
      resend: (e) => { if (e && e.preventDefault) e.preventDefault(); if (A.resendIn() > 0) return; A.sendCode(A.get().pending); this.setState({ code: '' }); } };
  }''')
    wr('UPSignInCode', s)

# Code problems: wrong, expired, locked. The state comes from the code screen.
s = rd('URCodeError')
if MARK not in s:
    a = s.index('<div role="tablist" aria-label="Preview state"'); b = s.index('</div>', s.index('</sc-for>', a)) + 6
    s = s[:a] + s[b:]
    s = re.sub(r'(We sent a 6-digit code to <strong[^>]*>)ada@example\.com(</strong>)', r'\1{{email}}\2', s, count=1)
    for d in '482193':
        s = s.replace('font-size: 24px; font-weight: 800">%s</span>' % d, 'font-size: 24px; font-weight: 800">{{d%s}}</span>' % d, 1)
    s = sub1(s, '<a href="UPSignInCode.dc.html" class="btn">Send a new code</a><span class="muted" style="font-size: 14px; text-align: center">You can resend in 0:42</span>',
        '<button type="button" class="btn" onClick="{{resend}}" aria-disabled="{{waitOn}}" ' + BTN + '>{{resendLabel}}</button>')
    s = sub1(s, '<span class="btn btn-off" aria-disabled="true">Try again in 15:00</span>', '<span class="btn btn-off" aria-disabled="true">Try again in {{lockLeft}}</span>')
    s = logic(s, A + '''  constructor(p) { super(p); this.state = { n: 0 }; }
  componentDidMount() { this.iv = setInterval(() => this.setState({ n: this.state.n + 1 }), 1000); }
  componentWillUnmount() { clearInterval(this.iv); }
  renderVals() {
    const A = this.A(); if (!A) return {};
    const m = /[?&]s=(wrong|expired|locked)/.exec(location.search), st = A.lockedFor() > 0 ? 'locked' : (m ? m[1] : 'wrong');
    const left = A.triesLeft(), code = st === 'wrong' ? '000000' : st === 'expired' ? '111111' : '000000';
    const msg = { wrong: "That code doesn't match. Check the email and try again.", expired: 'This code has expired. Codes last 10 minutes. We can send a new one.', locked: 'Too many wrong codes. For your safety, wait 15 minutes or request a new code.' }[st];
    const lk = A.lockedFor(), wait = A.resendIn(), v = { email: A.get().pending || '', msg, tries: left + (left === 1 ? ' try left' : ' tries left'), hasTries: st === 'wrong', bd: '#F04438', lock: st === 'locked', open: st !== 'locked',
      lockLeft: Math.floor(lk / 60) + ':' + String(lk % 60).padStart(2, '0'), waitOn: String(st === 'wrong' ? false : wait > 0),
      resendLabel: st === 'wrong' ? 'Try the code again' : wait > 0 ? 'Send a new code in ' + Math.floor(wait / 60) + ':' + String(wait % 60).padStart(2, '0') : 'Send a new code',
      resend: () => { if (st === 'wrong') { location.href = 'UPSignInCode.dc.html'; return; } if (A.resendIn() > 0) return; A.sendCode(A.get().pending); location.href = 'UPSignInCode.dc.html'; } };
    '482193'.split('').forEach((d, i) => { v['d' + d] = code[i]; });
    return v;
  }''')
    wr('URCodeError', s)

# Age: a real date check; under 18 can still learn.
s = rd('URAgeCheck')
if MARK not in s:
    for lab, val, key in [('Day', '14', 'dd'), ('Month', '06', 'mm'), ('Year', '2004', 'yy')]:
        s = sub1(s, '<span style="font-weight: 700; font-size: 14px">%s</span><input class="field" type="text" value="%s" inputmode="numeric">' % (lab, val),
                 '<span style="font-weight: 700; font-size: 14px">%s</span><input class="field" type="text" value="{{%s}}" onInput="{{on_%s}}" inputmode="numeric" maxlength="%d" aria-invalid="{{bad}}" placeholder="%s">' % (lab, key, key, 4 if key == 'yy' else 2, val))
    s = sub1(s, '<a href="UPOnbGoal.dc.html" class="btn">Continue</a>', '<sc-if value="{{showErr}}" hint-placeholder-val="{{false}}"><p role="alert" style="margin: 0 0 10px; color: #B42828; font-weight: 700; font-size: 14px; text-align: center">Enter a real date of birth, like 14 06 2004.</p></sc-if><button type="button" class="btn" onClick="{{go}}" ' + BTN + '>Continue</button>')
    s = sub1(s, '<a href="UPSignInCode.dc.html" class="press" aria-label="Back"', '<a href="UOHome.dc.html" class="press" aria-label="Back"')
    s = logic(s, A + '''  constructor(p) { super(p); this.state = { dd: '', mm: '', yy: '', tried: false }; }
  ok() {
    const d = +this.state.dd, m = +this.state.mm, y = +this.state.yy, now = new Date(), dt = new Date(Date.UTC(y, m - 1, d));
    return y >= 1900 && y <= now.getFullYear() && dt.getUTCDate() === d && dt.getUTCMonth() === m - 1 && dt < now;
  }
  renderVals() {
    const num = (k, n) => (e) => this.setState({ [k]: e.target.value.replace(/\\D/g, '').slice(0, n) }), bad = this.state.tried && !this.ok();
    return { dd: this.state.dd, mm: this.state.mm, yy: this.state.yy, on_dd: num('dd', 2), on_mm: num('mm', 2), on_yy: num('yy', 4), bad: String(bad), showErr: bad,
      go: () => { if (!this.ok()) { this.setState({ tried: true }); return; } const A = this.A(); A.setBirth(this.state.yy + '-' + this.state.mm.padStart(2, '0') + '-' + this.state.dd.padStart(2, '0')); location.href = A.get().asked ? 'UOHome.dc.html' : 'URNotifAsk.dc.html'; } };
  }''')
    wr('URAgeCheck', s)

# Reminder: saves the choice (no real notifications in the prototype).
s = rd('URNotifAsk')
if MARK not in s:
    s = sub1(s, '<a href="UOHome.dc.html" class="btn">Turn on reminders</a>', '<button type="button" class="btn" onClick="{{yes}}" ' + BTN + '>Turn on reminders</button>')
    s = re.sub(r'<a href="UOHome\.dc\.html"([^>]*)>Not now</a>', r'<a href="UOHome.dc.html" onClick="{{no}}"\1>Not now</a>', s, count=1)
    s = logic(s, A + '''  renderVals() { const A = this.A(); return { yes: () => { if (A) A.setReminder(true); location.href = 'UOHome.dc.html'; }, no: () => { if (A) A.setReminder(false); } }; }''')
    wr('URNotifAsk', s)

# Sign out ends the session.
s = rd('UMSignOut')
if MARK not in s:
    s = sub1(s, '<a href="UPSignIn.dc.html" class="btn btn-r" style="', '<button type="button" onClick="{{out}}" class="btn btn-r" style="width: 100%; border: 0; cursor: pointer; font: inherit; font-weight: 700; ')
    s = sub1(s, 'text-decoration: none">Sign out</a>', 'text-decoration: none">Sign out</button>')
    s = logic(s, A + '''  renderVals() { return { out: () => { const A = this.A(); if (A) A.signOut(); location.href = 'UPOnbWelcome.dc.html'; } }; }''')
    wr('UMSignOut', s)
print('sign-in wired')
