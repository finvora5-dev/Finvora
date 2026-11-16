"""Launch-rule fixes from the 16 Nov 2026 logic audit (owner: "fix all"). Sources: docs/build-backlog.md B2, B5, B10 and the
owner's answers the same day (age step after the interest step; under 18 is blocked; 5 wrong tries then a new code).
Idempotent. Usage: wire_navy_launch_rules.py <site>"""
import os, re, sys
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
def patch(n, pairs, mark=None):
    s = rd(n)
    if mark and mark in s: return
    for a, b in pairs:
        if a not in s: raise SystemExit(n + ': not found: ' + a[:70])
        s = s.replace(a, b)
    wr(n, s); print('patched', n)

# 1. After a correct code: Settings after an email change, Home for someone already set up, otherwise onboarding.
for n in ('SignInNavy', 'SignInCodeNavy', 'SignInLaptopNavy', 'SignInCodeLaptopNavy'):
    s = rd(n)
    for old in ("location.href = 'GoalNavy.dc.html'", "location.href = 'GoalLaptopNavy.dc.html'"):
        if old in s: s = s.replace(old, "location.href = A.next()"); wr(n, s); print('patched', n)

# 2. Wrong code screen: 5 tries per code, then a new code (at most one a minute; the code screen shows the wait).
for n in ('CodeErrorNavy', 'CodeErrorLaptopNavy'):
    patch(n, [("lock > 0 ? 'Too many wrong codes. Try again in ' + Math.ceil(lock / 60) + ' minutes.' :", "(A && A.spent()) ? 'Too many wrong codes. Send a new code to try again.' :"),
              ("if (!A || A.lockedFor() > 0) return; const a = A.get();", "if (!A) return; const a = A.get(); /* one-a-minute */")], mark='/* one-a-minute */')

# 3. Interest step leads to the age step, then notifications, then Home (owner order).
for n in ('GoalNavy', 'GoalLaptopNavy'):
    s = rd(n)
    if '{{next}}' not in s:
        s = re.sub(r'<a href="Home(Laptop)?Navy\.dc\.html" onClick="\{\{save\}\}"', '<a href="{{next}}" onClick="{{save}}"', s, count=1)
        s = s.replace("return { save: () =>", "return { next: this.A() ? this.A().onboardNext() : 'HomeNavy.dc.html', save: () =>", 1)
        s = s.replace("v = { save: () =>", "v = { next: window.FV ? window.FV.AUTH.onboardNext() : 'HomeNavy.dc.html', save: () =>", 1)
        assert '{{next}}' in s and 'onboardNext' in s, n; wr(n, s); print('patched', n)

