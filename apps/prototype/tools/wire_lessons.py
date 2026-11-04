"""Make the lesson screens (Info, Choice, Calc, Lesson complete) play whichever World 1 lesson you're on.
Content lives in fv.js (CONTENT). "Simple and compound interest" keeps its designed visuals.
Usage: python3 wire_lessons.py <site folder>"""
import re, sys, os
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing in board: ' + a[:90])
    return s.replace(a, b, 1)
def wrap(s, start, end_tag, cond):
    a = s.index(start); b = s.index(end_tag, a) + len(end_tag)
    return s[:a] + '<sc-if value="{{%s}}" hint-placeholder-val="{{true}}">' % cond + s[a:b] + '</sc-if>' + s[b:]
MARK = 'window.FV.lesson'
G = "  G() { const F = window.FV; return F && F.lesson ? F.lesson() : null; }\n"
CARD = 'background: #FFFFFF; border: 2px solid #E7E2F0; box-shadow: 0 4px 0 #E7E2F0; border-radius: 20px'

# ---------- Info ----------
s = rd('UPLessonInfo')
if MARK not in s:
    s = sub1(s, 'letter-spacing: -0.02em">Compound interest</h1>', 'letter-spacing: -0.02em">{{title}}</h1>')
    lead = '<p class="in" style="margin: -6px 0 0; font-size: 18px; line-height: 1.5; color: #1C1726">Interest you earn on your money <strong>and</strong> on the interest you\'ve already earned.</p>'
    s = sub1(s, lead, '<sc-if value="{{designed}}" hint-placeholder-val="{{true}}">' + lead + '</sc-if><sc-if value="{{generic}}" hint-placeholder-val="{{false}}"><p class="in" style="margin: -6px 0 0; font-size: 18px; line-height: 1.5; color: #1C1726">{{lead}}</p></sc-if>')
    s = wrap(s, '<section class="in" aria-label="Example"', '</section>', 'designed')
    a = s.index('</sc-if>', s.index('<section class="in" aria-label="Example"')) + 8
    s = s[:a] + '\n    <sc-if value="{{generic}}" hint-placeholder-val="{{false}}"><section class="in" aria-label="Example" style="animation-delay: .06s; ' + CARD + '; padding: 14px 16px; display: flex; flex-direction: column"><span style="font-weight: 800; padding-bottom: 6px">{{exTitle}}</span><sc-for list="{{rows}}" as="r" hint-placeholder-count="3"><div style="display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid #F5F3F8; font-size: 15px"><span style="color: #38323F">{{r.k}}</span><strong class="num" style="text-align: right">{{r.v}}</strong></div></sc-for></section></sc-if>' + s[a:]
    s = sub1(s, '>The longer you wait, the bigger the purple part grows. Starting early beats starting big.</p>', '>{{tip}}</p>')
    s = wrap(s, '<p class="in" style="margin: -6px 0 0; font-size: 13px; color: #615A6E">Assumes 10% every year', '</p>', 'designed')
    s = sub1(s, "  renderVals() { return {}; }", G + "  renderVals() {\n    const L = this.G(); if (!L) return { designed: true, generic: false, title: 'Compound interest', tip: '' };\n    const c = L.c;\n    return { title: L.title, designed: L.designed, generic: !L.designed, lead: c ? c.lead : '', exTitle: c ? c.exTitle : '', rows: c ? c.rows.map((r) => ({ k: r[0], v: r[1] })) : [],\n      tip: c ? c.tip : 'The longer you wait, the bigger the purple part grows. Starting early beats starting big.' };\n  }")
    wr('UPLessonInfo', s)

# ---------- Choice ----------
s = rd('UPLessonChoice')
if MARK not in s:
    h = s.index('<h1 id="q"'); h2 = s.index('>', h) + 1; he = s.index('</h1>', h2)
    s = s[:h2] + '<sc-if value="{{designed}}" hint-placeholder-val="{{true}}">' + s[h2:he] + '</sc-if><sc-if value="{{generic}}" hint-placeholder-val="{{false}}">{{qText}}</sc-if>' + s[he:]
    s = wrap(s, '<div class="in" aria-hidden="true" style="animation-delay: .05s; border-radius: 18px', '</div>\n', 'designed')
    rp = s.index('<p', s.index('<h2 id="fb-right"')); re_ = s.index('</p>', rp) + 4
    s = s[:rp] + '<sc-if value="{{designed}}" hint-placeholder-val="{{true}}">' + s[rp:re_] + '</sc-if><sc-if value="{{generic}}" hint-placeholder-val="{{false}}"><p style="margin: 0; font-size: 16px; line-height: 1.5">{{rightText}}</p></sc-if>' + s[re_:]
    s = sub1(s, "    const opts = [\n      { label: '₦22,000',", "    const L = this.G(), c = L && L.c;\n    const opts = c ? c.opts.map((o, i) => ({ label: o[0], why: o[1], right: i === c.right })) : [\n      { label: '₦22,000',")
    s = sub1(s, "check: () => { if (s.pick !== null) { window.FV && window.FV.answer('choice', !!opts[s.pick].right);", "check: () => { if (s.pick !== null) { window.FV && window.FV.answer('choice', !!opts[s.pick].right, opts[s.pick].label);")
    s = sub1(s, "      kThink: !s.checked,", "      designed: !c, generic: !!c, qText: c ? c.q : '', rightText: c ? c.rightText : '',\n      kThink: !s.checked,")
    s = sub1(s, "  renderVals() {\n    const s = this.state;", G + "  renderVals() {\n    const s = this.state;")
    wr('UPLessonChoice', s)

