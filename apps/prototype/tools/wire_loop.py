"""Wire the learning loop: daily question, level up, streak, streak lost, boss challenge (5 scored questions),
practical challenges, the inflation challenge and the five 1-minute micro modules, to window.FV.LOOP.
Usage: python3 wire_loop.py <site folder>"""
import re, sys, os
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing in board: ' + a[:90])
    return s.replace(a, b, 1)
def logic(s, js):
    a = s.index('class Component extends DCLogic {'); b = s.index('</script>', a)
    return s[:a] + 'class Component extends DCLogic {\n' + js + '\n}\n' + s[b:]
MARK = 'window.FV.LOOP'
LP = "  LP() { return window.FV && window.FV.LOOP; }\n"
BTN = 'style="width: 100%; border: 0; cursor: pointer; font: inherit; font-weight: 700"'

# Daily question: one a day from a pool; +5 XP, +3 more if right; counts as a learning day.
s = rd('UPDaily')
if MARK not in s:
    s = sub1(s, 'letter-spacing: -0.02em">Which currency is used in Ghana?</h1>' if 'letter-spacing: -0.02em">Which currency is used in Ghana?</h1>' in s else 'line-height: 1.3">Which currency is used in Ghana?</h1>', 'line-height: 1.3">{{qText}}</h1>')
    s = sub1(s, '>Daily question · 1 min · +5 XP</p>', '>Daily question · 1 min · +5 XP, +3 if right</p>')
    s = sub1(s, '<a href="UPStreak.dc.html" class="btn btn-g">Continue</a>', '<a href="UPStreak.dc.html" class="btn btn-g">{{doneLabel}}</a>')
    s = sub1(s, "    const opts = [{\"label\": \"Naira\",", "    const LP = this.LP(), D = LP ? LP.daily() : null;\n    const opts0 = [{\"label\": \"Naira\",")
    s = re.sub(r'(const opts0 = \[.*?\];)', r"\1\n    const opts = D ? D.opts.map((label, i) => (i === D.right ? { label, right: true } : { label, why: D.whys[i] })) : opts0;", s, count=1, flags=re.S)
    s = sub1(s, "rightText: \"Ghana uses the cedi (GH₵). Shares on the Ghana Stock Exchange are priced in cedis.\",", "rightText: D ? (D.done && !s.checked ? 'You\\'ve done today\\'s question. Come back tomorrow for a new one.' : D.explain) : '', qText: D ? D.q : 'Which currency is used in Ghana?', doneLabel: 'See your streak',")
    s = sub1(s, "check: () => { if (s.pick !== null) this.setState({ checked: true }); },", "check: () => { if (s.pick !== null) { if (LP) LP.dailyAnswer(!!opts[s.pick].right); this.setState({ checked: true }); } },")
    s = sub1(s, "showCheck: !s.checked, showWrong: wrong, showRight: right,", "showCheck: !s.checked && !(D && D.done), showWrong: wrong, showRight: right || !!(D && D.done && !s.checked),")
    s = sub1(s, "  renderVals() {\n    const s = this.state;", LP + "  renderVals() {\n    const s = this.state;")
    wr('UPDaily', s)

