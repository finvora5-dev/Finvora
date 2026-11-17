"""Client review, 17 Nov 2026: Plus lists the client's features, in their three groups:
company analysis (advanced company analysis, historical comparisons, financial report comparisons), investment intelligence
(Finvora Risk Signals, dividend and cash flow tracker, advanced watchlists, portfolio intelligence) and financial education
(market crisis simulator, interactive financial scenarios). Unlimited Finvora AI questions stays: the Ask limit screen sells it.
Updates the Plus screen and the phone and laptop plan comparisons. Idempotent. Usage: wire_navy_plus_client_list.py <site>"""
import os, re, sys
SITE = sys.argv[1]
GROUPS = [
    ('', ['Unlimited Finvora AI questions']),
    ('Company analysis', ['Advanced company analysis', 'Historical comparisons', 'Financial report comparisons']),
    ('Investment intelligence', ['Finvora Risk Signals', 'Dividend and cash flow tracker', 'Advanced watchlists', 'Portfolio intelligence']),
    ('Financial education', ['Market crisis simulator', 'Interactive financial scenarios']),
]
ROWS = [('Finvora AI questions', '5 a day', 'Unlimited'), ('Advanced company analysis', 'No', 'Yes'),
        ('Historical comparisons', '1 year', '5 years'), ('Financial report comparisons', 'No', 'Yes'),
        ('Finvora Risk Signals', 'No', 'Yes'), ('Dividend and cash flow tracker', 'No', 'Yes'),
        ('Watchlists', 'Basic', 'Advanced'), ('Portfolio intelligence', 'No', 'Yes'),
        ('Market crisis simulator', 'No', 'Yes'), ('Interactive financial scenarios', 'No', 'Yes'),
        ('Courses', 'All 6', 'All 6'), ('Practice market', 'Yes', 'Yes')]

# Plus screen: grouped list in a scrolling area so the plans and the pay button stay in view.
p = os.path.join(SITE, 'PlusNavy.dc.html'); s = open(p).read()
items = [{'t': t, 'h': h if i == 0 else ''} for h, ts in GROUPS for i, t in enumerate(ts)]
js = '[' + ', '.join("{ t: '%s', h: '%s' }" % (x['t'], x['h']) for x in items) + '].map(x => ({ t: x.t, h: x.h, hd: x.h ? \'block\' : \'none\' }))'
s = re.sub(r"f: \[[^\]]*\]\.map\([^\n]*?\),\n", 'f: ' + js + ',\n', s, count=1)
OLD_UL = re.search(r'<ul style="margin: 24px 0 0;[\s\S]*?</ul>', s)
NEW_UL = ('<ul style="margin: 20px -24px 0; padding: 0 24px; list-style: none; display: flex; flex-direction: column; gap: 10px; font-size: 15px; flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain">'
          '<sc-for list="{{f}}" as="x" hint-placeholder-count="10"><li style="display: flex; flex-direction: column; gap: 10px">'
          '<span style="display: {{x.hd}}; margin-top: 8px; font-size: 12px; font-weight: 600; color: #5B6577; text-transform: uppercase; letter-spacing: .06em">{{x.h}}</span>'
          '<span style="display: flex; gap: 12px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="flex: none"><path d="m5 12 5 5 9-10"></path></svg>{{x.t}}</span></li></sc-for></ul>')
if OLD_UL and 'Investment intelligence' not in OLD_UL.group(0): s = s.replace(OLD_UL.group(0), NEW_UL, 1)
s = s.replace('<div role="radiogroup" aria-label="Plan" style="margin-top: 28px;', '<div role="radiogroup" aria-label="Plan" style="margin-top: 20px; flex: none;')
s = s.replace('<div style="margin-top: auto; display: flex; flex-direction: column; gap: 10px">\n    <a href="#" onClick="{{pay}}"', '<div style="margin-top: 20px; flex: none; display: flex; flex-direction: column; gap: 10px">\n    <a href="#" onClick="{{pay}}"')
open(p, 'w').write(s); print('Plus list updated')

# Plan comparisons: rebuild the rows between the first feature row and the Price row.
for n in ['PlanCompareNavy', 'PlanCompareLaptopNavy']:
    p = os.path.join(SITE, n + '.dc.html'); s = open(p).read()
    lab = re.search(r'<span style="([^"]*color: #334155[^"]*)">Finvora AI questions</span>', s)
    end = re.search(r'<span style="[^"]*">Price</span>', s)
    if not lab or not end: print(n, 'rows not found'); continue
    val = re.search(r'<span style="([^"]*Geist Mono[^"]*)">5 a day</span>', s).group(1).replace('; color: #5B6577', '')
    L = lab.group(1)
    def cell(v, free): return '<span style="' + val + ('; color: #5B6577' if free and v in ('No', 'Basic') else '') + '">' + v + '</span>'
    rows = ''.join('<span style="' + L + '">' + a + '</span>' + cell(f, True) + cell(pl, False) for a, f, pl in ROWS)
    s = s[:lab.start()] + rows + s[end.start():]
    open(p, 'w').write(s); print(n, 'rows updated')
