"""Draft laptop versions of phone pages that have no laptop mock-up (owner approved the approach, 16 Nov 2026).
Frame: an approved laptop board with the right sidebar item selected (its sidebar and <main> padding).
Content: the phone page's approved content in order: its header title becomes the laptop page title (28px, as on the
laptop boards), its bottom navigation is dropped (the sidebar replaces it), and its 24px side margins are removed so the
content uses the full width. No new copy. Usage: python3 design_laptop_pages.py <mockups folder> <out folder> <batch>"""
import os, re, sys
M, OUT, BATCH = sys.argv[1], sys.argv[2], sys.argv[3]; SITE_MODE = '--site' in sys.argv  # working screens: phone content and logic from the site
MK = lambda n, t: (n, 'MarketsLaptopNavy', t + ' (laptop)'); PR = lambda n, t: (n, 'PracticeLaptopNavy', t + ' (laptop)'); AC = lambda n, t: (n, 'SettingsLaptopNavy', t + ' (laptop)')
BATCHES = {'markets': [MK('CompaniesNavy', 'Companies'), MK('CompareNavy', 'Compare'), MK('ExchangeNavy', 'About the NGX'), MK('InflationToolNavy', 'Inflation calculator')],
  'practice': [PR('PracticeMarketNavy', 'Practice: find a company'), PR('PracticeCompanyNavy', 'Practice: company'), PR('TradeNavy', 'Practice: buy'), PR('PracticeWatchlistNavy', 'Practice: watchlist'),
    PR('PracticeHistoryNavy', 'Practice: trade history'), PR('PracticeDividendsNavy', 'Practice: dividends'), PR('PracticeMeasuresNavy', 'Practice: measures'), PR('PracticeTimeNavy', 'Practice: time'),
    PR('PracticeCrisisNavy', 'Practice: big moves'), PR('PracticeDoneNavy', 'Practice: order placed'), PR('PracticeEmptyNavy', 'Practice: empty')],
  'account': [AC('SavedNavy', 'Saved'), AC('HistoryNavy', 'History'), AC('HelpNavy', 'Help'), AC('YourPlanNavy', 'Your plan'), AC('PlanCompareNavy', 'Compare plans'), AC('ReceiptNavy', 'Receipt'),
    AC('SetEmailNavy', 'Email'), AC('SetGoalNavy', 'Interest'), AC('SetPrivacyNavy', 'Privacy and data'), AC('SetTermsNavy', 'Terms and privacy'), ('LessonPEDoneNavy', 'LearnLaptopNavy', 'Practice exercise result (laptop)')],
  'states': [AC('EmptyHistoryNavy', 'History: empty'), AC('EmptySavedNavy', 'Saved: empty'), AC('EmptyNotifNavy', 'Notifications: empty')],
  'learning': [('TopicNavy', 'LibraryLaptopNavy', 'Topic (laptop)'), ('DictionaryNavy', 'LibraryLaptopNavy', 'A to Z (laptop)'), ('ProgressNavy', 'LearnLaptopNavy', 'Progress (laptop)')]}
TAG = re.compile(r'<(/?)(div|a|h1|h2|p|section|span|button|label|nav|main|header|sc-for|sc-if|ul|ol)\b[^>]*?(/?)>')
def kids(html, a):
    out, d, i, st = [], 0, a, None
    while True:
        m = TAG.search(html, i)
        if not m: break
        if m.group(1) == '' and m.group(3) == '':
            if d == 0: st = m.start()
            d += 1
        elif m.group(1) == '/':
            if d == 0: break
            d -= 1
            if d == 0: out.append(html[st:m.end()])
        i = m.end()
    return out
def text(h): return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', re.sub(r'<svg.*?</svg>', '', h, flags=re.S))).strip()
for name, frame_name, title in BATCHES[BATCH]:
    s = open(os.path.join(OUT if SITE_MODE else M, name + '.dc.html')).read(); a = s.index('</helmet>'); a = s.index('>', s.index('<div', a)) + 1
    ks = kids(s, a); head, body = ks[0], [k for k in ks[1:] if 'aria-label="Main"' not in k[:200]]
    # Title: the header's own heading (h1/h2); anything else the header holds (tags, stats, sender) stays as content.
    hm = re.search(r'<(h1|h2)\b[^>]*>(.*?)</\1>', head, flags=re.S)
    if hm:
        h1 = text(hm.group(2)); rest = head[:hm.start()] + head[hm.end():]
        rest_text = re.sub(r'\s+', '', text(re.sub(r'<a [^>]*aria-label="(Back|Close)[^"]*"[^>]*>.*?</a>', '', rest, flags=re.S)))
        if rest_text: body = [re.sub(r'<a [^>]*aria-label="(Back|Close)[^"]*"[^>]*>.*?</a>', '', rest, count=1, flags=re.S)] + body
    else:
        h1 = text(head) if text(head) not in ('Simulated',) and len(text(head)) < 30 and not re.search(r'<(span|div)[^>]*>[^<]{1,20}</(span|div)>\s*<(span|div)', head) else ''
        if not h1 and text(head): body = [re.sub(r'<a [^>]*aria-label="(Back|Close)[^"]*"[^>]*>.*?</a>', '', head, count=1, flags=re.S)] + body
    fixed = []
    for k in body:
        k = re.sub(r'(margin|padding): (\d+px) 24px( (\d+px))?', lambda m: m.group(1) + ': ' + m.group(2) + ' 0' + (' ' + m.group(4) if m.group(4) else ''), k, count=1)
        fixed.append(k)
    # Stat tiles drawn side by side on the phone (consecutive 'border-left' tiles) stay in one row.
    joined, row = [], []
    for k in fixed + ['']:
        if 'border-left' in k[:120] and k: row.append(k); continue
        if row: joined.append('<div style="display: flex; gap: 0; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; overflow: hidden">' + ''.join(r.replace('padding: 14px;', 'flex: 1; padding: 18px 20px;', 1) for r in row) + '</div>'); row = []
        if k: joined.append(k)
    f = open(os.path.join(M, frame_name + '.dc.html')).read()
    ma = f.index('>', f.index('<main')) + 1; mb = f.index('</main>')
    top = ('<h1 style="margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.02em">' + h1 + '</h1>') if h1 else ''
    out = f[:ma] + '\n    ' + top + '<div style="display: flex; flex-direction: column; gap: 0; width: 100%">' + ''.join(joined) + '</div>\n  ' + f[mb:]
    out = re.sub(r'<title>[^<]*</title>', '<title>' + title + '</title>', out, count=1)
    if SITE_MODE:
        site_head = open(os.path.join(OUT, frame_name + '.dc.html')).read(); out = site_head[:site_head.index('<x-dc>')] + out[out.index('<x-dc>'):]
        out = re.sub(r'<title>[^<]*</title>', '<title>' + title + '</title>', out, count=1)
        a2 = s.index('<script type="text/x-dc"'); b2 = s.index('</script>', a2) + 9; fa = out.index('<script type="text/x-dc"'); fb = out.index('</script>', fa) + 9
        out = out[:fa] + s[a2:b2].replace('"width":390,"height":844', '"width":1440,"height":900') + out[fb:]
    lap = name.replace('Navy', 'LaptopNavy'); open(os.path.join(OUT, lap + '.dc.html'), 'w').write(out); print(lap, '|', title, '| title:', h1 or '(from content)')
