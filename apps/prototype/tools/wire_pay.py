"""Wire the plan and checkout boards to window.FV.PAY (order rules from packages/domain).
Usage: python3 wire_pay.py <site folder>"""
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
MARK = 'window.FV && window.FV.PAY'
P = "  P() { return window.FV && window.FV.PAY; }\n"

# Plans: real prices from one place, Continue goes to the confirm sheet for the chosen period.
s = rd('USPlans')
if MARK not in s:
    s = sub1(s, '<a href="USUpgrade.dc.html" class="btn">Continue with Plus</a>', '<a href="{{contHref}}" class="btn">{{contLabel}}</a>')
    s = sub1(s, '<span class="muted" style="font-size: 14px">Your current plan</span>', '<span class="muted" style="font-size: 14px">{{freeNote}}</span>')
    s = sub1(s, 'const M = 150000, Y = 1500000;', "const Pay = this.P(), M = Pay ? Pay.PRICE.monthly : 150000, Y = Pay ? Pay.PRICE.yearly : 1500000, plus = window.FV && window.FV.plan() === 'plus';")
    s = sub1(s, "pickM: () => this.setState({ y: false }),", "freeNote: plus ? 'Included in Plus' : 'Your current plan', contLabel: plus ? 'See your plan' : 'Continue with Plus', contHref: plus ? 'USYourPlan.dc.html' : 'USUpgrade.dc.html?p=' + (y ? 'yearly' : 'monthly'),\n      pickM: () => this.setState({ y: false }),")
    s = sub1(s, '  constructor(p) { super(p); this.state = { y: false }; }', P + "  constructor(p) { super(p); this.state = { y: /[?&]p=yearly/.test(location.search) }; }\n  componentDidMount() { if (this.P()) this.P().remember(); }")
    wr('USPlans', s)

# Confirm sheet: period, price, renewal date; Pay creates one order (or reuses the pending one).
s = rd('USUpgrade')
if MARK not in s:
    s = sub1(s, '<span>Finvora Plus, monthly</span><strong class="num">₦1,500</strong>', '<span>Finvora Plus, {{period}}</span><strong class="num">{{price}}</strong>')
    s = sub1(s, '<span class="muted">Renews</span><span>2 Dec 2026</span>', '<span class="muted">Renews</span><span>{{renews}}</span>')
    s = sub1(s, '<strong>Due today</strong><strong class="num">₦1,500</strong>', '<strong>Due today</strong><strong class="num">{{price}}</strong>')
    s = sub1(s, '<a href="USCheckPending.dc.html" class="btn">Pay ₦1,500</a>', '<button type="button" class="btn" onClick="{{pay}}" aria-disabled="{{busy}}" style="width: 100%; border: 0; cursor: pointer; font: inherit; font-weight: 700">Pay {{price}}</button>')
    s = sub1(s, '<a href="USPlans.dc.html" style="min-height: 44px', '<a href="{{backHref}}" style="min-height: 44px')
    s = logic(s, P + '''  constructor(p) { super(p); this.state = { busy: false }; }
  componentDidMount() { if (this.P()) this.P().remember(); }
  renderVals() {
    const Pay = this.P(); if (!Pay) return {};
    const per = /[?&]p=yearly/.test(location.search) ? 'yearly' : 'monthly', naira = window.FV.SIM.naira;
    return { period: per, price: naira(Pay.PRICE[per]), renews: Pay.date(Pay.renewsOn(per)), busy: String(this.state.busy), backHref: 'USPlans.dc.html?p=' + per,
      pay: () => {
        if (this.state.busy) return; this.setState({ busy: true });
        const r = Pay.start(per);
        if (r.ok) location.href = 'USCheckPending.dc.html?o=' + r.orderId;
        else if (r.reason === 'pending') location.href = 'USCheckPending.dc.html?o=' + r.orderId;
        else location.href = 'USCheckAlready.dc.html';
      } };
  }''')
    wr('USUpgrade', s)

ORDERJS = P + '''  ord() { const Pay = this.P(); return Pay ? Pay.current() : null; }
'''
def order_no(s):
    return s.replace('<span class="num">FV-24117</span>', '<span class="num">{{orderNo}}</span>').replace('>FV-24117<', '>{{orderNo}}<')

