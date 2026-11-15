"""Wire Me, Settings and its pages, Saved, History, Notifications links and the feedback prompts to window.FV.
Sign-out, delete account (DELETE to confirm), email change (a code to the new address, earlier prototype),
interest, the switches kept in FV preferences, saved guides and companies, the activity log, and feedback
sent to the admin inbox (FV.ADMIN.submit). Usage: python3 wire_navy_me.py <site folder>"""
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
def onclick_text(s, text, handler, tag='a'):
    m = re.search(r'<' + tag + r' ([^>]*)>' + re.escape(text) + '</' + tag + '>', s)
    if not m: raise SystemExit('missing button: ' + text)
    return s[:m.start()] + '<' + tag + ' onClick="{{' + handler + '}}" ' + m.group(1) + '>' + text + '</' + tag + '>' + s[m.end():]
MARK = '/* navy-me */'

# Me
s = rd('MeNavy')
if MARK not in s:
    s = sub1(s, 'font-size: 20px; font-weight: 600">AO</span>', 'font-size: 20px; font-weight: 600">{{ini}}</span>')
    s = sub1(s, '>Ada Okafor<', '>{{name}}<'); s = sub1(s, '>ada@example.com<', '>{{email}}<')
    s = sub1(s, 'font-size: 12px; font-weight: 600">Free</span>', 'font-size: 12px; font-weight: 600">{{plan}}</span>')
    s = re.sub(r'(font-size: \d+px[^"]*">)7(</span><span[^>]*>Days in a row)', r'\1{{days}}\2', s, count=1)
    s = re.sub(r'>3/36(</span><span[^>]*>Lessons)', r'>{{lessons}}\1', s, count=1); s = re.sub(r'>0/6(</span><span[^>]*>Courses)', r'>{{courses}}\1', s, count=1)
    a = s.index('Upgrade to Finvora Plus'); a = s.rindex('<a ', 0, a); b = s.index('</a>', a) + 4
    s = s[:a] + '<sc-if value="{{isFree}}" hint-placeholder-val="{{ true }}">' + s[a:b] + '</sc-if>' + s[b:]
    s = sub1(s, '>3 companies<', '>{{nWatch}}<'); s = sub1(s, '>₦1,051,750<', '>{{port}}<'); s = sub1(s, '>4 items<', '>{{nSaved}}<')
    s = re.sub(r'(Plan and billing</span><span style="[^"]*">)Free<', r'\1{{plan}}<', s, count=1)
    s = re.sub(r'<a href="(?:PlusNavy|YourPlanNavy)\.dc\.html"((?:(?!</a>).)*?Plan and billing)', r'<a href="{{planHref}}"\1', s, count=1, flags=re.S)
    s = logic(s, MARK + '''
  renderVals() {
    const F = window.FV; if (!F) return {}; const a = F.AUTH.get(), plus = F.billing().sub.plan === 'plus', st = F.get(), LS = F.LESSONS, S = F.SIM, nm = a.name || 'Ada Okafor';
    const w = F.PLUS ? F.PLUS.lists()[0].tickers.length : 0, sv = F.LIB.saved().length;
    let rv = {}; try { rv = JSON.parse(localStorage.getItem('fv.review.v1') || 'null') || {}; } catch (e) {}
    return { ini: nm.split(/\\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase(), name: nm, email: a.email || 'Not signed in', plan: plus ? 'Plus' : 'Free', isFree: !plus, planHref: plus ? 'YourPlanNavy.dc.html' : 'PlusNavy.dc.html',
      days: String(F.streak()), lessons: (st.done || 0) + '/36', courses: ((rv.best || 0) >= 6 ? 1 : 0) + '/6',
      nWatch: w + (w === 1 ? ' company' : ' companies'), port: '₦' + Math.round(S.valuation().totalKobo / 100).toLocaleString('en-NG'), nSaved: sv + (sv === 1 ? ' item' : ' items') };
  }''')
    wr('MeNavy', s)

