"""Copy the approved desktop canvas boards into the prototype site and wire them to
the learner's real progress (window.FV), like the phone boards.
Usage: python3 build_desktop.py <folder with UD*.dc.html> <site folder>"""
import re, sys, os
SRC, SITE = sys.argv[1], sys.argv[2]
HEAD = '<script src="./support.js"></script>'
INJECT = HEAD + '\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<link rel="stylesheet" href="./responsive.css">\n<script src="./responsive.js"></script>\n<script src="./fvd.js"></script>\n<script src="./fv.js"></script>'
def inject(s): return s if 'fv.js' in s else s.replace(HEAD, INJECT, 1)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing: ' + a[:70])
    return s.replace(a, b, 1)
def chips(s):
    s = re.sub(r'(aria-label=")Streak: 5 days(">.*?</svg>)5</a>', r'\1Streak: {{streak}} days\2{{streak}}</a>', s, flags=re.S)
    s = re.sub(r'(aria-label=")160 XP, Level 2(">.*?</svg>)160</a>', r'\1{{xp}} XP, Level {{level}}\2{{xp}}</a>', s, flags=re.S)
    return s
NEXT_JS = '''
    const FV = window.FV, st = FV ? FV.get() : { done: 0, best: [], xp: 0, bossPassed: false };
    const cur = FV ? FV.current() : null, done = st.done;
    const v = { streak: FV ? FV.streak() : 0, xp: st.xp, level: FV ? FV.level(st.xp) : 1, done };
    if (cur) Object.assign(v, { nextHref: 'UPLessonInfo.dc.html', nextLabel: (done ? 'Next for you' : 'Start here'), nextTitle: cur.title, nextMeta: 'Lesson ' + (done + 1) + ' of 6 \\u00b7 ' + cur.min + ' min \\u00b7 +15 XP', nextCta: done ? 'Continue lesson' : 'Start lesson', nextPct: Math.round(done / 6 * 100) });
    else if (!st.bossPassed) Object.assign(v, { nextHref: 'UPBossIntro.dc.html', nextLabel: 'Boss challenge ready', nextTitle: 'The \\u20a6100,000 plan', nextMeta: 'Pass with 4 of 5 to finish World 1', nextCta: 'Start challenge', nextPct: 100 });
    else Object.assign(v, { nextHref: 'UDJourney.dc.html', nextLabel: 'World 1 complete', nextTitle: 'Review your journey', nextMeta: 'All 6 lessons and the boss challenge done', nextCta: 'Open journey', nextPct: 100 });
    const lv = [0, 100, 250, 500, 900], nx = lv[v.level] || 900, pv = lv[v.level - 1] || 0;
    v.levelPct = Math.min(100, Math.round((st.xp - pv) / Math.max(1, nx - pv) * 100)); v.levelNext = nx;
    v.badges = (done >= 1 ? 1 : 0) + (st.bossPassed ? 1 : 0) + ((FV ? FV.streak() : 0) >= 7 ? 1 : 0) + (done >= 6 ? 1 : 0);
    v.levelName = ['Money Explorer', 'Finance Learner', 'Market Explorer', 'Company Detective', 'Financial Analyst in Training'][v.level - 1];'''
# ---------- Home ----------
h = open(os.path.join(SRC, 'UDHome.dc.html')).read()
h = chips(h)
h = sub1(h, 'href="UDLesson.dc.html" class="press" style="display: flex; align-items: center; gap: 28px', 'href="{{nextHref}}" class="press" style="display: flex; align-items: center; gap: 28px')
h = sub1(h, '<span class="eyebrow" style="color: #DDD6FE">Next for you</span><strong style="font-size: 30px; line-height: 1.15">Simple and compound interest</strong><span style="font-size: 16px; color: #E9E3FB">Lesson 5 of 6 · 4 min · +15 XP</span>',
         '<span class="eyebrow" style="color: #DDD6FE">{{nextLabel}}</span><strong style="font-size: 30px; line-height: 1.15">{{nextTitle}}</strong><span style="font-size: 16px; color: #E9E3FB">{{nextMeta}}</span>')
