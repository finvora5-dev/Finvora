"""Build the Reviewer tools page (URReviewer) from the Privacy page's frame, and link to it from
Settings (phone and desktop) and the sign-in screen. The page is for people checking the app:
switch plan or account, pick the next checkout result, run the practice market, jump progress,
reset. Everything stays in this browser. Usage: python3 wire_reviewer.py <site folder>"""
import re, sys, os
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)

ON = "background: #5B21B6; color: #FFFFFF; border-color: #5B21B6"
def chips(name):
    return ('<div style="display: flex; gap: 8px; flex-wrap: wrap; padding: 4px 16px 16px"><sc-for list="{{%s}}" as="c" hint-placeholder-count="3">'
            '<button class="chip" type="button" aria-pressed="{{c.pressed}}" style="min-height: 44px; {{c.style}}" onClick="{{c.pick}}">{{c.label}}</button></sc-for></div>') % name
def card(title, note, body):
    return ('<section class="card" style="overflow: hidden"><div style="padding: 14px 16px 8px"><h2 style="font-size: 16px">%s</h2>'
            '<p class="muted" style="margin: 4px 0 0; font-size: 13px">%s</p></div>%s</section>') % (title, note, body)

MAIN = '\n'.join([
    '<p class="muted" style="margin: 0; font-size: 14px">Shortcuts for people checking Finvora. Changes stay in this browser and nothing is sent anywhere.</p>',
    card('Account', 'Signed in as {{who}}. Plan: {{planName}}.', chips('plans') +
         '<div style="padding: 0 16px 16px; display: flex; gap: 8px; flex-wrap: wrap"><button class="btn btn-w" type="button" style="flex: 1; min-width: 140px" onClick="{{asAda}}">Sign in as Ada</button><button class="btn btn-w" type="button" style="flex: 1; min-width: 140px" onClick="{{admin}}">Open admin as staff</button></div>'),
    card('Next checkout result', 'What our payment check returns the next time someone buys Plus. Real payments are never taken.', chips('outcomes')),
    card('Practice market', 'Market day {{day}}. Prices move once per market day.',
         '<div class="li" style="border-top: 1px solid #E7E2F0"><span style="flex: 1"><strong style="display: block">Market always open</strong><span class="muted" style="font-size: 13px">Ignore trading hours (weekdays, Lagos time)</span></span><span class="sw" role="switch" aria-checked="{{openOn}}" aria-label="Market always open" onClick="{{toggleOpen}}" tabindex="0" style="cursor: pointer; background: {{openBg}}; justify-content: {{openJust}}"><span></span></span></div>'
         '<div style="padding: 0 16px 16px"><button class="btn btn-w" type="button" style="width: 100%" onClick="{{nextDay}}">Move to the next market day</button></div>'),
    card('Learning progress', 'Jump to a point in World 1. Your XP and history stay as they are.', chips('progress')),
    '<section class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 10px"><h2 style="font-size: 16px">Start again</h2><p class="muted" style="margin: 0; font-size: 13px">Clears every Finvora record in this browser: progress, simulator, saved articles, plan, admin changes.</p>'
    '<button class="btn btn-w" type="button" style="color: #B42828" onClick="{{reset}}">{{resetLabel}}</button></section>',
])

