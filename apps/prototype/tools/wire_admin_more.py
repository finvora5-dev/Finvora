"""Wire the rest of the admin boards (staff sign-in, overview, content, article editor, question
builder, Ask Fin review, AI summary approvals, users and payments, plans) to window.FV.ADMIN.
Everything is a demonstration kept in this browser. Run after wire_admin.py.
Usage: python3 wire_admin_more.py <site folder>"""
import re, sys, os
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
MARK = '<!-- fv-admin-wired -->'

def main(s, html):
    i = s.index('<main'); i = s.index('>', i) + 1; j = s.index('</main>', i)
    return s[:i] + '\n' + html + '\n    ' + s[j:]
def header(s, html):
    i = s.index('<header'); i = s.index('>', i) + 1; j = s.index('</header>', i)
    return s[:i] + '\n      ' + html + '\n    ' + s[j:]
def logic(s, code):
    i = s.index('class Component extends DCLogic'); j = s.index('</script>', i)
    return s[:i] + code.strip() + '\n' + s[j:]
def done(s): return MARK in s
def mark(s): return s.replace('</x-dc>', MARK + '</x-dc>', 1)

LBL = 'style="display: flex; flex-direction: column; gap: 6px"'
LT = '<span style="font-weight: 700; font-size: 13px">'
TA = 'style="border-radius: 12px; border: 1.5px solid #E7E2F0; padding: 10px 12px; font: 500 14px \'Plus Jakarta Sans\', sans-serif; resize: vertical"'
ERR = '<sc-if value="{{hasErr}}" hint-placeholder-val="{{false}}"><p role="alert" style="margin: 0; color: #B42828; font-weight: 700; font-size: 14px">{{err}}</p></sc-if>'
TAGJS = "const tagc = (t) => t === 'Published' || t === 'Confirmed' || t === 'Pass' || t === 'Live' ? ['#E1F7EA', '#0F6B39'] : t === 'Draft' ? ['#F5F3F8', '#38323F'] : t === 'Sent back' || t === 'Failed' || t === 'Fix' || t === 'Check' ? ['#FFE6E6', '#B42828'] : ['#F1EBFB', '#4C1D95'];"
AGO = "const ago = (t) => { if (!t) return 'Earlier'; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'Now' : m < 60 ? m + 'm ago' : m < 1440 ? Math.round(m / 60) + 'h ago' : Math.round(m / 1440) + 'd ago'; };"
TOAST = "const toast = (m) => { if (window.fvToast) window.fvToast(m); };"
ON = 'background: #5B21B6; color: #FFFFFF; border-color: #5B21B6'

# ---- Staff sign-in
s = rd('UASignIn')
if not done(s):
    s = s.replace('<input class="field" type="email" value="tobi@finvora.app">', '<input class="field" type="email" autocomplete="username" value="{{email}}" onInput="{{onEmail}}">')
    s = s.replace('<input class="field num" inputmode="numeric" value="" placeholder="6 digits">', '<input class="field num" inputmode="numeric" autocomplete="one-time-code" maxlength="6" value="{{code}}" onInput="{{onCode}}" onKeyDown="{{onKey}}" placeholder="6 digits">')
    s = s.replace('<a href="UAOverview.dc.html" class="btn" style="height: 48px">Sign in</a>', ERR + '<button class="btn" type="button" style="height: 48px" onClick="{{go}}">Sign in</button>')
    s = logic(s, '''class Component extends DCLogic {
  constructor(p) { super(p); this.state = { email: 'tobi@finvora.app', code: '', err: '' }; }
  go() {
    const A = window.FV && window.FV.ADMIN; if (!A) return;
    const r = A.signIn(this.state.email, this.state.code);
    if (r === 'ok') { const m = /[?&]next=([^&]+)/.exec(location.search), n = m ? decodeURIComponent(m[1]) : ''; location.href = /^UA\\w+\\.dc\\.html/.test(n) ? n : 'UAOverview.dc.html'; return; }
    const left = A.triesLeft();
    this.setState({ code: '', err: r === 'domain' ? 'Use your @finvora.app work email.' : r === 'short' ? 'Enter the 6 digits from your authenticator app.' : r === 'locked' ? 'Too many wrong codes. Try again in 15 minutes.' : "That code isn't right. " + left + (left === 1 ? ' try' : ' tries') + ' left.' });
  }
  renderVals() {
    const s = this.state;
    return { email: s.email, code: s.code, err: s.err, hasErr: !!s.err,
      onEmail: (e) => this.setState({ email: e.target.value, err: '' }),
      onCode: (e) => this.setState({ code: e.target.value.replace(/\\D/g, '').slice(0, 6), err: '' }),
      onKey: (e) => { if (e.key === 'Enter') this.go(); },
      go: () => this.go() };
  }
}''')
    s = s.replace('<div class="root" style="width: 1440px; min-height: 960px; box-sizing: border-box; display: flex;', '<div class="root" data-fv-fluid style="width: 1440px; min-height: 960px; box-sizing: border-box; padding: 16px; display: flex;', 1)
    s = s.replace('<section class="card" style="width: 440px; padding: 36px;', '<section class="card" style="width: 100%; max-width: 440px; box-sizing: border-box; padding: 28px; ', 1)
    wr('UASignIn', mark(s))

