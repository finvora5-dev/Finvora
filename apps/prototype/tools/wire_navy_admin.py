"""Wire the navy admin console, part 1: staff sign-in, the feedback inbox (learner feedback from this browser
above the drawn rows, empty state when nothing is there), feedback settings switches, the confirm dialog before
turning the app review prompt off, and the audit log entries for each change. Copy for sign-in errors comes from
the earlier approved prototype (wire_admin_more.py). Usage: python3 wire_navy_admin.py <site folder>"""
import os, re, sys
SITE = sys.argv[1]
def path(n): return os.path.join(SITE, n + '.dc.html')
def rd(n): return open(path(n)).read()
def wr(n, s): open(path(n), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing in board: ' + a[:120])
    return s.replace(a, b, 1)
def logic(s, js):
    a = s.index('class Component extends DCLogic'); b = s.index('</script>', a)
    return s[:a] + 'class Component extends DCLogic {\n' + js + '\n}\n' + s[b:]
MARK = '/* navy-admin */'
# Staff guard: every admin page but sign-in sends a signed-out visitor to sign-in.
GUARD = "  componentDidMount() { if (window.FV && !window.FV.ADMIN.staff()) location.replace('AdminSignInNavy.dc.html'); }\n"
# Sidebar name and initials come from the signed-in staff member.
def staff_side(s):
    s = s.replace('font-size: 13px; font-weight: 600">CN</span>', 'font-size: 13px; font-weight: 600">{{sIni}}</span>', 1)
    return s.replace('font-size: 14px; font-weight: 600">Chidi Nwosu</span>', 'font-size: 14px; font-weight: 600" class="fv-staff" title="{{sName}}">{{sName}}</span>', 1)
STAFF = "const st = (window.FV && window.FV.ADMIN.staff()) || { name: 'Chidi Nwosu' }; const sName = st.name, sIni = sName.split(/\\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase();"

# Sign-in
s = rd('AdminSignInNavy')
if MARK not in s:
    s = sub1(s, '<input value="chidi@finvora.ng" style="', '<input id="em" type="email" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="next" placeholder="name@finvora.ng" value="{{em}}" onInput="{{onEm}}" style="')
    s = sub1(s, '<input value="482 917" style="', '<input id="cd" inputmode="numeric" autocomplete="one-time-code" maxlength="6" enterkeyhint="go" placeholder="6 digits" value="{{cd}}" onInput="{{onCd}}" onKeyDown="{{key}}" style="')
    s = sub1(s, '<a href="AdminOverviewNavy.dc.html" style="height: 44px;', '<sc-if value="{{hasErr}}" hint-placeholder-val="{{ false }}"><p role="alert" style="margin: 0; font-size: 14px; color: #B9473F">{{err}}</p></sc-if><a href="#" onClick="{{go}}" style="height: 44px;')
    s = logic(s, MARK + '''
  constructor(p) { super(p); this.state = { em: '', cd: '', err: '' }; }
  componentDidMount() { if (window.FV && window.FV.ADMIN.staff()) location.replace('AdminOverviewNavy.dc.html'); }
  renderVals() {
    const go = (e) => { if (e) e.preventDefault(); const A = window.FV && window.FV.ADMIN; if (!A) return;
      const r = A.signIn(this.state.em, this.state.cd.replace(/\\s/g, ''));
      if (r === 'ok') { location.href = 'AdminOverviewNavy.dc.html'; return; }
      const left = A.triesLeft();
      this.setState({ cd: '', err: r === 'domain' ? 'Use your @finvora.ng work email.' : r === 'short' ? 'Enter the 6 digits from your authenticator app.' : r === 'locked' ? 'Too many wrong codes. Try again in 15 minutes.' : "That code isn't right. " + left + (left === 1 ? ' try' : ' tries') + ' left.' }); };
    return { em: this.state.em, cd: this.state.cd, err: this.state.err, hasErr: !!this.state.err,
      onEm: (e) => this.setState({ em: e.target.value, err: '' }), onCd: (e) => this.setState({ cd: e.target.value.replace(/\\D/g, '').slice(0, 6), err: '' }),
      key: (e) => { if (e.key === 'Enter') go(e); }, go };
  }''')
    wr('AdminSignInNavy', s)

# Feedback inbox
KIND = "{ rate: ['Rating', '#E8EBEF', '#334155'], report: ['Mistake', '#FCEDEB', '#B9473F'], suggest: ['Topic', '#DDF3E6', '#047857'] }"
s = rd('AdminFeedbackNavy')
if MARK not in s:
    s = staff_side(s)
    s = sub1(s, '>12 unread</p>', '>{{unread}}</p>')
    row = '<div style="display: grid; grid-template-columns: 1.1fr 0.8fr 1fr 2.4fr 0.7fr; gap: 12px; min-height: 54px; align-items: center; padding: 0 20px; border-top: 1px solid #EDEFF2; font-size: 14px">'
    a = s.index(row)
    live = (row.replace('font-size: 14px">', 'font-size: 14px; padding-block: 10px">') + '<span style="text-align: left; overflow-wrap: anywhere">{{r.from}}</span><span style="text-align: left"><span style="display: inline-flex; padding: 3px 8px; border-radius: 6px; background: {{r.bg}}; color: {{r.fg}}; font-size: 12px; font-weight: 600">{{r.type}}</span></span><span style="text-align: left; overflow-wrap: anywhere">{{r.about}}</span><span style="text-align: left"><span class="fv-clamp" title="{{r.msg}}" style="color: #334155; overflow-wrap: anywhere">{{r.msg}}</span></span><span style="text-align: left">{{r.when}}</span></div>')
    s = s[:a] + '<sc-for list="{{rows}}" as="r" hint-placeholder-count="1">' + live + '</sc-for>' + s[a:]
    s = logic(s, MARK + '\n' + GUARD + '''  renderVals() {
    ''' + STAFF + '''
    const K = ''' + KIND + ''', inb = window.FV ? window.FV.ADMIN.inbox() : [];
    const rows = inb.map((x) => { const k = K[x.kind] || ['Feedback', '#E8EBEF', '#334155'], d = new Date(x.at), today = d.toDateString() === new Date().toDateString();
      const msg = [x.what && x.kind === 'rate' ? x.what + ' of 5' : x.what, x.note].filter(Boolean).join(' · ') || 'No message';
      return { from: 'A learner (this browser)', type: k[0], bg: k[1], fg: k[2], about: String(x.where || '').replace(/ · Finvora$/, '') || 'App', msg, when: today ? d.toTimeString().slice(0, 5) : d.toLocaleDateString('en-GB', { weekday: 'short' }) }; });
    return { sName, sIni, rows, unread: (12 + inb.filter((x) => !x.done).length) + ' unread' };
  }''')
    wr('AdminFeedbackNavy', s)

# Feedback settings: four switches; the app review prompt asks first (AdminConfirmOffNavy) before it goes off.
SW = [('Ask for a lesson rating after each lesson', 'rate'), ('Show "Report a mistake" on guides', 'report'), ('Ask for an app review after 7 days', 'review'), ('Email me for new mistake reports', 'mail')]
s = rd('AdminFeedbackSettingsNavy')
if MARK not in s:
    s = staff_side(s)
    for label, k in SW:
        m = re.search(r'<span role="switch" aria-checked="(true|false)" aria-label="' + re.escape(label) + r'" style="[^"]*"><span style="[^"]*"></span></span>', s)
        if not m: raise SystemExit('missing switch: ' + label)
        sw = ('<button type="button" role="switch" class="fv-sw" aria-checked="{{' + k + 'On}}" aria-label="' + label.replace('"', '&quot;') + '" onClick="{{' + k + 'Tog}}" style="width: 44px; height: 26px; border: 0; border-radius: 999px; padding: 3px; box-sizing: border-box; background: {{' + k + 'Bg}}; display: flex; cursor: pointer; transition: background-color 160ms ease">'
              '<span style="width: 20px; height: 20px; border-radius: 999px; background: #FFFFFF; transform: translateX({{' + k + 'X}}); transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1)"></span></button>')
        s = s[:m.start()] + sw + s[m.end():]
    s = logic(s, MARK + '''
  constructor(p) { super(p); this.state = { n: 0 }; }
''' + GUARD + '''  renderVals() {
    ''' + STAFF + '''
    const A = window.FV && window.FV.ADMIN, on = A ? A.settings().on : {}, L = { rate: 'Lesson rating', report: 'Report a mistake', review: 'App review prompt', mail: 'Email for mistake reports' }, v = { sName, sIni };
    ['rate', 'report', 'review', 'mail'].forEach((k) => { const o = k === 'mail' ? on.mail !== false : on[k] !== false;
      v[k + 'On'] = String(o); v[k + 'Bg'] = o ? '#0B192C' : '#D5D9E0'; v[k + 'X'] = o ? '18px' : '0px';
      v[k + 'Tog'] = () => { if (!A) return; if (k === 'review' && o) { location.href = 'AdminConfirmOffNavy.dc.html'; return; }
        A.set(k, !o); A.log('Feedback settings', L[k] + (o ? ' turned off' : ' turned on')); this.setState({ n: this.state.n + 1 }); }; });
    return v;
  }''')
    wr('AdminFeedbackSettingsNavy', s)

s = rd('AdminConfirmOffNavy')
if MARK not in s:
    s = staff_side(s)
    s = sub1(s, '<a href="AdminFeedbackSettingsNavy.dc.html" style="height: 44px; padding: 0 18px; border-radius: 10px; background: #0B192C;', '<a href="AdminFeedbackSettingsNavy.dc.html" onClick="{{off}}" style="height: 44px; padding: 0 18px; border-radius: 10px; background: #0B192C;')
    s = sub1(s, '<div role="dialog" aria-modal="true"', '<div role="dialog" class="fv-confirm" aria-modal="true"')
    s = logic(s, MARK + '\n' + GUARD + '''  renderVals() {
    ''' + STAFF + '''
    return { sName, sIni, off: () => { const A = window.FV && window.FV.ADMIN; if (A) { A.set('review', false); A.log('Feedback settings', 'App review prompt turned off'); } } };
  }''')
    wr('AdminConfirmOffNavy', s)
print('admin part 1 wired')
