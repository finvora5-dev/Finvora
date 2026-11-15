"""Wire the remaining lesson step boards (compare, myth, order, match, scenario) to the lesson content in fv.js.
Inside a lesson (?in=1) a board shows that lesson's step; opened on its own it keeps its drawn quick-learn content.
Order: drag to reorder, or Space to pick up and arrows to move (the board's own instructions).
Match: tap a word, then its meaning (the board's own instructions). Results use the bottom sheet (owner preference).
Run after wire_navy_lessons.py. Usage: python3 wire_navy_steps.py <site folder>"""
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
MARK = '/* navy-steps */'
WIRED = ['info', 'compare', 'myth', 'choice', 'order', 'match', 'scenario', 'calc']
f = open(path('fv.js')).read()
f = re.sub(r'var NAVY_STEPS = \[[^\]]*\];', 'var NAVY_STEPS = ' + str(WIRED).replace("'", '"') + ';', f)
open(path('fv.js'), 'w').write(f)

BAR = '<span style="flex: 1; display: flex; gap: 5px" role="img" aria-label="{{fText}}"><sc-for list="{{bars}}" as="b" hint-placeholder-count="5"><span style="flex: 1; height: 5px; border-radius: 999px; background: {{b.c}}"></span></sc-for></span>'
def bars(s):
    a = s.index('<span style="flex: 1; display: flex; gap: 5px" role="img" aria-label="'); b = s.index('</span></span>', a) + len('</span></span>')
    return s[:a] + BAR + s[b:]
HELP = '''  F() { return window.FV; }
  inL() { return !!(window.FV && window.FV.inLesson() && /[?&]in=1/.test(location.search)); }
  L() { return this.F() ? this.F().lesson() : { title: '', c: null }; }
  flow(kind, drawnNext) {
    const F = this.F();
    if (!F || !this.inL()) return { fText: '', bars: [0, 1, 2, 3, 4].map((i) => ({ c: i < this.drawnStep - 1 ? '#10B981' : i === this.drawnStep - 1 ? '#0B192C' : '#E2E5EA' })), next: drawnNext, n: this.drawnStep, total: 5 };
    const v = F.flowVals(kind), n = +v.fN, t = +v.fTotal;
    return { fText: v.fText, next: v.nextHref, n, total: t, bars: Array.from({ length: t }, (_, i) => ({ c: i < n - 1 ? '#10B981' : i === n - 1 ? '#0B192C' : '#E2E5EA' })) };
  }
'''
SHEET_SRC = rd('LessonNavy')
i = SHEET_SRC.index('<sc-if value="{{answered}}"'); j = SHEET_SRC.index('</sc-if>', SHEET_SRC.index('</section>', i)) + len('</sc-if>')
SHEET = SHEET_SRC[i:j]
def add_sheet(s):
    k = s.rindex('</div>', 0, s.index('</x-dc>'))
    return s[:k] + SHEET + s[k:]
def ask(s, old):
    return sub1(s, old, '{{askTitle}}')

