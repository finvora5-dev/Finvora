#!/usr/bin/env python3
"""Design Part 5 (admin tasks on phones): makes UAPhoneTasks and UAPhoneTask from USimHistory's phone shell.
Content is drawn by admin-phone.js from FV.ADMIN. The UA prefix keeps the staff check in fv.js. Re-runnable.
responsive.js sends admin pages here when the screen's shorter side is under 700 px. Run before build_sw.py."""
import sys, os, re
SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'site')
rd = lambda n: open(os.path.join(SITE, n + '.dc.html'), encoding='utf-8').read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w', encoding='utf-8').write(s)
TOP = ('<header style="padding: 12px 16px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #E7E2F0">'
       '<a href="UAPhoneTasks.dc.html" aria-label="Admin tasks" style="width: 34px; height: 34px; border-radius: 10px; background: #5B21B6; color: #FFFFFF; font-weight: 800; display: flex; align-items: center; justify-content: center; text-decoration: none">F</a>'
       '<b style="flex: 1; font-size: 17px">%s</b><a href="UAPhoneTasks.dc.html" class="press" style="font-size: 14px; font-weight: 700">%s</a></header>')
src = rd('USimHistory')
for name, title, kind, right in [('UAPhoneTasks', 'Admin tasks', 'tasks', ''), ('UAPhoneTask', 'Admin task', 'task', 'All tasks')]:
    s = src
    s = re.sub(r'<title>[^<]*</title>', '<title>Finvora admin: ' + title + '</title>', s, count=1)
    s = s.replace('<script src="./fv.js"></script>', '<script src="./fv.js"></script>\n<script src="./admin-phone.js"></script>', 1)
    s = re.sub(r'<header.*?</header>', TOP % ('Finvora admin', right), s, count=1, flags=re.S)
    i = s.index('<main'); j = s.index('</main>') + len('</main>')
    s = s[:i] + '<main data-admin="' + kind + '" style="padding: 16px; display: flex; flex-direction: column; gap: 14px"></main>' + s[j:]
    i = s.index('<div style="margin-top: auto"><nav'); j = s.index('</nav></div>', i) + len('</nav></div>')
    s = s[:i] + s[j:]
    i = s.index('class Component extends DCLogic {'); j = s.index('</script>', i)
    s = s[:i] + "class Component extends DCLogic {\n  componentDidMount() { setTimeout(() => window.fvAdminRender && window.fvAdminRender(), 0); }\n  renderVals() { return {}; }\n}\n" + s[j:]
    wr(name, s)
print('admin phone boards wired')
