"""Wire the Money Foundations course review (owner approved the 8 questions on 15 Nov 2026; Income and
expenses added to Covers). Pass mark 6 of 8 (as drawn). Best score kept in fv.review.v1; no limit on tries.
Each answer shows the bottom result sheet (owner preference). Usage: python3 wire_navy_review.py <site folder>"""
import os, sys, json
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
MARK = '/* navy-review */'
Q = [
 {'l': 'What money does', 'id': 'money', 'q': 'Bisi keeps ₦10,000 in a savings box for next month. Which job is her money doing?', 'o': ['Paying for things', 'Comparing prices', 'Keeping value for later', 'Measuring kobo'], 'r': 2, 'why': 'Putting money aside to use later is money keeping value.'},
 {'l': 'What money does', 'id': 'money', 'q': 'How many kobo are in ₦25?', 'o': ['25', '250', '2,500', '25,000'], 'r': 2, 'why': '₦1 is 100 kobo, so ₦25 × 100 = 2,500 kobo.'},
 {'l': 'Income and expenses', 'id': 'income', 'q': 'Tunde earns ₦120,000 a month and spends ₦95,000. How much is left over?', 'o': ['₦215,000', '₦25,000', '₦95,000', '₦12,000'], 'r': 1, 'why': 'Income minus expenses is what you can save: ₦120,000 − ₦95,000 = ₦25,000.'},
 {'l': 'Inflation', 'id': 'inflation', 'q': "Inflation is 20%. What does ₦100,000 buy next year, in today's prices?", 'o': ['About ₦120,000', 'About ₦100,000', 'About ₦83,000', 'About ₦80,000'], 'r': 2, 'why': 'Prices are 20% higher, so ₦100,000 buys what about ₦83,000 buys today (₦100,000 ÷ 1.2).'},
 {'l': 'Budgeting', 'id': 'budget', 'q': 'Ada earns ₦200,000 a month. Using 50/30/20, how much goes to savings?', 'o': ['₦20,000', '₦40,000', '₦60,000', '₦100,000'], 'r': 1, 'why': 'Savings are the 20% part: 20% of ₦200,000 is ₦40,000.'},
 {'l': 'Budgeting', 'id': 'budget', 'q': 'Using 50/30/20, which of these is a want?', 'o': ['Rent', 'Electricity bill', 'Weekend suya with friends', 'School fees'], 'r': 2, 'why': "It's nice to have but not essential."},
 {'l': 'Simple and compound interest', 'id': 'interest', 'q': '₦100,000 earns 10% a year, compounded yearly. How much is it after 2 years?', 'o': ['₦120,000', '₦121,000', '₦110,000', '₦200,000'], 'r': 1, 'why': 'Year 1 gives ₦110,000, and year 2 adds 10% of ₦110,000 to make ₦121,000.'},
 {'l': 'Emergency funds', 'id': 'emergency', 'q': 'Your costs are ₦60,000 a month. How much is 3 months of emergency savings?', 'o': ['₦60,000', '₦120,000', '₦180,000', '₦360,000'], 'r': 2, 'why': '₦60,000 × 3 = ₦180,000. Many people aim for 3 to 6 months of costs, built up a little at a time.'},
]
JSQ = json.dumps(Q, ensure_ascii=False)
STORE = '''  st() { try { return JSON.parse(localStorage.getItem('fv.review.v1') || 'null') || {}; } catch (e) { return {}; } }
  put(o) { try { localStorage.setItem('fv.review.v1', JSON.stringify(Object.assign(this.st(), o))); } catch (e) {} }
'''
# Intro
s = rd('CourseReviewNavy')
if MARK not in s:
    tick_row = s[s.index('<div style="display: flex; align-items: center; gap: 10px; min-height: 36px; font-size: 14px">'):s.index('What money does</div>') + len('What money does</div>')]
    s = s.replace(tick_row, tick_row + tick_row.replace('What money does', 'Income and expenses'), 1)
    s = sub1(s, '<a href="CourseReviewQNavy.dc.html" style="flex: 1;', '<a href="CourseReviewQNavy.dc.html" onClick="{{start}}" style="flex: 1;')
    s = sub1(s, '>No limit on tries. Your best score counts.</p>', '>No limit on tries. Your best score counts.{{best}}</p>')
    s = logic(s, MARK + '\n' + STORE + '''  renderVals() { const b = this.st().best; return { best: b !== undefined ? ' Best so far: ' + b + '/8.' : '', start: () => this.put({ run: { i: 0, right: 0, missed: [] } }) }; }''')
    wr('CourseReviewNavy', s)