# Checking: our server checks with the provider, then shows the confirmed result.
s = rd('USCheckPending')
if MARK not in s:
    s = order_no(s)
    s = logic(s, ORDERJS + '''  componentDidMount() {
    const Pay = this.P(), o = this.ord(); if (!Pay) return;
    if (!o) { location.replace('USPlans.dc.html'); return; }
    if (o.status === 'confirmedSuccess') { location.replace('USCheckAlready.dc.html?o=' + o.id); return; }
    if (o.status === 'confirmedFailed') { location.replace('USCheckFailed.dc.html?o=' + o.id); return; }
    this.t = setTimeout(() => {
      const r = Pay.check(o.id, false); if (!r) return;
      const q = '?o=' + o.id;
      if (r.offline) location.replace('USCheckOffline.dc.html' + q);
      else if (r.order.status === 'confirmedSuccess') location.replace('USCheckSuccess.dc.html' + q);
      else if (r.order.status === 'confirmedFailed') location.replace('USCheckFailed.dc.html' + q);
      else location.replace('USCheckSlow.dc.html' + q);
    }, 2500);
  }
  componentWillUnmount() { clearTimeout(this.t); }
  renderVals() { const Pay = this.P(); return { orderNo: Pay ? Pay.orderNo(this.ord()) : '' }; }''')
    wr('USCheckPending', s)

# Taking longer: keeps checking on its own.
s = rd('USCheckSlow')
if MARK not in s:
    s = order_no(s)
    s = logic(s, ORDERJS + '''  componentDidMount() {
    const Pay = this.P(), o = this.ord(); if (!Pay || !o) return;
    this.t = setTimeout(() => { const r = Pay.check(o.id, true); if (r && r.order.status === 'confirmedSuccess') location.replace('USCheckSuccess.dc.html?o=' + o.id); else if (r && r.order.status === 'confirmedFailed') location.replace('USCheckFailed.dc.html?o=' + o.id); }, 6000);
  }
  componentWillUnmount() { clearTimeout(this.t); }
  renderVals() { const Pay = this.P(); return { orderNo: Pay ? Pay.orderNo(this.ord()) : '' }; }''')
    wr('USCheckSlow', s)

# Offline: Check again re-runs the check on the same order.
s = rd('USCheckOffline')
if MARK not in s:
    s = order_no(s)
    s = sub1(s, '<a href="USCheckPending.dc.html" class="btn"', '<a href="{{againHref}}" class="btn"')
    s = logic(s, ORDERJS + '''  renderVals() { const Pay = this.P(), o = this.ord(); return { orderNo: Pay ? Pay.orderNo(o) : '', againHref: 'USCheckPending.dc.html' + (o ? '?o=' + o.id : '') }; }''')
    wr('USCheckOffline', s)

# Failed: Try again is a new attempt on the same order.
s = rd('USCheckFailed')
if MARK not in s:
    s = order_no(s)
    s = sub1(s, '<a href="USCheckPending.dc.html" class="btn"', '<a href="#" onClick="{{again}}" class="btn"')
    s = logic(s, ORDERJS + '''  renderVals() {
    const Pay = this.P(), o = this.ord();
    return { orderNo: Pay ? Pay.orderNo(o) : '', again: (e) => { if (e && e.preventDefault) e.preventDefault(); if (!Pay || !o) { location.href = 'USPlans.dc.html'; return; } Pay.retry(o.id); location.href = 'USCheckPending.dc.html?o=' + o.id; } };
  }''')
    wr('USCheckFailed', s)

for n in ('USCheckSuccess', 'USCheckAlready'):
    s = rd(n)
    if MARK not in s:
        s = order_no(s)
        s = logic(s, ORDERJS + '''  renderVals() {
    const Pay = this.P(); if (!Pay) return {};
    const o = this.ord() || window.FV.billing().orders.filter((x) => x.status === 'confirmedSuccess')[0];
    return { orderNo: Pay.orderNo(o) };
  }''')
        wr(n, s)