# ---- Overview: the queues are live; platform-wide figures stay the designed examples.
s = rd('UAOverview')
inbox_samples = rd('UAFeedbackInbox').count('>Mark done</button></td></tr>') - 1  # the template row is one of them
if not done(s):
    s = s.replace('line-height: 1.2; margin-top: 6px">23</div><span class="muted" style="font-size: 13px">6 mistake reports</span>', 'line-height: 1.2; margin-top: 6px">{{openFb}}</div><span class="muted" style="font-size: 13px">{{reportsText}}</span>')
    s = s.replace('line-height: 1.2; margin-top: 6px">9</div>', 'line-height: 1.2; margin-top: 6px">{{toReview}}</div>')
    s = s.replace('#B42828">6</span><span>Mistake reports on articles</span>', '#B42828">{{reports}}</span><span>Mistake reports on articles</span>')
    s = s.replace('#4C1D95">9</span><span>Ask Fin answers to check</span>', '#4C1D95">{{toReview}}</span><span>Ask Fin answers to check</span>')
    s = s.replace('#38323F">4</span><span>Drafts waiting for review</span>', '#38323F">{{drafts}}</span><span>Drafts waiting for review</span>')
    s = s.replace('<span class="tag" style="background: #E1F7EA; color: #0F6B39">On</span><span>All 4 feedback prompts live</span>', '<span class="tag" style="background: {{fbBg}}; color: {{fbFg}}">{{fbTag}}</span><span>{{fbText}}</span>')
    s = s.replace('<a href="UAAskKoboReview.dc.html" class="press" style="display: flex', '<a href="UAAskKoboReview.dc.html" class="press" style="min-height: 32px; display: flex')
    s = logic(s, '''class Component extends DCLogic {
  renderVals() {
    const A = window.FV && window.FV.ADMIN;
    if (!A) return { openFb: 0, reportsText: '', reports: 0, toReview: 0, drafts: 0, fbBg: '#E1F7EA', fbFg: '#0F6B39', fbTag: 'On', fbText: 'All 4 feedback prompts live' };
    const mine = A.inbox().filter((x) => !x.done), reports = mine.filter((x) => x.kind === 'Report').length + 1;
    const on = ['rate', 'report', 'suggest', 'review'].filter((k) => A.on(k)).length;
    const openFb = mine.length + %d;
    return { openFb: openFb, reports: reports, reportsText: reports + (reports === 1 ? ' mistake report' : ' mistake reports'),
      toReview: A.reviewQueue().length, drafts: A.contentRows().filter((r) => r.status !== 'Published').length,
      fbBg: on === 4 ? '#E1F7EA' : '#FFE6E6', fbFg: on === 4 ? '#0F6B39' : '#B42828', fbTag: on === 4 ? 'On' : on + ' of 4',
      fbText: on === 4 ? 'All 4 feedback prompts live' : (4 - on) + (4 - on === 1 ? ' feedback prompt is off' : ' feedback prompts are off') };
  }
}''' % inbox_samples)
    wr('UAOverview', mark(s))

# ---- Content list
s = rd('UAContent')
if not done(s):
    s = s.replace('<a href="UAEditor.dc.html" class="btn">New article</a>', '<button class="btn" type="button" onClick="{{newArt}}">New article</button>')
    s = main(s, '''      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap"><label style="flex: 1; max-width: 420px"><span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0)">Search content</span><input class="field" style="width: 100%" type="search" placeholder="Search titles" value="{{q}}" onInput="{{onQ}}"></label>
        <sc-for list="{{chips}}" as="c" hint-placeholder-count="4"><button class="chip" type="button" aria-pressed="{{c.pressed}}" style="{{c.style}}" onClick="{{c.pick}}">{{c.label}}</button></sc-for></div>
      <section class="card" style="overflow: hidden"><table><tr><th>Title</th><th>Type</th><th>Topic</th><th>Status</th><th>Updated</th></tr>
        <sc-for list="{{rows}}" as="r" hint-placeholder-count="6"><tr><td><sc-if value="{{r.link}}" hint-placeholder-val="{{true}}"><a href="{{r.href}}" style="font-weight: 700; text-decoration: none; color: #0E0B14">{{r.title}}</a></sc-if><sc-if value="{{r.plain}}" hint-placeholder-val="{{false}}"><span style="font-weight: 700">{{r.title}}</span></sc-if></td><td>{{r.type}}</td><td>{{r.topic}}</td><td><span class="tag" style="background: {{r.bg}}; color: {{r.fg}}">{{r.status}}</span></td><td class="muted">{{r.ago}}</td></tr></sc-for>
        <sc-if value="{{none}}" hint-placeholder-val="{{false}}"><tr><td colspan="5" class="muted" style="padding: 24px 16px">Nothing matches. Try another word or filter.</td></tr></sc-if></table></section>
      <p class="muted" style="margin: 0; font-size: 13px">Publishing an article changes it in the app straight away. Micro modules are edited in the lesson files for now.</p>''')
    s = logic(s, '''class Component extends DCLogic {
  constructor(p) { super(p); this.state = { q: '', f: 'All' }; }
  renderVals() {
    const A = window.FV && window.FV.ADMIN, s = this.state;
    %s
    %s
    const F = { All: () => true, Articles: (r) => r.type === 'Article', 'Micro modules': (r) => r.type === 'Micro module', Dictionary: (r) => r.type === 'Dictionary term' };
    const rows = (A ? A.contentRows() : []).filter(F[s.f]).filter((r) => !s.q.trim() || r.title.toLowerCase().indexOf(s.q.trim().toLowerCase()) >= 0);
    return { q: s.q, onQ: (e) => this.setState({ q: e.target.value }), none: rows.length === 0,
      chips: Object.keys(F).map((k) => ({ label: k, pressed: s.f === k ? 'true' : 'false', style: s.f === k ? '%s' : '', pick: () => this.setState({ f: k }) })),
      rows: rows.map((r) => ({ title: r.title, type: r.type, topic: r.topic, status: r.status, bg: tagc(r.status)[0], fg: tagc(r.status)[1], ago: ago(r.at), link: !!r.id, plain: !r.id, href: 'UAEditor.dc.html?a=' + r.id })),
      newArt: () => { if (A) location.href = 'UAEditor.dc.html?a=' + A.newArticle(); } };
  }
}''' % (TAGJS, AGO, ON))
    wr('UAContent', mark(s))

