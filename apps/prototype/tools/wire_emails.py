"""Wire the Welcome screen and the two emails (sign-in code and Plus receipt) to window.FV, and link
to the emails from the code screen and checkout success. The emails open as in-app previews: no
email is sent. Usage: python3 wire_emails.py <site folder>"""
import sys, os
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing in board: ' + a[:90])
    return s.replace(a, b, 1)
def logic(s, code):
    i = s.index('class Component extends DCLogic'); j = s.index('</script>', i)
    return s[:i] + code.strip() + '\n' + s[j:]
BAR = '<div style="padding: 0 16px; display: flex; align-items: center; gap: 8px; font-size: 14px; background: #FFFFFF; border-bottom: 1.5px solid #E7E2F0"><a href="{{back}}" class="press" style="min-height: 48px; display: flex; align-items: center; gap: 6px; font-weight: 700; text-decoration: none; color: #4C1D95"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>{{backLabel}}</a><span class="muted" style="margin-left: auto">Email preview. No email was sent.</span></div>'
ROOT = 'flex-direction: column; position: relative">\n  <div style="background: #F5F3F8;'
for n in ['UREmailCode', 'UREmailReceipt']:
    s = rd(n)
    if 'data-fv-fluid' not in s: wr(n, sub1(s, '<div class="root" style="width: 640px;', '<div class="root" data-fv-fluid style="width: 640px;'))

s = rd('UREmailCode')
if '{{code}}' not in s:
    s = sub1(s, ROOT, 'flex-direction: column; position: relative">\n  ' + BAR + '\n  <div style="background: #F5F3F8;')
    s = sub1(s, 'From: Finvora &lt;hello@finvora.app&gt; · Subject: <strong style="color: #0E0B14">Your Finvora code: 482193</strong>', 'From: Finvora &lt;hello@finvora.app&gt; · To: {{to}}<br>Subject: <strong style="color: #0E0B14">Your Finvora code: {{code}}</strong>')
    s = sub1(s, 'color: #4C1D95">482193</div>', 'color: #4C1D95">{{code}}</div>')
    s = logic(s, '''class Component extends DCLogic {
  renderVals() {
    const A = window.FV && window.FV.AUTH, a = A ? A.get() : {};
    return { to: a.pending || a.email || 'you', code: (A && A.code()) || '482193', back: a.email && !a.pending ? 'UPMe.dc.html' : 'UPSignInCode.dc.html', backLabel: 'Back to the code screen' };
  }
}''')
    wr('UREmailCode', s)

s = rd('UREmailReceipt')
if '{{orderNo}}' not in s:
    s = sub1(s, ROOT, 'flex-direction: column; position: relative">\n  ' + BAR + '\n  <div style="background: #F5F3F8;')
    s = sub1(s, 'Finvora Plus, monthly</td>', 'Finvora Plus, {{period}}</td>')
    s = sub1(s, '>FV-24117</td>', '>{{orderNo}}</td>')
    s = sub1(s, '>2 Nov 2026 · Card ending 4081</td>', '>{{paid}} · Paystack</td>')
    s = sub1(s, 'font-size: 20px">₦1,500.00</td>', 'font-size: 20px">{{total}}</td>')
    s = sub1(s, 'Renews 2 Dec 2026. Cancel any time', '{{renews}} Cancel any time')
    s = logic(s, '''class Component extends DCLogic {
  renderVals() {
    const FV = window.FV, P = FV && FV.PAY, D = window.FVD;
    const orders = FV ? FV.billing().orders : [], o = (P && P.current()) || orders.filter((x) => x.status === 'confirmedSuccess')[0];
    if (!o || !P || !D) return { period: 'monthly', orderNo: 'FV-24117', paid: '2 Nov 2026', total: '₦1,500.00', renews: 'Renews 2 Dec 2026.', back: 'USYourPlan.dc.html', backLabel: 'Back to your plan' };
    const day = (o.updatedAt || o.createdAt).slice(0, 10), sub = FV.billing().sub || {};
    return { period: o.period, orderNo: P.orderNo(o), paid: P.date(day), total: D.formatNaira(o.amountKobo), renews: sub.cancelled ? 'Plus ends on ' + P.date(sub.renewsOn) + '.' : 'Renews ' + P.date(D.addPeriod(day, o.period)) + '.', back: 'USYourPlan.dc.html', backLabel: 'Back to your plan' };
  }
}''')
    wr('UREmailReceipt', s)

# Code screen: open the email.
for n in ['UPSignInCode', 'UDyPSignInCode']:
    s = rd(n)
    if 'UREmailCode' not in s:
        s = sub1(s, '<span class="muted">Didn\'t get it? Check spam.</span>', '<span class="muted">Didn\'t get it? Check spam, or <a href="UREmailCode.dc.html" style="font-weight: 700">open the email</a>.</span>')
        wr(n, s)

# Checkout success: the receipt row opens the receipt email.
for n in ['USCheckSuccess', 'UDySCheckSuccess']:
    s = rd(n)
    if 'UREmailReceipt' not in s:
        old = '<span class="muted">Receipt</span><span class="num" style="font-weight: 700">{{orderNo}}</span></div>'
        i = s.index(old); j = s.rfind('<div', 0, i)
        div = s[j:s.index('>', j) + 1]
        a = div.replace('<div', '<a href="{{receiptHref}}" class="press"', 1).replace('display: flex', 'text-decoration: none; color: #0E0B14; min-height: 48px; box-sizing: border-box; align-items: center; display: flex', 1)
        s = s[:j] + a + '<span class="muted">Receipt</span><span style="display: flex; gap: 10px; align-items: center"><span class="num" style="font-weight: 700">{{orderNo}}</span><span style="color: #4C1D95; font-weight: 700">View email</span></span></a>' + s[i + len(old):]
        s = s.replace('orderNo: ', "receiptHref: 'UREmailReceipt.dc.html' + location.search, orderNo: ", 1)
        wr(n, s)

# Welcome: someone already signed in can carry on where they were.
for n in ['UPOnbWelcome', 'UDWelcome']:
    s = rd(n)
    if '{{other}}' not in s:
        s = sub1(s, '<a href="UPSignIn.dc.html" class="btn btn-o">I already have an account</a>', '<a href="{{otherHref}}" class="btn btn-o">{{other}}</a>')
        s = logic(s, '''class Component extends DCLogic {
  renderVals() {
    const A = window.FV && window.FV.AUTH, a = A ? A.get() : {};
    return a.email ? { other: 'Continue as ' + (a.name || a.email), otherHref: 'UOHome.dc.html' } : { other: 'I already have an account', otherHref: 'UPSignIn.dc.html' };
  }
}''')
        wr(n, s)
for n in ['UREmailCode', 'UREmailReceipt']:
    s = rd(n); wr(n, s.replace('padding: 24px; min-height: 760px;', 'padding: 24px; min-height: max(760px, 100vh);').replace('color: #615A6E; margin-bottom: 10px">From:', 'color: #615A6E; max-width: 560px; margin: 0 auto 10px">From:'))
print('emails and welcome wired')