# Question
s = rd('CourseReviewQNavy')
if MARK not in s:
    a = s.index('<span style="flex: 1; display: flex; gap: 4px">'); b = s.index('</span></span>', a) + len('</span></span>')
    s = s[:a] + '<span style="flex: 1; display: flex; gap: 4px" role="img" aria-label="Question {{n}} of 8"><sc-for list="{{bars}}" as="x" hint-placeholder-count="8"><span style="flex: 1; height: 5px; border-radius: 999px; background: {{x.c}}"></span></sc-for></span>' + s[b:]
    s = sub1(s, 'color: #5B6577">4/8</span>', 'color: #5B6577">{{n}}/8</span>')
    s = sub1(s, '>Review · Inflation<', '>Review · {{lesson}}<')
    s = sub1(s, ">Inflation is 20%. What does ₦100,000 buy next year, in today's prices?</h1>", '>{{q}}</h1>')
    a = s.index('<div role="radiogroup"'); b = s.index('<div style="margin-top: auto;', a)
    s = s[:a] + '<div role="radiogroup" aria-label="Answer" style="margin: 18px 24px 0; display: flex; flex-direction: column; gap: 10px; flex: none"><sc-for list="{{opts}}" as="o" hint-placeholder-count="4"><button type="button" role="radio" aria-checked="{{o.on}}" onClick="{{o.pick}}" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 56px; padding: 0 16px; border-radius: 14px; border: {{o.bd}}; background: {{o.bg}}; font: inherit; color: #0B192C; cursor: pointer; text-align: left"><span style="font-family: {{o.font}}; font-size: 17px">{{o.t}}</span><span style="width: 22px; height: 22px; flex: none; border-radius: 999px; border: {{o.dot}}; box-sizing: border-box"></span></button></sc-for></div>' + s[b:]
    a = s.index('<button style="flex: none; min-height: 54px;'); b = s.index('</button>', a) + 9
    s = s[:a] + s[b:]
    s = sub1(s, '<a href="CourseReviewDoneNavy.dc.html" style="flex: 1; height: 54px; border-radius: 14px; background: #334155; opacity: .4;', '<a href="#" onClick="{{check}}" aria-disabled="{{noPick}}" style="flex: 1; height: 54px; border-radius: 14px; background: {{ctaBg}}; opacity: {{op}};')
    sheet = rd('LessonNavy'); i = sheet.index('<sc-if value="{{answered}}"'); j = sheet.index('</sc-if>', sheet.index('</section>', i)) + len('</sc-if>')
    sh = sheet[i:j].replace('<a href="{{ctaHref}}" style="height: 54px;', '<a href="{{ctaHref}}" onClick="{{next}}" style="height: 54px;').replace('background: {{ctaBg}}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 600; text-decoration: none">{{cta}}', 'background: #0B192C; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 600; text-decoration: none">{{cta}}')
    k = s.rindex('</div>', 0, s.index('</x-dc>')); s = s[:k] + sh + s[k:]
    s = logic(s, MARK + '\n  Q = ' + JSQ + ';\n' + STORE + '''  constructor(p) { super(p); const r = this.st().run; this.state = { run: r && r.i < 8 ? r : { i: 0, right: 0, missed: [] }, pick: null, res: null }; }
  renderVals() {
    const run = this.state.run, q = this.Q[run.i], p = this.state.pick, r = this.state.res, ok = !!(r && r.ok), last = run.i === 7;
    const money = q.o.every((t) => /₦|^\\d/.test(t));
    return { n: String(run.i + 1), lesson: q.l, q: q.q, bars: this.Q.map((_, i) => ({ c: i < run.i ? '#10B981' : i === run.i ? '#0B192C' : '#E2E5EA' })),
      opts: q.o.map((t, i) => ({ t, on: String(p === i), font: money ? "'Geist Mono', monospace" : "'Geist', system-ui, sans-serif",
        bd: r && i === q.r ? '2px solid #10B981' : r && p === i ? '2px solid #B9473F' : p === i ? '2px solid #0B192C' : '1px solid #D5D9E0', bg: r && i === q.r ? '#EAF6EF' : r && p === i ? '#FCEFED' : '#FFFFFF',
        dot: p === i ? '6px solid #0B192C' : '1.5px solid #C0C6D0', pick: () => { if (!r) this.setState({ pick: i }); } })),
      noPick: String(p === null), ctaBg: p === null ? '#334155' : '#0B192C', op: p === null ? '.4' : '1',
      check: (e) => { e.preventDefault(); if (p === null || r) return; this.setState({ res: { ok: p === q.r } }); },
      answered: !!r, iconBg: ok ? '#DDF3E6' : '#FCEDEB', tone: ok ? '#10B981' : '#B9473F', icon: ok ? '✓' : '×',
      title: ok ? 'Correct' : 'Not quite', sub: ok ? 'Question ' + (run.i + 1) + ' of 8' : 'The right answer is ' + q.o[q.r], why: q.why,
      askTitle: 'Ask Finvora to explain this', askQ: encodeURIComponent(q.q), cta: last ? 'See my score' : ok ? 'Continue' : 'Got it, continue', ctaHref: '#',
      next: (e) => { e.preventDefault(); const nr = { i: run.i + 1, right: run.right + (ok ? 1 : 0), missed: ok ? run.missed : run.missed.concat([run.i]) };
        if (last) { const best = Math.max(this.st().best || 0, nr.right); this.put({ run: null, last: nr, best }); location.href = 'CourseReviewDoneNavy.dc.html'; return; }
        this.put({ run: nr }); this.setState({ run: nr, pick: null, res: null }); window.scrollTo(0, 0); } };
  }''')
    wr('CourseReviewQNavy', s)

