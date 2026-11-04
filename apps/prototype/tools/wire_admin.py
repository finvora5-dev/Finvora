"""Wire the feedback prompts, feedback forms and the admin feedback settings, inbox and audit log
to window.FV.ADMIN (a demonstration kept in this browser). Usage: python3 wire_admin.py <site folder>"""
import re, sys, os
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing in board: ' + a[:90])
    return s.replace(a, b, 1)
FB = "(this.props.feedback || 'on') === 'on'"
# Prompts in the app follow the admin settings.
for n, key in [('UPArticle', "on('report')"), ('UPLibrary', "on('suggest')"), ('UPEmptySearch', "on('suggest')"), ('UPMe', "on('suggest')"), ('UPLessonComplete', 'showRate()')]:
    s = rd(n)
    if 'window.FV.ADMIN' not in s:
        if FB not in s: raise SystemExit('no feedback switch in ' + n)
        s = s.replace(FB, FB + ' && (!window.FV || !window.FV.ADMIN || window.FV.ADMIN.%s)' % key)
        wr(n, s)
# Forms send to the admin inbox.
for n, old, new in [
    ('UFReport', "send: () => { if (s.pick !== null) this.setState({ sent: true }); }", "send: () => { if (s.pick !== null) { if (window.FV && window.FV.ADMIN) window.FV.ADMIN.submit('Report', window.FV.LIB ? window.FV.LIB.current().title : 'Article', R[s.pick][0]); this.setState({ sent: true }); } }"),
    ('UFSuggest', "send: () => this.setState({ sent: true })", "send: () => { if (window.FV && window.FV.ADMIN) window.FV.ADMIN.submit('Suggest', 'Library', P[s.pick] || 'A topic'); this.setState({ sent: true }); }"),
    ('UFRate', "send: () => { if (s.r) this.setState({ sent: true }); }", "send: () => { if (s.r) { if (window.FV && window.FV.ADMIN) window.FV.ADMIN.submit('Rate ' + s.r + '\\u2605', 'Lesson', (s.tags || []).map((i) => T[i]).join(', ') || words[s.r]); this.setState({ sent: true }); } }")]:
    s = rd(n)
    if 'ADMIN.submit' not in s: wr(n, sub1(s, old, new))
# Admin feedback settings: saved, and every change goes to the audit log.
s = rd('UAFeedbackSettings')
if 'window.FV.ADMIN' not in s:
    s = sub1(s, "constructor(p) { super(p); this.state = { on: { rate: true, report: true, suggest: true, review: true }, sel: 'rate', n: 3, log: [",
        "constructor(p) { super(p); const A = window.FV && window.FV.ADMIN, st = A ? A.settings() : null; this.state = { on: st ? Object.assign({}, st.on) : { rate: true, report: true, suggest: true, review: true }, sel: 'rate', n: st ? st.n : 3, log: (A ? A.audit().filter((x) => x.area === 'Feedback settings').map((x) => ({ when: x.when, who: x.who, what: x.what })) : []).concat([")
    s = sub1(s, "{ when: '14 Oct, 16:15', who: 'Tobi O.', what: 'Suggest a topic added to Me' }] }; }", "{ when: '14 Oct, 16:15', who: 'Tobi O.', what: 'Suggest a topic added to Me' }]) }; }")
    s = sub1(s, "toggle: () => this.setState({", "toggle: () => { if (window.FV && window.FV.ADMIN) { window.FV.ADMIN.set(p[0], !on); window.FV.ADMIN.log('Feedback settings', p[1] + ' turned ' + (on ? 'off' : 'on')); } this.setState({")
    s = sub1(s, "what: p[1] + ' turned ' + (on ? 'off' : 'on') }].concat(s.log) }) }; }),", "what: p[1] + ' turned ' + (on ? 'off' : 'on') }].concat(s.log) }); } }; }),")
    s = sub1(s, "tap: () => on ? null : this.setState({", "tap: () => { if (on) return; if (window.FV && window.FV.ADMIN) { window.FV.ADMIN.setN(n); window.FV.ADMIN.log('Feedback settings', 'Rating prompt set to 1 in ' + n); } this.setState({")
    s = sub1(s, "what: 'Rating prompt set to 1 in ' + n }].concat(s.log) }) }; }),", "what: 'Rating prompt set to 1 in ' + n }].concat(s.log) }); } }; }),")
    s = s.replace("who: 'Tobi O.', what: p[1] + ' turned '", "who: 'You (admin)', what: p[1] + ' turned '").replace("who: 'Tobi O.', what: 'Rating prompt set to 1 in ' + n", "who: 'You (admin)', what: 'Rating prompt set to 1 in ' + n")
    wr('UAFeedbackSettings', s)
