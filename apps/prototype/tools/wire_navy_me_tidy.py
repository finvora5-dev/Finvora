"""Owner requests, 16 Nov 2026 (phone Me screen and Settings):
1. Phone Me: the Practice portfolio row goes; the bottom bar's Practice tab already opens it.
2. The Settings icon (a circle with rays, which reads as brightness) becomes a gear, on every screen that shows it.
3. "Market news" goes from the notification settings: there is no market news feature to switch on.
Idempotent. Usage: wire_navy_me_tidy.py <site>"""
import os, re, sys
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n)).read()
def wr(n, s): open(os.path.join(SITE, n), 'w').write(s)

# 1. Practice portfolio row on phone Me (the list row, not the bottom-bar tab).
s = rd('MeNavy.dc.html')
m = re.search(r'<a href="PracticeNavy\.dc\.html" style="display: flex; align-items: center; gap: 12px; min-height: 56px;.*?Practice portfolio.*?</a>', s, re.S)
if m: wr('MeNavy.dc.html', s.replace(m.group(0), '', 1)); print('Me: Practice portfolio row removed')

# 2. Gear icon (outline gear, same 24-unit grid, stroke and colour as before).
OLD = '<circle cx="12" cy="12" r="3"></circle><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"></path>'
NEW = ('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>'
       '<circle cx="12" cy="12" r="3"></circle>')
n = 0
for f in sorted(os.listdir(SITE)):
    if f.endswith('.dc.html'):
        s = rd(f)
        if OLD in s: wr(f, s.replace(OLD, NEW)); n += 1
print('gear icon on', n, 'screens')

# 3. Market news switch.
s = rd('SettingsNavy.dc.html')
if "sw('Market news', 'news')" in s: wr('SettingsNavy.dc.html', s.replace(", sw('Market news', 'news')", '').replace("sw('Market news', 'news'), ", '')); print('Settings: Market news removed')
for f in ('SettingsLaptopNavy.dc.html', 'CancelPlanLaptopNavy.dc.html'):
    s = rd(f)
    m = re.search(r'<div style="[^"]*">\s*<span>Market news</span>.*?</div>', s, re.S)
    if m and m.group(0).count('<div') == 1: wr(f, s.replace(m.group(0), '', 1)); print(f, ': Market news removed')
    elif 'Market news' in s: raise SystemExit(f + ': Market news row not matched')
