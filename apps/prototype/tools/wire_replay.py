"""Lesson replay: finished lessons on the journey open as a replay (?l=<lesson id>), the completion
screen says it was a replay, and History names replays. Scoring is in fv.js (engine rule
lessonPractice: 2 XP once per lesson per day, best score kept). Run after the desktop boards are
regenerated. Usage: python3 wire_replay.py <site folder>"""
import sys, os
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
LIDS = ["money", "income", "budget", "inflation", "interest", "emergency"]

for n in ['UPJourney', 'UDJourney']:
    s = rd(n)
    for i, l in enumerate(LIDS):
        k = s.find('sc-if value="{{n%ddone}}"' % i)
        if k < 0: raise SystemExit('no finished node %d in %s' % (i, n))
        h = s.find('href="UPLessonInfo.dc.html"', k); e = s.find('</sc-if>', k)
        if 0 < h < e: s = s[:h] + 'href="UPLessonInfo.dc.html?l=%s"' % l + s[h + len('href="UPLessonInfo.dc.html"'):]
    wr(n, s.replace('Review lesson."', 'Replay lesson."'))

for n in ['UPHistory', 'UDxHistory']:
    s = rd(n)
    if 'Lesson replay' not in s:
        old = "const kindName = { article: 'Article', lesson: 'Lesson', micro"
        if old not in s: raise SystemExit('no kind names in ' + n)
        wr(n, s.replace(old, "const kindName = { article: 'Article', lesson: 'Lesson', practice: 'Lesson replay', micro", 1))

for n in ['UPLessonComplete', 'UDyPLessonComplete']:
    s = rd(n)
    if 'Replay complete' not in s:
        old = "    this.result = r;\n"
        if old not in s: raise SystemExit('no result in ' + n)
        wr(n, s.replace(old, old + "    if (r.replay) { const h = document.getElementById('done-h'); if (h) h.textContent = 'Replay complete!'; if (window.fvToast) window.fvToast(r.xp ? 'Replay: +2 XP. Your best score is kept.' : 'Replay done. Your best score is kept. Replay XP is once a day per lesson.'); }\n", 1))
print('replay wired')