# Level up: your real level, shown once after you reach it.
s = rd('UPLevelUp')
if MARK not in s:
    s = sub1(s, 'margin-top: 4px">Market Explorer</h1><p class="muted" style="margin: 6px 0 0">You reached 250 XP. Next: Company Detective at 500 XP.</p>', 'margin-top: 4px">{{name}}</h1><p class="muted" style="margin: 6px 0 0">{{line}}</p>')
    s = sub1(s, '<strong>Level 3</strong><span class="muted num">250 / 500 XP</span>', '<strong>Level {{n}}</strong><span class="muted num">{{xpLine}}</span>')
    s = sub1(s, '<div class="fill" style="width: 0%"></div>', '<div class="fill" style="width: {{pct}}%"></div>')
    s = re.sub(r'(<text[^>]*>)3(</text>)', r'\1{{n}}\2', s, count=1)
    s = logic(s, LP + '''  componentDidMount() { const LP = this.LP(); if (LP) LP.clearLevelUp(); this.paint(); }
  componentDidUpdate() { this.paint(); }
  paint() { const v = this.vals(); if (!v) return; document.querySelectorAll('#dc-root text').forEach((t) => { if (/^(\\d|\\{\\{n\\}\\})$/.test(t.textContent.trim())) t.textContent = v.n; if (/^LEVEL/i.test(t.textContent.trim())) t.textContent = 'LEVEL ' + v.n; }); }
  vals() {
    const F = window.FV, LP = this.LP(); if (!LP) return null;
    const xp = F.get().xp, L = LP.levelInfo(xp);
    return { n: String(L.n), name: L.name, pct: String(L.pct), xpLine: L.next ? xp + ' / ' + L.next.at + ' XP' : xp + ' XP',
      line: 'You reached ' + L.at + ' XP.' + (L.next ? ' Next: ' + L.next.name + ' at ' + L.next.at + ' XP.' : ' That\\'s the top level.') };
  }
  renderVals() { return this.vals() || {}; }''')
    wr('UPLevelUp', s)

# Streak: real count, this week's days, rest-day rule, next badge.
s = rd('UPStreak')
if MARK not in s:
    s = sub1(s, '<h2 class="num" style="font-size: 40px">6 days</h2><p class="muted" style="margin: 0">6 days in a row, counting your rest day. Nice rhythm.</p>', '<h2 class="num" style="font-size: 40px">{{count}}</h2><p class="muted" style="margin: 0">{{line}}</p>')
    a = s.index('<div class="card" style="padding: 16px; display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px">'); a2 = s.index('>', a) + 1; b = s.index('</div></div>\n', a2) + 6
    cells = s[a2:b]
    learned = re.search(r'<span aria-label="learned"[^>]*>(<svg.*?</svg>)</span>', cells, flags=re.S).group(1)
    s = s[:a2] + ('<sc-for list="{{week}}" as="d" hint-placeholder-count="7"><div style="display: flex; flex-direction: column; align-items: center; gap: 6px"><span class="muted" style="font-size: 12px; font-weight: 700">{{d.l}}</span><span aria-label="{{d.aria}}" style="width: 38px; height: 38px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: {{d.bg}}; box-shadow: {{d.ring}}">'
        '<sc-if value="{{d.tick}}" hint-placeholder-val="{{true}}">' + learned + '</sc-if><sc-if value="{{d.rest}}" hint-placeholder-val="{{false}}"><span style="font-size: 11px; font-weight: 800; color: #4C1D95">Rest</span></sc-if></span></div></sc-for>') + s[b:]
    s = sub1(s, '>You get 1 rest day a week. Your streak stays safe on that day. You have used it this week.</p>', '>You get 1 rest day a week. Your streak stays safe on that day. {{restLine}}</p>')
    s = sub1(s, '<div class="fill" style="width: 86%; background: #7B4AF0"></div></div><span class="muted" style="font-size: 13px">1 more day</span>', '<div class="fill" style="width: {{badgePct}}%; background: #7B4AF0"></div></div><span class="muted" style="font-size: 13px">{{badgeLine}}</span>')
    s = sub1(s, '<a href="UPDaily.dc.html" class="btn">Do today\'s question</a>', '<a href="{{ctaHref}}" class="btn">{{cta}}</a>')
    s = logic(s, LP + '''  renderVals() {
    const LP = this.LP(); if (!LP) return {};
    const I = LP.streakInfo(), n = I.n, D = LP.daily();
    const week = I.week.map((w, i) => ({ l: 'MTWTFSS'[i], tick: w.learned, rest: w.rest && !w.learned, aria: w.learned ? 'learned' : w.rest ? 'rest day' : w.today ? 'today, not yet' : w.future ? 'not yet' : 'missed',
      bg: w.learned ? '#FF5A1F' : w.rest ? '#F1EBFB' : '#F5F3F8', ring: w.today ? '0 0 0 3px #FFD3BF' : 'none' }));
    return { count: n + (n === 1 ? ' day' : ' days'), week,
      line: n === 0 ? 'Learn something today to start a streak.' : (n + (n === 1 ? ' day' : ' days') + ' in a row' + (I.restUsed ? ', counting your rest day.' : '.') + (I.learnedToday ? ' Nice rhythm.' : ' Learn today to keep it going.')),
      restLine: I.restUsed ? 'You have used it this week.' : 'You haven\\'t needed it this week.',
      badgePct: String(Math.min(100, Math.round(n / 7 * 100))), badgeLine: n >= 7 ? 'Earned' : (7 - n) + ' more ' + (7 - n === 1 ? 'day' : 'days'),
      cta: D.done ? 'Continue learning' : 'Do today\\'s question', ctaHref: D.done ? 'UPJourney.dc.html' : 'UPDaily.dc.html' };
  }''')
    wr('UPStreak', s)

