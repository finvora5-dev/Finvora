"""Wire the navy admin console, part 2: Overview counts, AI summary approvals, Finvora AI review, the audit log,
the guide editor's Publish, Question builder Save, the phone task list and task, and the staff guard on every
admin page. Items, wording and figures are the canvas's own; actions change their status and write to the audit
log (FV.ADMIN.log). Usage: python3 wire_navy_admin2.py <site folder>"""
import os, re, sys
sys.argv = sys.argv[:2]
from wire_navy_admin import rd, wr, sub1, logic, staff_side, GUARD, STAFF
MARK = '/* navy-admin2 */'
# Decisions kept in localStorage fv.admin.navy: { sum: {Zenith: 'Approved'}, rev: {0: 'Reviewed'}, pub: {}, q: n }
ST = "const N = (() => { try { return JSON.parse(localStorage.getItem('fv.admin.navy') || '{}'); } catch (e) { return {}; } })(), NS = (n) => { try { localStorage.setItem('fv.admin.navy', JSON.stringify(n)); } catch (e) {} };"
COUNTS = ST + " const sumLeft = 4 - Object.keys(N.sum || {}).length, flagLeft = 2 - Object.keys(N.rev || {}).length, unread = 12 + (window.FV ? window.FV.ADMIN.inbox().filter((x) => !x.done).length : 0);"
def done(s): return MARK in s
def plain(name, extra=''):
    s = rd(name)
    if done(s): return
    s = staff_side(s)
    s = logic(s, MARK + '\n' + GUARD + '  renderVals() {\n    ' + STAFF + '\n    return { sName, sIni };\n  }')
    wr(name, s)

# Overview: needs-attention counts follow the decisions made in the console.
s = rd('AdminOverviewNavy')
if not done(s):
    s = staff_side(s)
    for lab, k in [('AI summaries to approve', 'sumLeft'), ('Finvora AI answers flagged', 'flagLeft'), ('Feedback unread', 'unread')]:
        s = re.sub('(' + re.escape(lab) + r'</span><span[^>]*>)\d+<', r'\1{{' + k + '}}<', s, count=1)
    s = logic(s, MARK + '\n' + GUARD + '  renderVals() {\n    ' + STAFF + '\n    ' + COUNTS + "\n    return { sName, sIni, sumLeft: String(sumLeft), flagLeft: String(flagLeft + 1), unread: String(unread) };\n  }")
    wr('AdminOverviewNavy', s)

# AI summaries: the Zenith summary shown is approved or rejected; its status pill updates.
s = rd('AdminAISummariesNavy')
if not done(s):
    s = staff_side(s)
    s = re.sub(r'(Zenith Bank</strong>.*?<span style=")([^"]*)(">)Waiting<', lambda m: m.group(1) + m.group(2) + '; background: {{zBg}}; color: {{zFg}}' + m.group(3) + '{{zSt}}<', s, count=1, flags=re.S)
    for t, h in [('Reject', 'rej'), ('Approve', 'ok')]:
        s = re.sub(r'<a href="#"([^>]*)>' + t + '</a>', '<a href="#" onClick="{{' + h + '}}" aria-disabled="{{zDone}}"\\1>' + t + '</a>', s, count=1)
    s = logic(s, MARK + '\n  constructor(p) { super(p); this.state = { n: 0 }; }\n' + GUARD + '  renderVals() {\n    ' + STAFF + '\n    ' + ST + '''
    const z = (N.sum || {}).Zenith, act = (d) => (e) => { e.preventDefault(); if (z) return; N.sum = Object.assign({}, N.sum, { Zenith: d }); NS(N); if (window.FV) window.FV.ADMIN.log('AI summaries', d + ' AI summary: Zenith Bank FY2024'); this.setState({ n: this.state.n + 1 }); };
    return { sName, sIni, zSt: z || 'Waiting', zBg: z === 'Approved' ? '#DDF3E6' : z === 'Rejected' ? '#FCEDEB' : '#E8EBEF', zFg: z === 'Approved' ? '#047857' : z === 'Rejected' ? '#B9473F' : '#334155', zDone: String(!!z), ok: act('Approved'), rej: act('Rejected') };
  }''')
    wr('AdminAISummariesNavy', s)