# 4. Age step: a real date of birth; under 18 cannot continue (the line already on the screen turns red).
SEL = "height: 50px; border: 1px solid #D5D9E0; border-radius: 12px; padding: 0 10px; font-size: 16px; font-family: 'Geist Mono', monospace; background: #FFFFFF; color: #0B192C; width: 100%; box-sizing: border-box"
AGE_JS = r'''class Component extends DCLogic {
/* age-check */
  A() { return window.FV && window.FV.AUTH; }
  constructor(p) { super(p); const b = (this.A() && this.A().get().birth) || ''; this.state = { d: b ? String(+b.slice(8)) : '', m: b ? String(+b.slice(5, 7)) : '', y: b ? b.slice(0, 4) : '', tried: false }; }
  date() { const { d, m, y } = this.state; if (!d || !m || !y) return ''; const iso = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'), t = new Date(iso + 'T12:00:00Z'); return t.getUTCDate() === +d ? iso : ''; }
  renderVals() {
    const A = this.A(), iso = this.date(), young = !!iso && !!A && A.ageOf(iso) < 18, bad = this.state.tried && (!iso || young), yr = +new Date().getFullYear();
    const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const opt = (v, t, cur) => ({ v: String(v), t: String(t), sel: String(v) === String(cur) });
    return { days: [opt('', 'Day', this.state.d)].concat(Array.from({ length: 31 }, (_, i) => opt(i + 1, i + 1, this.state.d))),
      months: [opt('', 'Month', this.state.m)].concat(M.map((t, i) => opt(i + 1, t, this.state.m))),
      years: [opt('', 'Year', this.state.y)].concat(Array.from({ length: 100 }, (_, i) => opt(yr - i, yr - i, this.state.y))),
      dV: this.state.d, mV: this.state.m, yV: this.state.y,
      onD: (e) => this.setState({ d: e.target.value }), onM: (e) => this.setState({ m: e.target.value }), onY: (e) => this.setState({ y: e.target.value }),
      ruleC: bad || young ? '#B9473F' : '#5B6577', ruleW: bad || young ? '600' : '400', bd: bad && !iso ? '1.5px solid #B9473F' : '1px solid #D5D9E0',
      go: (e) => { e.preventDefault(); if (!A || !iso || young) { this.setState({ tried: true }); return; } A.setBirth(iso);
        const then = (/[?&]then=(\w+)/.exec(location.search) || [])[1]; location.href = then ? then + '.dc.html' : A.onboardNext(); } };
  }
}'''
for n in ('AgeCheckNavy', 'AgeCheckLaptopNavy'):
    s = rd(n)
    if '/* age-check */' in s: continue
    for lab, key, on in (('Day', 'days', 'onD'), ('Month', 'months', 'onM'), ('Year', 'years', 'onY')):
        m = re.search(r'(>' + lab + r')<span style="height: 50px; border: 1px solid #D5D9E0;[^"]*">[^<]*</span>', s); assert m, (n, lab)
        v = {'Day': 'dV', 'Month': 'mV', 'Year': 'yV'}[lab]
        s = s.replace(m.group(0), m.group(1) + '<select aria-label="' + lab + '" value="{{' + v + '}}" onChange="{{' + on + '}}" style="' + SEL + '; border: {{bd}}"><sc-for list="{{' + key + '}}" as="o"><option value="{{o.v}}">{{o.t}}</option></sc-for></select>')
    s = s.replace('<p style="margin: 8px 0 0; font-size: 15px; line-height: 1.5; color: #5B6577">You need to be 18 or older to use Finvora.</p>', '<p role="status" style="margin: 8px 0 0; font-size: 15px; line-height: 1.5; color: {{ruleC}}; font-weight: {{ruleW}}">You need to be 18 or older to use Finvora.</p>')
    s = re.sub(r'<a href="GoalNavy\.dc\.html" (style="height: 52px;[^"]*">Continue</a>)', r'<a href="#" onClick="{{go}}" \1', s, count=1)
    s = s.replace('<a href="SignInNavy.dc.html" aria-label="Back"', '<a href="GoalNavy.dc.html" aria-label="Back"', 1)
    s = s.replace('class Component extends DCLogic { renderVals() { return {}; } }', AGE_JS, 1)
    assert '/* age-check */' in s and 'onClick="{{go}}"' in s and s.count('<select') == 3, n
    wr(n, s); print('patched', n)

# 5. Notification step: both buttons record the answer (Settings can change it later).
for n in ('NotifAskNavy', 'NotifAskLaptopNavy'):
    s = rd(n)
    if '{{allow}}' in s: continue
    s = re.sub(r'<a href="HomeNavy\.dc\.html" (style="[^"]*">Allow notifications</a>)', r'<a href="HomeNavy.dc.html" onClick="{{allow}}" \1', s, count=1)
    s = re.sub(r'<a href="HomeNavy\.dc\.html" (style="[^"]*">Not now</a>)', r'<a href="HomeNavy.dc.html" onClick="{{later}}" \1', s, count=1)
    s = s.replace('class Component extends DCLogic { renderVals() { return {}; } }', "class Component extends DCLogic {\n  renderVals() { const A = window.FV && window.FV.AUTH, set = (on) => () => { if (A) { A.setReminder(on); window.FV.ME.setPref('price', on); window.FV.ME.setPref('daily', on); } }; return { allow: set(true), later: set(false) }; }\n}", 1)
    assert '{{allow}}' in s and '{{later}}' in s and 'setReminder' in s, n; wr(n, s); print('patched', n)

# 6. Plus page: prices come from the one price setting; checkout needs a confirmed 18+ date of birth.
patch('PlusNavy', [("const P = [['Monthly', 'Billed every month', '₦5,999'], ['Yearly', 'One month free · 11 × ₦5,999', '₦65,989']];",
                    "const PR = (window.FV && window.FV.PAY) ? window.FV.PAY.PRICE : { monthly: 599900, yearly: 6598900 }, nn = (k) => '₦' + (k / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 }); /* live-prices */\n    const P = [['Monthly', 'Billed every month', nn(PR.monthly)], ['Yearly', 'One month free · 11 × ' + nn(PR.monthly), nn(PR.yearly)]];"),
                   ("else if (r.reason === 'pending') location.href = 'PayPendingNavy.dc.html?o=' + r.orderId; else", "else if (r.reason === 'pending') location.href = 'PayPendingNavy.dc.html?o=' + r.orderId; else if (r.reason === 'age') location.href = 'AgeCheckNavy.dc.html?then=PlusNavy'; else")], mark='/* live-prices */')
