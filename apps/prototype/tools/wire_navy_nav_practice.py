"""Phone navigation change (owner, 16 Nov 2026): Me moves to a button beside the notification bell on Home, and the
bottom bar's Me tab becomes "Practice market" (the laptop sidebar's Practice market icon), opening the Practice portfolio.
Idempotent. Usage: wire_navy_nav_practice.py <site>"""
import glob, os, re, sys
SITE = sys.argv[1]
TAB = ('<a href="PracticeNavy.dc.html" style="flex: 1; height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 15px; box-sizing: border-box; gap: 4px; text-decoration: none; position: relative">'
       '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8E9AAE" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"></rect><path d="M3 10h18M7 15h4"></path></svg>'
       '<span style="font-size: 12px; font-weight: 500; color: #C7D0DD; text-align: center; line-height: 1.15">Practice market</span></a>')
ME_TAB = re.compile(r'<a href="MeNavy\.dc\.html"(?: aria-current="page")? style="flex: 1; height: 72px;.*?</a>', re.S)
n = 0
for f in sorted(glob.glob(os.path.join(SITE, '*Navy.dc.html'))):
    if 'Laptop' in f: continue
    s = open(f).read()
    if 'aria-label="Main"' not in s or '>Practice market</span></a>' in s: continue
    s2, k = ME_TAB.subn(TAB, s, count=1)
    if k: open(f, 'w').write(s2); n += 1
print('bottom bars changed:', n)
# Home: Me button right of the bell. Account icon: a person inside a circle, distinct from the other icons (owner asked for its own icon).
P = os.path.join(SITE, 'HomeNavy.dc.html'); s = open(P).read()
if 'aria-label="Me"' not in s:
    a = '<a href="#" aria-label="Notifications" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; margin-right: -10px">'
    assert s.count(a) == 1
    i = s.index(a); j = s.index('</a>', i) + 4; bell = s[i:j].replace('; margin-right: -10px', '')
    me = ('<a href="MeNavy.dc.html" aria-label="Me" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; margin-right: -10px">'
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"></circle><circle cx="12" cy="10" r="3"></circle><path d="M6.3 18.6c1.3-2.1 3.3-3.3 5.7-3.3s4.4 1.2 5.7 3.3"></path></svg></a>')
    s = s[:i] + '<span style="display: flex; align-items: center">' + bell + me + '</span>' + s[j:]
    open(P, 'w').write(s); print('Home: Me button added')