# ---- Article editor
s = rd('UAEditor')
if not done(s):
    s = header(s, '<div style="flex: 1; min-width: 0"><span class="muted" style="font-size: 13px">Content / Article</span><h1 style="font-size: 22px; line-height: 1.2; overflow-wrap: anywhere">{{heading}}</h1></div><a href="UAContent.dc.html" class="btn btn-w">Back to content</a><button class="btn" type="button" onClick="{{saveDraft}}">Save draft</button>')
    s = main(s, '''      <sc-if value="{{missing}}" hint-placeholder-val="{{false}}"><section class="card" style="padding: 24px"><h2 style="font-size: 18px">This article doesn't exist</h2><p class="muted" style="margin: 6px 0 12px">It may have been removed. Pick one from the content list.</p><a href="UAContent.dc.html" class="btn" style="align-self: flex-start">Back to content</a></section></sc-if>
      <sc-if value="{{found}}" hint-placeholder-val="{{true}}"><div style="display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start">
        <section class="card" style="padding: 24px; display: flex; flex-direction: column; gap: 16px">
          <label %s>%sTitle</span><input class="field" value="{{f.title}}" onInput="{{on.title}}"></label>
          <label %s>%sOne-line definition</span><input class="field" value="{{f.definition}}" onInput="{{on.definition}}"></label>
          <div style="display: flex; gap: 6px; border-bottom: 1.5px solid #E7E2F0; padding-bottom: 10px; flex-wrap: wrap; align-items: center"><span class="muted" style="font-size: 13px; font-weight: 700; margin-right: 4px">Show section</span><sc-for list="{{secs}}" as="c" hint-placeholder-count="3"><button class="chip" type="button" aria-pressed="{{c.pressed}}" style="{{c.style}}" onClick="{{c.pick}}">{{c.label}}</button></sc-for></div>
          <div style="display: flex; flex-direction: column; gap: 10px"><label %s>%sSection heading</span><input class="field" style="font-size: 18px; font-weight: 800" value="{{f.howTitle}}" onInput="{{on.howTitle}}"></label>
            <label %s>%sBody</span><textarea rows="7" %s value="{{f.howIntro}}" onInput="{{on.howIntro}}"></textarea></label></div>
          <sc-if value="{{hasSec}}" hint-placeholder-val="{{false}}"><div style="border: 2px dashed #E7E2F0; border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 6px"><span class="eyebrow">{{secTitle}}</span><sc-for list="{{secLines}}" as="l" hint-placeholder-count="2"><span style="font-size: 14px; line-height: 1.5">{{l}}</span></sc-for><span class="muted" style="font-size: 12px">Shown as written. Editing this section comes later.</span></div></sc-if>
        </section>
        <aside style="display: flex; flex-direction: column; gap: 16px">
          <section class="card" style="padding: 18px; display: flex; flex-direction: column; gap: 10px"><span class="eyebrow">Status</span><span class="tag" style="align-self: flex-start; background: {{stBg}}; color: {{stFg}}">{{status}}</span><span class="muted" style="font-size: 13px">{{statusNote}}</span><button class="{{pubClass}}" type="button" aria-disabled="{{pubOff}}" onClick="{{publish}}">Approve and publish</button><button class="btn btn-w" type="button" onClick="{{sendBack}}">Send back with notes</button></section>
          <section class="card" style="padding: 18px; display: flex; flex-direction: column; gap: 8px"><span class="eyebrow">Details</span><sc-if value="{{isNew}}" hint-placeholder-val="{{false}}"><label %s>%sTopic</span><select class="field" onChange="{{on.topic}}" value="{{f.topic}}"><sc-for list="{{topics}}" as="t" hint-placeholder-count="4"><option value="{{t}}">{{t}}</option></sc-for></select></label></sc-if><sc-if value="{{notNew}}" hint-placeholder-val="{{true}}"><span style="font-size: 14px">Topic: {{f.topic}}</span></sc-if><span style="font-size: 14px">Level: Beginner</span><sc-if value="{{live}}" hint-placeholder-val="{{true}}"><a href="{{appHref}}" style="font-size: 14px; font-weight: 700">See it in the app</a></sc-if></section>
          <section class="card" style="padding: 18px; display: flex; flex-direction: column; gap: 8px"><span class="eyebrow">Checks</span><sc-for list="{{checks}}" as="c" hint-placeholder-count="3"><span style="font-size: 14px"><span class="tag" style="background: {{c.bg}}; color: {{c.fg}}">{{c.tag}}</span> {{c.text}}</span></sc-for></section>
        </aside>
      </div></sc-if>''' % (LBL, LT, LBL, LT, LBL, LT, LBL, LT, TA, LBL, LT))
    s = logic(s, '''class Component extends DCLogic {
  constructor(p) {
    super(p); const A = window.FV && window.FV.ADMIN, m = /[?&]a=([\\w-]+)/.exec(location.search), d = A ? A.form(m ? m[1] : 'dividend') : null;
    this.state = { id: d && d.id, f: d ? Object.assign({}, d.form) : null, status: d ? d.status : '', isNew: !!(d && d.isNew), sec: '' };
  }
  save(status) {
    const A = window.FV && window.FV.ADMIN, s = this.state; if (!A || !s.f) return;
    A.saveArticle(s.id, s.f, status); this.setState({ status: status });
    if (window.fvToast) window.fvToast(status === 'Published' ? 'Published. Learners see it now.' : status === 'Sent back' ? 'Sent back to the writer.' : 'Draft saved. Learners still see the published version.');
  }
  renderVals() {
    const A = window.FV && window.FV.ADMIN, s = this.state, L = window.FV && window.FV.LIB;
    %s
    if (!s.f) return { missing: true, found: false, heading: 'Article', saveDraft: () => {}, f: {}, on: {}, secs: [], secLines: [], checks: [], topics: [] };
    const set = (k) => (e) => this.setState({ f: Object.assign({}, s.f, { [k]: e.target.value }) });
    const checks = A ? A.checks(s.f) : [], ok = checks.every((c) => c.ok);
    const art = !s.isNew && L ? (window.FVD && window.FVD.ARTICLES || []).filter((x) => x.slug === s.id)[0] : null, deep = art && art.deep;
    const SECS = { 'Key takeaways': deep ? deep.takeaways : [], 'African example': deep && deep.example ? [deep.example.line].concat(deep.example.rows.map((r) => r[0] + ': ' + r[1])) : [], Formula: deep && deep.formula ? [deep.formula.text || deep.formula.line || JSON.stringify(deep.formula).replace(/[{}"]/g, ' ')] : [] };
    const secs = Object.keys(SECS).filter((k) => SECS[k] && SECS[k].length);
    const notes = { Published: 'Live in the app.', Draft: 'Not live yet. Learners see the published version.', 'Sent back': 'Waiting for the writer to make changes.' };
    return { missing: false, found: true, heading: s.f.title || 'New article', f: s.f, isNew: s.isNew, notNew: !s.isNew, topics: L ? L.TOPICS.map((t) => t.name) : [],
      on: { title: set('title'), definition: set('definition'), howTitle: set('howTitle'), howIntro: set('howIntro'), topic: set('topic') },
      secs: secs.map((k) => ({ label: k, pressed: s.sec === k ? 'true' : 'false', style: s.sec === k ? '%s' : '', pick: () => this.setState({ sec: s.sec === k ? '' : k }) })),
      hasSec: !!s.sec, secTitle: s.sec, secLines: s.sec ? SECS[s.sec] : [],
      status: s.status, stBg: tagc(s.status)[0], stFg: tagc(s.status)[1], statusNote: notes[s.status] || '',
      pubClass: ok ? 'btn' : 'btn btn-off', pubOff: ok ? 'false' : 'true', live: !s.isNew || s.status === 'Published', appHref: 'UPArticle.dc.html?a=' + s.id,
      checks: checks.map((c) => ({ tag: c.ok ? 'Pass' : 'Fix', bg: tagc(c.ok ? 'Pass' : 'Fix')[0], fg: tagc(c.ok ? 'Pass' : 'Fix')[1], text: c.text })),
      saveDraft: () => this.save('Draft'), sendBack: () => this.save('Sent back'),
      publish: () => { if (ok) this.save('Published'); else if (window.fvToast) window.fvToast('Fix the checks marked Fix first.'); } };
  }
}''' % (TAGJS, ON))
    wr('UAEditor', mark(s))

