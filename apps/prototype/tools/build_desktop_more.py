"""Copy the approved desktop sub-pages (A), focus flows (B) and pop-ups (C) into the site.
Each board is generated from the site's own phone board, so it keeps that board's logic and links;
responsive.js swaps phone and desktop partners at 1024px. Header chips show the learner's real
streak, XP and level through data-fv attributes (filled by responsive.js).
Usage: python3 build_desktop_more.py <folder with generated UDx/UDy/UDz boards> <site folder> <pairs.json out>"""
import re, sys, os, json
SRC, SITE, OUT = sys.argv[1:4]
HEAD = '<script src="./support.js"></script>'
INJECT = HEAD + '\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<link rel="stylesheet" href="./responsive.css">\n<script src="./responsive.js"></script>\n<script src="./fvd.js"></script>\n<script src="./fv.js"></script>'
EXTRA = {'UPArticle': 'UDArticle', 'UPOnbWelcome': 'UDWelcome', 'USimTrade': 'UDBuy'}
def fix(s):
    if 'fv.js' not in s: s = s.replace(HEAD, INJECT, 1)
    s = re.sub(r'aria-label="Streak: 5 days"(>.*?</svg>)5</a>', r'aria-label="Streak" data-fv-label="streak"\1<span data-fv="streak">5</span></a>', s, flags=re.S)
    s = re.sub(r'aria-label="160 XP, Level 2"(>.*?</svg>)160</a>', r'aria-label="XP" data-fv-label="xp"\1<span data-fv="xp">160</span></a>', s, flags=re.S)
    s = s.replace('<span class="muted">Level 2 · Finance Learner</span>', '<span class="muted" data-fv="levelText">Level 2 learner</span>')
    # Pop-ups fill the window height (the page behind stays in view).
    s = s.replace('width: 1440px; height: 960px; box-sizing: border-box; position: relative; overflow: hidden', 'width: 1440px; min-height: 960px; box-sizing: border-box; position: relative; overflow: hidden', 1)
    return s.replace('href="UDLesson.dc.html"', 'href="UPLessonInfo.dc.html"')
pairs = {}
for f in sorted(os.listdir(SRC)):
    n = f[:-8]
    if not f.endswith('.dc.html') or not (re.match(r'UD[xyz]', n) or n in EXTRA.values()): continue
    open(os.path.join(SITE, f), 'w').write(fix(open(os.path.join(SRC, f)).read()))
for k in ('A', 'B', 'C'):
    m = json.load(open(os.path.join(SRC, '..', 'gen', k + '_map.json')))
    for ph, d in m.items():
        d = d[0] if isinstance(d, list) else d
        if ph.startswith('UD'): continue
        pairs[ph] = d
pairs.update(EXTRA)
json.dump(pairs, open(OUT, 'w'), indent=0)
print(len(pairs), 'pairs')
