"""Mobile-native fixes (skill: mobile-native) for the navy boards.
- Hover colour only for hover-capable precise pointers (sticky hover on touch).
- Text inputs at 16px (iOS zooms the page under 16px); keyboard hints on email and confirm fields.
- theme-color matches the colour at the top of each board (navy header or the light page).
The shared baseline (tap highlight, touch-action, user-select on controls, overscroll, safe areas,
press feedback) lives in responsive.css. Usage: python3 wire_navy_mobile.py <site folder> [boards...]"""
import os, re, sys, glob
SITE = sys.argv[1]
names = sys.argv[2:] or [os.path.basename(p)[:-8] for p in glob.glob(os.path.join(SITE, '*Navy.dc.html'))]
for n in names:
    p = os.path.join(SITE, n + '.dc.html'); s = open(p).read(); o = s
    s = re.sub(r'a:hover\{color: ?#047857\}', '@media (hover: hover) and (pointer: fine){a:hover{color: #047857}}', s)
    s = re.sub(r'(<(?:textarea|input)\b[^>]*?font-size: )1[0-5]px', r'\g<1>16px', s)
    if 'id="ne" type="email"' in s and 'enterkeyhint' not in s:
        s = s.replace('id="ne" type="email"', 'id="ne" type="email" inputmode="email" autocapitalize="none" autocorrect="off" enterkeyhint="send"', 1)
    if 'id="dc" autocomplete="off"' in s and 'autocorrect' not in s:
        s = s.replace('id="dc" autocomplete="off"', 'id="dc" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="done"', 1)
    body = s[s.index('<x-dc>'):]
    top = re.search(r'<div style="width: \d+px;[^"]*">\s*<(?:div|header|aside)[^>]*style="[^"]*background: #0B192C', body)
    tc = '#0B192C' if top else '#F8F9FA'
    s = re.sub(r'<meta name="theme-color" content="#[0-9A-Fa-f]{6}">', '<meta name="theme-color" content="' + tc + '">', s, count=1)
    if s != o: open(p, 'w').write(s)
print('done', len(names))
