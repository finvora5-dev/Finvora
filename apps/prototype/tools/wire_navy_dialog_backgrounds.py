"""Owner request, 16 Nov 2026: laptop dialogs open over the real page, not a drawn copy with fixed figures. Each dialog screen
now shows its page live underneath (the page itself, loaded behind the dimmed layer, not clickable and hidden from screen
readers), so names, plans and figures always match. Market closed and Reset practice already had live backgrounds.
Idempotent. Usage: wire_navy_dialog_backgrounds.py <site>"""
import os, re, sys
SITE = sys.argv[1]
BEHIND = {  # dialog screen: the page it opens from
    # AskLimitLaptopNavy is not a dialog over a page: its limit message is part of the page, so it stays as it is.
    'CancelPlanLaptopNavy': 'YourPlanLaptopNavy', 'LeaveLessonLaptopNavy': 'LessonLaptopNavy',
    'LockedLaptopNavy': 'LearnLaptopNavy', 'RateLaptopNavy': 'LessonDoneLaptopNavy', 'ReviewLaptopNavy': 'HomeLaptopNavy',
    'SignOutLaptopNavy': 'SettingsLaptopNavy', 'UpgradeLaptopNavy': 'CompanyLaptopNavy',
}
for n, page in BEHIND.items():
    p = os.path.join(SITE, n + '.dc.html'); s = open(p).read()
    if 'data-fv-behind' in s: continue
    i = s.index('<aside'); j = s.index('</main>', i) + len('</main>')
    frame = ('<iframe data-fv-behind src="' + page + '.dc.html" title="" tabindex="-1" aria-hidden="true" inert loading="eager" '
             'style="position: absolute; inset: 0; width: 100%; height: 100%; border: 0; pointer-events: none; background: #F8F9FA"></iframe>')
    s = s[:i] + frame + s[j:]
    open(p, 'w').write(s); print(n, '-> live', page)
