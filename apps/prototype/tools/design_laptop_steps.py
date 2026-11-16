"""Draft the 10 missing laptop lesson step boards for owner approval (owner chose option 1, 16 Nov 2026).
Frame: the approved LessonLaptopNavy (sidebar, close, progress, 640px centred column, Continue on the right).
Content: each phone step's approved board content, in order, with the phone's 24px side margins removed and its
bottom action bar placed at the end of the column like the laptop lesson's Continue.
Usage: python3 design_laptop_steps.py <mockups folder> <out folder>"""
import os, re, sys
M, OUT = sys.argv[1], sys.argv[2]
STEPS = [('LessonInfoNavy', 'Lesson: read (laptop)'), ('LearnCompareNavy', 'Lesson: compare (laptop)'), ('LearnTermNavy', 'Lesson: key term (laptop)'),
         ('LearnStepsNavy', 'Lesson: steps (laptop)'), ('LearnMarketNavy', 'Lesson: market example (laptop)'), ('LearnMythNavy', 'Lesson: myth or fact (laptop)'),
         ('LessonOrderNavy', 'Lesson: put in order (laptop)'), ('LessonMatchNavy', 'Lesson: match (laptop)'), ('LessonScenarioNavy', 'Lesson: scenario (laptop)'),
         ('LessonCalcNavy', 'Lesson: calculation (laptop)')]
frame = open(os.path.join(M, 'LessonLaptopNavy.dc.html')).read()
col_start = frame.index('<div style="max-width: 640px;'); col_open_end = frame.index('>', col_start) + 1
col_end = frame.index('</main>')
def children(html):
    """Top-level elements of the phone board's root div."""
    a = html.index('<x-dc>'); a = html.index('<div', html.index('</helmet>', a)); a = html.index('>', a) + 1
    out, depth, i, start = [], 0, a, None
    tag = re.compile(r'<(/?)(div|a|h1|h2|p|section|span|button|label|ul|ol|nav|form|sc-for|sc-if)\b[^>]*?(/?)>')
    while True:
        m = tag.search(html, i)
        if not m: break
        if m.group(1) == '' and m.group(3) == '':
            if depth == 0: start = m.start()
            depth += 1
        elif m.group(1) == '/':
            if depth == 0: break
            depth -= 1
            if depth == 0: out.append(html[start:m.end()])
        i = m.end()
    return out
made = []
for name, title in STEPS:
    s = open(os.path.join(M, name + '.dc.html')).read(); kids = children(s)
    body = kids[1:]  # drop the phone top bar (close + progress), the laptop frame has its own
    fixed = []
    for k in body:
        # Result sheets: the laptop lesson shows the result inline (note, then Continue), so no dim layer or bottom sheet.
        if 'rgba(17,28,45,.45)' in k[:300] and 'role="dialog"' not in k: continue
        if 'role="dialog"' in k[:300]:
            k = re.sub(r'(<section[^>]*style=")[^"]*"', r'\1margin: 6px 0 0; padding: 16px 18px; border-radius: 16px; background: #FFFFFF; border: 1px solid #E5E7EB; display: flex; flex-direction: column; gap: 10px"', k, count=1)
        k = re.sub(r'margin: (\d+px) 24px( (\d+px))?', lambda m: 'margin: ' + m.group(1) + ' 0' + (' ' + m.group(3) if m.group(3) else ''), k, count=1)
        k = re.sub(r'padding: (\d+px) 24px( (\d+px))?', lambda m: 'padding: ' + m.group(1) + ' 0' + (' ' + m.group(3) if m.group(3) else ''), k, count=1)
        if re.search(r'position: absolute[^"]*bottom', k[:400]) or ('margin-top: auto' in k[:300]):
            k = re.sub(r'position: absolute;?[^"]*?(?=")', 'display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap', k, count=1)
            k = k.replace('margin-top: auto', 'margin-top: 6px', 1)
        # Actions follow the laptop lesson: right-aligned 44px buttons instead of full-width phone buttons.
        k = re.sub(r'(<(?:a|button)\b[^>]*style="[^"]*?)(?:flex: 1;|width: 100%;)\s*([^"]*height: (?:5\d|4\d)px)', r'\1\2', k)
        k = re.sub(r'(<(?:a|button)\b[^>]*style="[^"]*?)height: 5\dpx', r'\1height: 44px; padding: 0 18px', k)
        fixed.append(k)
    # Actions on the right, as the laptop lesson's Continue: the last block is the action row.
    if fixed:
        last = fixed[-1]
        if re.match(r'<(a|button)\b', last): fixed[-1] = '<div style="display: flex; justify-content: flex-end; gap: 10px">' + last + '</div>'
        elif re.match(r'<div[^>]*display: flex', last): fixed[-1] = re.sub(r'style="', 'style="justify-content: flex-end; ', last, count=1)
    fixed = [re.sub(r'<span style="width: 36px; height: 4px;[^"]*"></span>', '', k) for k in fixed]  # phone sheet drag handle
    fixed = [re.sub(r'(<a\b[^>]*style="[^"]*?)display: flex; align-items: center; justify-content: center; height: 44px; padding: 0 18px', r'\1display: flex; align-self: flex-end; align-items: center; justify-content: center; height: 44px; padding: 0 18px', k) for k in fixed]
    out = frame[:col_open_end] + ''.join(fixed) + '</div>\n  ' + frame[col_end:]
    out = out.replace('<title>Lesson (laptop)</title>', '<title>' + title + '</title>', 1)
    out = re.sub(r'href="LearnNavy\.dc\.html"', 'href="LearnLaptopNavy.dc.html"', out)
    lap = name.replace('Navy', 'LaptopNavy'); open(os.path.join(OUT, lap + '.dc.html'), 'w').write(out); made.append((lap, title))
print('\n'.join(a + ' | ' + b for a, b in made))