# ---- Question builder (the learner's daily questions)
s = rd('UAQuestions')
if not done(s):
    s = header(s, '<div style="flex: 1"><span class="muted" style="font-size: 13px">Content / Daily questions / Question {{n}} of {{total}}</span><h1 style="font-size: 22px; line-height: 1.2">Question builder</h1></div><a href="{{previewHref}}" class="btn btn-w">Preview on phone</a><button class="btn" type="button" onClick="{{save}}">Save question</button>')
    s = main(s, '''      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center"><span class="muted" style="font-size: 13px; font-weight: 700">Question</span><sc-for list="{{nums}}" as="c" hint-placeholder-count="10"><button class="chip" type="button" aria-label="Question {{c.label}}" aria-pressed="{{c.pressed}}" style="min-width: 44px; {{c.style}}" onClick="{{c.pick}}">{{c.label}}</button></sc-for></div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap"><button class="chip" type="button" aria-pressed="true" style="%s">Multiple choice</button><sc-for list="{{types}}" as="t" hint-placeholder-count="4"><button class="chip" type="button" aria-pressed="false" onClick="{{t.pick}}">{{t.label}}</button></sc-for></div>
      <sc-if value="{{hasNote}}" hint-placeholder-val="{{false}}"><p role="status" class="muted" style="margin: 0; font-size: 14px">{{note}}</p></sc-if>
      <div style="display: grid; grid-template-columns: minmax(0, 1fr) 390px; gap: 20px; align-items: start">
        <section class="card" style="padding: 24px; display: flex; flex-direction: column; gap: 16px">
          <label %s>%sQuestion</span><input class="field" value="{{q.q}}" onInput="{{onQ}}"></label>
          <div style="display: flex; flex-direction: column; gap: 10px"><span style="font-weight: 700; font-size: 13px">Answers (tap the circle to mark correct)</span><sc-for list="{{opts}}" as="o" hint-placeholder-count="4"><div style="display: flex; align-items: center; gap: 10px"><button type="button" aria-label="Mark answer {{o.n}} correct" aria-pressed="{{o.pressed}}" onClick="{{o.mark}}" style="width: 44px; height: 44px; margin: -11px; flex: none; border: 0; background: none; padding: 0; display: flex; align-items: center; justify-content: center; cursor: pointer"><span style="width: 22px; height: 22px; border-radius: 999px; border: 2px solid {{o.ring}}; background: {{o.fill}}"></span></button><input class="field" style="flex: 1; margin-left: 11px" aria-label="Answer {{o.n}}" value="{{o.label}}" onInput="{{o.edit}}"><sc-if value="{{o.right}}" hint-placeholder-val="{{false}}"><span class="tag" style="background: #E1F7EA; color: #0F6B39">Correct</span></sc-if></div></sc-for></div>
          <label %s>%sExplain the answer</span><textarea rows="3" %s value="{{q.explain}}" onInput="{{onExplain}}"></textarea></label>
          <label %s>%sHint (optional)</span><input class="field" value="{{q.hint}}" onInput="{{onHint}}"></label>
          %s
        </section>
        <section class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 10px; background: #FFFFFF"><span class="eyebrow">Learner preview</span>
          <div style="background: #FFFFFF; border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 10px"><strong style="font-size: 17px; line-height: 1.35">{{q.q}}</strong>
          <sc-for list="{{opts}}" as="o" hint-placeholder-count="4"><div style="min-height: 48px; border-radius: 14px; border: 2px solid {{o.pvBd}}; background: {{o.pvBg}}; display: flex; align-items: center; padding: 0 14px; font-weight: 700">{{o.label}}</div></sc-for>
          <p class="muted" style="margin: 0; font-size: 14px; line-height: 1.5">{{q.explain}}</p></div></section>
      </div>''' % (ON, LBL, LT, LBL, LT, TA, LBL, LT, ERR))
    s = logic(s, '''class Component extends DCLogic {
  constructor(p) { super(p); this.state = { i: 0, q: null, note: '', err: '' }; }
  cur() { const A = window.FV && window.FV.ADMIN; return this.state.q || (A ? JSON.parse(JSON.stringify(A.questions()[this.state.i])) : { q: '', opts: ['', '', '', ''], right: 0, explain: '', whys: [], hint: '' }); }
  renderVals() {
    const A = window.FV && window.FV.ADMIN, s = this.state, q = this.cur(), all = A ? A.questions() : [q];
    const put = (ch) => this.setState({ q: Object.assign({}, q, ch), err: '', note: '' });
    return { n: s.i + 1, total: all.length, q: q, note: s.note, hasNote: !!s.note, err: s.err, hasErr: !!s.err, previewHref: 'UPDaily.dc.html?dq=' + s.i,
      nums: all.map((x, i) => ({ label: String(i + 1), pressed: i === s.i ? 'true' : 'false', style: i === s.i ? '%s' : '', pick: () => this.setState({ i: i, q: null, note: '', err: '' }) })),
      types: ['Order the steps', 'Match pairs', 'Scenario A/B', 'Calculation'].map((t) => ({ label: t, pick: () => this.setState({ note: 'Daily questions are multiple choice. ' + t + ' questions are built in the lesson files for now.' }) })),
      opts: q.opts.map((o, i) => ({ n: i + 1, label: o, right: i === q.right, pressed: i === q.right ? 'true' : 'false', ring: i === q.right ? '#16884A' : '#D3CDE0', fill: i === q.right ? '#16884A' : '#FFFFFF', pvBd: i === q.right ? '#12B76A' : '#E7E2F0', pvBg: i === q.right ? '#DCFAE6' : '#FFFFFF',
        mark: () => put({ right: i }), edit: (e) => { const a = q.opts.slice(); a[i] = e.target.value; put({ opts: a }); } })),
      onQ: (e) => put({ q: e.target.value }), onExplain: (e) => put({ explain: e.target.value }), onHint: (e) => put({ hint: e.target.value }),
      save: () => {
        if (!A) return;
        if (!q.q.trim() || q.opts.some((o) => !o.trim()) || !q.explain.trim()) { this.setState({ err: 'Fill in the question, all four answers and the explanation.' }); return; }
        const old = A.questions()[s.i], whys = q.opts.map((o, i) => i === q.right ? '' : (old.opts[i] === o && old.whys[i] ? old.whys[i] : 'Not quite.' + (q.hint ? ' Hint: ' + q.hint : ' Try again.')));
        A.saveQuestion(s.i, Object.assign({}, q, { whys: whys })); this.setState({ q: null, err: '' });
        if (window.fvToast) window.fvToast('Saved. Learners get this question on its day.');
      } };
  }
}''' % ON)
    wr('UAQuestions', mark(s))

