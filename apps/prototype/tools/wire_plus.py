#!/usr/bin/env python3
"""Design Part 4 (Plus learning tools): makes the eight Plus boards from USimHistory and adds the entry points.
Content is drawn by plus.js from FV.PLUS (rules in packages/domain/src/plus.ts). Re-runnable.
Run after wire_askfin3.py and before wire_a11y.py and build_sw.py."""
import sys, os, re
SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'site')
rd = lambda n: open(os.path.join(SITE, n + '.dc.html'), encoding='utf-8').read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w', encoding='utf-8').write(s)

BOARDS = [  # board, page title, header, back, kind
    ('USimPlus', 'Plus tools', 'Plus tools', 'USimHome.dc.html', 'hub'),
    ('USimMeasures', 'What this number means', 'What this number means', 'USimPlus.dc.html', 'measures'),
    ('USimPortfolio', 'Your practice portfolio', 'Your practice portfolio', 'USimPlus.dc.html', 'portfolio'),
    ('USimCrisis', 'Crisis practice', 'Crisis practice', 'USimPlus.dc.html', 'crisis'),
    ('UPScenario', 'Money scenarios', 'Money scenarios', 'USimPlus.dc.html', 'scenario'),
    ('USimDividends', 'Dividend tracker', 'Dividend tracker', 'USimPlus.dc.html', 'dividends'),
    ('USimCompareTime', 'Compare over time', 'Compare over time', 'USimPlus.dc.html', 'compare'),
    ('USimWatchlists', 'Watchlists', 'Watchlists', 'USimPlus.dc.html', 'watchlists'),
]
src = rd('USimHistory')
for name, title, h1, back, kind in BOARDS:
    s = src
    s = re.sub(r'<title>[^<]*</title>', '<title>Finvora (purple and black): ' + title + '</title>', s, count=1)
    s = s.replace('<script src="./fv.js"></script>', '<script src="./fv.js"></script>\n<script src="./plus.js"></script>', 1)
    s = re.sub(r'(<header[^>]*><a href=")USimHome\.dc\.html', r'\g<1>' + back, s, count=1)
    s = s.replace('<h1 style="font-size: 22px">Practice history</h1>', '<span class="sr">' + h1 + '</span>', 1)
    i = s.index('<main'); j = s.index('</main>') + len('</main>')
    s = s[:i] + '<main data-plus="' + kind + '" style="padding: 12px 16px 24px; display: flex; flex-direction: column; gap: 14px"></main>' + s[j:]
    i = s.index('class Component extends DCLogic {'); j = s.index('</script>', i)
    s = s[:i] + "class Component extends DCLogic {\n  componentDidMount() { setTimeout(() => window.fvPlusRender && window.fvPlusRender(), 0); }\n  renderVals() { return {}; }\n}\n" + s[j:]
    if kind == 'scenario':  # lives in Learn too: Learn tab is current
        s = s.replace('<a href="UPMarkets.dc.html" aria-current="page"', '<a href="UPMarkets.dc.html"', 1).replace('<a href="UPJourney.dc.html" class="press"', '<a href="UPJourney.dc.html" aria-current="page" class="press"', 1)
    wr(name, s)

CARD = ('<a href="USimPlus.dc.html" class="card press" style="padding: 14px 16px; display: flex; align-items: center; gap: 12px; text-decoration: none; color: #0E0B14">'
        '<span style="flex: 1; display: flex; flex-direction: column"><b>Plus tools</b><span class="muted" style="font-size: 13px">What this number means, crisis practice and more</span></span>'
        '<span aria-hidden="true" style="font-size: 20px; color: #5B21B6">›</span></a>')
s = rd('USimHome')
if 'USimPlus.dc.html' not in s:
    s = s.replace('<h2 style="font-size: 18px">Your holdings</h2>', CARD + '\n    <h2 style="font-size: 18px">Your holdings</h2>', 1); wr('USimHome', s)
s = rd('USimEmpty')
if 'USimPlus.dc.html' not in s:
    s = s.replace('</main>', CARD + '</main>', 1); wr('USimEmpty', s)
s = rd('USPlans')
if 'USimPlus.dc.html' not in s:
    s = s.replace('</main>', '<a href="USimPlus.dc.html" style="align-self: center; font-weight: 700; font-size: 14px">See the Plus learning tools</a></main>', 1); wr('USPlans', s)
s = rd('UPJourney')
ANCHOR = '    <section aria-labelledby="later-h"'
if 'UPScenario.dc.html' not in s and ANCHOR in s:
    s = s.replace(ANCHOR, '<a href="UPScenario.dc.html" class="card press" style="padding: 14px 16px; display: flex; align-items: center; gap: 12px; text-decoration: none; color: #0E0B14"><span style="flex: 1; display: flex; flex-direction: column"><b>Money scenarios</b><span class="muted" style="font-size: 13px">Salary day, surprise bills, rising prices. Plus.</span></span><span aria-hidden="true" style="font-size: 20px; color: #5B21B6">›</span></a></main>', 1); wr('UPJourney', s)
for B in ['USimCompany', 'UDxSimCompany']:
  s = rd(B)
  ROW = '<div class="li"><span style="flex: 1">Dividend per share</span><strong class="num">{{div}}</strong></div>'
  if 'USimMeasures' not in s and ROW in s:
    s = s.replace(ROW, ROW + '<a href="USimMeasures.dc.html?t={{c.t}}" class="li press"><span style="flex: 1">What this number means</span><span class="muted" style="font-size: 13px">Plus</span></a>', 1); wr(B, s)

# Desktop versions (responsive.js routes wide screens to these).
import re as _re
s = rd('UDSimulator')
if 'USimPlus.dc.html' not in s:
    m = _re.search(r'<h2[^>]*>Your holdings</h2>', s)
    s = s[:m.start()] + CARD + '\n' + s[m.start():] if m else s.replace('</main>', CARD + '</main>', 1); wr('UDSimulator', s)
for B in ['UDxSimEmpty']:
    s = rd(B)
    if 'USimPlus.dc.html' not in s: s = s.replace('</main>', CARD + '</main>', 1); wr(B, s)
s = rd('UDxSPlans')
if 'USimPlus.dc.html' not in s: s = s.replace('</main>', '<a href="USimPlus.dc.html" style="align-self: center; font-weight: 700; font-size: 14px">See the Plus learning tools</a></main>', 1); wr('UDxSPlans', s)
s = rd('UDJourney')
if 'UPScenario.dc.html' not in s: s = s.replace('</main>', '<a href="UPScenario.dc.html" class="card press" style="padding: 14px 16px; display: flex; align-items: center; gap: 12px; text-decoration: none; color: #0E0B14"><span style="flex: 1; display: flex; flex-direction: column"><b>Money scenarios</b><span class="muted" style="font-size: 13px">Salary day, surprise bills, rising prices. Plus.</span></span><span aria-hidden="true" style="font-size: 20px; color: #5B21B6">\u203a</span></a></main>', 1); wr('UDJourney', s)
print('Plus boards wired:', len(BOARDS))
