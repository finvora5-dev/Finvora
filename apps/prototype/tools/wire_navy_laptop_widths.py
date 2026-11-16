"""Owner report, 16 Nov 2026: on a wide laptop screen some content stopped short while the header above it ran the full width.
Settings, Notifications, Sell and the page behind Cancel Plus now span the full content width like Home; the Practice company
chart gets a laptop height. Reading and message screens (articles, the Ask chat, centred status cards) stay narrow on purpose.
Idempotent. Usage: wire_navy_laptop_widths.py <site>"""
import os, sys
SITE = sys.argv[1]
EDITS = {
    'SettingsLaptopNavy.dc.html': [('<div style="max-width: 760px; display: flex; flex-direction: column; gap: 16px">', '<div style="display: flex; flex-direction: column; gap: 16px">')],
    'CancelPlanLaptopNavy.dc.html': [('<div style="max-width: 760px; display: flex; flex-direction: column; gap: 16px">', '<div style="display: flex; flex-direction: column; gap: 16px">')],
    'NotificationsLaptopNavy.dc.html': [('padding: 20px 22px; max-width: 820px">', 'padding: 20px 22px">')],
    'SellLaptopNavy.dc.html': [('<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 960px">', '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px">')],
    # Related links on the laptop article: one per line instead of run together (found with the owner's report).
    'ArticleLaptopNavy.dc.html': [('padding: 20px 22px; padding: 16px 18px"><span style="font-size: 12px; font-weight: 600; color: #5B6577; text-transform: uppercase; letter-spacing: .06em">Related</span>', 'padding: 20px 22px; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px"><span style="font-size: 12px; font-weight: 600; color: #5B6577; text-transform: uppercase; letter-spacing: .06em">Related</span>')],
    'PracticeCompanyLaptopNavy.dc.html': [('<svg viewBox="0 0 342 130" width="100%" height="130" aria-label="Price chart', '<svg viewBox="0 0 342 130" width="100%" height="240" aria-label="Price chart')],
}
# Practice company: the change pill is red when the price is down (it was always green).
for f in ('PracticeCompanyNavy.dc.html', 'PracticeCompanyLaptopNavy.dc.html'):
    q = os.path.join(SITE, f); t = open(q).read()
    a = "border-radius: 6px; background: #DDF3E6; color: #047857\">{{chg}}</span>"
    if a in t:
        t = t.replace(a, "border-radius: 6px; background: {{chgBg}}; color: {{chgC}}\">{{chg}}</span>")
        b = "price: this.n(p), chg: this.ch(ch),"; assert t.count(b) == 1, f
        t = t.replace(b, "price: this.n(p), chg: this.ch(ch), chgBg: ch >= 0 ? '#DDF3E6' : '#FCEDEB', chgC: ch >= 0 ? '#047857' : '#B9473F',")
        open(q, 'w').write(t); print('down colour on', f)
for f, pairs in EDITS.items():
    p = os.path.join(SITE, f); s = open(p).read(); n = 0
    for a, b in pairs:
        if a in s: s = s.replace(a, b, 1); n += 1
        elif b not in s: raise SystemExit(f + ': not found: ' + a[:60])
    if n: open(p, 'w').write(s); print('widened', f)
