"""Wire the navy learning boards to window.FV (lesson progress) and the lesson content in fv.js (CONTENT),
the content the earlier approved prototype used for the six Money Foundations lessons.
Steps follow each lesson's content flow; a step type plays on its navy board (STEP_BOARD below).
Step types not wired yet are skipped (WIRED) so a lesson never lands on a drawn-only screen.
Results show in the bottom sheet for right and wrong answers (owner preference).
Usage: python3 wire_navy_lessons.py <site folder>"""
import os, re, sys
SITE = sys.argv[1]
def path(n): return os.path.join(SITE, n)
def rd(n): return open(path(n + '.dc.html')).read()
def wr(n, s): open(path(n + '.dc.html'), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing in board: ' + a[:110])
    return s.replace(a, b, 1)
def logic(s, js):
    a = s.index('class Component extends DCLogic'); b = s.index('</script>', a)
    return s[:a] + 'class Component extends DCLogic {\n' + js + '\n}\n' + s[b:]
def between(s, a, b, new):
    i = s.index(a); j = s.index(b, i) + len(b); return s[:i] + new + s[j:]
MARK = '/* navy-lessons */'
WIRED = ['info', 'choice', 'calc']

# 1. fv.js: navy boards for each step type, Lesson complete at the end, and only wired step types.
f = open(path('fv.js')).read()
if 'NAVY_STEPS' not in f:
    f = sub1(f, 'var STEP_BOARD = { info: "UPLessonInfo", compare: "UPLearnCompare", term: "UPLearnTerm", steps: "UPLearnSteps", market: "UPLearnMarket", myth: "UPLearnMyth", choice: "UPLessonChoice", order: "UPLessonOrder", match: "UPLessonMatch", scenario: "UPLessonScenario", calc: "UPLessonCalc" };',
        'var STEP_BOARD = { info: "LessonInfoNavy", compare: "LearnCompareNavy", term: "LearnTermNavy", steps: "LearnStepsNavy", market: "LearnMarketNavy", myth: "LearnMythNavy", choice: "LessonNavy", order: "LessonOrderNavy", match: "LessonMatchNavy", scenario: "LessonScenarioNavy", calc: "LessonCalcNavy" };\n  var NAVY_STEPS = ' + str(WIRED).replace("'", '"') + ';')
    f = sub1(f, '/UPLesson(Info|Choice|Calc|Order|Scenario|Match)/.test(location.pathname)', '/(Lesson(Info|Calc|Order|Scenario|Match)?|LearnMyth|LearnCompare)Navy/.test(location.pathname)')
    f = sub1(f, 'function flowOf(id) { var c = CONTENT[id]; return (c && c.flow) || (id === "interest" ? ["info", "choice", "order", "match", "scenario", "calc"] : ["info", "choice", "calc"]); }',
        'function flowOf(id) { var c = CONTENT[id], fl = (c && c.flow) || (id === "interest" ? ["info", "choice", "order", "match", "scenario", "calc"] : ["info", "choice", "calc"]); return fl.filter(function (k) { return NAVY_STEPS.indexOf(k) >= 0; }); }')
    f = sub1(f, '(rev ? "UPReviewDone.dc.html" : "UPCelebrate.dc.html")', '"LessonDoneNavy.dc.html"')
    f = sub1(f, 'if (s.run.review && /LessonInfo/.test(location.pathname))', 'if (s.run.review && /LessonInfoNavy/.test(location.pathname))')
    open(path('fv.js'), 'w').write(f)
else:
    f = re.sub(r'var NAVY_STEPS = \[[^\]]*\];', 'var NAVY_STEPS = ' + str(WIRED).replace("'", '"') + ';', f)
    open(path('fv.js'), 'w').write(f)

BAR = '<span style="flex: 1; display: flex; gap: 5px" role="img" aria-label="{{fText}}"><sc-for list="{{bars}}" as="b" hint-placeholder-count="5"><span style="flex: 1; height: 5px; border-radius: 999px; background: {{b.c}}"></span></sc-for></span>'
HELP = '''  F() { return window.FV; }
  L() { return this.F() ? this.F().lesson() : { title: '', c: null, index: 0 }; }
  flow(kind) {
    const F = this.F(); if (!F) return { fText: '', bars: [], next: 'LessonDoneNavy.dc.html', n: 1, total: 1 };
    const v = F.flowVals(kind), n = +v.fN, t = +v.fTotal;
    return { fText: v.fText, next: v.nextHref, n, total: t, bars: Array.from({ length: t }, (_, i) => ({ c: i < n - 1 ? '#10B981' : i === n - 1 ? '#0B192C' : '#E2E5EA' })) };
  }
'''
def bars(s):
    a = s.index('<span style="flex: 1; display: flex; gap: 5px" role="img" aria-label="'); b = s.index('</span></span>', a) + len('</span></span>')
    return s[:a] + BAR + s[b:]

# 2. Learn: lesson states from progress; Continue starts the next lesson.
s = rd('LearnNavy')
if MARK not in s:
    s = sub1(s, '<a href="#" style="height: 48px; border-radius: 12px; background: #0B192C;', '<a href="LessonInfoNavy.dc.html" style="height: 48px; border-radius: 12px; background: #0B192C;')
    s = sub1(s, 'Continue: Budgeting · 4 min', '{{cont}}')
    s = sub1(s, 'display: block; width: 33%; height: 100%; background: #10B981"></span></span><span style="font-family: \'Geist Mono\', monospace; font-size: 12px; color: #5B6577">2/6<', 'display: block; width: {{donePct}}; height: 100%; background: #10B981"></span></span><span style="font-family: \'Geist Mono\', monospace; font-size: 12px; color: #5B6577">{{doneN}}<')
    s = re.sub(r"(>COURSE 1 OF 6[^<]*<|>Course 1 of 6[^<]*<)", lambda m: m.group(0), s)
    s = logic(s, MARK + '''
  renderVals() {
    const F = window.FV, st = F ? F.get() : { done: 2 }, done = st.done || 0, LS = F ? F.LESSONS : [];
    const L = LS.map((x, i) => [x.title, i < done ? 'done' : i === done ? 'next' : 'locked', x.min + ' min']).concat([['Course review', done >= LS.length ? 'next' : 'locked', '8 questions']]);
    const cur = LS[done];
    return { cont: cur ? (done ? 'Continue: ' : 'Start: ') + cur.title + ' · ' + cur.min + ' min' : 'Start the course review', donePct: Math.round(done / (LS.length || 6) * 100) + '%', doneN: done + '/' + (LS.length || 6),
      lessons: L.map(([t, st, d], i) => ({
      t, s: st === 'done' ? 'Completed · ' + d : st === 'next' ? 'Up next · ' + d : d,
      mark: st === 'done' ? '✓' : String(i + 1),
      bg: st === 'done' ? '#DDF3E6' : st === 'next' ? '#0B192C' : '#FFFFFF',
      fg: st === 'done' ? '#10B981' : st === 'next' ? '#FFFFFF' : '#5B6577',
      bd: st === 'locked' ? '1px solid #D5D9E0' : '0',
      ink: st === 'locked' ? '#5B6577' : '#0B192C', w: st === 'next' ? '600' : '500'
    })) };
  }''')
    wr('LearnNavy', s)

# 3. Lesson intro (info step): starts the run and shows the lesson's explanation.
s = rd('LessonInfoNavy')
if MARK not in s:
    s = bars(s)
    s = sub1(s, '>Inflation · Read<', '>{{kicker}}<')
    s = sub1(s, '>Prices rise, money buys less</h1>', '>{{title}}</h1>')
    s = sub1(s, '>Inflation is how fast prices go up. When inflation is 20%, something that cost ₦50,000 last year costs about ₦60,000 now.</p>', '>{{lead}}</p>')
    a = s.index('<div style="margin: 16px 24px 0; padding: 16px; border-radius: 16px; background: #FFFFFF;'); b = s.index('<div style="margin: 12px 24px 0; padding: 14px 16px; border-radius: 16px; background: #EAF6EF;', a)
    s = s[:a] + '<sc-if value="{{hasRows}}" hint-placeholder-val="{{ false }}"><div style="margin: 16px 24px 0; padding: 6px 16px 10px; border-radius: 16px; background: #FFFFFF; border: 1px solid #E5E7EB; flex: none"><p style="margin: 8px 0 4px; font-size: 13px; color: #5B6577">{{exTitle}}</p><sc-for list="{{rows}}" as="r" hint-placeholder-count="3"><div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 40px; border-top: 1px solid #EDEFF2; font-size: 14px"><span style="color: #5B6577">{{r.a}}</span><span style="font-family: \'Geist Mono\', monospace; color: #0B192C; white-space: nowrap">{{r.b}}</span></div></sc-for></div></sc-if><sc-if value="{{chart}}" hint-placeholder-val="{{ false }}">' + s[a:b] + '</sc-if>' + s[b:]
    s = sub1(s, '<b style="font-weight: 600; color: #0B192C">Why it matters:</b> money left in a box loses value each year. Saving and investing help you keep up.', '<b style="font-weight: 600; color: #0B192C">Why it matters:</b> {{tip}}')
    s = sub1(s, '>Ask Finvora: what is inflation in Nigeria now?<', '>Ask Finvora about {{topic}}<')
    s = sub1(s, '<a href="LessonCalcNavy.dc.html" style="flex: 1;', '<a href="{{next}}" style="flex: 1;')
    s = logic(s, MARK + HELP + '''  constructor(p) { super(p); if (window.FV && !/[?&]keep=1/.test(location.search)) window.FV.startRun(); }
  renderVals() {
    const L = this.L(), c = L.c, fl = this.flow('info');
    if (!c) return Object.assign(fl, { kicker: 'Interest · Read', title: 'Prices rise, money buys less', lead: 'Inflation is how fast prices go up. When inflation is 20%, something that cost ₦50,000 last year costs about ₦60,000 now.', chart: true, hasRows: false, rows: [], exTitle: '', tip: 'money left in a box loses value each year. Saving and investing help you keep up.', topic: L.title.toLowerCase() });
    return Object.assign(fl, { kicker: L.title + ' · Read', title: L.title, lead: c.lead, chart: false, hasRows: !!(c.rows && c.rows.length), exTitle: c.exTitle || '', rows: (c.rows || []).map(([a, b]) => ({ a, b })), tip: c.tip || '', topic: L.title.toLowerCase() });
  }''')
    wr('LessonInfoNavy', s)

# 4. Multiple choice (LessonNavy): the lesson's question, options and feedback; first try is scored.
s = rd('LessonNavy')
if MARK not in s:
    s = bars(s)
    s = sub1(s, '>Budgeting · Question 3 of 5<', '>{{kicker}}<')
    s = sub1(s, '>Ada earns ₦250,000 a month. Using the 50/30/20 rule, how much should she save?</h1>', '>{{q}}</h1>')
    s = sub1(s, '>The “20” in 50/30/20 is the savings share. Work out 20% of ₦250,000.</p>', '>{{hint}}</p>')
    s = sub1(s, '<span style="flex: 1; font-family: \'Geist Mono\', monospace; font-size: 17px">{{o.t}}</span>', '<span style="flex: 1; font-family: {{o.font}}; font-size: 17px">{{o.t}}</span>')
    s = between(s, '<div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 12px; background: #F8F9FA">', '</div>', '')
    s = sub1(s, '<a href="AskFinvoraNavy.dc.html" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; border: 1px solid #E5E7EB;', '<a href="AskFinvoraNavy.dc.html?q={{askQ}}" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; border: 1px solid #E5E7EB;')
    s = sub1(s, '<a href="LessonDoneNavy.dc.html" style="height: 54px;', '<a href="{{ctaHref}}" style="height: 54px;')
    s = logic(s, MARK + HELP + '''  constructor(p) { super(p); this.state = { g: null, hint: false }; }
  renderVals() {
    const L = this.L(), c = L.c, fl = this.flow('choice');
    const O = c ? c.opts.map((o) => o[0]) : ['₦25,000', '₦50,000', '₦75,000', '₦125,000'], R = c ? c.right : 1;
    const why = c ? c.opts.map((o) => o[1]) : ['', '', 'This is 30%, the share for wants, not savings.', ''];
    const g = this.state.g, done = g !== null, ok = g === R, money = O.every((t) => /^₦/.test(t));
    const pick = (i) => { if (done) return; if (this.F()) this.F().answer('choice', i === R, i); this.setState({ g: i }); };
    const q = c ? c.q : 'Ada earns ₦250,000 a month. Using the 50/30/20 rule, how much should she save?';
    return Object.assign(fl, {
      kicker: L.title + ' · Question ' + fl.n + ' of ' + fl.total, q, hint: (c && c.hint0) || '',
      opts: O.map((t, i) => {
        const right = done && i === R, wrong = g === i && !ok;
        return { t, on: String(g === i), pick: () => pick(i), font: money ? "'Geist Mono', monospace" : "'Geist', system-ui, sans-serif",
          bd: right ? '2px solid #10B981' : wrong ? '2px solid #B9473F' : '1px solid #D5D9E0',
          bg: right ? '#EAF6EF' : wrong ? '#FCEFED' : '#FFFFFF',
          dot: right || wrong ? '0' : '1.5px solid #C0C6D0', dotBg: right ? '#10B981' : wrong ? '#B9473F' : 'transparent',
          mark: right ? '✓' : wrong ? '×' : '', hasNote: false, note: '', noteC: '#334155' };
      }),
      answered: done, canHint: !done && !!(c && c.hint0), showHint: this.state.hint && !done,
      hintLabel: this.state.hint ? 'Hide hint' : 'Need a hint?', toggleHint: () => this.setState({ hint: !this.state.hint }),
      askTitle: 'Ask Finvora why ' + O[R] + ' is right', askQ: encodeURIComponent(q),
      iconBg: ok ? '#DDF3E6' : '#FCEDEB', tone: ok ? '#10B981' : '#B9473F', icon: ok ? '✓' : '×',
      title: ok ? 'Correct' : 'Not quite', sub: ok ? 'Question ' + fl.n + ' of ' + fl.total : 'The right answer is ' + O[R],
      why: ok ? (c ? c.rightText : '') : ((why[g] || '') + ' ' + (c ? c.rightText : '')).trim(),
      cta: ok ? 'Continue' : 'Got it, continue', ctaBg: '#0B192C', ctaHref: done ? fl.next : '#'
    });
  }''')
    wr('LessonNavy', s)

# 5. Calculation (LessonCalcNavy): typed answer, hint, known wrong answers explained, result in the sheet.
s = rd('LessonCalcNavy')
if MARK not in s:
    s = bars(s)
    s = sub1(s, '>Interest · Calculate<', '>{{kicker}}<')
    s = sub1(s, '>₦50,000 earns 10% simple interest a year. How much interest after 2 years?</h1>', '>{{q}}</h1>')
    a = s.index('<div style="margin: 16px 24px 0; padding: 6px 16px; border-radius: 16px; background: #FFFFFF;'); b = s.index('<div style="margin: 16px 24px 0; flex: none"><label for="ans"', a)
    s = s[:a] + '<sc-if value="{{hasRows}}" hint-placeholder-val="{{ false }}">' + s[a:b] + '</sc-if>' + s[b:]
    s = sub1(s, '<input id="ans" inputmode="numeric" value="10,000" style="', '<input id="ans" inputmode="numeric" autocomplete="off" aria-describedby="calc-hint" value="{{val}}" onInput="{{onVal}}" onKeyDown="{{onKey}}" style="')
    s = sub1(s, 'border: 2px solid #10B981; background: #FFFFFF"><span', 'border: {{fieldBd}}; background: #FFFFFF"><span')
    s = sub1(s, 'font-size: 22px; color: #5B6577">₦</span>', 'font-size: 22px; color: #5B6577">{{pre}}</span>')
    s = sub1(s, '<button style="height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid #D5D9E0; background: #FFFFFF; font: inherit; font-size: 13px; color: #0B192C">+000</button>', '<button type="button" onClick="{{zeros}}" style="height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid #D5D9E0; background: #FFFFFF; font: inherit; font-size: 13px; color: #0B192C; cursor: pointer">+000</button>')
    s = sub1(s, '<button style="height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid #D5D9E0; background: #FFFFFF; font: inherit; font-size: 13px; color: #0B192C">Clear</button></div></div>', '<button type="button" onClick="{{clear}}" style="height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid #D5D9E0; background: #FFFFFF; font: inherit; font-size: 13px; color: #0B192C; cursor: pointer">Clear</button></div><sc-if value="{{showHint}}" hint-placeholder-val="{{ false }}"><p id="calc-hint" style="margin: 12px 0 0; font-size: 14px; line-height: 1.5; color: #334155">{{hint}}</p></sc-if></div>')
    s = sub1(s, '<button style="flex: none; min-height: 54px; padding: 0 16px; border-radius: 14px; border: 1px solid #D5D9E0; background: #FFFFFF;', '<button type="button" onClick="{{toggleHint}}" aria-expanded="{{hintOpen}}" style="cursor: pointer; flex: none; min-height: 54px; padding: 0 16px; border-radius: 14px; border: 1px solid #D5D9E0; background: #FFFFFF;')
    s = sub1(s, '<a href="LessonMatchNavy.dc.html" style="flex: 1; height: 54px; border-radius: 14px; background: #0B192C;', '<a href="#" onClick="{{check}}" aria-disabled="{{empty}}" style="flex: 1; height: 54px; border-radius: 14px; background: {{ctaBg}};')
    # result sheet, copied from the choice board's sheet
    sheet = rd('LessonNavy')
    i = sheet.index('<sc-if value="{{answered}}"'); j = sheet.index('</sc-if>', sheet.index('</section>', i)) + len('</sc-if>')
    sh = sheet[i:j]
    k = s.rindex('</div>\n</x-dc>') if '</div>\n</x-dc>' in s else s.rindex('</div>', 0, s.index('</x-dc>'))
    s = s[:k] + sh + s[k:]
    s = logic(s, MARK + HELP + '''  constructor(p) { super(p); this.state = { v: '', res: null, hint: false }; }
  num() { return +String(this.state.v).replace(/[^0-9.]/g, ''); }
  check() {
    if (this.state.res || !String(this.state.v).trim()) return;
    const c = this.L().c, ans = c ? c.answer : 10000, n = this.num(), ok = Math.abs(n - ans) <= 0.5;
    if (this.F()) this.F().answer('calc', ok, n);
    this.setState({ res: { ok, n } });
  }
  renderVals() {
    const L = this.L(), c = L.c, fl = this.flow('calc'), r = this.state.res, ok = !!(r && r.ok);
    const ans = c ? c.answer : 10000, kobo = !!(c && c.unit === 'kobo'), fmt = (x) => kobo ? Number(x).toLocaleString('en-NG') + ' kobo' : '₦' + Number(x).toLocaleString('en-NG');
    const wrongWhy = r && !ok && c && c.wrongs && c.wrongs[r.n] ? c.wrongs[r.n] + ' ' : '';
    const q = c ? c.calc : '₦50,000 earns 10% simple interest a year. How much interest after 2 years?';
    return Object.assign(fl, {
      kicker: L.title + ' · Calculate', q, pre: kobo ? 'k' : '₦', hasRows: !c, val: this.state.v, empty: String(!String(this.state.v).trim()),
      fieldBd: this.state.v ? '2px solid #10B981' : '1px solid #D5D9E0', ctaBg: String(this.state.v).trim() ? '#0B192C' : '#9AA3B2',
      onVal: (e) => { const d = e.target.value.replace(/[^0-9]/g, ''); this.setState({ v: d ? Number(d).toLocaleString('en-NG') : '' }); },
      onKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); this.check(); } },
      zeros: () => this.setState({ v: Number((this.num() || 0) + '000').toLocaleString('en-NG') }), clear: () => this.setState({ v: '' }),
      hint: (c && c.hint) || 'Interest each year is 10% of ₦50,000. Then multiply by the number of years.', showHint: this.state.hint && !r, hintOpen: String(this.state.hint), toggleHint: () => this.setState({ hint: !this.state.hint }),
      check: (e) => { e.preventDefault(); this.check(); },
      answered: !!r, iconBg: ok ? '#DDF3E6' : '#FCEDEB', tone: ok ? '#10B981' : '#B9473F', icon: ok ? '✓' : '×',
      title: ok ? 'Correct' : 'Not quite', sub: ok ? 'Question ' + fl.n + ' of ' + fl.total : 'The right answer is ' + fmt(ans),
      why: (ok ? '' : wrongWhy) + ((c && c.calcRight) || '') + (c && c.calcNote ? ' ' + c.calcNote : ''),
      askTitle: 'Ask Finvora to explain this sum', askQ: encodeURIComponent(q),
      cta: ok ? 'Continue' : 'Got it, continue', ctaHref: r ? fl.next : '#'
    });
  }''')
    wr('LessonCalcNavy', s)

# 6. Lesson complete: scores the run, shows correct answers, time, days in a row and what was learned.
s = rd('LessonDoneNavy')
if MARK not in s:
    s = sub1(s, '>Budgeting complete</h1>', '>{{title}} complete</h1>')
    s = sub1(s, '>Lesson 3 of 6 · Money Foundations<', '>Lesson {{n}} of 6 · Money Foundations<')
    s = sub1(s, 'color: #047857">4/5</span>', 'color: #047857">{{score}}</span>')
    s = sub1(s, 'color: #0B192C">3:52</span>', 'color: #0B192C">{{time}}</span>')
    s = sub1(s, 'color: #0B192C">7</span><span style="font-size: 12px; color: #5B6577">Days in a row', 'color: #0B192C">{{days}}</span><span style="font-size: 12px; color: #5B6577">Days in a row')
    a = s.index('<div style="display: flex; gap: 10px; padding-top: 10px;'); b = s.rindex('</div>', 0, s.index('<a href="AskFinvoraNavy.dc.html"', a))
    s = s[:a] + '<sc-for list="{{learned}}" as="x" hint-placeholder-count="3"><div style="display: flex; gap: 10px; padding-top: 10px; font-size: 14px; line-height: 1.5; color: #334155"><span style="font-family: \'Geist Mono\', monospace; color: #047857">{{x.i}}</span>{{x.t}}</div></sc-for>' + s[b:]
    s = sub1(s, '>Ask Finvora to build my 50/30/20 budget<', '>Ask Finvora about {{topic}}<')
    s = sub1(s, '<a href="LessonInfoNavy.dc.html" style="height: 54px;', '<a href="{{nextHref}}" style="height: 54px;')
    s = sub1(s, '>Next: Inflation · 5 min</a>', '>{{nextLabel}}</a>')
    s = logic(s, MARK + '''  constructor(p) { super(p); const F = window.FV; let r = F ? F.finishRun() : null; if (!r && F) r = F.lastRun(); this.state = { r }; }
  renderVals() {
    const F = window.FV, r = this.state.r, LS = F ? F.LESSONS : [], st = F ? F.get() : { done: 0 }, L = r ? r.lesson : (F ? F.lesson() : { title: 'Lesson', index: 0, c: null });
    const c = L.c || (F ? (F.lesson().c) : null), nx = LS[st.done], secs = r ? r.secs : 0;
    const learned = ((c && c.learned) || []).map((t, i) => ({ i: String(i + 1), t }));
    return { title: L.title, n: String((L.index || 0) + 1), score: r ? r.right + '/' + r.total : '0/0', time: Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0'),
      days: String(F ? F.streak() : 1), learned, topic: L.title.toLowerCase(),
      nextHref: nx ? 'LessonInfoNavy.dc.html' : 'LearnNavy.dc.html', nextLabel: nx ? 'Next: ' + nx.title + ' · ' + nx.min + ' min' : 'Back to Learn' };
  }''')
    wr('LessonDoneNavy', s)
print('wired', WIRED)
