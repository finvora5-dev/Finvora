"""Lesson steps: progress bars show "n of total", Continue goes to the lesson's next screen, and the
compare, order and scenario screens play the lesson's own content when used inside a lesson (?in=1).
Content lives in fv.js (CONTENT[id].flow / compare / order / scenario). Usage: python3 wire_flow.py <site folder>"""
import re, sys, os
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing: ' + a[:90])
    return s.replace(a, b, 1)
def resub(s, pat, rep):
    n = re.subn(pat, rep, s, count=1, flags=re.S)
    if not n[1]: raise SystemExit('pattern not found: ' + pat[:80])
    return n[0]
def wrap_render(s, kind, extra=''):
    """Rename renderVals to _rv and add one that merges in the step values."""
    a = s.index('class Component extends DCLogic {'); b = s.index('</script>', a)
    body = s[a:b].replace('  renderVals() {', '  _rv() {', 1)
    body = body.rstrip()
    assert body.endswith('}')
    body = body[:-1] + "  renderVals() { const F = window.FV, base = this._rv() || {}; " + extra + "return F && F.flowVals && (F.inLesson() || ['compare', 'myth'].indexOf('%s') < 0) ? Object.assign({}, base, F.flowVals('%s')) : Object.assign({ nextHref: 'UPLessonComplete.dc.html', fLabel: '', fN: '1', fTotal: '1', fPct: '100%%', fFrom: '0%%', fText: '' }, base); }\n}\n" % (kind, kind)
    return s[:a] + body + s[b:]
def progress(s):
    s = resub(s, r'aria-valuemax="3" aria-valuenow="\d"( aria-valuetext="Step \d of 3")?', 'aria-valuemax="{{fTotal}}" aria-valuenow="{{fN}}" aria-valuetext="{{fText}}"')
    s = resub(s, r'(role="progressbar".*?<div (?:class="fill" )?style=")(?:--from: [\d.]+%; )?width: [\d.]+%;', r'\1--from: {{fFrom}}; width: {{fPct}};')
    s = resub(s, r'(</div></div>\s*<span style="font-size: 14px; font-weight: 700; color: #615A6E">)(?:\d/3)?(</span>)', r'\1{{fLabel}}\2')
    return s
MARK = 'flowVals'
for n, kind, cont in (('UPLessonInfo', 'info', '<a href="UPLessonChoice.dc.html" class="btn b-blue">Continue</a>'),
                      ('UPLessonChoice', 'choice', '<a href="UPLessonCalc.dc.html" class="btn b-green">Continue</a>'),
                      ('UPLessonCalc', 'calc', '<a href="UPLessonComplete.dc.html" class="btn b-green" style="margin-top: 2px">Continue</a>')):
    s = rd(n)
    if MARK in s: continue
    s = progress(s)
    s = sub1(s, cont, cont.replace(cont[cont.index('href="'):cont.index('" class')+0], 'href="{{nextHref}}'))
    wr(n, wrap_render(s, kind))