# Streak lost: the streak that just ended.
s = rd('URStreakLost')
if MARK not in s:
    s = sub1(s, '<h1 style="font-size: 24px">Your 12-day streak ended</h1>', '<h1 style="font-size: 24px">{{title}}</h1>')
    s = logic(s, LP + '''  constructor(p) { super(p); const LP = window.FV && window.FV.LOOP; this.len = LP ? LP.lostStreak() : 12; if (LP) LP.seenLost(); }
  renderVals() { return { title: this.len > 0 ? 'Your ' + this.len + '-day streak ended' : 'Your streak ended' }; }''')
    wr('URStreakLost', s)

# Home and Journey: show Level up or Streak lost once, when they happen.
for n in ('UOHome', 'UPJourney', 'UDHome', 'UDJourney'):
    s = rd(n)
    if 'LP.pendingLevelUp()' not in s:
        hook = "  componentDidMount() { const LP = window.FV && window.FV.LOOP; if (!LP) return; if (LP.pendingLevelUp()) location.href = 'UPLevelUp.dc.html'; else if (LP.lostStreak() > 0) location.href = 'URStreakLost.dc.html'; }\n"
        a = s.index('class Component extends DCLogic {') + len('class Component extends DCLogic {\n')
        if 'componentDidMount()' in s[a:s.index('</script>', a)]: raise SystemExit('board already has componentDidMount: ' + n)
        s = s[:a] + hook + s[a:]
        wr(n, s)

# Boss intro: starts a fresh attempt; the design's numbers match the rules (5 questions, 80%, +55 XP).
s = rd('UPBossIntro')
if MARK not in s:
    s = sub1(s, '<a href="UPBossQuestion.dc.html" class="btn">Start the challenge</a>', '<a href="UPBossQuestion.dc.html" onClick="{{start}}" class="btn">{{startLabel}}</a>')
    s = logic(s, LP + '''  renderVals() { const F = window.FV, LP = this.LP(); return { start: () => { if (LP) LP.startBoss(); }, startLabel: F && F.get().bossPassed ? 'Try it again' : 'Start the challenge' }; }''')
    wr('UPBossIntro', s)