# Settings: real account values; switches kept in preferences.
s = rd('SettingsNavy')
if MARK not in s:
    s = sub1(s, "  constructor(p) { super(p); this.state = { price: true, daily: true, news: false, sound: true }; }", "  constructor(p) { super(p); const P = window.FV ? window.FV.ME.prefs() : {}; this.state = { price: P.price !== false, daily: P.daily !== false, news: !!P.news, sound: P.sound !== false }; }")
    s = sub1(s, "tog: () => this.setState({ [k]: !on }) }; };", "tog: () => { if (window.FV) window.FV.ME.setPref(k, !on); this.setState({ [k]: !on }); } }; };")
    s = sub1(s, "rows: [val('Email', 'ada@example.com'), val('Plan', 'Free'), val('Interest', 'Investing')]", "rows: [val('Email', (window.FV && window.FV.AUTH.get().email) || 'Not signed in'), val('Plan', window.FV && window.FV.billing().sub.plan === 'plus' ? 'Plus' : 'Free'), val('Interest', (window.FV && window.FV.AUTH.get().goal) || 'Investing')]")
    s = s.replace('class Component extends DCLogic {', 'class Component extends DCLogic {\n' + MARK, 1)
    s = s.replace('<a href="MainNavy.dc.html"', '<a href="SignOutNavy.dc.html"', 1)
    # Break UI fix 1: long emails wrap inside the value column instead of crowding the label.
    s = s.replace('        <div style="display: flex; align-items: center; justify-content: space-between; min-height: 52px; border-bottom: 1px solid #EDEFF2; font-size: 15px">\n          <span>{{r.t}}</span>\n          <span style="display: {{r.showV}}; font-size: 14px; color: #5B6577">{{r.v}}</span>', '        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 52px; border-bottom: 1px solid #EDEFF2; font-size: 15px">\n          <span style="flex: none">{{r.t}}</span>\n          <span style="display: {{r.showV}}; min-width: 0; text-align: right; overflow-wrap: anywhere; font-size: 14px; color: #5B6577">{{r.v}}</span>', 1)
    wr('SettingsNavy', s)

# Email change, interest, sign out, delete
s = rd('SetEmailNavy')
if MARK not in s:
    s = sub1(s, '<input id="ne" type="email" value="ada.okafor@example.com" style="', '<input id="ne" type="email" autocomplete="email" value="{{v}}" onInput="{{onV}}" aria-invalid="{{bad}}" style="')
    s = sub1(s, 'Current: ada@example.com', 'Current: {{cur}}')
    s = re.sub(r'<a href="SignInCodeNavy\.dc\.html"', '<a href="#" onClick="{{send}}"', s, count=1)
    s = logic(s, MARK + '''
  constructor(p) { super(p); this.state = { v: '', tried: false }; }
  renderVals() { const A = window.FV && window.FV.AUTH; const bad = !!A && this.state.tried && !A.validEmail(this.state.v);
    return { v: this.state.v, cur: (A && A.get().email) || 'none', bad: String(bad), onV: (e) => this.setState({ v: e.target.value }), send: (e) => { e.preventDefault(); if (!A || !A.validEmail(this.state.v)) { this.setState({ tried: true }); return; } A.sendCode(this.state.v, true); location.href = 'SignInCodeNavy.dc.html'; } }; }''')
    wr('SetEmailNavy', s)
s = rd('SetGoalNavy')
if MARK not in s:
    a = s.index('<div role="radiogroup"'); b = s.index('</div>', a) + 6
    btn = re.search(r'<button role="radio" aria-checked="(?:true|false)" style="([^"]*)">', s[a:b]).group(1)
    btn = re.sub(r'border: [^;]+;', 'border: {{o.bd}};', btn, count=1)
    inner = re.search(r'<button role="radio"[^>]*>(.*?)</button>', s[a:b], flags=re.S).group(1)
    inner = re.sub(r'>A<', '>{{o.l}}<', inner, count=1); inner = re.sub(r'>Money basics<', '>{{o.t}}<', inner, count=1)
    s = s[:a] + '<div role="radiogroup" aria-label="Interest" style="padding: 20px 24px 0; display: flex; flex-direction: column; gap: 10px; flex: none"><sc-for list="{{opts}}" as="o" hint-placeholder-count="3"><button type="button" role="radio" aria-checked="{{o.on}}" onClick="{{o.pick}}" style="' + btn + '; cursor: pointer">' + inner + '</button></sc-for></div>' + s[b:]
    s = onclick_text(s, 'Save', 'save')
    s = logic(s, MARK + '''
  constructor(p) { super(p); const g = window.FV ? window.FV.AUTH.get().goal : null; this.state = { g: g || 'Investing' }; }
  renderVals() { return { opts: ['Money basics', 'Investing', 'Nigerian market'].map((t, i) => ({ l: 'ABC'[i], t, on: String(t === this.state.g), bd: t === this.state.g ? '2px solid #0B192C' : '1px solid #D5D9E0', pick: () => this.setState({ g: t }) })), save: () => { if (window.FV) window.FV.AUTH.setGoal(this.state.g); } }; }''')
    wr('SetGoalNavy', s)