# Compare (quick learn): the lesson's comparison when inside a lesson, else the original micro module.
s = rd('UPLearnCompare')
if MARK not in s:
    s = progress(s)
    s = sub1(s, '>Saving vs investing</h1>', '>{{cTitle}}</h1>')
    s = sub1(s, '>Both put money to work, but they suit different goals and different amounts of risk.</p>', '>{{cLead}}</p>')
    s = resub(s, r'(<strong[^>]*>)Saving(</strong>)', r'\1{{cA}}\2')
    s = resub(s, r'(<strong[^>]*>)Investing(</strong>)', r'\1{{cB}}\2')
    for i, t in enumerate(['Money is kept safe', 'Small, steady return', 'Easy to reach', 'For short-term goals']):
        s = resub(s, r'(</span>)' + re.escape(t) + r'(</li>)', r'\1{{ca%d}}\2' % i)
    for i, t in enumerate(['Value can rise or fall', 'May grow more over years', 'Can take time to sell', 'For long-term goals']):
        s = resub(s, r'(</span>)' + re.escape(t) + r'(</li>)', r'\1{{cb%d}}\2' % i)
    s = sub1(s, '>Many people do both: savings for emergencies, investments for the long run.</p>', '>{{cTip}}</p>')
    s = sub1(s, '<a href="{{back}}" onClick="{{finish}}" class="btn b-blue">{{doneLabel}}</a>', '<a href="{{goHref}}" onClick="{{goTap}}" class="btn b-blue">{{goLabel}}</a>')
    s = s.replace('aria-label="Close"', 'aria-label="{{closeLabel}}"', 1).replace('<a href="UPJourney.dc.html" class="press" aria-label="{{closeLabel}}"', '<a href="{{closeHref}}" class="press" aria-label="{{closeLabel}}"', 1)
    extra = """const L = F && F.lesson ? F.lesson() : null, C = L && L.c && L.c.compare, inL = F && F.inLesson() && C;
    const D = { title: 'Saving vs investing', lead: 'Both put money to work, but they suit different goals and different amounts of risk.', a: { name: 'Saving', items: ['Money is kept safe', 'Small, steady return', 'Easy to reach', 'For short-term goals'] }, b: { name: 'Investing', items: ['Value can rise or fall', 'May grow more over years', 'Can take time to sell', 'For long-term goals'] }, tip: 'Many people do both: savings for emergencies, investments for the long run.' }, X = inL ? C : D;
    Object.assign(base, { cTitle: X.title, cLead: X.lead, cA: X.a.name, cB: X.b.name, cTip: X.tip, closeHref: inL ? 'UMLeaveLesson.dc.html' : 'UPJourney.dc.html', closeLabel: inL ? 'Close lesson and return to the journey' : 'Close',
      goHref: inL ? F.flowVals('compare').nextHref : base.back, goTap: inL ? null : base.finish, goLabel: inL ? 'Continue' : base.doneLabel });
    X.a.items.forEach((t, i) => { base['ca' + i] = t; }); X.b.items.forEach((t, i) => { base['cb' + i] = t; });
    """
    wr('UPLearnCompare', wrap_render(s, 'compare', extra))

# Order: the lesson's items, scored on the first check.
s = rd('UPLessonOrder')
if MARK not in s:
    s = progress(s)
    s = resub(s, r'(<h1 id="q"[^>]*>)Start with ₦10,000\. Order these from least to most money after 10 years at 10% a year\.(</h1>)', r'\1{{oQ}}\2')
    s = sub1(s, '>Cash never grows. Simple interest adds the same ₦1,000 every year. Compound interest adds a little more each year, because past interest earns interest too. Move the items and check again.</p>', '>{{oWrong}}</p>')
    a = s.index('<li>Cash: ₦10,000. It earns nothing.</li>'); b = s.index('</ul>', a)
    s = s[:a] + '<sc-for list="{{oRight}}" as="r" hint-placeholder-count="3"><li>{{r}}</li></sc-for>' + s[b:]
    s = resub(s, r'(<p[^>]*>)Assumes 10% every year, no withdrawals, no tax or fees, and ignores inflation\.(</p>)', r'\1{{oNote}}\2')
    s = sub1(s, '>Least money<', '>{{oLeast}}<'); s = sub1(s, '>Most money<', '>{{oMost}}<')
    s = sub1(s, '<a href="UPLessonMatch.dc.html" class="btn b-green" style="margin-top: 2px">Continue</a>', '<a href="{{nextHref}}" class="btn b-green" style="margin-top: 2px">Continue</a>')
    s = sub1(s, "this.state = { order: [0, 2, 1],", "const O0 = window.FV && window.FV.lesson && window.FV.lesson().c && window.FV.lesson().c.order; this.state = { order: O0 ? O0.start.slice() : [0, 2, 1],")
    s = sub1(s, "    const L = [\n      { label: 'Keep it as cash',", "    const LS = window.FV && window.FV.lesson ? window.FV.lesson() : null, O = LS && LS.c && LS.c.order;\n    const L = O ? O.items.map((x, i) => ({ label: x[0], sub: x[1], amt: x[2], key: ['isCash', 'isSimple', 'isCompound'][i] })) : [\n      { label: 'Keep it as cash',")
    s = sub1(s, "      check: () => this.setState({ checked: true }),", "      check: () => { if (window.FV) window.FV.answer('order', right, s.order.map((k) => L[k].label).join(', ')); this.setState({ checked: true }); },")
    s = sub1(s, "      listCls: good ? 'pop' : bad ? 'shake' : '',", "      oLeast: O && O.ends ? O.ends[0] : 'Least money', oMost: O && O.ends ? O.ends[1] : 'Most money',\n      oQ: O ? O.q : 'Start with \\u20a610,000. Order these from least to most money after 10 years at 10% a year.', oWrong: O ? O.wrong : 'Cash never grows. Simple interest adds the same \\u20a61,000 every year. Compound interest adds a little more each year, because past interest earns interest too. Move the items and check again.',\n      oRight: O ? O.right : ['Cash: \\u20a610,000. It earns nothing.', 'Simple: \\u20a620,000. \\u20a61,000 a year for 10 years.', 'Compound: \\u20a625,937. \\u20a610,000 \\u00d7 1.1\\u00b9\\u2070 = \\u20a625,937.42.'], oNote: O ? O.note : 'Assumes 10% every year, no withdrawals, no tax or fees, and ignores inflation.',\n      listCls: good ? 'pop' : bad ? 'shake' : '',")
    wr('UPLessonOrder', wrap_render(s, 'order'))