# Compare
s = rd('LearnCompareNavy')
if MARK not in s:
    s = bars(s)
    s = sub1(s, '>Quick learn · Compare<', '>{{kicker}}<')
    s = sub1(s, '>Savings account or Treasury bill?</h1>', '>{{title}}</h1>')
    a = s.index('<strong style="font-size: 15px; font-weight: 600">Savings</strong>'); b = s.index('</div>', a)
    s = s[:a] + '<strong style="font-size: 15px; font-weight: 600">{{aName}}</strong><sc-for list="{{aItems}}" as="x" hint-placeholder-count="3"><span style="display: flex; gap: 8px; font-size: 13px; line-height: 1.4"><span style="color: #5B6577">•</span>{{x.t}}</span></sc-for>' + s[b:]
    a = s.index('<strong style="font-size: 15px; font-weight: 600">Treasury bill</strong>'); b = s.index('</div>', a)
    s = s[:a] + '<strong style="font-size: 15px; font-weight: 600">{{bName}}</strong><sc-for list="{{bItems}}" as="x" hint-placeholder-count="3"><span style="display: flex; gap: 8px; font-size: 13px; line-height: 1.4"><span style="color: #00E676">•</span>{{x.t}}</span></sc-for>' + s[b:]
    s = ask(s, 'Ask Finvora: what do Treasury bills pay now?')
    s = sub1(s, '<a href="LearnMythNavy.dc.html" style="flex: 1;', '<a href="{{next}}" style="flex: 1;')
    s = logic(s, MARK + '\n  drawnStep = 3;\n' + HELP + '''  renderVals() {
    const fl = this.flow('compare', 'LearnMythNavy.dc.html'), L = this.L(), c = this.inL() && L.c && L.c.compare;
    const it = (a) => a.map((t) => ({ t }));
    if (!c) return Object.assign(fl, { kicker: 'Quick learn · Compare', title: 'Savings account or Treasury bill?', aName: 'Savings', bName: 'Treasury bill', aItems: it(['Take money out anytime', 'Lower interest', 'Run by your bank']), bItems: it(['Locked for 91 to 364 days', 'Higher interest', 'Backed by the government']), askTitle: 'Ask Finvora: what do Treasury bills pay now?' });
    return Object.assign(fl, { kicker: L.title + ' · Compare', title: c.title, aName: c.a.name, bName: c.b.name, aItems: it(c.a.items), bItems: it(c.b.items), askTitle: 'Ask Finvora about ' + c.title.toLowerCase() });
  }''')
    wr('LearnCompareNavy', s)

# Myth or fact
s = rd('LearnMythNavy')
if MARK not in s:
    s = bars(s)
    s = sub1(s, '>Quick learn · Myth or fact<', '>{{kicker}}<')
    s = sub1(s, '>“You need millions to invest on the NGX”</h1>', '>“{{myth}}”</h1>')
    s = sub1(s, '>Many NGX shares cost under ₦50. You can start with a few thousand naira through a licensed broker.</p>', '>{{why}}</p>')
    s = sub1(s, '>Fees matter more on small amounts, so check what your broker charges.</p>', '>{{fact}}</p>')
    s = ask(s, 'Ask Finvora: how much do broker fees cost?')
    s = sub1(s, '<a href="LearnMarketNavy.dc.html" style="flex: 1;', '<a href="{{next}}" style="flex: 1;')
    s = logic(s, MARK + '\n  drawnStep = 4;\n' + HELP + '''  renderVals() {
    const fl = this.flow('myth', 'LearnMarketNavy.dc.html'), L = this.L(), c = this.inL() && L.c && L.c.myth;
    if (!c) return Object.assign(fl, { kicker: 'Quick learn · Myth or fact', myth: 'You need millions to invest on the NGX', why: 'Many NGX shares cost under ₦50. You can start with a few thousand naira through a licensed broker.', fact: 'Fees matter more on small amounts, so check what your broker charges.', askTitle: 'Ask Finvora: how much do broker fees cost?' });
    return Object.assign(fl, { kicker: L.title + ' · Myth or fact', myth: c.myth, why: c.fact, fact: c.tip, askTitle: 'Ask Finvora about ' + L.title.toLowerCase() });
  }''')
    wr('LearnMythNavy', s)

