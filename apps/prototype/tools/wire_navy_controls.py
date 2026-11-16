"""Make drawn-but-dead controls work (owner, 15 Nov 2026: 'i don't need anybody not working').
Switches on Privacy and laptop Settings save to preferences; Report reasons select; Pay failed Close goes back to plans
as drawn. Chip filters and the sidebar collapse live in responsive.js. Usage: python3 wire_navy_controls.py <site folder>"""
import os, re, sys
SITE = sys.argv[1]; MARK = '/* navy-controls */'
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)
def logic(s, js):
    a = s.index('class Component extends DCLogic'); b = s.index('</script>', a)
    return s[:a] + 'class Component extends DCLogic {\n' + js + '\n}\n' + s[b:]
PREF = {'Usage analytics': ('analytics', True), 'Save Finvora AI chats': ('saveChats', True), 'Price alerts': ('price', True),
        'Daily lesson reminder': ('daily', True), 'Market news': ('news', False), 'Sounds': ('sound', True)}
for n in ['SetPrivacyNavy', 'SettingsLaptopNavy']:
    s = rd(n)
    if MARK in s: continue
    keys = []
    def rep(m):
        lab = m.group(2); k, d = PREF[lab]; keys.append((k, d)); st = m.group(3)
        st = re.sub(r'background: #[0-9A-F]{6}', 'background: {{%s_bg}}' % k, st, count=1); st = re.sub(r'justify-content: flex-(end|start)', 'justify-content: {{%s_j}}' % k, st, count=1)
        return '<button type="button" role="switch" aria-checked="{{%s_on}}" aria-label="%s" onClick="{{%s_tog}}" style="border: 0; cursor: pointer; %s">%s</button>' % (k, lab, k, st, m.group(4))
    s = re.sub(r'<span role="switch" aria-checked="(true|false)" aria-label="([^"]+)" style="([^"]*)">(<span style="[^"]*"></span>)</span>', rep, s)
    ks = ', '.join("['%s', %s]" % (k, 'true' if d else 'false') for k, d in keys)
    s = logic(s, MARK + '''
  constructor(p) { super(p); const P = window.FV ? window.FV.ME.prefs() : {}, st = {}; [''' + ks + '''].forEach(([k, d]) => { st[k] = P[k] === undefined ? d : !!P[k]; }); this.state = st; }
  renderVals() { const v = {}; Object.keys(this.state).forEach((k) => { const on = this.state[k]; v[k + '_on'] = String(on); v[k + '_bg'] = on ? '#0B192C' : '#D5D9E0'; v[k + '_j'] = on ? 'flex-end' : 'flex-start';
    v[k + '_tog'] = () => { if (window.FV) window.FV.ME.setPref(k, !on); this.setState({ [k]: !on }); }; }); return v; }''')
    wr(n, s)
s = rd('ReportNavy')
if MARK not in s:
    i = [0]
    def rr(m):
        k = i[0]; i[0] += 1
        if k > 3: return m.group(0)
        st = re.sub(r'border: [^;]+;', 'border: {{bd%d}};' % k, m.group(1), count=1); st = re.sub(r'background: #FFFFFF', 'background: {{bg%d}}' % k, st, count=1)
        return '<button type="button" role="radio" aria-checked="{{on%d}}" onClick="{{pick%d}}" style="cursor: pointer; %s">' % (k, k, st)
    s = re.sub(r'<button role="radio" aria-checked="false" style="([^"]*)">', rr, s)
    s = s.replace('class Component extends DCLogic {', 'class Component extends DCLogic {\n' + MARK, 1); wr('ReportNavy', s)
s = rd('PayFailedNavy')
if MARK not in s:
    s = s.replace('<a href="#" onClick="{{retry}}" aria-label="Close"', '<a href="PlusNavy.dc.html" aria-label="Close"', 1).replace('onClick="{{retry}}" onClick="{{retry}}"', 'onClick="{{retry}}"')
    s = s.replace('class Component extends DCLogic {', 'class Component extends DCLogic {\n' + MARK, 1); wr('PayFailedNavy', s)
# Company links without a ticker open Zenith whatever you tapped. Give every company link on every screen its own
# ticker (?t=TICKER, read from the ticker drawn inside the link), so it opens the right company and chips can filter it.
import glob
TICKERS = set(re.findall(r'ticker: "([A-Z]+)"', open(os.path.join(SITE, 'fvd.js')).read()))
for f in glob.glob(os.path.join(SITE, '*Navy.dc.html')):
    s = open(f).read(); o = s
    def tick(m):
        NAMES = {'Zenith Bank': 'ZENITHBANK', 'Nestlé Nigeria': 'NESTLE', 'MTN Nigeria': 'MTNN', 'Dangote Cement': 'DANGCEM', 'Seplat Energy': 'SEPLAT', 'Airtel Africa': 'AIRTELAFRI', 'Nigerian Breweries': 'NB'}
        found = [t for t in re.findall(r'>\s*([A-Z]{2,12})\s*<', m.group(3)) if t in TICKERS] + [NAMES[n] for n in re.findall(r'>\s*([^<>]{3,30}?)\s*<', m.group(3)) if n in NAMES]
        if not found: return m.group(0)
        return '<a href="' + m.group(1) + '.dc.html?t=' + found[0] + '"' + m.group(2) + '>' + m.group(3) + '</a>'
    s = re.sub(r'<a href="(Company(?:Laptop)?Navy)\.dc\.html"([^>]*)>(.*?)</a>', tick, s, flags=re.S)
    if s != o: open(f, 'w').write(s)
# Laptop Settings account rows (phone: SettingsNavy): name, email, plan and interest from the account (break-ui fix).
s = rd('SettingsLaptopNavy')
if '/* settings-account */' not in s:
    for a, b in [('>Ada Okafor</span></div>', '>{{acName}}</span></div>'), ('>ada@example.com</span></div>', '>{{acEmail}}</span></div>'), ('>Free · Upgrade to Plus</span></div>', '>{{acPlan}}</span></div>'), ('>Investing</span></div></section>', '>{{acGoal}}</span></div></section>')]:
        if a not in s: raise SystemExit('settings anchor ' + a)
        s = s.replace(a, b, 1)
    s = s.replace('<span style="font-size: 14px; color: #5B6577">{{acEmail}}', '<span style="font-size: 14px; color: #5B6577; min-width: 0; overflow-wrap: anywhere; text-align: right">{{acEmail}}', 1)
    s = s.replace("renderVals() { const v = {};", "renderVals() { /* settings-account */ const F = window.FV, A = F ? F.AUTH.get() : {}, plus = F && F.billing().sub.plan === 'plus'; const v = { acName: A.name || 'Not set', acEmail: A.email || 'Not signed in', acPlan: plus ? 'Plus' : 'Free · Upgrade to Plus', acGoal: A.goal || 'Investing' };", 1)
    wr('SettingsLaptopNavy', s)
print('controls wired')