# Result
s = rd('CourseReviewDoneNavy')
if MARK not in s:
    s = sub1(s, 'conic-gradient(#00E676 0 87.5%, #2C3D5B 87.5% 100%)', 'conic-gradient(#00E676 0 {{pct}}, #2C3D5B {{pct}} 100%)')
    s = sub1(s, 'font-size: 20px">7/8</span>', 'font-size: 20px">{{score}}</span>')
    s = sub1(s, 'color: #00E676">Course complete</span>', 'color: #00E676">{{kicker}}</span>')
    s = sub1(s, '>6 of 6 lessons · passed</span>', '>{{status}}</span>')
    a = s.index('<a href="LessonCalcNavy.dc.html" style="margin-top: 8px;'); b = s.index('</a>', a) + 4
    row = s[a:b].replace('<a href="LessonCalcNavy.dc.html"', '<a href="{{x.href}}"').replace('>Compound interest</span>', '>{{x.t}}</span>')
    box_a = s.rindex('<div style="margin: 14px 24px 0;', 0, a); box_b = s.index('</div>', b) + 6
    s = s[:box_a] + '<sc-if value="{{hasMiss}}" hint-placeholder-val="{{ false }}">' + s[box_a:a] + '<sc-for list="{{miss}}" as="x" hint-placeholder-count="1">' + row + '</sc-for>' + s[b:box_b] + '</sc-if>' + s[box_b:]
    a = s.index('<div style="margin: 10px 24px 0; padding: 16px; border-radius: 16px; background: #FFFFFF; border: 1px solid #E5E7EB; flex: none; "><span style="font-size: 12px; color: #5B6577">Up next · now open</span>'); b = s.index('</div>', a) + 6
    s = s[:a] + '<sc-if value="{{passed}}" hint-placeholder-val="{{ false }}">' + s[a:b] + '</sc-if>' + s[b:]
    s = sub1(s, '>Ask Finvora to explain compound interest again<', '>{{askTitle}}<')
    s = sub1(s, '<a href="AskFinvoraNavy.dc.html" style="margin: 10px 24px 0;', '<a href="{{askHref}}" style="margin: 10px 24px 0;')
    s = sub1(s, '<a href="LearnNavy.dc.html" style="flex: 1; height: 54px;', '<a href="{{ctaHref}}" style="flex: 1; height: 54px;')
    s = sub1(s, '>Start Understanding Investing</a>', '>{{cta}}</a>')
    s = logic(s, MARK + '\n  Q = ' + JSQ + ';\n' + STORE + '''  renderVals() {
    const st = this.st(), r = st.last || { right: 0, missed: [] }, passed = r.right >= 6, seen = {};
    const miss = (r.missed || []).map((i) => this.Q[i]).filter((q) => q && !seen[q.l] && (seen[q.l] = 1)).map((q) => ({ t: q.l, href: 'LessonInfoNavy.dc.html?l=' + q.id }));
    const first = miss[0];
    return { score: r.right + '/8', pct: (r.right / 8 * 100) + '%', kicker: passed ? 'Course complete' : 'Course review', status: passed ? '6 of 6 lessons · passed' : 'Score 6 or more to finish the course',
      hasMiss: !!miss.length, miss, passed, askTitle: first ? 'Ask Finvora to explain ' + first.t.toLowerCase() + ' again' : 'Ask Finvora about Money Foundations',
      askHref: 'AskFinvoraNavy.dc.html?q=' + encodeURIComponent(first ? 'Explain ' + first.t.toLowerCase() : 'What is budgeting?'),
      cta: passed ? 'Start Understanding Investing' : 'Start review', ctaHref: passed ? 'LearnNavy.dc.html' : 'CourseReviewNavy.dc.html' };
  }''')
    wr('CourseReviewDoneNavy', s)