# Order
s = rd('LessonOrderNavy')
if MARK not in s:
    s = bars(s)
    s = sub1(s, '>Buying shares · Order<', '>{{kicker}}<')
    s = sub1(s, '>Put the steps to buy NGX shares in order</h1>', '>{{q}}</h1>')
    a = s.index('<ol style="'); b = s.index('</ol>', a) + 5
    li = s[s.index('<li style="', a):s.index('</li>', a) + 5]
    grip = li[li.index('</span>[', 0) if False else li.rindex('<svg'):li.rindex('</li>')]
    s = s[:a] + '<sc-if value="{{hasEnds}}" hint-placeholder-val="{{ false }}"><p style="margin: 16px 24px 0; font-size: 12px; color: #5B6577; flex: none">{{endA}}</p></sc-if><ol id="ord" aria-label="Items to put in order" style="margin: 8px 24px 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; flex: none; touch-action: none"><sc-for list="{{items}}" as="x" hint-placeholder-count="4"><li tabindex="0" role="button" aria-roledescription="sortable item" aria-pressed="{{x.held}}" aria-label="{{x.aria}}" data-i="{{x.i}}" onPointerDown="{{x.down}}" onKeyDown="{{x.key}}" style="display: flex; align-items: center; gap: 12px; min-height: 58px; padding: 0 14px; border-radius: 14px; background: #FFFFFF; border: {{x.bd}}; box-shadow: {{x.sh}}; transform: {{x.tf}}; transition: {{x.tr}}; cursor: grab; user-select: none; -webkit-user-select: none; position: relative; z-index: {{x.z}}"><span style="width: 28px; height: 28px; flex: none; border-radius: 8px; background: {{x.nb}}; color: {{x.nc}}; display: flex; align-items: center; justify-content: center; font-family: \'Geist Mono\', monospace; font-size: 13px">{{x.n}}</span><span style="flex: 1; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 15px">{{x.t}}</span><sc-if value="{{x.hasSub}}" hint-placeholder-val="{{ false }}"><span style="font-size: 12px; color: #5B6577">{{x.sub}}</span></sc-if></span>' + grip + '</li></sc-for></ol><sc-if value="{{hasEnds}}" hint-placeholder-val="{{ false }}"><p style="margin: 8px 24px 0; font-size: 12px; color: #5B6577; flex: none">{{endB}}</p></sc-if><p role="status" aria-live="polite" style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0)">{{live}}</p>' + s[b:]
    s = sub1(s, '<button style="flex: none; min-height: 54px;', '<button type="button" onClick="{{toggleHint}}" aria-expanded="{{hintOpen}}" style="cursor: pointer; flex: none; min-height: 54px;')
    s = sub1(s, '<p style="margin: 12px 24px 0; font-size: 13px; line-height: 1.6; color: #334155; flex: none">Drag to reorder. Keyboard: Space to pick up, arrows to move.</p>', '<p style="margin: 12px 24px 0; font-size: 13px; line-height: 1.6; color: #334155; flex: none">Drag to reorder. Keyboard: Space to pick up, arrows to move.</p><sc-if value="{{showHint}}" hint-placeholder-val="{{ false }}"><p style="margin: 8px 24px 0; font-size: 14px; line-height: 1.5; color: #334155; flex: none">{{hint}}</p></sc-if>')
    s = sub1(s, '<a href="LessonScenarioNavy.dc.html" style="flex: 1;', '<a href="#" onClick="{{check}}" style="flex: 1;')
    s = add_sheet(s)
    s = logic(s, MARK + '\n  drawnStep = 4;\n' + HELP + '''  constructor(p) { super(p); const c = this.data(); this.state = { order: c.start.slice(), held: null, drag: null, res: null, hint: false, live: '' }; }
  data() {
    const L = this.L(), c = this.inL() && L.c && L.c.order;
    if (c) return { q: c.q, items: c.items, start: c.start.slice(), wrong: c.wrong, right: c.right, note: c.note, ends: c.ends || null, title: L.title };
    return { q: 'Put the steps to buy NGX shares in order', items: [['Open an account with a stockbroker'], ['Get a CSCS number'], ['Fund your account'], ['Place a buy order']], start: [1, 0, 3, 2], wrong: 'A broker account comes first, then the CSCS number, then money, then the order.', right: ['You need a stockbroker to trade on the NGX.', 'The CSCS number holds your shares.', 'Fund the account, then place the order.'], note: '', ends: null, title: 'Buying shares' };
  }
  move(from, to) { const o = this.state.order.slice(); if (to < 0 || to >= o.length || from === to) return; const [x] = o.splice(from, 1); o.splice(to, 0, x); this.setState({ order: o, held: this.state.held === null ? null : to, live: this.data().items[x][0] + ', position ' + (to + 1) + ' of ' + o.length }); }
  down(e, idx) {
    if (this.state.res) return; const li = e.currentTarget, ol = li.parentNode, startY = e.clientY, H = li.offsetHeight + 10;
    let cur = idx, moved = false; li.setPointerCapture && li.setPointerCapture(e.pointerId);
    const mv = (ev) => { const dy = ev.clientY - startY; if (!moved && Math.abs(dy) < 4) return; moved = true;
      const target = Math.max(0, Math.min(this.state.order.length - 1, idx + Math.round(dy / H)));
      if (target !== cur) { this.move(cur, target); cur = target; }
      this.setState({ drag: { i: cur, dy: dy - (cur - idx) * H } }); };
    const up = () => { li.removeEventListener('pointermove', mv); li.removeEventListener('pointerup', up); li.removeEventListener('pointercancel', up); this.setState({ drag: null }); };
    li.addEventListener('pointermove', mv); li.addEventListener('pointerup', up); li.addEventListener('pointercancel', up);
  }
  key(e, idx) {
    if (this.state.res) return; const h = this.state.held;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.setState({ held: h === idx ? null : idx, live: h === idx ? 'Dropped' : 'Picked up. Use the arrow keys to move.' }); return; }
    if (h === idx && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); const to = idx + (e.key === 'ArrowUp' ? -1 : 1); this.move(idx, to); setTimeout(() => { const el = document.querySelector('#ord li[data-i="' + Math.max(0, Math.min(this.state.order.length - 1, to)) + '"]'); if (el) el.focus(); }, 0); }
  }
  check() {
    if (this.state.res) return; const o = this.state.order, ok = o.every((v, i) => v === i);
    if (this.F() && this.inL()) this.F().answer('order', ok, o.join(','));
    this.setState({ res: { ok }, held: null });
  }
  renderVals() {
    const d = this.data(), fl = this.flow('order', 'LessonScenarioNavy.dc.html'), r = this.state.res, ok = !!(r && r.ok), dr = this.state.drag;
    const items = this.state.order.map((v, i) => { const it = d.items[v], held = this.state.held === i, dragging = !!(dr && dr.i === i);
      return { i: String(i), n: String(i + 1), t: it[0], sub: it[1] || '', hasSub: !!it[1], held: String(held), aria: it[0] + ', position ' + (i + 1) + ' of ' + d.items.length,
        bd: held || dragging ? '2px solid #0B192C' : '1px solid #D5D9E0', sh: held || dragging ? '0 10px 22px rgba(17,28,45,.14)' : 'none',
        tf: dragging ? 'translateY(' + dr.dy + 'px)' : 'none', tr: dragging ? 'none' : 'transform 200ms var(--ease-out)', z: dragging ? '2' : '0',
        nb: held || dragging ? '#0B192C' : '#E8EBEF', nc: held || dragging ? '#FFFFFF' : '#5B6577',
        down: (e) => this.down(e, i), key: (e) => this.key(e, i) }; });
    return Object.assign(fl, { kicker: d.title + ' · Order', q: d.q, items, hasEnds: !!d.ends, endA: d.ends ? d.ends[0] : '', endB: d.ends ? d.ends[1] : '', live: this.state.live,
      hint: d.wrong, showHint: this.state.hint && !r, hintOpen: String(this.state.hint), toggleHint: () => this.setState({ hint: !this.state.hint }),
      check: (e) => { e.preventDefault(); this.check(); },
      answered: !!r, iconBg: ok ? '#DDF3E6' : '#FCEDEB', tone: ok ? '#10B981' : '#B9473F', icon: ok ? '✓' : '×',
      title: ok ? 'Correct' : 'Not quite', sub: 'Question ' + fl.n + ' of ' + fl.total,
      why: ok ? d.right.join(' ') + (d.note ? ' ' + d.note : '') : d.wrong,
      askTitle: 'Ask Finvora to explain this order', askQ: encodeURIComponent(d.q),
      cta: ok ? 'Continue' : 'Try again', ctaHref: ok ? fl.next : '#', ctaBg: '#0B192C' });
  }''')
    # wrong answer: the sheet's button closes the sheet so the learner can move the items and check again
    s = sub1(s, '<a href="{{ctaHref}}" style="height: 54px;', '<a href="{{ctaHref}}" onClick="{{again}}" style="height: 54px;')
    s = s.replace("cta: ok ? 'Continue' : 'Try again',", "again: (e) => { if (!ok) { e.preventDefault(); this.setState({ res: null }); } }, cta: ok ? 'Continue' : 'Try again',")
    wr('LessonOrderNavy', s)

