"""Owner report, 16 Nov 2026: on laptop the sidebar's Watchlist and Help did not work (the canvas pointed them at Markets and
Settings). Every laptop sidebar: Watchlist opens the watchlist, Help opens Help; on those two pages the sidebar highlights
the right item. Idempotent. Usage: wire_navy_sidebar_links.py <site>"""
import glob, os, re, sys
SITE = sys.argv[1]
ITEM = r'<a href="{href}"( aria-current="page")?( style="[^"]*")>(<svg(?:(?!</a>).)*?</svg>){label}</a>'  # never crosses into the next link
n = 0
for p in sorted(glob.glob(os.path.join(SITE, '*LaptopNavy.dc.html'))):
    s = open(p).read(); i = s.find('<aside'); j = s.find('</aside>', i)
    if i < 0: continue
    a = s[i:j]
    # Repair from an earlier run of this script whose pattern crossed links: Markets and Settings open their own pages.
    a2 = re.sub(r'<a href="PracticeWatchlistLaptopNavy\.dc\.html"(( aria-current="page")? style="[^"]*">(?:<svg(?:(?!</a>).)*?</svg>)Markets</a>)', r'<a href="MarketsLaptopNavy.dc.html"\1', a, flags=re.S)
    a2 = re.sub(r'<a href="HelpLaptopNavy\.dc\.html"(( aria-current="page")? style="[^"]*">(?:<svg(?:(?!</a>).)*?</svg>)Settings</a>)', r'<a href="SettingsLaptopNavy.dc.html"\1', a2, flags=re.S)
    b = re.sub(ITEM.format(href=r'MarketsLaptopNavy\.dc\.html', label='Watchlist'), lambda m: m.group(0).replace('MarketsLaptopNavy.dc.html', 'PracticeWatchlistLaptopNavy.dc.html', 1), a2, flags=re.S)
    b = re.sub(ITEM.format(href=r'SettingsLaptopNavy\.dc\.html', label='Help'), lambda m: m.group(0).replace('SettingsLaptopNavy.dc.html', 'HelpLaptopNavy.dc.html', 1), b, flags=re.S)
    # Highlight: move the selected look to the page's own item.
    own = {'HelpLaptopNavy.dc.html': 'Help', 'PracticeWatchlistLaptopNavy.dc.html': 'Watchlist'}.get(os.path.basename(p))
    if own:
        cur = re.search(r'<a href="[^"]*" aria-current="page" style="[^"]*">(<svg(?:(?!</a>).)*?</svg>)([A-Za-z ]+)</a>', b, re.S)
        tgt = re.search(r'<a href="([^"]*)" style="([^"]*)">(<svg(?:(?!</a>).)*?</svg>)' + own + '</a>', b, re.S)
        if cur and tgt and cur.group(2) != own:
            cs = re.search(r'style="([^"]*)"', cur.group(0)).group(1); chref = re.search(r'href="([^"]*)"', cur.group(0)).group(1)
            stroke_on = re.search(r'stroke="([^"]*)"', cur.group(1)).group(1); stroke_off = re.search(r'stroke="([^"]*)"', tgt.group(3)).group(1)
            new_cur = '<a href="' + chref + '" style="' + tgt.group(2) + '">' + cur.group(1).replace('stroke="' + stroke_on + '"', 'stroke="' + stroke_off + '"', 1) + cur.group(2) + '</a>'
            new_tgt = '<a href="' + tgt.group(1) + '" aria-current="page" style="' + cs + '">' + tgt.group(3).replace('stroke="' + stroke_off + '"', 'stroke="' + stroke_on + '"', 1) + own + '</a>'
            b = b.replace(cur.group(0), new_cur, 1).replace(tgt.group(0), new_tgt, 1)
        # No item selected (left so by the earlier faulty run): take the selected look from the Settings page's own item.
        if 'aria-current="page"' not in b:
            ref = open(os.path.join(SITE, 'SettingsLaptopNavy.dc.html')).read()
            rc = re.search(r'<a href="SettingsLaptopNavy\.dc\.html" aria-current="page" style="([^"]*)">(<svg(?:(?!</a>).)*?</svg>)Settings</a>', ref, re.S)
            tgt = re.search(r'<a href="([^"]*)" style="([^"]*)">(<svg(?:(?!</a>).)*?</svg>)' + own + '</a>', b, re.S)
            if rc and tgt:
                on = re.search(r'stroke="([^"]*)"', rc.group(2)).group(1); off = re.search(r'stroke="([^"]*)"', tgt.group(3)).group(1)
                b = b.replace(tgt.group(0), '<a href="' + tgt.group(1) + '" aria-current="page" style="' + rc.group(1) + '">' + tgt.group(3).replace('stroke="' + off + '"', 'stroke="' + on + '"', 1) + own + '</a>', 1)
    if b != a: open(p, 'w').write(s[:i] + b + s[j:]); n += 1
print('sidebars fixed:', n)