# Inbox: what learners sent in this browser, above the sample rows.
s = rd('UAFeedbackInbox')
if 'window.FV.ADMIN' not in s:
    TR = '<tr><td><span class="tag" style="background: {{r.bg}}; color: {{r.fg}}">{{r.kind}}</span></td><td style="font-weight: 700">{{r.where}}</td><td>{{r.what}}<div class="muted" style="font-size: 13px">{{r.note}}</div></td><td class="muted">{{r.ago}}</td><td><sc-if value="{{r.open}}" hint-placeholder-val="{{true}}"><button class="chip" type="button" onClick="{{r.done}}">Mark done</button></sc-if><sc-if value="{{r.closed}}" hint-placeholder-val="{{false}}"><span class="muted" style="font-size: 13px; font-weight: 700">Done</span></sc-if></td></tr>'
    s = sub1(s, '<th>When</th><th></th></tr>', '<th>When</th><th></th></tr><sc-for list="{{mine}}" as="r" hint-placeholder-count="1">' + TR + '</sc-for>')
    i = s.index('class Component extends DCLogic {'); j = s.index('</script>', i)
    s = s[:i] + '''class Component extends DCLogic {
  constructor(p) { super(p); this.state = { n: 0 }; }
  renderVals() {
    const A = window.FV && window.FV.ADMIN; if (!A) return { mine: [] };
    const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'Now' : m < 60 ? m + 'm' : m < 1440 ? Math.round(m / 60) + 'h' : Math.round(m / 1440) + 'd'; };
    const col = (k) => k === 'Report' ? ['#FFE6E6', '#B42828'] : k === 'Suggest' ? ['#F1EBFB', '#4C1D95'] : ['#F5F3F8', '#38323F'];
    return { mine: A.inbox().map((x) => ({ kind: x.kind, where: x.where, what: x.what, note: x.note, ago: ago(x.at), bg: col(x.kind)[0], fg: col(x.kind)[1], open: !x.done, closed: x.done,
      done: () => { A.markDone(x.id); A.log('Feedback inbox', 'Marked done: ' + x.kind + ' on ' + x.where); this.setState({ n: this.state.n + 1 }); } })) };
  }
}
''' + s[j:]
    wr('UAFeedbackInbox', s)
# Audit log: changes made in this browser, above the sample entries. Nothing can be edited or deleted.
s = rd('UAAudit')
if 'window.FV.ADMIN' not in s:
    s = sub1(s, '<th>Area</th><th>What changed</th></tr>', '<th>Area</th><th>What changed</th></tr><sc-for list="{{mine}}" as="r" hint-placeholder-count="1"><tr><td class="muted num">{{r.when}}</td><td style="font-weight:700">{{r.who}}</td><td><span class="tag" style="background: #F5F3F8; color: #38323F">{{r.area}}</span></td><td>{{r.what}}</td></tr></sc-for>')
    i = s.index('class Component extends DCLogic {'); j = s.index('</script>', i)
    s = s[:i] + "class Component extends DCLogic {\n  renderVals() { const A = window.FV && window.FV.ADMIN; return { mine: A ? A.audit() : [] }; }\n}\n" + s[j:]
    wr('UAAudit', s)
print('admin wired')