LOGIC = '''class Component extends DCLogic {
  constructor(p) { super(p); this.state = { n: 0, arm: false }; }
  renderVals() {
    const F = window.FV; if (!F || !F.REV) return { plans: [], outcomes: [], progress: [] };
    const R = F.REV, a = F.AUTH.get(), st = F.get(), bump = (m) => { this.setState({ n: this.state.n + 1, arm: false }); if (m && window.fvToast) window.fvToast(m); };
    const chip = (list, cur, set) => list.map(([k, label, msg]) => ({ label: label, pressed: k === cur ? 'true' : 'false', style: k === cur ? 'ON' : '', pick: () => { set(k); bump(msg); } }));
    const plan = R.plan(), next = R.next(), open = R.alwaysOpen();
    const prog = st.bossPassed ? 'boss' : String(st.done);
    return {
      who: a.email || 'nobody yet', planName: plan === 'plus' ? 'Plus' : 'Free',
      plans: chip([['free', 'Free', 'Switched to Free.'], ['plus', 'Plus', 'Switched to Plus.']], plan, (k) => R.setPlan(k)),
      asAda: () => { R.signInAs('ada@example.com', 'Ada'); bump('Signed in as Ada.'); },
      admin: () => { R.staff(); location.href = 'UAOverview.dc.html'; },
      outcomes: chip([['success', 'Paid', 'Next checkout: paid.'], ['failed', 'Fails', 'Next checkout: fails.'], ['slow', 'Takes longer', 'Next checkout: takes longer.'], ['offline', 'Offline', 'Next checkout: offline.']], next, (k) => R.setNext(k)),
      day: R.day(), openOn: String(open), openBg: open ? '#5B21B6' : '#D3CDE0', openJust: open ? 'flex-end' : 'flex-start',
      toggleOpen: () => { R.setAlwaysOpen(!open); bump(open ? 'Trading hours apply.' : 'Market always open.'); },
      nextDay: () => { const d = R.nextDay(); bump('Market day ' + d + '. Prices have moved.'); },
      progress: chip([['0', 'Start', 'Back to lesson 1.'], ['3', '3 lessons done', '3 lessons done.'], ['6', 'All 6 lessons', 'All 6 lessons done. The boss is open.'], ['boss', 'Boss passed', 'World 1 complete.']], prog, (k) => R.setProgress(k === 'boss' ? 6 : +k, k === 'boss')),
      resetLabel: this.state.arm ? 'Tap again to clear everything' : 'Clear everything',
      reset: () => { if (!this.state.arm) { this.setState({ arm: true }); return; } R.resetAll(); location.href = 'UPOnbWelcome.dc.html'; }
    };
  }
}'''.replace("'ON'", "'" + ON + "'")

src = rd('URSetPrivacy')
i = src.index('<div class="root"'); j = src.index('</x-dc>')
root = ('<div class="root" style="width: 390px; min-height: 900px; box-sizing: border-box; display: flex; flex-direction: column; position: relative">\n'
        '  <header style="padding: 12px 16px 0; display: flex; align-items: center; gap: 8px"><a href="UPSettings.dc.html" class="press" aria-label="Back" style="width: 44px; height: 44px; margin-left: -10px; flex: none; display: flex; align-items: center; justify-content: center">'
        '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" fill="none" stroke="#0E0B14" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg></a><h1 style="font-size: 22px">Reviewer tools</h1></header>\n'
        '  <main style="padding: 12px 16px 24px; display: flex; flex-direction: column; gap: 14px">\n' + MAIN + '\n  </main>\n</div>\n')
s = src[:i] + root + src[j:]
k = s.index('class Component extends DCLogic'); e = s.index('</script>', k)
s = s[:k] + LOGIC + '\n' + s[e:]
s = re.sub(r'<title>[^<]*</title>', '<title>Reviewer tools</title>', s)
wr('URReviewer', s)

# Entry points: Settings (phone and desktop) and the sign-in screen.
TOOL = ('<a href="URReviewer.dc.html" class="li press"><span class="tile" style="width: 44px; height: 44px; background: #F5F3F8"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" fill="none" stroke="#615A6E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>'
        '<span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><span style="font-weight: 700; line-height: 1.3">Reviewer tools</span><span class="muted" style="font-size: 13px">Switch plan, checkout result, market day</span></span>'
        '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="#8E879A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></a>')
for n in ['UPSettings', 'UDxSettings']:
    s = rd(n)
    if 'URReviewer' not in s:
        h = s.index('<a href="URHelp.dc.html"'); h = s.index('</a>', h) + 4
        s = s[:h] + TOOL + s[h:]
        wr(n, s)
for n in ['UPSignIn', 'UDyPSignIn']:
    s = rd(n)
    if 'URReviewer' not in s:
        old = '<p class="muted" style="margin: 0; font-size: 13px">By continuing you agree to the Terms and Privacy policy.</p>'
        if old not in s: raise SystemExit('missing sign-in note in ' + n)
        s = s.replace(old, old + '<a href="URReviewer.dc.html" style="font-size: 14px; font-weight: 700; min-height: 44px; display: flex; align-items: center">Reviewing Finvora? Open reviewer tools</a>', 1)
        wr(n, s)
print('reviewer tools built')