# Scenario: the lesson's situation and options.
s = rd('UPLessonScenario')
if MARK not in s:
    s = progress(s)
    s = resub(s, r'(<h1 id="q"[^>]*>)Which savings option should Tolu choose\?(</h1>)', r'\1{{sQ}}\2')
    s = sub1(s, 'I have <strong class="num">₦200,000</strong>. I need it for a new laptop in <strong>3 months</strong>.', '{{s0}}<strong class="num">{{s1}}</strong>{{s2}}<strong>{{s3}}</strong>{{s4}}')
    s = resub(s, r'(<p class="in"[^>]*>)Both options are made up for this lesson\. Rates are fixed; tax and fees are ignored\.(</p>)', r'\1{{sNote}}\2')
    s = sub1(s, '<a href="UPLessonComplete.dc.html" class="btn b-green">Continue</a>', '<a href="{{nextHref}}" class="btn b-green">Continue</a>')
    s = sub1(s, "    const opts = [\n", "    const LS = window.FV && window.FV.lesson ? window.FV.lesson() : null, SC = LS && LS.c && LS.c.scenario;\n    const opts0 = [\n")
    s = resub(s, r"(const opts0 = \[.*?\n    \];)", r"\1\n    const IC = [opts0[0].icon, opts0[1].icon], CO = [opts0[0].col, opts0[1].col];\n    const opts = SC ? SC.opts.map((o, i) => ({ name: o.name, rate: o.rate, access: o.access, icon: IC[i % 2], col: CO[i % 2], right: !!o.right, why: o.why, explain: o.why })) : opts0;")
    s = sub1(s, "wrongText: wrong ? picked.why : '', rightText: opts[1].explain,", "wrongText: wrong ? picked.why : '', rightText: (opts.find((o) => o.right) || opts[1]).explain,\n      sQ: SC ? SC.q : 'Which savings option should Tolu choose?', sNote: SC ? SC.note : 'Both options are made up for this lesson. Rates are fixed; tax and fees are ignored.',\n      s0: SC ? SC.say[0] : 'I have ', s1: SC ? SC.say[1] : '\\u20a6200,000', s2: SC ? SC.say[2] : '. I need it for a new laptop in ', s3: SC ? SC.say[3] : '3 months', s4: SC ? SC.say[4] : '.',")
    s = sub1(s, "check: () => { if (s.pick !== null) this.setState({ checked: true }); },", "check: () => { if (s.pick !== null) { if (window.FV) window.FV.answer('scenario', !!opts[s.pick].right, opts[s.pick].name + ': ' + opts[s.pick].access); this.setState({ checked: true }); } },")
    wr('UPLessonScenario', wrap_render(s, 'scenario'))
print('lesson steps wired')