# Boss question: five questions on one screen, first try counts.
s = rd('UPBossQuestion')
if MARK not in s:
    s = sub1(s, 'aria-valuemax="5" aria-valuenow="3"', 'aria-valuemax="5" aria-valuenow="{{num}}"')
    s = re.sub(r'(<span class="muted"[^>]*>)3/5(</span>)', r'\1{{num}}/5\2', s, count=1)
    s = re.sub(r'(role="progressbar"[^>]*>\s*<div style="[^"]*?width: )\d+(?:\.\d+)?%', r'\1{{pct}}%', s, count=1)
    s = sub1(s, 'line-height: 1.3">Tolu\'s rent, food and transport come to ₦70,000 a month. Which plan builds an emergency fund fastest without missing a bill?</h1>', 'line-height: 1.3">{{qText}}</h1>')
    a = s.index('<div class="card" style="padding: 14px 16px; display: grid; grid-template-columns: 1fr auto'); b = s.index('</div>', s.index('₦30,000</strong>', a)) + 6
    s = s[:a] + '<sc-if value="{{card}}" hint-placeholder-val="{{true}}">' + s[a:b] + '</sc-if>' + s[b:]
    s = sub1(s, '<a href="UPBossResult.dc.html" class="btn btn-g">Continue</a>', '<button type="button" class="btn btn-g" onClick="{{next}}" ' + BTN + '>{{nextLabel}}</button>')
    s = sub1(s, "    const opts = [{\"label\": \"Spend the", "    const LP = this.LP(), B = LP ? LP.bossState() : { i: 0 }, Q = LP ? LP.BOSS_Q[Math.min(4, B.i)] : null;\n    const opts0 = [{\"label\": \"Spend the")
    s = re.sub(r'(const opts0 = \[.*?\];)', r"\1\n    const opts = Q ? Q.opts.map((o, i) => (i === Q.right ? { label: o[0], right: true } : { label: o[0], why: o[1] })) : opts0;", s, count=1, flags=re.S)
    s = sub1(s, 'rightText: "₦20,000 a month builds a ₦210,000 cushion, three months of needs, in about 11 months, while still leaving room for wants.",',
        "rightText: Q ? Q.explain : '', qText: Q ? Q.q : '', card: !!(Q && Q.card), num: String(Math.min(5, B.i + 1)), pct: String(Math.min(5, B.i + 1) * 20), nextLabel: B.i >= 4 ? 'See my result' : 'Next question',\n      next: () => { if (!LP) return; if (LP.bossNext() >= 5) { const sc = LP.bossState().score; location.href = 'UPBossResult.dc.html?s=' + sc; } else this.setState({ pick: null, checked: false }); },")
    s = sub1(s, "check: () => { if (s.pick !== null) this.setState({ checked: true }); },", "check: () => { if (s.pick !== null) { if (LP) LP.bossAnswer(B.i, !!opts[s.pick].right); this.setState({ checked: true }); } },")
    s = sub1(s, "  renderVals() {\n    const s = this.state;", LP + "  componentDidMount() { const LP = this.LP(); if (LP && LP.bossState().i >= 5) LP.startBoss(); }\n  renderVals() {\n    const s = this.state;")
    wr('UPBossQuestion', s)

# Boss result: real score; pass at 4 of 5, otherwise try again.
s = rd('UPBossResult')
if MARK not in s:
    s = sub1(s, 'color: #16884A">Boss challenge passed</p><h1', 'color: {{eyeInk}}">{{eyebrow}}</p><h1')
    s = re.sub(r'(<h1[^>]*>)World 1 complete!(</h1>)', r'\1{{title}}\2', s, count=1)
    s = sub1(s, '>You scored 4 of 5. Money Foundations is done.</p>', '>{{line}}</p>')
    s = re.sub(r'(>Score</div><div class="num"[^>]*>)80%(</div>)', r'\1{{pct}}%\2', s, count=1)
    s = re.sub(r'(>XP earned</div><div class="num"[^>]*>)\+55(</div>)', r'\1{{xp}}\2', s, count=1)
    s = sub1(s, '<a href="UPJourney.dc.html" class="btn">Start World 2</a>', '<a href="{{ctaHref}}" class="btn">{{cta}}</a>')
    if '{{pct}}%' not in s or '{{xp}}' not in s or '{{title}}' not in s: raise SystemExit('boss result fields missing')
    i = s.index('>Badge</div>'); a = s.rindex('<div class="card"', 0, i); b = s.index('</div></div>', i) + 12
    s = s[:a] + '<sc-if value="{{ok}}" hint-placeholder-val="{{true}}">' + s[a:b] + '</sc-if>' + s[b:]
    i = s.index('World 2 unlocked'); a = s.rindex('<div class="card"', 0, i); b = s.index('</a></div>', i) + 10
    s = s[:a] + '<sc-if value="{{ok}}" hint-placeholder-val="{{true}}">' + s[a:b] + '</sc-if>' + s[b:]
    s = sub1(s, '<a href="UPAchievements.dc.html" class="btn btn-w">', '<sc-if value="{{ok}}" hint-placeholder-val="{{true}}"><a href="UPAchievements.dc.html" class="btn btn-w">')
    j = s.index('<a href="UPAchievements.dc.html" class="btn btn-w">'); k = s.index('</a>', j) + 4; s = s[:k] + '</sc-if>' + s[k:]
    s = logic(s, LP + '''  constructor(p) { super(p); const m = /[?&]s=(\\d)/.exec(location.search); this.score = m ? +m[1] : null; const F = window.FV; this.was = F ? F.get().bossPassed : false; }
  componentDidMount() { const F = window.FV; if (F && this.score !== null) F.passBoss(this.score); }
  renderVals() {
    const sc = this.score === null ? 4 : this.score, ok = sc >= 4;
    return { ok, eyeInk: ok ? '#16884A' : '#B42828', eyebrow: ok ? 'Boss challenge passed' : 'Not this time', title: ok ? 'World 1 complete!' : 'So close', pct: String(sc * 20),
      line: ok ? 'You scored ' + sc + ' of 5. Money Foundations is done.' : 'You scored ' + sc + ' of 5. You need 4 to pass. Review a lesson and try again.',
      xp: ok && !this.was ? '+55' : '+0', cta: ok ? 'Start World 2' : 'Try again', ctaHref: ok ? 'UPJourney.dc.html' : 'UPBossIntro.dc.html' };
  }''')
    wr('UPBossResult', s)