# ---------- Calc ----------
s = rd('UPLessonCalc')
if MARK not in s:
    s = sub1(s, '<h1 id="q" style="margin: 0; font-size: 19px; line-height: 1.3">Rule of 72: roughly how many years does money take to double at 12% a year?</h1>', '<h1 id="q" style="margin: 0; font-size: 19px; line-height: 1.3">{{qText}}</h1>')
    s = re.sub(r'(<span class="fd">Hint:</span> )Divide 72 by the yearly rate\. Use the number, not the percentage sign\.', r'\1{{hintText}}', s, count=1)
    if '{{hintText}}' not in s: raise SystemExit('hint text not found')
    s = sub1(s, 'flex: none">years</span>', 'flex: none">{{unit}}</span>')
    s = sub1(s, '<span>Your answer: {{shownVal}} years</span>' if '<span>Your answer: {{shownVal}} years</span>' in s else 'Your answer: {{shownVal}} years', 'Your answer: {{shownVal}} {{unit}}')
    s = wrap(s, '<div class="card in" aria-hidden="true"', '</div>', 'designed')
    s = sub1(s, '>72 ÷ 12 = 6 years.</span>', '>{{rightHead}}</span>')
    s = sub1(s, '>The Rule of 72 is a shortcut, so it is an approximation. The exact answer at 12% compounded yearly is about 6.12 years.</p>', '>{{rightNote}}</p>')
    s = s.replace("v.length < 5", "v.length < 7")
    s = sub1(s, "font: 600 40px 'Plus Jakarta Sans', sans-serif; color: {{valInk}}", "font: 600 {{valSize}} 'Plus Jakarta Sans', sans-serif; color: {{valInk}}")
    s = sub1(s, "    const ok = !isNaN(n) && Math.abs(n - 6) < 0.15;\n    let wrongText = 'Divide 72 by the rate: 72 ÷ 12 = 6. Try entering that.';",
        "    const L = this.G(), c = L && L.c, N = parseFloat(String(s.val).replace(/,/g, ''));\n    const ok = c ? N === c.answer : (!isNaN(n) && Math.abs(n - 6) < 0.15);\n    let wrongText = c ? (c.wrongs[N] || ('Not quite. ' + c.hint)) : 'Divide 72 by the rate: 72 ÷ 12 = 6. Try entering that.';")
    s = sub1(s, "    if (n === 864)", "    if (c) {} else if (n === 864)")
    s = sub1(s, "check: () => { if (!empty) { window.FV && window.FV.answer('calc', ok);", "check: () => { if (!empty) { window.FV && window.FV.answer('calc', ok, s.val + ' ' + (c ? c.unit : 'years'));")
    s = sub1(s, "      kThink: !s.checked,", "      valSize: String(s.val).length > 5 ? '28px' : String(s.val).length > 4 ? '34px' : '40px',
      designed: !c, qText: c ? c.calc : 'Rule of 72: roughly how many years does money take to double at 12% a year?', hintText: c ? c.hint : 'Divide 72 by the yearly rate. Use the number, not the percentage sign.', unit: c ? c.unit : 'years',\n      rightHead: c ? c.calcRight : '72 \\u00f7 12 = 6 years.', rightNote: c ? c.calcNote : 'The Rule of 72 is a shortcut, so it is an approximation. The exact answer at 12% compounded yearly is about 6.12 years.',\n      kThink: !s.checked,")
    s = sub1(s, "  renderVals() {\n    const s = this.state;", G + "  renderVals() {\n    const s = this.state;")
    wr('UPLessonCalc', s)

# ---------- Lesson complete ----------
s = rd('UPLessonComplete')
if 'r.lesson' not in s:
    s = sub1(s, 'font-weight: 800">Now 174 XP</span>', 'font-weight: 800">Now {{totalXp}} XP</span>')
    s = sub1(s, 'font-weight: 800">+4 XP</dd>', 'font-weight: 800">+{{bonus}} XP</dd>')
    s = sub1(s, 'aria-label="XP towards Level 3" aria-valuemin="0" aria-valuemax="250" aria-valuenow="174" aria-valuetext="174 of 250 XP, 76 XP to Level 3"', 'aria-label="XP towards the next level" aria-valuemin="0" aria-valuemax="{{lvNext}}" aria-valuenow="{{totalXp}}" aria-valuetext="{{lvText}}"')
    s = sub1(s, 'width: 69.6%; height: 100%; border-radius: 999px; background: #7B4AF0', 'width: {{lvPct}}%; height: 100%; border-radius: 999px; background: #7B4AF0')
    s = sub1(s, 'font-weight: 700">Level 2 · 174 / 250 XP · 76 XP to Level 3</span>', 'font-weight: 700">{{lvText}}</span>')
    s = sub1(s, 'animation-delay: .04s">Simple and compound interest</p>', 'animation-delay: .04s">{{lessonTitle}}</p>')
    s = sub1(s, 'stroke-dasharray="161.6 188.5"', 'stroke-dasharray="{{accDash}} 188.5"')
    s = sub1(s, '>86%</text>', '>{{accPct}}%</text>')
    s = sub1(s, '>1 of 2 right first try</span>', '>{{accText}}</span>')
    a = s.index('<ol style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px"><li'); a2 = s.index('>', a) + 1; b = s.index('</ol>', a2)
    li = s[a2:s.index('</li>', a2) + 5].replace('>1</span>', '>{{x.n}}</span>').replace('>Simple interest is paid on the original amount only.</span>', '>{{x.t}}</span>')
    s = s[:a2] + '<sc-for list="{{learned}}" as="x" hint-placeholder-count="3">' + li + '</sc-for>' + s[b:]
    s = sub1(s, 'white-space: nowrap">5 of 6</span>', 'white-space: nowrap">{{doneN}} of 6</span>')
    s = sub1(s, 'aria-valuenow="5" aria-valuetext="5 of 6 lessons done"', 'aria-valuenow="{{doneN}}" aria-valuetext="{{doneN}} of 6 lessons done"')
    a = s.index('<div role="progressbar" aria-label="World 1 progress"'); a2 = s.index('>', a) + 1; b = s.index('</div>', a2)
    s = s[:a2] + '<sc-for list="{{segs}}" as="g" hint-placeholder-count="6"><span style="flex: 1; height: 10px; border-radius: 999px; background: {{g}}"></span></sc-for>' + s[b:]
    s = sub1(s, 'font-weight: 600">Emergency funds</span>\n          <span style="font-size: 14px; font-weight: 700">Next module · about 1 min</span>', 'font-weight: 600">{{nextTitle}}</span>\n          <span style="font-size: 14px; font-weight: 700">{{nextMeta}}</span>')
    s = sub1(s, 'color: #B42828">Not quite: question 1 of 2</h2>', 'color: #B42828">Not quite: question {{revN}} of {{revOf}}</h2>')
    s = sub1(s, 'line-height: 1.45">You save ₦20,000 at 10% a year, compounded yearly. How much after 2 years?</p>', 'line-height: 1.45">{{revQ}}</p>')
    s = sub1(s, '>Your answer: ₦24,000</span>', '>Your answer: {{revGiven}}</span>')
    s = re.sub(r'(</svg>)Correct: ₦24,200</span>', r'\1Correct: {{revRight}}</span>', s, count=1)
    if '{{revRight}}' not in s: raise SystemExit('correct pill not found')
    s = sub1(s, "line-height: 1.5\">₦24,000 is what simple interest gives: ₦2,000 a year on the original ₦20,000. With compounding, year 1 takes you to ₦22,000, and year 2 earns 10% of ₦22,000, which is ₦2,200. So ₦22,000 + ₦2,200 = ₦24,200.</p>", 'line-height: 1.5">{{revWhy}}</p>')
    s = wrap(s, '<p class="muted" style="margin: 0; font-size: 13px; font-weight: 700; line-height: 1.4">Assumes a fixed 10% rate', '</p>', 'designed')
    s = sub1(s, '<a href="UPArticle.dc.html" style="min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 15px', '<a href="{{readHref}}" style="min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 15px')
    s = sub1(s, '</svg>Read: Compound interest</a>', '</svg>Read: {{readTitle}}</a>')
    s = sub1(s, "      toggleReview: () => this.setState({ showReview: !open })\n    };", """      toggleReview: () => this.setState({ showReview: !open }),
      ...this.lessonVals()
    };""")
    s = sub1(s, "  renderVals() {\n    const open = this.state.showReview;", """  componentDidUpdate() { this.paintAcc(); }
  paintAcc() {
    const v = this.lessonVals ? this.lessonVals() : null; if (!v) return;
    document.querySelectorAll('#dc-root text').forEach((t) => { if (/%$/.test(t.textContent.trim())) t.textContent = v.accPct + '%'; });
    document.querySelectorAll('#dc-root circle[stroke="#176EEB"]').forEach((c) => c.setAttribute('stroke-dasharray', v.accDash + ' 188.5'));
  }
  lessonVals() {
    const r = this.result, F = window.FV, L = r && r.lesson ? r.lesson : (F && F.lesson ? F.lesson() : null), c = L && L.c;
    const st = F ? F.get() : { done: 5 }, done = Math.min(6, st.done), right = r ? r.right : 1, total = r ? r.total : 2, pct = r ? r.pct : 86;
    const nxt = F && F.LESSONS && done < 6 ? F.LESSONS[done] : null, lib = F && F.LIB, slug = c ? c.article : 'compound-interest', art = lib && lib.article(slug);
    const D = { choice: { q: 'You save \\u20a620,000 at 10% a year, compounded yearly. How much after 2 years?', right: '\\u20a624,200', why: '\\u20a624,000 is what simple interest gives: \\u20a62,000 a year on the original \\u20a620,000. With compounding, year 1 takes you to \\u20a622,000, and year 2 earns 10% of \\u20a622,000, which is \\u20a62,200. So \\u20a622,000 + \\u20a62,200 = \\u20a624,200.' },
      calc: { q: 'Rule of 72: roughly how many years does money take to double at 12% a year?', right: '6 years', why: 'Divide 72 by the yearly rate: 72 \\u00f7 12 = 6 years.' } };
    if (c) { const ro = c.opts[c.right]; D.choice = { q: c.q, right: ro[0], why: c.rightText }; D.calc = { q: c.calc, right: c.answer.toLocaleString('en-NG') + ' ' + c.unit, why: c.calcRight + ' ' + c.calcNote }; }
    const ans = r ? r.answers : { choice: false, calc: true }, miss = ['choice', 'calc'].filter((k) => k in ans && !ans[k])[0] || 'choice', given = (r && r.given && r.given[miss]) || (L && !c ? '\\u20a624,000' : '');
    const WHY = c ? Object.fromEntries(c.opts.map((o) => [o[0], o[1]])) : { '\\u20a622,000': '\\u20a622,000 is the total after one year only. Year 2 adds another round of interest.', '\\u20a640,000': '\\u20a640,000 doubles the money. At 10% a year that takes about 7 years, not 2.' };
    if (miss === 'choice' && WHY[given]) D.choice.why = WHY[given] + ' ' + (c ? c.rightText : 'With compounding, year 2 earns 10% of \\u20a622,000, so \\u20a622,000 + \\u20a62,200 = \\u20a624,200.');
    const xpNow = st.xp || 0, lv = F ? F.level(xpNow) : 1, T = [0, 100, 250, 500, 900], nx = T[lv] || 900, pv = T[lv - 1] || 0;
    const xpVals = { totalXp: String(xpNow), bonus: String(Math.max(0, (r ? r.xp : 14) - 10)), lvNext: String(nx), lvPct: Math.min(100, Math.round((xpNow - pv) / Math.max(1, nx - pv) * 100)).toFixed(1),
      lvText: 'Level ' + lv + ' \\u00b7 ' + xpNow + ' / ' + nx + ' XP \\u00b7 ' + Math.max(0, nx - xpNow) + ' XP to Level ' + (lv + 1) };
    const learned = c ? c.learned : ['Simple interest is paid on the original amount only.', 'Compound interest is paid on the amount plus the interest already earned.', 'Time matters: the gap between the two grows every year.'];
    return { ...xpVals, lessonTitle: L ? L.title : 'Simple and compound interest', designed: !c, accPct: String(pct), accDash: (188.5 * pct / 100).toFixed(1), accText: right + ' of ' + total + ' right first try',
      learned: learned.map((t, i) => ({ n: String(i + 1), t })), doneN: String(done), segs: [0, 1, 2, 3, 4, 5].map((i) => (i < done ? '#5B21B6' : '#E7E2F0')),
      nextTitle: nxt ? nxt.title : 'The \\u20a6100,000 plan', nextMeta: nxt ? 'Next lesson \\u00b7 about ' + nxt.min + ' min' : 'Boss challenge \\u00b7 pass with 4 of 5',
      revN: miss === 'choice' ? '1' : '2', revOf: '2', revQ: D[miss].q, revGiven: given, revRight: D[miss].right, revWhy: D[miss].why,
      readHref: 'UPArticle.dc.html?a=' + slug, readTitle: art ? art.title : 'Compound interest' };
  }
  renderVals() {
    const open = this.state.showReview;""")
    wr('UPLessonComplete', s)
print('lessons wired')