# Match
s = rd('LessonMatchNavy')
if MARK not in s:
    s = bars(s)
    s = sub1(s, '>Company words · Match<', '>{{kicker}}<')
    a = s.index('<div style="margin: 18px 24px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex: none">'); b = s.index('<div style="margin: 14px 24px 0; display: flex; align-items: center; gap: 10px; flex: none">', a)
    tick = re.search(r'<span style="width: 18px; height: 18px; border-radius: 999px; background: #10B981;[^"]*">(<svg.*?</svg>)</span>', s[a:b], flags=re.S).group(1)
    s = s[:a] + '<div style="margin: 18px 24px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex: none"><sc-for list="{{cells}}" as="x" hint-placeholder-count="8"><button type="button" onClick="{{x.tap}}" aria-pressed="{{x.sel}}" aria-disabled="{{x.doneS}}" style="min-height: 68px; padding: 10px 12px; border-radius: 14px; border: {{x.bd}}; background: {{x.bg}}; box-shadow: {{x.sh}}; font: inherit; font-size: 14px; font-weight: {{x.w}}; color: {{x.c}}; text-align: left; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: background-color 160ms ease, border-color 160ms ease"><sc-if value="{{x.done}}" hint-placeholder-val="{{ false }}"><span style="width: 18px; height: 18px; border-radius: 999px; background: #10B981; display: flex; align-items: center; justify-content: center; flex: none">' + tick + '</span></sc-if><span>{{x.t}}</span></button></sc-for></div>' + s[b:]
    s = sub1(s, '<span style="display: block; width: 25%; height: 100%;', '<span style="display: block; width: 100%; height: 100%; transform: scaleX({{sx}}); transform-origin: left; transition: transform 240ms var(--ease-out);')
    s = sub1(s, '>1 of 4 matched<', '>{{count}}<')
    s = sub1(s, '<button style="flex: none; min-height: 54px;', '<button type="button" onClick="{{toggleHint}}" aria-expanded="{{hintOpen}}" style="cursor: pointer; flex: none; min-height: 54px;')
    s = sub1(s, '<p style="margin: 10px 24px 0; font-size: 13px; line-height: 1.6; color: #334155; flex: none">Tap a word, then its meaning.</p>', '<p role="status" aria-live="polite" style="margin: 10px 24px 0; font-size: 13px; line-height: 1.6; color: #334155; flex: none">{{tip}}</p>')
    s = sub1(s, '<a href="LessonOrderNavy.dc.html" style="flex: 1; height: 54px; border-radius: 14px; background: #334155; opacity: .4;', '<a href="{{next}}" onClick="{{go}}" aria-disabled="{{notDone}}" style="flex: 1; height: 54px; border-radius: 14px; background: {{ctaBg}}; opacity: {{op}};')
    s = logic(s, MARK + '\n  drawnStep = 3;\n' + HELP + '''  constructor(p) { super(p); this.state = { sel: null, matched: {}, miss: null, missed: false, hint: false }; }
  data() {
    const L = this.L(), c = this.inL() && L.c && L.c.match;
    if (c) return { terms: c.terms, means: c.means, done: c.done, title: L.title };
    return { terms: ['Revenue', 'Profit', 'Dividend', 'Share'], means: ['Money from sales', 'What is left after costs', 'Cash paid to shareholders', 'A small piece of a company'], done: 'These four words come up in every company report.', title: 'Company words' };
  }
  renderVals() {
    const d = this.data(), fl = this.flow('match', 'LessonOrderNavy.dc.html'), n = d.terms.length, m = this.state.matched, done = Object.keys(m).length;
    const meanOrder = d.means.map((_, i) => i).sort((a, b) => ((a * 7 + 3) % n) - ((b * 7 + 3) % n));
    const cells = [];
    for (let r = 0; r < n; r++) {
      const ti = r, mi = meanOrder[r];
      [['t', ti, d.terms[ti]], ['m', mi, d.means[mi]]].forEach(([side, i, t]) => {
        const isDone = side === 't' ? m[i] !== undefined : Object.values(m).indexOf(i) >= 0;
        const sel = this.state.sel && this.state.sel.side === side && this.state.sel.i === i, miss = this.state.miss && this.state.miss.side === side && this.state.miss.i === i;
        cells.push({ t, done: isDone, doneS: String(isDone), sel: String(!!sel),
          bd: isDone ? '1.5px solid #10B981' : miss ? '2px solid #B9473F' : sel ? '2px solid #0B192C' : '1px solid #D5D9E0',
          bg: isDone ? '#EAF6EF' : miss ? '#FCEFED' : '#FFFFFF', sh: sel ? '0 6px 16px rgba(17,28,45,.12)' : 'none',
          w: sel ? '600' : '500', c: isDone ? '#047857' : '#0B192C',
          tap: () => {
            if (isDone) return; const s0 = this.state.sel;
            if (!s0 || s0.side === side) { this.setState({ sel: { side, i }, miss: null }); return; }
            const term = side === 't' ? i : s0.i, mean = side === 'm' ? i : s0.i;
            if (term === mean) { const mm = Object.assign({}, m); mm[term] = mean; if (window.fvSound) window.fvSound(Object.keys(mm).length === n ? 'correct' : 'pairok'); this.setState({ matched: mm, sel: null, miss: null });
              if (Object.keys(mm).length === n && this.F() && this.inL()) this.F().answer('match', !this.state.missed, 'all'); }
            else { if (window.fvSound) window.fvSound('pairno'); this.setState({ miss: { side, i }, sel: null, missed: true }); setTimeout(() => this.setState({ miss: null }), 700); }
          } });
      });
    }
    const all = done === n;
    return Object.assign(fl, { kicker: d.title + ' · Match', cells, pct: Math.round(done / n * 100) + '%', sx: (done / n).toFixed(3), count: done + ' of ' + n + ' matched',
      tip: all ? d.done : this.state.hint ? 'Start with the word you know best, then match what is left.' : 'Tap a word, then its meaning.',
      hintOpen: String(this.state.hint), toggleHint: () => this.setState({ hint: !this.state.hint }),
      notDone: String(!all), ctaBg: all ? '#0B192C' : '#334155', op: all ? '1' : '.4', go: (e) => { if (!all) e.preventDefault(); } });
  }''')
    wr('LessonMatchNavy', s)