# Challenges list: real status.
s = rd('UPChallenges')
if MARK not in s:
    s = sub1(s, 'background: #FFE6E6; color: #B42828">New</span>', 'background: {{infBg}}; color: {{infFg}}">{{infTag}}</span>')
    s = sub1(s, 'background: #E1F7EA; color: #16884A">Done</span>', 'background: {{bossBg}}; color: {{bossFg}}">{{bossTag}}</span>')
    s = sub1(s, '<a href="#locked" class="card press"', '<a href="UMLocked.dc.html" class="card press"')
    s = logic(s, LP + '''  renderVals() {
    const F = window.FV, LP = this.LP(), inf = LP && LP.challenge('inflation'), boss = F && F.get().bossPassed;
    return { infTag: inf ? 'Done' : 'New', infBg: inf ? '#E1F7EA' : '#FFE6E6', infFg: inf ? '#16884A' : '#B42828',
      bossTag: boss ? 'Done' : 'Boss', bossBg: boss ? '#E1F7EA' : '#F1EBFB', bossFg: boss ? '#16884A' : '#4C1D95' };
  }''')
    wr('UPChallenges', s)

# Inflation challenge: a real slider; finishing saves it and gives +15 XP the first time.
s = rd('UPInflation')
if MARK not in s:
    s = sub1(s, '<span>Inflation every year</span><strong class="num" style="font-size: 20px">20%</strong>', '<label for="infl">Inflation every year</label><strong class="num" style="font-size: 20px">{{rate}}%</strong>')
    s = sub1(s, '<div style="height: 8px; border-radius: 999px; background: #E7E2F0; position: relative"><div style="width: 50%; height: 100%; border-radius: 999px; background: #5B21B6"></div><span style="position: absolute; left: 50%;',
        '<div style="height: 8px; border-radius: 999px; background: #E7E2F0; position: relative"><input id="infl" type="range" min="0" max="40" step="1" value="{{rate}}" onInput="{{onRate}}" aria-valuetext="{{rate}}% a year" style="position: absolute; inset: -14px 0; width: 100%; height: 36px; margin: 0; opacity: 0; cursor: pointer; z-index: 2"><div style="width: {{pos}}%; height: 100%; border-radius: 999px; background: #5B21B6"></div><span style="position: absolute; left: {{pos}}%;')
    for y, v in (('After 1 year', '₦83,333'), ('After 2 years', '₦69,444')):
        s = sub1(s, '<span class="muted">%s</span><strong class="num">%s</strong>' % (y, v), '<span class="muted">%s</span><strong class="num">{{y%s}}</strong>' % (y, y.split()[1]))
    s = sub1(s, 'color: #B42828">₦57,870</strong>', 'color: #B42828">{{y3}}</strong>')
    s = sub1(s, ">What ₦100,000 buys today, in today's money. ₦100,000 ÷ 1.2³ = ₦57,870. Real inflation changes every year.</span>", '>{{note}}</span>')
    s = sub1(s, '<a href="UPChallenges.dc.html" class="btn">Finish challenge · +15 XP</a>', '<a href="UPChallenges.dc.html" onClick="{{finish}}" class="btn">{{finishLabel}}</a>')
    s = logic(s, LP + '''  constructor(p) { super(p); this.state = { rate: 20 }; }
  renderVals() {
    const r = this.state.rate, f = (n) => '\\u20a6' + Math.round(100000 / Math.pow(1 + r / 100, n)).toLocaleString('en-NG'), LP = this.LP(), done = LP && LP.challenge('inflation');
    return { rate: String(r), pos: String(r / 40 * 100), y1: f(1), y2: f(2), y3: f(3), onRate: (e) => this.setState({ rate: +e.target.value }),
      note: "What \\u20a6100,000 buys today, in today's money. \\u20a6100,000 \\u00f7 " + (1 + r / 100).toFixed(2).replace(/\\.?0+$/, '') + '\\u00b3 = ' + f(3) + '. Real inflation changes every year.',
      finishLabel: done ? 'Finish challenge' : 'Finish challenge \\u00b7 +15 XP', finish: () => { if (LP) LP.finishChallenge('inflation'); } };
  }''')
    wr('UPInflation', s)

