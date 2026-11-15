#!/usr/bin/env python3
"""One way into Me (owner, 9 Nov 2026): phone Home loses the top-right profile icon (Me stays in the bottom bar);
desktop sidebars lose the "Me" link and the learner card at the bottom becomes the way into Me, highlighted when you are there.
Re-runnable. Run before build_sw.py."""
import sys, os, re, glob
SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'site')
n = 0
s = open(os.path.join(SITE, 'UOHome.dc.html'), encoding='utf-8').read()
s2 = re.sub(r'<a href="UPMe\.dc\.html" class="press" aria-label="Profile".*?</a>', '', s, count=1, flags=re.S)
if s2 != s: open(os.path.join(SITE, 'UOHome.dc.html'), 'w', encoding='utf-8').write(s2); n += 1
for f in glob.glob(os.path.join(SITE, 'UD*.dc.html')):
    s = open(f, encoding='utf-8').read(); o = s
    m = re.search(r'<a href="U[DP]Me\.dc\.html" class="dnav press"([^>]*)>.*?</a>', s, flags=re.S)
    current = False
    if m:
        current = 'aria-current="page"' in m.group(1)
        s = s[:m.start()] + s[m.end():]
    if 'class="dme press"' not in s:
        s = re.sub(r'<a href="U[DP]Me\.dc\.html" style="display: flex; align-items: center; gap: 10px;', '<a href="UDMe.dc.html" class="dme press"' + (' aria-current="page"' if current else '') + ' aria-label="Me: profile, progress and settings" style="display: flex; align-items: center; gap: 10px;', s, count=1)
    if s != o: open(f, 'w', encoding='utf-8').write(s); n += 1
print('profile entry points wired:', n, 'files')