# Myth or fact (quick learn): the lesson's myth when inside a lesson, else the original micro module.
s = rd('UPLearnMyth')
if MARK not in s:
    s = progress(s)
    s = sub1(s, '>Myth or fact?</h1>', '>{{mTitle}}</h1>')
    s = sub1(s, '>A quick myth that stops many people from learning about investing.</p>', '>{{mLead}}</p>')
    s = sub1(s, '>"You need lots of money to start investing."</p>', '>“{{mMyth}}”</p>')
    s = sub1(s, '>Some investments let you start with small amounts. Understanding the risk matters more than the size.</p>', '>{{mFact}}</p>')
    s = sub1(s, '>Learning comes first. Finvora never tells you what to buy.</p>', '>{{mTip}}</p>')
    s = sub1(s, '<a href="{{back}}" onClick="{{finish}}" class="btn b-blue">{{doneLabel}}</a>', '<a href="{{goHref}}" onClick="{{goTap}}" class="btn b-blue">{{goLabel}}</a>')
    s = s.replace('<a href="UPJourney.dc.html" class="press" aria-label="Close"', '<a href="{{closeHref}}" class="press" aria-label="{{closeLabel}}"', 1)
    extra = """const L = F && F.lesson ? F.lesson() : null, M = L && L.c && L.c.myth, inL = F && F.inLesson() && M;
    const X = inL ? M : { title: 'Myth or fact?', lead: 'A quick myth that stops many people from learning about investing.', myth: 'You need lots of money to start investing.', fact: 'Some investments let you start with small amounts. Understanding the risk matters more than the size.', tip: 'Learning comes first. Finvora never tells you what to buy.' };
    Object.assign(base, { mTitle: X.title, mLead: X.lead, mMyth: X.myth, mFact: X.fact, mTip: X.tip, closeHref: inL ? 'UMLeaveLesson.dc.html' : 'UPJourney.dc.html', closeLabel: inL ? 'Close lesson and return to the journey' : 'Close',
      goHref: inL ? F.flowVals('myth').nextHref : base.back, goTap: inL ? null : base.finish, goLabel: inL ? 'Continue' : base.doneLabel });
    """
    wr('UPLearnMyth', wrap_render(s, 'myth', extra))
    print('myth wired')

# Match the pairs: the lesson's four words, scored on the first try (no wrong taps).
s = rd('UPLessonMatch')
if MARK not in s:
    s = progress(s)
    s = sub1(s, '>These four words are the building blocks of every interest calculation.</p>', '>{{mDone}}</p>')
    s = sub1(s, '<a href="UPLessonCalc.dc.html" class="btn b-green">Continue</a>', '<a href="{{nextHref}}" class="btn b-green">Continue</a>')
    s = sub1(s, "this.state = { sel: null, done: [], miss: null, last: null };", "this.state = { sel: null, done: [], miss: null, last: null, misses: 0 };")
    s = sub1(s, "    const T = ['Principal', 'Interest rate', 'Compounding', 'Time horizon'];\n    const M = [{ k: 2, t: 'Earning interest on past interest' }, { k: 0, t: 'The money you start with' }, { k: 3, t: 'How long the money stays invested' }, { k: 1, t: 'The % paid per year' }];",
        "    const LS = window.FV && window.FV.lesson ? window.FV.lesson() : null, MC = LS && LS.c && LS.c.match;\n    const T = MC ? MC.terms : ['Principal', 'Interest rate', 'Compounding', 'Time horizon'];\n    const M = MC ? [2, 0, 3, 1].map((k) => ({ k: k, t: MC.means[k] })) : [{ k: 2, t: 'Earning interest on past interest' }, { k: 0, t: 'The money you start with' }, { k: 3, t: 'How long the money stays invested' }, { k: 1, t: 'The % paid per year' }];")
    s = sub1(s, "if (m.k === s.sel) this.setState({ done: s.done.concat([m.k]), last: m.k, sel: null, miss: null }); else this.setState({ miss: j });",
        "if (m.k === s.sel) { const nd = s.done.concat([m.k]); if (nd.length === 4 && window.FV) window.FV.answer('match', s.misses === 0, s.misses ? s.misses + ' wrong taps' : 'All matched first time'); this.setState({ done: nd, last: m.k, sel: null, miss: null }); } else this.setState({ miss: j, misses: s.misses + 1 });")
    s = sub1(s, "      showRight: all\n", "      showRight: all, mDone: MC ? MC.done : 'These four words are the building blocks of every interest calculation.'\n")
    wr('UPLessonMatch', wrap_render(s, 'match'))
    print('match wired')
