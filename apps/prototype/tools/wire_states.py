"""App states: closed practice market (queue an order), and toasts after saving, cancelling, resetting,
downloading and changing settings. Run after the other wire_*.py scripts. Usage: python3 wire_states.py <site folder>"""
import re, sys, os
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
def rep(n, pairs):
    s = rd(n); changed = False
    for a, b in pairs:
        if b in s: continue
        if a not in s: raise SystemExit('missing in %s: %s' % (n, a[:80]))
        s = s.replace(a, b, 1); changed = True
    if changed: wr(n, s)
T = "window.fvToast && window.fvToast"
FL = "window.fvFlash && window.fvFlash"

# Buy and sell outside trading hours open the "market is closed" pop-up.
rep('USimTrade', [("buy: () => { if (this.state.busy) return; this.setState({ busy: true });",
    "buy: () => { if (this.state.busy) return; if (!S.isOpen()) { location.href = 'UMOrderClosed.dc.html?t=' + co.t + '&side=buy&q=' + q; return; } this.setState({ busy: true });")])
rep('USimSell', [("sell: () => { if (this.state.busy || !OWN) return; this.setState({ busy: true });",
    "sell: () => { if (this.state.busy || !OWN) return; if (!S.isOpen()) { location.href = 'UMOrderClosed.dc.html?t=' + co.t + '&side=sell&q=' + q; return; } this.setState({ busy: true });")])
s = rd('UMOrderClosed')
if 'S.queue(' not in s:
    s = s.replace('>It follows real trading hours: weekdays 10:00 to 14:30, Lagos time. Your order will be placed when it opens.</p>', '>It follows real trading hours: {{hours}}. Your order will be placed when it opens.</p>', 1)
    s = s.replace('<a href="USimDone.dc.html" class="btn">Queue my order</a>', '<button type="button" class="btn" onClick="{{queue}}" style="width: 100%; border: 0; cursor: pointer; font: inherit; font-weight: 700">Queue my order</button>', 1)
    s = s.replace('<a href="USimCompany.dc.html" style="min-height: 44px', '<a href="{{back}}" style="min-height: 44px', 1)
    a = s.index('class Component extends DCLogic {'); b = s.index('</script>', a)
    s = s[:a] + """class Component extends DCLogic {
  renderVals() {
    const S = window.FV && window.FV.SIM; if (!S) return {};
    const m = (k) => { const x = new RegExp('[?&]' + k + '=([^&]+)').exec(location.search); return x ? decodeURIComponent(x[1]) : ''; };
    const t = m('t') || 'ADF', side = m('side') === 'sell' ? 'sell' : 'buy', q = Math.max(1, +m('q') || 1), c = S.company(t);
    return { hours: S.hours(), back: 'USimCompany.dc.html?t=' + t,
      queue: () => { S.queue(side, t, q); """ + FL + """('Order queued: ' + (side === 'buy' ? 'buy ' : 'sell ') + q + ' ' + c.name + (q === 1 ? ' share' : ' shares') + '. It will be placed when the market opens.'); location.href = 'USimCompany.dc.html?t=' + t; } };
  }
}
""" + s[b:]
    wr('UMOrderClosed', s)

# Toasts.
rep('UPArticle', [("save: () => { L.toggleSave(a.slug); this.setState({ n: this.state.n + 1 }); } };",
    "save: () => { const on = L.toggleSave(a.slug); this.setState({ n: this.state.n + 1 }); " + T + "(on ? 'Saved to your Library' : 'Removed from Saved', { action: 'Undo', onAction: () => { L.toggleSave(a.slug); this.setState({ n: this.state.n + 1 }); } }); } };")])
rep('UMCancelPlan', [("cancel: () => { Pay.cancel(); location.href = 'USYourPlan.dc.html'; } };",
    "cancel: () => { Pay.cancel(); " + FL + "('Plus will end on ' + (sub.renewsOn ? Pay.date(sub.renewsOn) : 'the end of the period')); location.href = 'USYourPlan.dc.html'; } };")])
rep('URSetGoal', [("a.minutes = M[this.state.m]; localStorage.setItem('fv.auth.v1', JSON.stringify(a)); };",
    "a.minutes = M[this.state.m]; localStorage.setItem('fv.auth.v1', JSON.stringify(a)); " + FL + "('Learning goal saved'); };")])
rep('UMSimReset', [("window.FV.SIM.reset(); location.href = 'USimEmpty.dc.",
    "window.FV.SIM.reset(); " + FL + "('Practice portfolio reset. You have a fresh \\u20a6100,000.'); location.href = 'USimEmpty.dc.")])
rep('URSetPrivacy', [("setTimeout(() => URL.revokeObjectURL(url), 1000); };",
    "setTimeout(() => URL.revokeObjectURL(url), 1000); " + T + "('Downloaded your data'); };")])
rep('UPSignInCode', [("location.href = a.changing ? 'UPSettings.dc.html' :",
    "if (a.changing) " + FL + "('Email updated'); location.href = a.changing ? 'UPSettings.dc.html' :")])
print('app states wired')