# ---- Ask Fin review
s = rd('UAAskKoboReview')
if not done(s):
    s = main(s, '''      <sc-if value="{{empty}}" hint-placeholder-val="{{false}}"><section class="card" style="padding: 32px; display: flex; flex-direction: column; gap: 8px; align-items: flex-start"><h2 style="font-size: 18px">Nothing to review</h2><p class="muted" style="margin: 0">Every flagged answer has been checked. Decisions are in the audit log.</p><a href="UAAudit.dc.html" class="btn btn-w">Open the audit log</a></section></sc-if>
      <sc-if value="{{has}}" hint-placeholder-val="{{true}}"><div style="display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 20px; align-items: start">
        <section class="card" style="overflow: hidden"><sc-for list="{{items}}" as="x" hint-placeholder-count="4"><button type="button" class="press" aria-pressed="{{x.pressed}}" onClick="{{x.pick}}" style="display: block; width: 100%%; text-align: left; border: 0; font: inherit; color: inherit; cursor: pointer; padding: 14px 16px; background: {{x.bg}}; border-bottom: 1px solid #E7E2F0"><span style="display: flex; justify-content: space-between"><span class="tag" style="background: {{x.tbg}}; color: {{x.tfg}}">{{x.tag}}</span><span class="muted" style="font-size: 12px">{{x.ago}}</span></span><strong style="display: block; margin-top: 6px">"{{x.q}}"</strong></button></sc-for></section>
        <section class="card" style="padding: 24px; display: flex; flex-direction: column; gap: 16px">
          <div><span class="eyebrow">Learner asked</span><p style="margin: 6px 0 0; font-size: 17px; font-weight: 700">"{{sel.q}}"</p></div>
          <div style="background: #F8F6FC; border: 1.5px solid #E7E2F0; border-radius: 14px; padding: 16px"><span class="eyebrow">Fin answered</span><p style="margin: 6px 0 0; line-height: 1.6">{{sel.a}}</p></div>
          <div style="display: flex; flex-direction: column; gap: 6px"><span class="eyebrow">Rule checks</span><sc-for list="{{checks}}" as="c" hint-placeholder-count="3"><span><span class="tag" style="background: {{c.bg}}; color: {{c.fg}}">{{c.tag}}</span> {{c.text}}</span></sc-for></div>
          <label %s>%sReviewer note</span><textarea rows="2" %s value="{{note}}" onInput="{{onNote}}"></textarea></label>
          <div style="display: flex; gap: 10px; flex-wrap: wrap"><button class="btn" type="button" onClick="{{fine}}">Answer is fine</button><button class="btn btn-w" type="button" onClick="{{better}}">Needs a better answer</button><button class="btn btn-w" type="button" style="color: #B42828" onClick="{{escalate}}">Escalate</button></div>
        </section>
      </div></sc-if>''' % (LBL, LT, TA))
    s = logic(s, '''class Component extends DCLogic {
  constructor(p) { super(p); this.state = { sel: null, note: '', n: 0 }; }
  renderVals() {
    const A = window.FV && window.FV.ADMIN, s = this.state, items = A ? A.reviewQueue() : [];
    %s
    %s
    if (!items.length) return { empty: true, has: false, items: [], checks: [], sel: { q: '', a: '' }, note: '' };
    const sel = items.filter((x) => x.id === s.sel)[0] || items[0];
    const pii = /@|\\b\\d{10,11}\\b/.test(sel.a);
    const checks = (sel.kind === 'refusal' ? [[true, 'Refused to recommend what to buy or sell']] : sel.kind === 'insufficient' ? [[true, "Said it didn't know instead of guessing"]] : [[true, 'Gave a general explanation'], [false, 'A learner said this answer didn\\'t help']])
      .concat([[/lesson|learn/i.test(sel.a), 'Offered a lesson or a way to learn more'], [!pii, 'No personal data in the answer']]);
    const decide = (d) => { A.decide(sel.id, sel.q, d, s.note.trim()); this.setState({ sel: null, note: '', n: s.n + 1 }); if (window.fvToast) window.fvToast(d === 'Escalated' ? 'Escalated to the content lead.' : 'Saved to the audit log.'); };
    return { empty: false, has: true, sel: sel, note: s.note, onNote: (e) => this.setState({ note: e.target.value }),
      items: items.map((x) => { const c = x.tag === 'Asks for a pick' ? ['#FFE6E6', '#B42828'] : x.tag === 'Thumbs down' ? ['#F5F3F8', '#38323F'] : ['#F1EBFB', '#4C1D95']; return { q: x.q, tag: x.tag, tbg: c[0], tfg: c[1], ago: x.ago || ago(x.at), bg: x.id === sel.id ? '#F1EBFB' : '#FFFFFF', pressed: x.id === sel.id ? 'true' : 'false', pick: () => this.setState({ sel: x.id, note: '' }) }; }),
      checks: checks.map((c) => ({ tag: c[0] ? 'Pass' : 'Check', bg: tagc(c[0] ? 'Pass' : 'Check')[0], fg: tagc(c[0] ? 'Pass' : 'Check')[1], text: c[1] })),
      fine: () => decide('Answer is fine'), better: () => decide('Needs a better answer'), escalate: () => decide('Escalated') };
  }
}''' % (TAGJS, AGO.replace("m + 'm ago'", "m + 'm'").replace("+ 'h ago'", "+ 'h'").replace("+ 'd ago'", "+ 'd'")))
    wr('UAAskKoboReview', mark(s))