patch('PlansLaptopNavy', [("if (r.ok || r.reason === 'pending') location.href = 'PayPendingNavy.dc.html?o=' + r.orderId; else", "if (r.ok || r.reason === 'pending') location.href = 'PayPendingNavy.dc.html?o=' + r.orderId; else if (r.reason === 'age') location.href = 'AgeCheckNavy.dc.html?then=PlusNavy'; /* age-gate */ else")], mark='/* age-gate */')

# 7. Your plan: a cancelled plan can be kept ("Keep Plus", the wording on the cancel dialog) instead of bought again.
for n in ('YourPlanNavy', 'YourPlanLaptopNavy'):
    s = rd(n)
    if '{{cancelT}}' in s: continue
    a = '<a href="CancelPlanNavy.dc.html" style="display: flex; align-items: center; min-height: 54px; text-decoration: none; font-size: 15px; color: #B9473F">Cancel Plus</a>'
    assert s.count(a) == 1, n
    s = s.replace(a, '<a href="{{cancelHref}}" onClick="{{cancelGo}}" style="display: flex; align-items: center; min-height: 54px; text-decoration: none; font-size: 15px; color: {{cancelC}}">{{cancelT}}</a>')
    b = "return { monthly: !y,"; assert s.count(b) == 1, n
    s = s.replace(b, "return { cancelT: sub.cancelled ? 'Keep Plus' : 'Cancel Plus', cancelC: sub.cancelled ? '#047857' : '#B9473F', cancelHref: sub.cancelled ? '#' : 'CancelPlanNavy.dc.html', cancelGo: (e) => { if (!sub.cancelled) return; e.preventDefault(); P.resume(); this.setState({ n: Date.now() }); }, monthly: !y,")
    wr(n, s); print('patched', n)

# 8. Delete account: an active Plus plan must be cancelled first (the row already says so); payment records are kept.
for n in ('DeleteAccountNavy', 'DeleteAccountLaptopNavy'):
    patch(n, [("ok = this.state.v.trim() === 'DELETE', sub = F ? F.billing().sub : {};", "sub = F ? F.billing().sub : {}, active = !!F && F.plan() === 'plus' && !sub.cancelled, ok = this.state.v.trim() === 'DELETE' && !active; /* cancel-first */"),
              ("plusLine: sub.plan === 'plus' && sub.renewsOn ? 'Cancel first; you keep it until '", "plusLine: sub.plan === 'plus' && sub.cancelled && sub.renewsOn ? 'Plus ends ' + new Date(sub.renewsOn + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : sub.plan === 'plus' && sub.renewsOn ? 'Cancel first; you keep it until '"),
              ("try { Object.keys(localStorage)", "try { const paid = F.billing().orders.filter((o) => o.status === 'confirmedSuccess'); if (paid.length) localStorage.setItem('finvora.records.v1', JSON.stringify(paid)); Object.keys(localStorage)")], mark='/* cancel-first */')
print('done')

# 9. Leave lesson: the count is the lesson in progress, not the drawn "3 of 5" (owner, 16 Nov 2026).
for n in ('LeaveLessonNavy', 'LeaveLessonLaptopNavy'):
    t = rd(n)
    if '{{answered}}' in t: continue
    t = t.replace('You have answered 3 of 5. Your progress in this lesson will not be saved.', 'You have answered {{answered}}. Your progress in this lesson will not be saved.', 1)
    t = t.replace('class Component extends DCLogic { renderVals() { return {}; } }', "class Component extends DCLogic {\n  renderVals() { const F = window.FV; let n = 0, tot = 0; try { const r = F.get().run || {}; n = Object.keys(r.answers || {}).length; tot = +F.flowVals('info').fTotal - 1; } catch (e) {}\n    return { answered: n + ' of ' + Math.max(n, tot || n) }; }\n}", 1)
    assert '{{answered}}' in t and "answered: n + ' of '" in t, n
    wr(n, t); print('live count on', n)