# Learn: the course review row and button use the review result.
s = rd('LearnNavy')
if 'fv.review.v1' not in s:
    s = sub1(s, "    const cur = LS[done];", "    let rv = {}; try { rv = JSON.parse(localStorage.getItem('fv.review.v1') || 'null') || {}; } catch (e) {}\n    const passed = (rv.best || 0) >= 6; if (passed) L[L.length - 1][1] = 'done';\n    const cur = LS[done];")
    s = sub1(s, "return { cont: cur ?", "return { contHref: cur ? 'LessonInfoNavy.dc.html' : 'CourseReviewNavy.dc.html', cont: passed ? 'Review the course again' : cur ?")
    s = sub1(s, '<a href="LessonInfoNavy.dc.html" style="height: 48px; border-radius: 12px; background: #0B192C;', '<a href="{{contHref}}" style="height: 48px; border-radius: 12px; background: #0B192C;')
    wr('LearnNavy', s)
# Learn: finished lessons reopen (replay via ?l=), the next lesson and review open; long button text wraps with padding.
s = rd('LearnNavy')
if 'href: st ===' not in s:
    s = sub1(s, "      t, s: st === 'done'", "      href: st === 'locked' ? '#' : i === LS.length ? 'CourseReviewNavy.dc.html' : st === 'next' ? 'LessonInfoNavy.dc.html' : 'LessonInfoNavy.dc.html?l=' + LS[i].id,\n      t, s: st === 'done'")
    s = sub1(s, '<a href="#" style="display: flex; align-items: center; gap: 12px; min-height: 54px; border-bottom: 1px solid #EDEFF2; text-decoration: none; color: {{l.ink}}">', '<a href="{{l.href}}" style="display: flex; align-items: center; gap: 12px; min-height: 54px; border-bottom: 1px solid #EDEFF2; text-decoration: none; color: {{l.ink}}">')
    s = sub1(s, '<a href="{{contHref}}" style="height: 48px; border-radius: 12px; background: #0B192C; color: #FFFFFF; display: flex; align-items: center; justify-content: center;', '<a href="{{contHref}}" style="min-height: 48px; padding: 12px 16px; box-sizing: border-box; line-height: 1.3; text-align: center; border-radius: 12px; background: #0B192C; color: #FFFFFF; display: flex; align-items: center; justify-content: center;')
    wr('LearnNavy', s)
# Lesson done: the Next button's long lesson title wraps with padding instead of touching the edges.
s = rd('LessonDoneNavy')
s = s.replace('<a href="{{nextHref}}" style="height: 54px; border-radius: 14px;', '<a href="{{nextHref}}" style="min-height: 54px; padding: 12px 16px; box-sizing: border-box; line-height: 1.3; text-align: center; border-radius: 14px;')
wr('LessonDoneNavy', s)
# Button labels: keep "· 4 min" together so "min" never sits alone on a line.
for n, a in (('LessonDoneNavy', "' · ' + nx.min + ' min'"), ('LearnNavy', "' · ' + cur.min + ' min'")):
    s = rd(n); s = s.replace(a, a.replace("' · '", "'\\u00a0·\\u00a0'").replace("' min'", "'\\u00a0min'")); wr(n, s)
print('wired')