# Finvora AI review: "Mark fine" moves the open answer (MTN) from Flagged to Reviewed.
s = rd('AdminAIReviewNavy')
if not done(s):
    s = staff_side(s)
    s = re.sub(r'(Should I buy MTN shares now\?</span>.*?<span style=")([^"]*)(">)Flagged<', lambda m: m.group(1) + m.group(2) + '; background: {{mBg}}; color: {{mFg}}' + m.group(3) + '{{mSt}}<', s, count=1, flags=re.S)
    s = re.sub(r'<a href="#"([^>]*)>Mark fine</a>', r'<a href="#" onClick="{{fine}}" aria-disabled="{{mDone}}"\1>Mark fine</a>', s, count=1)
    s = logic(s, MARK + '\n  constructor(p) { super(p); this.state = { n: 0 }; }\n' + GUARD + '  renderVals() {\n    ' + STAFF + '\n    ' + ST + '''
    const r = (N.rev || {})[0];
    return { sName, sIni, mSt: r ? 'Reviewed' : 'Flagged', mBg: r ? '#E8EBEF' : '#FCEDEB', mFg: r ? '#334155' : '#B9473F', mDone: String(!!r),
      fine: (e) => { e.preventDefault(); if (r) return; N.rev = Object.assign({}, N.rev, { 0: 'Reviewed' }); NS(N); if (window.FV) window.FV.ADMIN.log('Finvora AI review', 'Marked fine: Should I buy MTN shares now?'); this.setState({ n: this.state.n + 1 }); } };
  }''')
    wr('AdminAIReviewNavy', s)

# Audit log: this browser's admin actions above the drawn history.
s = rd('AdminAuditNavy')
if not done(s):
    s = staff_side(s)
    m = re.search(r'<div style="([^"]*border-top[^"]*)"><span style="text-align: left"><span style="([^"]*)">10:42:18</span></span><span style="text-align: left">Chidi</span><span style="text-align: left">Saved draft</span><span style="text-align: left"><span style="([^"]*)">guide/treasury-bills</span></span></div>', s)
    if not m: raise SystemExit('audit row not found')
    row = '<sc-for list="{{rows}}" as="r" hint-placeholder-count="1"><div style="' + m.group(1) + '"><span style="text-align: left"><span style="' + m.group(2) + '">{{r.t}}</span></span><span style="text-align: left">{{r.who}}</span><span style="text-align: left; overflow-wrap: anywhere">{{r.act}}</span><span style="text-align: left"><span class="fv-clamp" title="{{r.tg}}" style="' + m.group(3) + '; overflow-wrap: anywhere">{{r.tg}}</span></span></div></sc-for>'
    s = s[:m.start()] + row + s[m.start():]
    s = logic(s, MARK + '\n' + GUARD + '  renderVals() {\n    ' + STAFF + '''
    const rows = (window.FV ? window.FV.ADMIN.audit() : []).map((a) => { const w = String(a.what), i = w.indexOf(': ');
      return { t: a.when, who: a.who === 'You (admin)' ? sName.split(' ')[0] : a.who, act: i > 0 ? w.slice(0, i) : w, tg: i > 0 ? w.slice(i + 2) : a.area }; });
    return { sName, sIni, rows };
  }''')
    wr('AdminAuditNavy', s)

# Editor: Publish records the guide as published; Content shows the new status.
s = rd('AdminEditorNavy')
if not done(s):
    s = staff_side(s)
    s = sub1(s, '>Draft · autosaved 10:42</p>', '>{{stat}}</p>')
    s = sub1(s, '<a href="AdminContentNavy.dc.html" style="height: 44px; padding: 0 18px; border-radius: 10px; background: #0B192C;', '<a href="AdminContentNavy.dc.html" onClick="{{pub}}" style="height: 44px; padding: 0 18px; border-radius: 10px; background: #0B192C;')
    s = logic(s, MARK + '\n' + GUARD + '  renderVals() {\n    ' + STAFF + '\n    ' + ST + '''
    return { sName, sIni, stat: (N.pub || {}).tbills ? 'Published' : 'Draft · autosaved 10:42',
      pub: () => { N.pub = Object.assign({}, N.pub, { tbills: 1 }); NS(N); if (window.FV) window.FV.ADMIN.log('Content', 'Published: Treasury bills'); } };
  }''')
    wr('AdminEditorNavy', s)