s = rd('SignOutNavy')
if MARK not in s:
    s = re.sub(r'<a href="MainNavy\.dc\.html"', '<a href="MainNavy.dc.html" onClick="{{out}}"', s, count=1)
    s = logic(s, MARK + "\n  renderVals() { return { out: () => { if (window.FV) window.FV.AUTH.signOut(); } }; }")
    wr('SignOutNavy', s)
s = rd('DeleteAccountNavy')
if MARK not in s:
    s = sub1(s, '<input id="dc" value="DELETE" style="', '<input id="dc" autocomplete="off" autocapitalize="characters" value="{{v}}" onInput="{{onV}}" style="')
    s = re.sub(r'<a href="DeletedNavy\.dc\.html" style="([^"]*)background: #B9473F;', r'<a href="#" onClick="{{del}}" aria-disabled="{{off}}" style="\1background: #B9473F; opacity: {{op}};', s, count=1)
    s = sub1(s, 'Cancel first; you keep it until 10 Dec', '{{plusLine}}')
    s = logic(s, MARK + '''
  constructor(p) { super(p); this.state = { v: '' }; }
  renderVals() { const F = window.FV, ok = this.state.v.trim() === 'DELETE', sub = F ? F.billing().sub : {};
    return { v: this.state.v, onV: (e) => this.setState({ v: e.target.value }), off: String(!ok), op: ok ? '1' : '.4',
      plusLine: sub.plan === 'plus' && sub.renewsOn ? 'Cancel first; you keep it until ' + new Date(sub.renewsOn + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'You are on Free',
      del: (e) => { e.preventDefault(); if (!ok) return; try { Object.keys(localStorage).filter((k) => /^fv\\./.test(k)).forEach((k) => localStorage.removeItem(k)); sessionStorage.clear(); } catch (x) {} location.href = 'DeletedNavy.dc.html'; } }; }''')
    wr('DeleteAccountNavy', s)

# Saved: saved guides plus watched companies.
s = rd('SavedNavy')
if MARK not in s:
    m = re.search(r'<a href="ArticleNavy\.dc\.html"[^>]*>.*?</a>', s, flags=re.S); a = m.start()
    last = a
    for mm in re.finditer(r'<a href="(?:ArticleNavy|CompanyNavy|AskFinvoraNavy)\.dc\.html"[^>]*>.*?</a>', s[a:], flags=re.S): last = a + mm.end()
    row = m.group(0).replace('<a href="ArticleNavy.dc.html"', '<a href="{{x.href}}"', 1).replace('>Dividend yield<', '>{{x.t}}<', 1).replace('>Guide · The Nigerian market<', '>{{x.s}}<', 1)
    s = s[:a] + '<sc-for list="{{items}}" as="x" hint-placeholder-count="3">' + row + '</sc-for>' + s[last:]
    s = logic(s, MARK + '''
  renderVals() { const F = window.FV; if (!F) return { items: [] };
    const g = F.LIB.saved().map((a) => ({ t: a.title, s: 'Guide · ' + F.LIB.topicOf(a).name, href: 'ArticleNavy.dc.html?a=' + a.slug }));
    const c = (F.PLUS ? F.PLUS.lists()[0].tickers : []).map((t) => ({ t: F.SIM.company(t).name, s: 'Company · ' + t, href: 'CompanyNavy.dc.html?t=' + t }));
    return { items: g.concat(c) }; }''')
    wr('SavedNavy', s)