# Micro modules (1 minute each): finishing gives +15 XP the first time and returns to where you came from.
for n, k in (('UPLearnTerm', 'term'), ('UPLearnSteps', 'steps'), ('UPLearnCompare', 'compare'), ('UPLearnMarket', 'market'), ('UPLearnMyth', 'myth')):
    s = rd(n)
    if MARK not in s:
        s = sub1(s, '<a href="UPLessonChoice.dc.html" class="btn b-blue">Continue</a>', '<a href="{{back}}" onClick="{{finish}}" class="btn b-blue">{{doneLabel}}</a>')
        s = sub1(s, 'aria-label="Close lesson and return to the journey"', 'aria-label="Close"')
        s = re.sub(r'(<span[^>]*>)1/3(</span>)', r'\1\2', s, count=1)
        s = logic(s, LP + '''  componentDidMount() { const prev = window.FV_PREV || ''; if (prev && !/Learn/.test(prev)) this.from = prev.replace(/^U[DP][xyz]?(?=[A-Z])/, (m) => m); this.setState({ n: 1 }); }
  renderVals() { const LP = this.LP(), done = LP && LP.micro('%s'); return { back: this.from || 'UPLibrary.dc.html', doneLabel: done ? 'Done' : 'Done \\u00b7 +15 XP', finish: () => { if (LP) LP.finishMicro('%s'); } }; }''' % (k, k))
        wr(n, s)
print('learning loop wired')

# Article "Practise it in 1 minute" opens the matching micro module (or the journey).
s = rd('UPArticle')
if '{{practiseHref}}' not in s:
    s = sub1(s, '<a href="UPLearnTerm.dc.html" class="press"', '<a href="{{practiseHref}}" class="press"')
    s = sub1(s, "      save: () => { L.toggleSave(a.slug); this.setState({ n: this.state.n + 1 }); } };", "      practiseHref: ({ dividend: 'UPLearnTerm', 'what-is-a-share': 'UPLearnSteps', 'saving-vs-investing': 'UPLearnCompare', 'stock-exchange': 'UPLearnMarket', 'risk-and-return': 'UPLearnMyth' }[a.slug] || 'UPJourney') + '.dc.html',\n      save: () => { L.toggleSave(a.slug); this.setState({ n: this.state.n + 1 }); } };")
    wr('UPArticle', s)
print('article practise links wired')
