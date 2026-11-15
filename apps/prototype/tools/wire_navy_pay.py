"""Wire Plus and the simulated checkout to window.FV.PAY (build-backlog §B5, build plan §4.7):
pending, confirmed success, confirmed failed; only the simulated server check moves an order out of pending;
a failed response never marks it failed; retries reuse the same order; no retry while pending.
Reviewers pick the next result with ?outcome=failed|slow|offline on the Plus page (earlier prototype).
Usage: python3 wire_navy_pay.py <site folder>"""
import os, re, sys
SITE = sys.argv[1]
def path(n): return os.path.join(SITE, n)
def rd(n): return open(path(n + '.dc.html')).read()
def wr(n, s): open(path(n + '.dc.html'), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing in board: ' + a[:120])
    return s.replace(a, b, 1)
def logic(s, js):
    a = s.index('class Component extends DCLogic'); b = s.index('</script>', a)
    return s[:a] + 'class Component extends DCLogic {\n' + js + '\n}\n' + s[b:]
MARK = '/* navy-pay */'
H = '''  P() { return window.FV && window.FV.PAY; }
  o() { const P = this.P(); return P ? P.current() : null; }
  oid() { const m = /[?&]o=([\\w-]+)/.exec(location.search); return m ? m[1] : ''; }
  n(k) { return '₦' + (k / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 }); }
  d(day) { return day ? new Date(day + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }
  base() { const P = this.P(), o = this.o(); if (!P || !o) return { amt: '₦5,999', planName: 'Plus monthly', orderNo: 'FV-24117' };
    return { amt: this.n(o.amountKobo), planName: 'Plus ' + o.period, orderNo: P.orderNo(o) }; }
'''
def details(s):
    s = re.sub(r'>₦5,999<', '>{{amt}}<', s, count=1)
    s = s.replace('>Plus monthly<', '>{{planName}}<', 1)
    s = s.replace('>FV-24117<', '>{{orderNo}}<', 1)
    return s

# Plus: the plan choice starts (or resumes) one order.
s = rd('PlusNavy')
if MARK not in s:
    s = sub1(s, '<a href="#" style="height: 52px;', '<a href="#" onClick="{{pay}}" style="height: 52px;')
    s = sub1(s, "  renderVals() {\n    const P = [['Monthly'", "  renderVals() {\n    const pay = (e) => { e.preventDefault(); const PAY = window.FV && window.FV.PAY; if (!PAY) return; const r = PAY.start(this.state.g === 1 ? 'yearly' : 'monthly');\n      if (r.ok) location.href = 'PayPendingNavy.dc.html?o=' + r.orderId; else if (r.reason === 'pending') location.href = 'PayPendingNavy.dc.html?o=' + r.orderId; else location.href = 'YourPlanNavy.dc.html'; };\n    const P = [['Monthly'")
    s = sub1(s, "    return {\n      f:", "    return { pay,\n      f:")
    s = sub1(s, "  constructor(p) { super(p); this.state = { g: 1 }; }", "  constructor(p) { super(p); this.state = { g: 1 }; if (window.FV && window.FV.PAY) window.FV.PAY.remember(); }")
    s = s.replace('class Component extends DCLogic {', 'class Component extends DCLogic {\n' + MARK, 1)
    wr('PlusNavy', s)

# Pending: our server checks with Paystack (simulated), then shows the confirmed result.
s = rd('PayPendingNavy')
if MARK not in s:
    s = details(s)
    s = logic(s, MARK + '\n' + H + '''  componentDidMount() {
    const P = this.P(), o = this.o(); if (!P || !o) return;
    if (o.status === 'confirmedSuccess') { location.replace('PayAlreadyNavy.dc.html?o=' + o.id); return; }
    if (o.status === 'confirmedFailed') { location.replace('PayFailedNavy.dc.html?o=' + o.id); return; }
    this.t = setTimeout(() => { const r = P.check(o.id, /[?&]again=1/.test(location.search)); if (!r) return;
      if (r.offline) location.replace('PayOfflineNavy.dc.html?o=' + o.id);
      else if (r.order.status === 'confirmedSuccess') location.replace('PaySuccessNavy.dc.html?o=' + o.id);
      else if (r.order.status === 'confirmedFailed') location.replace('PayFailedNavy.dc.html?o=' + o.id);
      else location.replace('PaySlowNavy.dc.html?o=' + o.id); }, 1800);
  }
  componentWillUnmount() { clearTimeout(this.t); }
  renderVals() { return this.base(); }''')
    wr('PayPendingNavy', s)

# Slow, offline: check again without paying again.
for name in ['PaySlowNavy', 'PayOfflineNavy']:
    s = rd(name)
    if MARK in s: continue
    s = details(s)
    s = s.replace('href="PayPendingNavy.dc.html"', 'href="PayPendingNavy.dc.html?o={{oid}}&again=1"')
    s = logic(s, MARK + '\n' + H + "  renderVals() { return Object.assign(this.base(), { oid: this.oid() }); }")
    wr(name, s)

# Failed: a retry is a new attempt on the same order.
s = rd('PayFailedNavy')
if MARK not in s:
    s = details(s)
    s = s.replace('Retries order FV-24117.', 'Retries order {{orderNo}}.')
    s = re.sub(r'<a href="PlusNavy\.dc\.html"', '<a href="#" onClick="{{retry}}"', s)
    s = re.sub(r'<a href="#"((?:(?!</a>).)*?>Try again</a>)', r'<a href="#" onClick="{{retry}}"\1', s, count=1, flags=re.S)
    s = re.sub(r'<button((?:(?!</button>).)*?>Try again</button>)', r'<button type="button" onClick="{{retry}}"\1', s, count=1, flags=re.S)
    s = re.sub(r'<button((?:(?!</button>).)*?>Use another card</button>)', r'<button type="button" onClick="{{retry}}"\1', s, count=1, flags=re.S)
    s = logic(s, MARK + '\n' + H + "  renderVals() { return Object.assign(this.base(), { retry: (e) => { e.preventDefault(); const P = this.P(), o = this.o(); if (!P || !o) return; P.retry(o.id); location.href = 'PayPendingNavy.dc.html?o=' + o.id; } }); }")
    wr('PayFailedNavy', s)

# Confirmed, already paid
s = rd('PaySuccessNavy')
if MARK not in s:
    s = details(s)
    s = s.replace('A receipt is on its way to ada@example.com.', 'A receipt is on its way to {{email}}.').replace('>10 Dec 2026<', '>{{renews}}<', 1)
    s = logic(s, MARK + '\n' + H + "  renderVals() { const F = window.FV, a = F ? F.AUTH.get() : {}, b = F ? F.billing() : { sub: {} }; return Object.assign(this.base(), { email: a.email || 'your email', renews: this.d(b.sub.renewsOn) }); }")
    wr('PaySuccessNavy', s)
s = rd('PayAlreadyNavy')
if MARK not in s:
    s = details(s); s = s.replace('Order FV-24117 was confirmed earlier', 'Order {{orderNo}} was confirmed earlier')
    s = logic(s, MARK + '\n' + H + "  renderVals() { return this.base(); }")
    wr('PayAlreadyNavy', s)

# Your plan, cancel, receipt
s = rd('YourPlanNavy')
if MARK not in s:
    s = sub1(s, '>Monthly<', '>{{per}}<'); s = sub1(s, '>₦5,999 a month<', '>{{priceLine}}<'); s = sub1(s, '>Renews 10 December 2026<', '>{{renewLine}}<')
    a = s.index('>Payments</h2>') + len('>Payments</h2>'); b = s.index('</section>', a)
    r0 = re.search(r'<a href="#".*?</a>', s[a:b], flags=re.S).group(0)
    t = r0.replace('>10 Nov 2026<', '>{{x.d}}<').replace('>Card ending 4081 · FV-24117<', '>{{x.no}}<').replace('>₦5,999<', '>{{x.amt}}<')
    s = s[:a] + '<sc-for list="{{pays}}" as="x" hint-placeholder-count="2">' + t + '</sc-for>' + s[b:]
    i = s.index('<a href="#" style="display: flex; align-items: center; gap: 12px; min-height: 54px; border-bottom: 1px solid #EDEFF2; text-decoration: none"><span style="flex: 1; display: flex; flex-direction: column; gap: 1px"><span style="font-size: 15px; font-weight: 500">Switch to yearly</span>'); j = s.index('</a>', i) + 4
    s = s[:i] + '<sc-if value="{{monthly}}" hint-placeholder-val="{{ true }}">' + s[i:j] + '</sc-if>' + s[j:]
    s = logic(s, MARK + '\n' + H + '''  constructor(p) { super(p); const F = window.FV; if (F && F.billing().sub.plan !== 'plus') location.replace('PlusNavy.dc.html'); }
  renderVals() {
    const F = window.FV, P = this.P(); if (!F || !P) return { pays: [] }; const b = F.billing(), sub = b.sub, y = sub.period === 'yearly';
    return { monthly: !y, per: y ? 'Yearly' : 'Monthly', priceLine: y ? this.n(P.PRICE.yearly) + ' a year' : this.n(P.PRICE.monthly) + ' a month', renewLine: (sub.cancelled ? 'Plus ends ' : 'Renews ') + new Date((sub.renewsOn || '') + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      pays: b.orders.filter((o) => o.status === 'confirmedSuccess').map((o) => ({ d: new Date(o.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), no: P.orderNo(o), amt: this.n(o.amountKobo) })) };
  }''')
    wr('YourPlanNavy', s)
s = rd('CancelPlanNavy')
if MARK not in s:
    s = sub1(s, '>Plus monthly · ₦5,999<', '>{{line}}<'); s = sub1(s, 'You keep Plus until 10 December 2026.', 'You keep Plus until {{until}}.')
    s = re.sub(r'<a href="YourPlanNavy\.dc\.html"((?:(?!</a>).)*?>Cancel Plus</a>)', r'<a href="YourPlanNavy.dc.html" onClick="{{cancel}}"\1', s, count=1, flags=re.S)
    s = logic(s, MARK + '\n' + H + "  renderVals() { const F = window.FV, P = this.P(); if (!F || !P) return {}; const sub = F.billing().sub, y = sub.period === 'yearly'; return { line: 'Plus ' + (y ? 'yearly' : 'monthly') + ' · ' + this.n(y ? P.PRICE.yearly : P.PRICE.monthly), until: new Date((sub.renewsOn || '') + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), cancel: () => P.cancel() }; }")
    wr('CancelPlanNavy', s)
s = rd('ReceiptNavy')
if MARK not in s:
    for old, new in [('>Thanks, Ada<', '>Thanks, {{name}}<'), ('>Plus monthly<', '>{{planName}}<'), ('>₦5,999.00<', '>{{amt}}<'), ('>FV-24117<', '>{{orderNo}}<'), ('>10 Nov 2026<', '>{{paid}}<'), ('>10 Dec 2026<', '>{{next}}<')]:
        s = sub1(s, old, new)
    s = logic(s, MARK + '\n' + H + '''  renderVals() {
    const F = window.FV, P = this.P(); if (!F || !P) return {}; const b = F.billing(), o = b.orders.filter((x) => x.status === 'confirmedSuccess')[0], a = F.AUTH.get();
    if (!o) return { name: a.name || 'Ada', planName: 'Plus monthly', amt: '₦5,999.00', orderNo: 'FV-24117', paid: '', next: '' };
    return { name: a.name || 'there', planName: 'Plus ' + o.period, amt: '₦' + (o.amountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 }), orderNo: P.orderNo(o), paid: new Date(o.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), next: this.d(b.sub.renewsOn) };
  }''')
    wr('ReceiptNavy', s)
print('wired')
