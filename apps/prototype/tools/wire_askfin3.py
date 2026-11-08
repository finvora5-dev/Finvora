#!/usr/bin/env python3
"""Design Part 3 (Ask Fin grounded answers): screens.
- Chat: "Did you mean" buttons inside Fin's reply, a green line on replies that didn't use a free question,
  and the question box replaced by the limit panel once the free questions are used up.
- Admin editor: optional "Ask words" box.
Re-runnable. Run after wire_settings.py."""
import sys, os
SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'site')
rd = lambda n: open(os.path.join(SITE, n + '.dc.html'), encoding='utf-8').read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w', encoding='utf-8').write(s)
def sub(s, old, new, n):
    if new in s: return s
    if old not in s: raise SystemExit('not found in ' + n + ': ' + old[:80])
    return s.replace(old, new, 1)

for n in ['UPAskKobo', 'UDxAskKobo']:
    s = rd(n)
    s = sub(s, '<p style="margin: 0">{{m.a}}</p>',
        '<p style="margin: 0">{{m.a}}</p><sc-if value="{{m.hasPicks}}" hint-placeholder-val="{{false}}"><div style="display: flex; flex-direction: column; gap: 8px"><sc-for list="{{m.picks}}" as="k" hint-placeholder-count="2"><button type="button" class="chip" onClick="{{k.tap}}" style="cursor: pointer; font: inherit; text-align: left">{{k.label}}</button></sc-for></div></sc-if>'
        '<sc-if value="{{m.free}}" hint-placeholder-val="{{false}}"><span style="font-size: 12px; font-weight: 600; color: #147D44">This didn’t use a free question</span></sc-if>', n)
    s = sub(s, "noCite: !m.r.citations.length }));",
        "noCite: !m.r.citations.length, free: limit !== null && !!window.FVD && !window.FVD.countsTowardLimit(m.r.kind), picks: (m.r.choices || []).map((c) => ({ label: c.title, tap: () => this.send(/\\?$/.test(c.title) ? c.title : 'What is ' + c.title + '?') })), hasPicks: !!(m.r.choices && m.r.choices.length) }));", n)
    # Footer: question box only while questions are left; otherwise the limit panel.
    s = sub(s, '<div style="display: flex; flex-wrap: wrap; gap: 8px"><sc-for list="{{chips}}"',
        '<sc-if value="{{blocked}}" hint-placeholder-val="{{false}}"><div style="display: flex; flex-direction: column; gap: 10px; text-align: center; padding: 4px 0"><h2 style="margin: 0; font-size: 17px">That’s your 5 free questions for today</h2><p class="muted" style="margin: 0; font-size: 14px; line-height: 1.5">Fin will answer again tomorrow. With Plus you can ask as many as you like.</p><a href="USPlans.dc.html" class="btn" style="text-decoration: none">See Plus</a></div></sc-if>'
        '<sc-if value="{{open}}" hint-placeholder-val="{{true}}"><div style="display: flex; flex-direction: column; gap: 10px"><div style="display: flex; flex-wrap: wrap; gap: 8px"><sc-for list="{{chips}}"', n)
    s = sub(s, '{{left}}</a>', '{{left}}</a></div></sc-if>', n)
    s = sub(s, "return { msgs, empty:", "const blocked = limit !== null && !st.allowed;\n    return { msgs, blocked, open: !blocked, empty:", n)
    wr(n, s)

n = 'UAEditor'; s = rd(n)
s = sub(s, '<input class="field" value="{{f.definition}}" onInput="{{on.definition}}"></label>',
    '<input class="field" value="{{f.definition}}" onInput="{{on.definition}}"></label>'
    '<label style="display: flex; flex-direction: column; gap: 6px"><span style="font-weight: 700; font-size: 13px">Ask words (optional)</span><input class="field" value="{{f.askWords}}" onInput="{{on.askWords}}" placeholder="expensive, costly, prices going up"><span class="muted" style="font-size: 12px">Everyday words learners might use. Fin uses them to find this article. Separate with commas.</span></label>', n)
s = sub(s, "howIntro: set('howIntro'), topic: set('topic') },", "howIntro: set('howIntro'), topic: set('topic'), askWords: set('askWords') },", n)
wr(n, s)
print('Ask Fin Part 3 screens wired')