# Scenario
s = rd('LessonScenarioNavy')
if MARK not in s:
    s = sub1(s, '>Emergency funds · Scenario<', '>{{kicker}}<')
    s = sub1(s, '<span style="display: block; width: 100%; height: 100%; background: #10B981"></span></span><span style="font-family: \'Geist Mono\', monospace; font-size: 12px; color: #5B6577">5/5</span>', '<span style="display: block; width: {{barW}}; height: 100%; background: #10B981"></span></span><span style="font-family: \'Geist Mono\', monospace; font-size: 12px; color: #5B6577">{{barL}}</span>')
    s = sub1(s, '<span style="font-size: 12px; color: #5B6577">Tolu</span>', '<span style="font-size: 12px; color: #5B6577">{{who}}</span>')
    s = sub1(s, '>I earn ₦180,000 a month. My generator broke and the repair is ₦90,000. I have ₦40,000 saved.</p>', '>{{say}}</p>')
    s = sub1(s, '>What is the best first step?</h1>', '>{{q}}</h1>')
    a = s.index('<div role="radiogroup"'); b = s.index('<div style="position: absolute; inset: 0;', a)
    s = s[:a] + '<div role="radiogroup" aria-label="Answer" style="padding: 20px 24px 0; display: flex; flex-direction: column; gap: 10px; flex: none"><sc-for list="{{opts}}" as="o" hint-placeholder-count="3"><button type="button" role="radio" aria-checked="{{o.on}}" onClick="{{o.pick}}" style="display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 0 16px; border-radius: 12px; border: {{o.bd}}; background: {{o.bg}}; font: inherit; font-size: 15px; text-align: left; color: #0B192C; cursor: pointer"><span style="font-family: \'Geist Mono\', monospace; font-size: 13px; color: #5B6577; width: 16px">{{o.l}}</span><span style="flex: 1">{{o.t}}</span><sc-if value="{{o.isRight}}" hint-placeholder-val="{{ false }}"><span style="font-size: 13px; font-weight: 600; color: #047857">Correct</span></sc-if></button></sc-for></div>' + s[b:]
    a = s.index('<div style="position: absolute; inset: 0; background: rgba(17,28,45,.45)" aria-hidden="true"></div>'); b = s.index('</section>', a) + len('</section>')
    s = s[:a] + SHEET[SHEET.index('>') + 1:SHEET.rindex('</sc-if>')].strip() + s[b:]
    s = s[:a] + '<sc-if value="{{answered}}" hint-placeholder-val="{{ false }}">' + s[a:]
    k = s.index('</section>', a) + len('</section>'); s = s[:k] + '</sc-if>' + s[k:]
    s = logic(s, MARK + HELP + '''  constructor(p) { super(p); this.state = { g: null }; }
  data() {
    const L = this.L(), c = this.inL() && L.c && L.c.scenario;
    if (c) { const who = (c.q.match(/\\b(Ada|Bisi|Amaka|Bimpe|Tunde|Tolu|Chioma)\\b/) || [])[1] || ''; return { q: c.q, say: c.say.join(''), who, opts: c.opts.map((o) => ({ t: o.rate + ': ' + o.access.charAt(0).toLowerCase() + o.access.slice(1), right: !!o.right, why: o.why })), note: c.note || '', title: L.title }; }
    return { q: 'What is the best first step?', say: 'I earn ₦180,000 a month. My generator broke and the repair is ₦90,000. I have ₦40,000 saved.', who: 'Tolu', opts: [{ t: 'Borrow from a loan app', why: 'Loan apps charge very high interest.' }, { t: 'Use savings, cover the rest from this month, then rebuild', right: true, why: "Using savings first avoids high-interest debt. Cover the rest from this month's pay, then rebuild the fund a little each month." }, { t: 'Skip rent this month', why: 'Missing rent can cost you your home.' }], note: '', title: 'Emergency funds' };
  }
  renderVals() {
    const d = this.data(), fl = this.flow('scenario', 'LessonDoneNavy.dc.html'), g = this.state.g, done = g !== null, R = d.opts.findIndex((o) => o.right), ok = g === R;
    return Object.assign(fl, { barW: Math.round(fl.n / fl.total * 100) + '%', barL: fl.n + '/' + fl.total, kicker: d.title + ' · Scenario', who: d.who, say: d.say, q: d.q,
      opts: d.opts.map((o, i) => ({ l: 'ABCD'[i], t: o.t, on: String(g === i), isRight: done && i === R,
        bd: done && i === R ? '1.5px solid #10B981' : g === i ? '1.5px solid #B9473F' : '1px solid #D5D9E0', bg: done && i === R ? '#DDF3E6' : g === i ? '#FCEFED' : '#FFFFFF',
        pick: () => { if (done) return; if (this.F() && this.inL()) this.F().answer('scenario', i === R, i); this.setState({ g: i }); } })),
      answered: done, iconBg: ok ? '#DDF3E6' : '#FCEDEB', tone: ok ? '#10B981' : '#B9473F', icon: ok ? '✓' : '×',
      title: ok ? 'Correct' : 'Not quite', sub: 'Question ' + fl.n + ' of ' + fl.total,
      why: done ? (ok ? d.opts[R].why : d.opts[g].why + ' ' + d.opts[R].why) + (d.note ? ' ' + d.note : '') : '',
      askTitle: 'Ask Finvora about this choice', askQ: encodeURIComponent(d.q),
      cta: ok ? 'Continue' : 'Got it, continue', ctaHref: done ? fl.next : '#', ctaBg: '#0B192C' });
  }''')
    s = s.replace("  F() { return window.FV; }", "  drawnStep = 5;\n  F() { return window.FV; }", 1)
    wr('LessonScenarioNavy', s)
print('wired', WIRED)
