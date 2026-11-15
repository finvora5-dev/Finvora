"""Wire the navy Home boards: the signed-in learner's name (FV.AUTH) and today's date on the Lagos calendar
(build plan §4.3, B10). The greeting words, 'Your companies' and the market card stay as drawn until their
data is wired (Markets week). Usage: python3 wire_navy_home.py <site folder>"""
import os, sys
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing in board: ' + a[:100])
    return s.replace(a, b, 1)
def logic(s, js):
    a = s.index('class Component extends DCLogic'); b = s.index('</script>', a)
    return s[:a] + 'class Component extends DCLogic {\n' + js + '\n}\n' + s[b:]
JS = '''  renderVals() {
    const a = window.FV ? window.FV.AUTH.get() : {}, name = a.name || 'Ada';
    const day = new Date(Date.now() + 3600000).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    return { name, today: day.replace(/^(\\w+) /, '$1, '), full: a.name ? a.name : 'Ada Okafor' };
  }'''
s = rd('HomeNavy')
if 'FV.AUTH' not in s:
    s = sub1(s, '>Monday, 10 November<', '>{{today}}<')
    s = sub1(s, 'Good morning, Ada.', 'Good morning, {{name}}.')
    wr('HomeNavy', logic(s, JS))
s = rd('HomeLaptopNavy')
if 'FV.AUTH' not in s:
    s = sub1(s, 'Good morning, Ada', 'Good morning, {{name}}')
    s = sub1(s, '>Ada Okafor<', '>{{full}}<')
    wr('HomeLaptopNavy', logic(s, JS))
print('wired')