# History: the activity log.
s = rd('HistoryNavy')
if MARK not in s:
    a = s.index('>This week<'); a = s.rindex('<section', 0, a); b = s.rindex('</section>', 0, s.index('</x-dc>')) + 10
    sec = s[a:b]; h2 = re.search(r'<h2[^>]*>', sec).group(0); row = re.search(r'<a href="[A-Za-z]+Navy\.dc\.html"[^>]*>.*?</a>', sec, flags=re.S).group(0)
    row = re.sub(r'<a href="[A-Za-z]+Navy\.dc\.html"', '<a href="{{x.href}}"', row, count=1).replace('>Budgeting<', '>{{x.t}}<', 1).replace('>Lesson · 4/5 correct<', '>{{x.s}}<', 1).replace('>Today<', '>{{x.when}}<', 1)
    open_sec = re.match(r'<section[^>]*>', sec).group(0)
    s = s[:a] + '<sc-for list="{{groups}}" as="g" hint-placeholder-count="2">' + open_sec + h2 + '{{g.h}}</h2><sc-for list="{{g.items}}" as="x" hint-placeholder-count="2">' + row + '</sc-for></section></sc-for>' + s[b:]
    s = logic(s, MARK + '''
  renderVals() { const F = window.FV; if (!F) return { groups: [] };
    const map = { lesson: 'Lesson', practice: 'Lesson replay', daily: 'Daily question', article: 'Guide read', review: 'Lesson review' };
    const wk = new Date(Date.now() + 3600000 - 6 * 86400000).toISOString().slice(0, 10), today = new Date(Date.now() + 3600000).toISOString().slice(0, 10);
    const href = (e) => e.kind === 'daily' ? 'DailyNavy.dc.html' : e.kind === 'article' ? String(e.href || '').replace('UPArticle', 'ArticleNavy') : 'LearnNavy.dc.html';
    const items = F.ME.log().filter((e) => map[e.kind] && !/ \\(read\\)$/.test(e.title)).map((e) => ({ t: e.title.replace(/ \\(read\\)$/, ''), s: map[e.kind], when: e.day === today ? 'Today' : new Date(e.day + 'T12:00:00Z').toLocaleDateString('en-GB', e.day >= wk ? { weekday: 'short' } : { day: 'numeric', month: 'short' }), href: href(e), day: e.day }));
    const g = [{ h: 'This week', items: items.filter((x) => x.day >= wk) }, { h: 'Earlier', items: items.filter((x) => x.day < wk) }].filter((x) => x.items.length);
    if (!g.length) location.replace('EmptyHistoryNavy.dc.html');
    return { groups: g }; }''')
    wr('HistoryNavy', s)

# Notifications: point the drawn items at the navy screens.
s = rd('NotificationsNavy')
if 'CompanyNavy.dc.html' not in s:
    for old, new in [("'Company.dc.html'", "'CompanyNavy.dc.html'"), ("'Markets.dc.html'", "'MarketsNavy.dc.html'"), ("'Article.dc.html'", "'ArticleNavy.dc.html'"), ("'Learn.dc.html'", "'LearnNavy.dc.html'"), ("'Library.dc.html'", "'LibraryNavy.dc.html'")]:
        s = s.replace(old, new)
    wr('NotificationsNavy', s)

# Feedback prompts: sent to the admin inbox.
for name, kind, sendText, picks in [('RateNavy', 'rate', 'Send', ['Poor', 'OK', 'Good', 'Great']), ('ReportNavy', 'report', 'Send report', None), ('SuggestNavy', 'suggest', 'Send', None)]:
    s = rd(name)
    if MARK in s: continue
    if picks:
        for i, pk in enumerate(picks):
            s = re.sub(r'<button aria-label="' + pk + r'" style="([^"]*)border: 1px solid #D5D9E0; background: #FFFFFF;', r'<button type="button" aria-label="' + pk + r'" aria-pressed="{{on' + str(i) + r'}}" onClick="{{pick' + str(i) + r'}}" style="\1border: {{bd' + str(i) + r'}}; background: {{bg' + str(i) + r'}}; cursor: pointer;', s, count=1)
    s = onclick_text(s, sendText, 'send')
    # Break UI fix 4: free text limited to 500 characters (owner, 15 Nov 2026).
    s = re.sub(r'<(textarea|input) aria-label=', r'<\1 maxlength="500" aria-label=', s)
    js = MARK + '''
  constructor(p) { super(p); this.state = { g: null }; }
  renderVals() { const v = { send: () => { const A = window.FV && window.FV.ADMIN, el = document.querySelector('#dc-root textarea, #dc-root input'); if (A) A.submit('KIND', document.title, this.state.g === null ? '' : String(this.state.g), el ? el.value.slice(0, 500) : ''); } };
    for (let i = 0; i < 4; i++) { const on = this.state.g === i; v['on' + i] = String(on); v['bd' + i] = on ? '2px solid #0B192C' : '1px solid #D5D9E0'; v['bg' + i] = on ? '#EEF0F3' : '#FFFFFF'; v['pick' + i] = () => this.setState({ g: i }); }
    return v; }'''.replace('KIND', kind)
    s = logic(s, js)
    wr(name, s)
print('wired')
