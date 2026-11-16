"""Owner report, 16 Nov 2026: on laptop a wrong (or right) answer opened the phone's bottom sheet: the whole page greyed out
and the result card sat low with its button off screen. On laptop the result is a card in the page, like the laptop
multiple-choice question: no grey layer, no drag handle, no slide-up; the page scrolls it into view (responsive.js).
Idempotent. Usage: wire_navy_laptop_result.py <site>"""
import os, sys
SITE = sys.argv[1]
OVERLAY = '<div style="position: absolute; inset: 0; background: rgba(17,28,45,.45)" aria-hidden="true"></div>'
HANDLE = '<span style="align-self: center; width: 40px; height: 4px; border-radius: 999px; background: #D5D9E0"></span>'
for n in ('CourseReviewQLaptopNavy', 'DailyLaptopNavy', 'LessonCalcLaptopNavy', 'LessonOrderLaptopNavy', 'LessonScenarioLaptopNavy'):
    p = os.path.join(SITE, n + '.dc.html'); s = open(p).read()
    if 'data-fv-result' in s: continue
    assert s.count(OVERLAY) == 1 and s.count('<section role="dialog" aria-modal="true"') == 1, n
    s = s.replace(OVERLAY, '', 1).replace(HANDLE, '', 1).replace('<section role="dialog" aria-modal="true"', '<section data-fv-result role="status" aria-live="polite"', 1)
    open(p, 'w').write(s); print('in-page result on', n)

# Owner, 16 Nov 2026: "do something like the correct for laptop view": right and wrong both show as on the laptop
# multiple-choice question: a tinted line ("Correct." / "Not quite." and the explanation) under the answers, then the
# Ask link and the button on the right. No box, no big icon.
import re
SPARK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"></path></svg>'
for n in ('CourseReviewQLaptopNavy', 'DailyLaptopNavy', 'LessonCalcLaptopNavy', 'LessonOrderLaptopNavy', 'LessonScenarioLaptopNavy'):
    p = os.path.join(SITE, n + '.dc.html'); s = open(p).read()
    if 'data-fv-result-line' in s: continue
    i = s.index('<section data-fv-result'); j = s.index('</section>', i) + len('</section>'); old = s[i:j]
    cta = re.search(r'<a href="\{\{ctaHref\}\}"( onClick="\{\{\w+\}\}")?', old)
    new = ('<section data-fv-result data-fv-result-line role="status" aria-live="polite" aria-label="{{title}}" style="margin-top: 6px; display: flex; flex-direction: column; gap: 12px">'
           '<p style="margin: 0; padding: 14px 16px; border-radius: 12px; background: {{iconBg}}; font-size: 15px; line-height: 1.55; color: #334155"><strong style="font-weight: 600; color: {{tone}}">{{title}}.</strong> {{why}}</p>'
           '<div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap">'
           '<a href="AskFinvoraNavy.dc.html?q={{askQ}}" style="display: inline-flex; align-items: center; gap: 8px; min-height: 44px; font-size: 14px; font-weight: 500; color: #047857; text-decoration: none">' + SPARK + '{{askTitle}}</a>'
           '<a href="{{ctaHref}}"' + (cta.group(1) or '') + ' style="height: 44px; padding: 0 20px; border-radius: 12px; background: #0B192C; color: #FFFFFF; display: inline-flex; align-items: center; font-weight: 600; font-size: 15px; text-decoration: none">{{cta}}</a></div></section>')
    s = s[:i] + new + s[j:]
    s = re.sub(r"tone: ([\w |]+?) \? '#10B981' : '#B9473F'", r"tone: \1 ? '#047857' : '#B9473F'", s)  # readable green on the light tint
    open(p, 'w').write(s); print('result line on', n)