s = rd('AdminContentNavy')
if not done(s):
    s = staff_side(s)
    s = re.sub(r'(Treasury bills</span>.*?<span style=")([^"]*)(">)Draft<', lambda m: m.group(1) + m.group(2) + '; background: {{tBg}}; color: {{tFg}}' + m.group(3) + '{{tSt}}<', s, count=1, flags=re.S)
    s = s.replace('>Today, Chidi<', '>Today, {{sFirst}}<', 1)
    s = logic(s, MARK + '\n' + GUARD + '  renderVals() {\n    ' + STAFF + '\n    ' + ST + '''
    const p = (N.pub || {}).tbills;
    return { sName, sIni, sFirst: sName.split(' ')[0], tSt: p ? 'Published' : 'Draft', tBg: p ? '#DDF3E6' : '#E8EBEF', tFg: p ? '#047857' : '#334155' };
  }''')
    wr('AdminContentNavy', s)

# Question builder: Save writes to the audit log and confirms on the button.
s = rd('AdminQuestionsNavy')
if not done(s):
    s = staff_side(s)
    s = re.sub(r'<a href="[^"]*"([^>]*)>Save question</a>', r'<a href="#" onClick="{{save}}"\1>{{saveT}}</a>', s, count=1)
    s = re.sub(r'<button([^>]*)>Save question</button>', r'<button type="button" onClick="{{save}}"\1>{{saveT}}</button>', s, count=1)
    s = logic(s, MARK + '\n  constructor(p) { super(p); this.state = { saved: false }; }\n' + GUARD + '  renderVals() {\n    ' + STAFF + '''
    return { sName, sIni, saveT: this.state.saved ? 'Saved' : 'Save question', save: (e) => { e.preventDefault(); if (window.FV) window.FV.ADMIN.log('Questions', 'Saved: Money Foundations, Budgeting, question 3'); this.setState({ saved: true }); } };
  }''')
    wr('AdminQuestionsNavy', s)

# Phone: task counts follow decisions; the Zenith task approves or rejects.
s = rd('AdminPhoneTasksNavy')
if not done(s):
    for lab, k in [('Waiting for approval', 'sumLeft'), ('Learners flagged', 'flagLeft')]:
        s = re.sub('(' + re.escape(lab) + r'</span></span><span[^>]*>)\d+<', r'\1{{' + k + '}}<', s, count=1)
    s = logic(s, MARK + '\n' + GUARD + '  renderVals() {\n    ' + COUNTS + "\n    return { sumLeft: String(sumLeft), flagLeft: String(flagLeft + 1) };\n  }")
    wr('AdminPhoneTasksNavy', s)
s = rd('AdminPhoneTaskNavy')
if not done(s):
    for t, d in [('Reject', 'rej'), ('Approve', 'ok')]:
        s = re.sub(r'<a href="AdminPhoneTasksNavy\.dc\.html"([^>]*)>' + t + '</a>', '<a href="AdminPhoneTasksNavy.dc.html" onClick="{{' + d + '}}"\\1>' + t + '</a>', s, count=1)
    s = logic(s, MARK + '\n' + GUARD + '  renderVals() {\n    ' + ST + '''
    const act = (d) => () => { if ((N.sum || {}).Zenith) return; N.sum = Object.assign({}, N.sum, { Zenith: d }); NS(N); if (window.FV) window.FV.ADMIN.log('AI summaries', d + ' AI summary: Zenith Bank FY2024'); };
    return { ok: act('Approved'), rej: act('Rejected') };
  }''')
    wr('AdminPhoneTaskNavy', s)

for n in ['AdminPlansNavy', 'AdminUsersNavy', 'AdminEmptyInboxNavy', 'AdminEmptyReviewNavy']: plain(n)
print('admin part 2 wired')
