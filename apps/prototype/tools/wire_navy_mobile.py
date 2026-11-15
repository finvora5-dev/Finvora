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
    s = re.sub(r'(?:@media \(hover: hover\) and \(pointer: fine\)\{)*a:hover\{color: ?#047857\}\}*', '@media (hover: hover) and (pointer: fine){a:hover{color: #047857}}', s)
    s = re.sub(r'(<(?:textarea|input)\b[^>]*?font-size: )1[0-5]px', r'\g<1>16px', s)
    if 'id="ne" type="email"' in s and 'enterkeyhint' not in s:
        s = s.replace('id="ne" type="email"', 'id="ne" type="email" inputmode="email" autocapitalize="none" autocorrect="off" enterkeyhint="send"', 1)
    if 'id="dc" autocomplete="off"' in s and 'autocorrect' not in s:
        s = s.replace('id="dc" autocomplete="off"', 'id="dc" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="done"', 1)
    # Keyboard hints (mobile-native §4): what the return key does, no auto-capitals on emails and codes.
    for a, b in [('<input id="em" type="email"', '<input id="em" type="email" autocapitalize="none" autocorrect="off" enterkeyhint="next"'),
                 ('<input id="code" inputmode="numeric"', '<input id="code" inputmode="numeric" enterkeyhint="go"'),
                 ('<input id="ans" inputmode="numeric"', '<input id="ans" inputmode="numeric" enterkeyhint="done"'),
                 ('<textarea id="ask" rows="1"', '<textarea id="ask" rows="1" enterkeyhint="send"'),
                 ('<textarea id="hq" rows="3"', '<textarea id="hq" rows="3" enterkeyhint="send"')]:
        if a in s and b not in s: s = s.replace(a, b, 1)
    # Tap targets (mobile-app-qa / qa_mobile.cjs): round icon buttons 44px, small text links get a 44px
    # touch area through padding with matching negative margin, so nothing moves visually.
    s = re.sub(r'(aria-label="(?:Add|Attach a report|Send)"[^>]*?)width: 40px; height: 40px', r'\1width: 44px; height: 44px', s)
    HIT = 'display: inline-block; padding: 14px 8px; margin: -14px -8px; '
    for t in ['{{resendLabel}}</a>', 'Change email</a>', '‹ Tasks</a>']:
        s = re.sub(r'(<a [^>]*style=")(?!display: inline-block; padding: 14px)([^"]*">)' + re.escape(t), lambda m: m.group(1) + HIT + m.group(2) + t, s)
    # Dictionary letter index: a strip you can tap or drag along (responsive.js), wider to the screen edge.
    s = s.replace('aria-label="Letters" style="width: 28px; padding: 14px 6px 0 0;', 'aria-label="Letters" class="fv-index" style="width: 36px; padding: 14px 6px 0 0; touch-action: none;')
    body = s[s.index('<x-dc>'):]
    top = re.search(r'<div style="width: \d+px;[^"]*">\s*<(?:div|header|aside)[^>]*style="[^"]*background: #0B192C', body)
    tc = '#0B192C' if top else '#F8F9FA'
    s = re.sub(r'<meta name="theme-color" content="#[0-9A-Fa-f]{6}">', '<meta name="theme-color" content="' + tc + '">', s, count=1)
    if s != o: open(p, 'w').write(s)
print('done', len(names))