# Your plan: the real subscription, payments and cancel state.
s = rd('USYourPlan')
if MARK not in s:
    s = sub1(s, '<strong style="font-size: 26px">Finvora Plus</strong><span class="num" style="color: #EDE9FE">₦1,500 a month · renews 2 Dec 2026</span>', '<strong style="font-size: 26px">Finvora Plus</strong><span class="num" style="color: #EDE9FE">{{headline}}</span>')
    s = sub1(s, '<span class="muted">Card ending 4081</span>', '<span class="muted">Paystack</span>')
    s = sub1(s, '<span style="flex: 1">Billing period</span><span class="muted">Monthly</span>', '<span style="flex: 1">Billing period</span><span class="muted">{{period}}</span>')
    s = sub1(s, '<a href="USPlans.dc.html" class="li press"><span style="flex: 1; font-weight: 700">Switch to yearly</span>', '<sc-if value="{{monthly}}" hint-placeholder-val="{{true}}"><a href="USPlans.dc.html?p=yearly" class="li press"><span style="flex: 1; font-weight: 700">Switch to yearly</span>')
    s = sub1(s, '>Save ₦3,000</span></a>', '>Save {{save}}</span></a></sc-if>')
    a = s.index('<div class="li"><span style="flex: 1">2 Nov 2026</span>'); b = s.index('</div>\n    </div>', s.index('2 Oct 2026')) + 6
    s = s[:a] + '<sc-for list="{{pays}}" as="x" hint-placeholder-count="1"><div class="li"><span style="flex: 1">{{x.day}}</span><span class="num" style="font-weight: 700">{{x.amt}}</span><span class="tag" style="background: #DCFAE6; color: #0F6B39">Paid</span></div></sc-for>' + s[b:]
    s = sub1(s, '<a href="UMCancelPlan.dc.html" class="btn btn-w" style="color: #B42828">Cancel Plus</a>', '<sc-if value="{{active}}" hint-placeholder-val="{{true}}"><a href="UMCancelPlan.dc.html" class="btn btn-w" style="color: #B42828">Cancel Plus</a></sc-if><sc-if value="{{cancelled}}" hint-placeholder-val="{{false}}"><button type="button" class="btn" onClick="{{resume}}" style="width: 100%; border: 0; cursor: pointer; font: inherit; font-weight: 700">Keep Plus</button></sc-if>')
    s = sub1(s, '>If you cancel, Plus stays on until 2 Dec 2026. Your progress is kept.</p>', '>{{note}}</p>')
    s = logic(s, P + '''  constructor(p) { super(p); this.state = { n: 0 }; }
  componentDidMount() { if (window.FV && window.FV.plan() !== 'plus' && /USYourPlan|UDxSYourPlan/.test(location.pathname)) location.replace('USPlans.dc.html'); }
  renderVals() {
    const Pay = this.P(); if (!Pay) return {};
    const b = window.FV.billing(), sub = b.sub, per = sub.period || 'monthly', naira = window.FV.SIM.naira, until = sub.renewsOn ? Pay.date(sub.renewsOn) : '';
    const pays = b.orders.filter((o) => o.status === 'confirmedSuccess').map((o) => ({ day: Pay.date(o.updatedAt.slice(0, 10)), amt: naira(o.amountKobo) }));
    return { headline: naira(Pay.PRICE[per]) + (per === 'yearly' ? ' a year' : ' a month') + (sub.cancelled ? ' \\u00b7 ends ' : ' \\u00b7 renews ') + until,
      period: per === 'yearly' ? 'Yearly' : 'Monthly', monthly: per === 'monthly' && !sub.cancelled, save: naira(Pay.PRICE.monthly * 12 - Pay.PRICE.yearly), pays,
      active: !sub.cancelled, cancelled: !!sub.cancelled,
      note: sub.cancelled ? 'Plus is cancelled. It stays on until ' + until + ', then you go back to Free. Your progress is kept.' : 'If you cancel, Plus stays on until ' + until + '. Your progress is kept.',
      resume: () => { Pay.resume(); this.setState({ n: this.state.n + 1 }); } };
  }''')
    wr('USYourPlan', s)

# Cancel: the real end date; cancelling keeps Plus until then.
s = rd('UMCancelPlan')
if MARK not in s:
    s = sub1(s, '>Plus stays on until 2 Dec 2026. After that you go back to Free and keep all your progress.</p>', '>Plus stays on until {{until}}. After that you go back to Free and keep all your progress.</p>')
    s = sub1(s, '<a href="UMToasts.dc.html" class="btn btn-w" style="color: #B42828">Cancel at end of period</a>', '<button type="button" onClick="{{cancel}}" class="btn btn-w" style="width: 100%; cursor: pointer; font: inherit; font-weight: 700; color: #B42828">Cancel at end of period</button>')
    s = logic(s, P + '''  renderVals() {
    const Pay = this.P(); if (!Pay) return {};
    const sub = window.FV.billing().sub;
    return { until: sub.renewsOn ? Pay.date(sub.renewsOn) : 'the end of the period', cancel: () => { Pay.cancel(); location.href = 'USYourPlan.dc.html'; } };
  }''')
    wr('UMCancelPlan', s)
print('checkout wired')