h = sub1(h, '<span style="display: block; width: 66%; height: 100%; background: #FFFFFF; border-radius: 999px"></span>', '<span style="display: block; width: {{nextPct}}%; height: 100%; background: #FFFFFF; border-radius: 999px"></span>')
h = sub1(h, '>Continue lesson</span></a>', '>{{nextCta}}</span></a>')
h = re.sub(r'(day streak</span>)', r'\1', h)
h = sub1(h, '<strong style="display: block; font-size: 24px; line-height: 1.1">5</strong><span class="muted" style="font-size: 14px">day streak</span>', '<strong style="display: block; font-size: 24px; line-height: 1.1">{{streak}}</strong><span class="muted" style="font-size: 14px">day streak</span>')
h = sub1(h, '<strong style="display: block; font-size: 24px; line-height: 1.1">160</strong><span class="muted" style="font-size: 14px">XP</span>', '<strong style="display: block; font-size: 24px; line-height: 1.1">{{xp}}</strong><span class="muted" style="font-size: 14px">XP</span>')
h = sub1(h, '<span>Level 2 · Finance Learner</span><span class="muted">160 / 250 XP</span></div><div class="bar"><div style="width: 64%"></div></div>', '<span>Level {{level}} · {{levelName}}</span><span class="muted">{{xp}} / {{levelNext}} XP</span></div><div class="bar"><div style="width: {{levelPct}}%"></div></div>')
h = sub1(h, '<strong style="display: block; font-size: 24px; line-height: 1.1">3</strong><span class="muted" style="font-size: 14px">badges</span>', '<strong style="display: block; font-size: 24px; line-height: 1.1">{{badges}}</strong><span class="muted" style="font-size: 14px">badges</span>')
h = sub1(h, 'renderVals() { return {}; }', 'renderVals() {' + NEXT_JS + '\n    return v;\n  }')
open(os.path.join(SITE, 'UDHome.dc.html'), 'w').write(inject(h))
# ---------- Journey: desktop shell + the live phone board's dynamic sections ----------
dj = open(os.path.join(SRC, 'UDJourney.dc.html')).read()
pj = open(os.path.join(SITE, 'UPJourney.dc.html')).read()
def grab(s, start):
    a = s.index(start); depth = 0; i = a
    while True:
        o = s.find('<section', i + 1); c = s.find('</section>', i + 1)
        if o != -1 and o < c: depth += 1; i = o
        else:
            if depth == 0: return s[a:c + 10]
            depth -= 1; i = c
for key in ['<section aria-labelledby="w1-h"', '<section aria-labelledby="path-h"', '<section aria-labelledby="w2-h"']:
    dj = dj.replace(grab(dj, key), grab(pj, key).replace('margin: 0 -16px', 'margin: 0 auto').replace('style="padding-top: 44px"', ''), 1)
dj = chips(dj)
dj = sub1(dj, 'href="UDLesson.dc.html" class="press" style="display: flex; align-items: center; gap: 24px', 'href="{{nextHref}}" class="press" style="display: flex; align-items: center; gap: 24px')
dj = sub1(dj, '>UP NEXT · LESSON 5 OF 6</span><strong class="h" style="font-size: 24px; font-weight: 600">Simple and compound interest</strong><span style="font-size: 15px; color: #615A6E">See how interest earns interest. 4 min · +15 XP</span>',
          '>{{nextLabel}}</span><strong class="h" style="font-size: 24px; font-weight: 600">{{nextTitle}}</strong><span style="font-size: 15px; color: #615A6E">{{nextMeta}}</span>')