# ---- AI summary approvals
s = rd('UAAISummaries')
if not done(s):
    s = main(s, '''      <sc-if value="{{empty}}" hint-placeholder-val="{{false}}"><section class="card" style="padding: 32px; display: flex; flex-direction: column; gap: 8px; align-items: flex-start"><h2 style="font-size: 18px">All summaries checked</h2><p class="muted" style="margin: 0">Nothing is waiting. Every decision is in the audit log.</p><a href="UAAudit.dc.html" class="btn btn-w">Open the audit log</a></section></sc-if>
      <sc-if value="{{has}}" hint-placeholder-val="{{true}}"><div style="display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 20px; align-items: start">
        <section class="card" style="overflow: hidden"><sc-for list="{{items}}" as="x" hint-placeholder-count="4"><button type="button" class="press" aria-pressed="{{x.pressed}}" onClick="{{x.pick}}" style="display: block; width: 100%%; text-align: left; border: 0; font: inherit; color: inherit; cursor: pointer; padding: 14px 16px; border-bottom: 1px solid #E7E2F0; background: {{x.bg}}"><span style="display:flex;justify-content:space-between"><span class="tag" style="background: #F1EBFB; color: #4C1D95">{{x.kind}}</span><span class="muted" style="font-size:12px">{{x.ago}}</span></span><strong style="display:block;margin-top:6px">{{x.title}}</strong></button></sc-for></section>
        <section class="card" style="padding: 24px; display: flex; flex-direction: column; gap: 16px">
          <div><span class="eyebrow">Source</span><p style="margin: 6px 0 0; font-weight: 700">{{sel.source}}</p></div>
          <sc-if value="{{reading}}" hint-placeholder-val="{{true}}"><div style="background: #F8F6FC; border: 1.5px solid #E7E2F0; border-radius: 14px; padding: 16px"><span class="eyebrow">Fin's summary</span><p style="margin: 6px 0 0; line-height: 1.6">{{text}}</p></div></sc-if>
          <sc-if value="{{editing}}" hint-placeholder-val="{{false}}"><label %s>%sFin's summary (your edit)</span><textarea rows="4" %s value="{{text}}" onInput="{{onText}}"></textarea></label></sc-if>
          <div style="display: flex; flex-direction: column; gap: 6px"><span class="eyebrow">Checks</span><sc-for list="{{checks}}" as="c" hint-placeholder-count="3"><span><span class="tag" style="background: {{c.bg}}; color: {{c.fg}}">{{c.tag}}</span> {{c.text}}</span></sc-for></div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap"><button class="btn" type="button" onClick="{{approve}}">Approve and publish</button><button class="btn btn-w" type="button" aria-pressed="{{editPressed}}" onClick="{{edit}}">{{editLabel}}</button><button class="btn btn-w" type="button" style="color: #B42828" onClick="{{reject}}">Reject</button></div>
        </section></div></sc-if>''' % (LBL, LT, TA))
    s = logic(s, '''class Component extends DCLogic {
  constructor(p) { super(p); this.state = { sel: null, editing: false, text: null }; }
  renderVals() {
    const A = window.FV && window.FV.ADMIN, s = this.state, items = A ? A.sumQueue() : [];
    %s
    if (!items.length) return { empty: true, has: false, items: [], checks: [], sel: {}, text: '' };
    const sel = items.filter((x) => x.id === s.sel)[0] || items[0], text = s.text !== null ? s.text : sel.text;
    const checks = [[true, 'Matches the source'], [!/\\b(buy|sell|you should)\\b/i.test(text), 'No advice to buy or sell']].concat(sel.flag ? [[false, sel.flag]] : []);
    const decide = (d) => { A.decideSum(sel, d, text); this.setState({ sel: null, editing: false, text: null }); if (window.fvToast) window.fvToast(d === 'Rejected' ? 'Rejected. Fin will not use this summary.' : 'Approved. The summary is live.'); };
    return { empty: false, has: true, sel: sel, text: text, editing: s.editing, reading: !s.editing, editLabel: s.editing ? 'Done editing' : 'Edit before approving', editPressed: s.editing ? 'true' : 'false',
      onText: (e) => this.setState({ text: e.target.value }), edit: () => this.setState({ editing: !s.editing, text: text }),
      items: items.map((x) => ({ kind: x.kind, title: x.title, ago: x.ago, bg: x.id === sel.id ? '#F1EBFB' : '#FFFFFF', pressed: x.id === sel.id ? 'true' : 'false', pick: () => this.setState({ sel: x.id, editing: false, text: null }) })),
      checks: checks.map((c) => ({ tag: c[0] ? 'Pass' : 'Check', bg: tagc(c[0] ? 'Pass' : 'Check')[0], fg: tagc(c[0] ? 'Pass' : 'Check')[1], text: c[1] })),
      approve: () => decide(s.text !== null && s.text !== sel.text ? 'Approved with edits' : 'Approved'), reject: () => decide('Rejected') };
  }
}''' % TAGJS)
    wr('UAAISummaries', mark(s))

