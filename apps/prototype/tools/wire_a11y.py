"""Accessibility fixes from the axe-core run (WCAG 2.2 AA) on 9 Nov 2026. Re-run after any board
rebuild. Colour shifts are the smallest darkening of the same hue that reaches 4.5:1 for the text on
it. Usage: python3 wire_a11y.py <site folder>"""
import sys, os, glob
SITE = sys.argv[1]
def rd(p): return open(p).read()
def wr(p, s): open(p, 'w').write(s)
def boards(names): return [os.path.join(SITE, n + '.dc.html') for n in names]

# Teal: pale text on teal chips (Journey, Markets) and teal text on pale teal. 4.37 -> 4.62.
for p in glob.glob(os.path.join(SITE, '*.dc.html')):
    s = rd(p); t = s.replace('#0B7D72', '#0A796E').replace('#0b7d72', '#0A796E')
    if t != s: wr(p, t)
# Library topic tiles: pale text over green and red tiles. 4.0 -> 4.6 (phone), 3.6 -> 4.7 (desktop).
for p, a, b in [(boards(['UPLibrary'])[0], ['#12865A', '#12865a'], '#107B52'), (boards(['UPLibrary'])[0], ['#D63C3C', '#d63c3c'], '#C43737'),
                (boards(['UDLibrary'])[0], ['#138A55', '#138a55'], '#107649'), (boards(['UDLibrary'])[0], ['#D64545', '#d64545'], '#B53A3A')]:
    s = rd(p)
    for x in a: s = s.replace(x, b)
    wr(p, s)
# Markets: pale text on the purple header chip. 4.32 -> 4.63.
for p in boards(['UPMarkets', 'UDMarkets']):
    s = rd(p); wr(p, s.replace('#7B4AF0', '#7647E6').replace('#7b4af0', '#7647E6'))
# Admin Plans: the included / not included marks are images with a name.
p = boards(['UAPlans'])[0]; s = rd(p)
s = s.replace('<span aria-label="Included">', '<span role="img" aria-label="Included">').replace('<span class="muted" aria-label="Not included">', '<span class="muted" role="img" aria-label="Not included">')
wr(p, s)
# Success green used as text on pale green across the app. 4.01 -> 4.62.
for p in glob.glob(os.path.join(SITE, '*.dc.html')):
    s = rd(p); t = s.replace('#16884A', '#147D44').replace('#16884a', '#147D44')
    if t != s: wr(p, t)
# Library purple topic tile: pale text on purple. 4.49 -> 4.6 (phone), 4.13 -> 4.6 (desktop).
for p, a, b in [(boards(['UPLibrary'])[0], ['#7B4AF0', '#7b4af0'], '#7848EB'), (boards(['UDLibrary'])[0], ['#7C4DEB', '#7c4deb'], '#7448DC')]:
    s = rd(p)
    for x in a: s = s.replace(x, b)
    wr(p, s)
print('a11y fixes applied')