dj = sub1(dj, '>Start lesson</span></a>', '>{{nextCta}}</span></a>')
m = re.search(r'renderVals\(\) \{\n(.*?)\n  return v;\n\}', pj, flags=re.S)
body = m.group(1).replace('const FV = window.FV, st = FV ? FV.get() : { done: 0, best: [], xp: 0, bossPassed: false };', '').replace('const done = st.done, v = { streak: FV ? FV.streak() : 0, xp: st.xp, level: FV ? FV.level(st.xp) : 1, done };', '')
dj = sub1(dj, 'renderVals() { return {}; }', 'renderVals() {' + NEXT_JS + '\n' + body + '\n    if (v.nextLabel === "Next for you" || v.nextLabel === "Start here") v.nextLabel = "Up next \\u00b7 lesson " + (done + 1) + " of 6";\n    return v;\n  }')
open(os.path.join(SITE, 'UDJourney.dc.html'), 'w').write(inject(dj))
# ---------- Library, Markets, Simulator, Me: chips are the learner's real numbers ----------
for n in ['UDLibrary', 'UDMarkets', 'UDSimulator', 'UDMe']:
    s = chips(open(os.path.join(SRC, n + '.dc.html')).read())
    s = s.replace('renderVals() { return {}; }', 'renderVals() {\n    const FV = window.FV, st = FV ? FV.get() : { xp: 0 };\n    return { streak: FV ? FV.streak() : 0, xp: st.xp, level: FV ? FV.level(st.xp) : 1 };\n  }', 1)
    if n == 'UDMe':
        s = s.replace("renderVals() {\n    const FV = window.FV, st = FV ? FV.get() : { xp: 0 };\n    return { streak: FV ? FV.streak() : 0, xp: st.xp, level: FV ? FV.level(st.xp) : 1 };\n  }", 'renderVals() {' + NEXT_JS + '\n    v.badges = (done >= 1 ? 1 : 0) + (st.bossPassed ? 1 : 0) + ((FV ? FV.streak() : 0) >= 7 ? 1 : 0) + (done >= 6 ? 1 : 0);\n    return v;\n  }', 1)
        s = s.replace('<span class="muted">Level 2 · Finance Learner</span>', '<span class="muted">Level {{level}} · {{levelName}}</span>')
        s = s.replace('width: 64%; height: 100%; border-radius: 999px; background: #5B21B6', 'width: {{levelPct}}%; height: 100%; border-radius: 999px; background: #5B21B6', 1)
        s = s.replace('160 / 250 XP to Market Explorer', '{{xp}} / {{levelNext}} XP to the next level', 1)
        s = s.replace('<strong style="display: block; font-size: 24px; line-height: 1.1">3</strong>', '<strong style="display: block; font-size: 24px; line-height: 1.1">{{badges}}</strong>', 1)
        s = s.replace('<strong style="display: block; font-size: 24px; line-height: 1.1">5</strong>', '<strong style="display: block; font-size: 24px; line-height: 1.1">{{streak}}</strong>', 1).replace('<strong style="display: block; font-size: 24px; line-height: 1.1">160</strong>', '<strong style="display: block; font-size: 24px; line-height: 1.1">{{xp}}</strong>', 1)
    open(os.path.join(SITE, n + '.dc.html'), 'w').write(inject(s))
# Sidebar profile shows the learner's real level on every desktop board.
for n in ['UDHome', 'UDJourney', 'UDLibrary', 'UDMarkets', 'UDSimulator', 'UDMe']:
    q = os.path.join(SITE, n + '.dc.html'); t = open(q).read()
    t = t.replace('<strong style="display: block">Ada</strong><span class="muted">Level 2 · Finance Learner</span>', '<strong style="display: block">Ada</strong><span class="muted">Level {{level}} learner</span>')
    open(q, 'w').write(t)
# Lessons open the interactive phone lesson flow (styled for desktop by responsive.css).
for n in os.listdir(SITE):
    if n.startswith('UD') and n.endswith('.dc.html'):
        p = os.path.join(SITE, n); s = open(p).read().replace('href="UDLesson.dc.html"', 'href="UPLessonInfo.dc.html"'); open(p, 'w').write(s)
print('desktop boards built')