# ---- Users and payments: the learner in this browser first, then the designed rows.
s = rd('UAUsers')
if not done(s):
    i = s.index('<div style="display: flex; gap: 10px; align-items: center"><input class="field" style="width: 420px"'); j = s.index('<p class="muted" style="margin: 0; font-size: 13px">Payment status comes only', i)
    s = s[:i] + '''<div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap"><input class="field" style="width: 420px; max-width: 100%" type="search" aria-label="Search by email or order number" placeholder="Search by email or order number" value="{{q}}" onInput="{{onQ}}"><sc-for list="{{chips}}" as="c" hint-placeholder-count="4"><button class="chip" type="button" aria-pressed="{{c.pressed}}" style="{{c.style}}" onClick="{{c.pick}}">{{c.label}}</button></sc-for></div>
      <section class="card" style="overflow: hidden"><table><tr><th>Learner</th><th>Plan</th><th>Last order</th><th>Amount</th><th>Payment</th><th></th></tr>
        <sc-for list="{{rows}}" as="r" hint-placeholder-count="5"><tr><td><strong style="display:block">{{r.name}}</strong><span class="muted" style="font-size:13px">{{r.email}}</span></td><td>{{r.plan}}</td><td class="num">{{r.order}}</td><td class="num">{{r.amount}}</td><td><sc-if value="{{r.hasPay}}" hint-placeholder-val="{{true}}"><span class="tag" style="background: {{r.bg}}; color: {{r.fg}}">{{r.status}}</span></sc-if><sc-if value="{{r.noPay}}" hint-placeholder-val="{{false}}"><span class="muted">No payments</span></sc-if></td><td><button class="chip" type="button" aria-expanded="{{r.expanded}}" onClick="{{r.view}}">{{r.viewLabel}}</button></td></tr>
          <sc-if value="{{r.open}}" hint-placeholder-val="{{false}}"><tr><td colspan="6" style="background: #F8F6FC"><div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px"><strong>Orders</strong><sc-for list="{{r.orders}}" as="o" hint-placeholder-count="1"><span class="num">{{o}}</span></sc-for><span class="muted" style="font-size: 13px">Read-only. Staff can't mark a payment as paid.</span></div></td></tr></sc-if></sc-for>
        <sc-if value="{{none}}" hint-placeholder-val="{{false}}"><tr><td colspan="6" class="muted" style="padding: 24px 16px">No learners match. Try another email, order number or filter.</td></tr></sc-if></table></section>
      ''' + s[j:]
    s = logic(s, '''class Component extends DCLogic {
  constructor(p) { super(p); this.state = { q: '', f: 'All', open: '' }; }
  renderVals() {
    const FV = window.FV, s = this.state;
    %s
    const st = (x) => x === 'confirmedSuccess' ? 'Confirmed' : x === 'confirmedFailed' ? 'Failed' : 'Pending';
    const naira = (k) => window.FVD ? window.FVD.formatNaira(k).replace(/\\.00$/, '') : '';
    const rows = [];
    if (FV && FV.AUTH && FV.AUTH.get().email) {
      const a = FV.AUTH.get(), orders = FV.billing ? FV.billing().orders : [], o = orders[0], plus = FV.plan && FV.plan() === 'plus';
      rows.push({ id: 'me', name: (a.name || 'You') + ' (this browser)', email: a.email, plan: plus ? 'Plus ' + ((FV.billing().sub || {}).period || 'monthly') : 'Free', order: o ? FV.PAY.orderNo(o) : '', amount: o ? naira(o.amountKobo) : '', status: o ? st(o.status) : '',
        orders: orders.map((x) => FV.PAY.orderNo(x) + ' · ' + naira(x.amountKobo) + ' · ' + st(x.status) + ' · ' + (x.attempts || 1) + (x.attempts === 1 || !x.attempts ? ' attempt' : ' attempts')) });
    }
    [['Ada Okafor', 'ada@example.com', 'Plus monthly', 'FV-24117', '₦1,500', 'Confirmed'], ['Kwame Mensah', 'kwame@example.com', 'Plus yearly', 'FV-24109', '₦15,000', 'Pending'], ['Wanjiru Kamau', 'wanjiru@example.com', 'Free', '', '', ''], ['Tunde Bello', 'tunde@example.com', 'Plus monthly', 'FV-24098', '₦1,500', 'Failed'], ['Zainab Musa', 'zainab@example.com', 'Plus monthly', 'FV-24090', '₦1,500', 'Confirmed']]
      .forEach((r) => rows.push({ id: r[1], name: r[0], email: r[1], plan: r[2], order: r[3], amount: r[4], status: r[5], orders: r[3] ? [r[3] + ' · ' + r[4] + ' · ' + r[5] + ' · 1 attempt'] : ['No orders'] }));
    const F = { All: () => true, Plus: (r) => /^Plus/.test(r.plan), Pending: (r) => r.status === 'Pending', Failed: (r) => r.status === 'Failed' };
    const q = s.q.trim().toLowerCase(), list = rows.filter(F[s.f]).filter((r) => !q || (r.email + ' ' + r.order + ' ' + r.name).toLowerCase().indexOf(q) >= 0);
    return { q: s.q, onQ: (e) => this.setState({ q: e.target.value }), none: !list.length,
      chips: Object.keys(F).map((k) => ({ label: k, pressed: s.f === k ? 'true' : 'false', style: s.f === k ? '%s' : '', pick: () => this.setState({ f: k }) })),
      rows: list.map((r) => ({ name: r.name, email: r.email, plan: r.plan, order: r.order, amount: r.amount, status: r.status, hasPay: !!r.status, noPay: !r.status, bg: tagc(r.status)[0], fg: tagc(r.status)[1],
        orders: r.orders, open: s.open === r.id, expanded: s.open === r.id ? 'true' : 'false', viewLabel: s.open === r.id ? 'Hide' : 'View', view: () => this.setState({ open: s.open === r.id ? '' : r.id }) })) };
  }
}''' % (TAGJS, ON))
    wr('UAUsers', mark(s))

# ---- Plans: prices in kobo; a saved price is what new checkouts charge.
s = rd('UAPlans')
if not done(s):
    s = s.replace('<button class="btn btn-w" type="button">View change log</button><button class="btn" type="button">Save changes</button>', '<a href="UAAudit.dc.html" class="btn btn-w">View change log</a><button class="btn" type="button" onClick="{{save}}">Save changes</button>')
    s = s.replace('<div class="num" style="font-size: 28px; font-weight: 800">₦1,500<span', '<div class="num" style="font-size: 28px; font-weight: 800">{{mNaira}}<span')
    s = s.replace('<input class="field num" style="height: 34px; width: 140px" value="150000">', '<input class="field num" inputmode="numeric" style="height: 34px; width: 140px" value="{{m}}" onInput="{{onM}}">')
    s = s.replace('<div class="num" style="font-size: 28px; font-weight: 800">₦15,000<span', '<div class="num" style="font-size: 28px; font-weight: 800">{{yNaira}}<span')
    s = s.replace('<input class="field num" style="height: 34px; width: 140px" value="1500000">', '<input class="field num" inputmode="numeric" style="height: 34px; width: 140px" value="{{y}}" onInput="{{onY}}">')
    s = s.replace('<td>Ask Fin questions per day</td><td><span style="font-weight: 700">5</span>', '<td>Ask Fin questions per day</td><td><span style="font-weight: 700">{{askFree}}</span>')
    s = s.replace('<div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16px">', ERR + '\n      <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16px">', 1)
    s = logic(s, '''class Component extends DCLogic {
  constructor(p) { super(p); const A = window.FV && window.FV.ADMIN, pr = A ? A.prices() : { monthly: 150000, yearly: 1500000 }; this.state = { m: String(pr.monthly), y: String(pr.yearly), err: '' }; }
  renderVals() {
    const FV = window.FV, A = FV && FV.ADMIN, s = this.state;
    const ok = (v) => /^\\d+$/.test(v) && +v >= 10000 && +v <= 100000000 && +v % 100 === 0;
    const naira = (v) => ok(v) && window.FVD ? window.FVD.formatNaira(+v).replace(/\\.00$/, '') : 'Check the price';
    return { m: s.m, y: s.y, mNaira: naira(s.m), yNaira: naira(s.y), err: s.err, hasErr: !!s.err,
      askFree: window.FVD ? window.FVD.entitlements('free').askFinDailyLimit : 5,
      onM: (e) => this.setState({ m: e.target.value.replace(/\\D/g, ''), err: '' }), onY: (e) => this.setState({ y: e.target.value.replace(/\\D/g, ''), err: '' }),
      save: () => {
        if (!ok(s.m) || !ok(s.y)) { this.setState({ err: 'Prices are whole naira in kobo: at least 10000 (₦100), and ending in 00.' }); return; }
        A.savePrices({ monthly: +s.m, yearly: +s.y }); if (window.fvToast) window.fvToast('Saved. New checkouts use these prices.');
      } };
  }
}''')
    wr('UAPlans', mark(s))

# ---- Daily question preview (?dq=N) never counts as the learner's answer.
for n in ['UPDaily', 'UDyPDaily']:
    s = rd(n)
    s = s.replace('if (LP) LP.dailyAnswer(', 'if (LP && !/[?&]dq=/.test(location.search)) LP.dailyAnswer(')
    wr(n, s)
print('admin boards wired')
