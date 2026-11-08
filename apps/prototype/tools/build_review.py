"""Design Part 2 (docs/designs/review-what-i-missed.md), screens: the review end screen (UPReviewDone,
built from UPCelebrate so Fin's power-up is identical), the "Review what I missed" button on the lesson
summary, and "Lesson review" in History. The journey sheet lives in responsive.js. Safe to re-run.
Usage: python3 build_review.py <site folder>   (run after build_celebrate.py)"""
import os, re, sys
SITE = sys.argv[1]
def rd(n): return open(os.path.join(SITE, n + '.dc.html')).read()
def wr(n, s): open(os.path.join(SITE, n + '.dc.html'), 'w').write(s)

cel = rd('UPCelebrate')
head = cel[:cel.index('<div class="root" id="cel">')].replace('<title>Finvora: Lesson celebration</title>', '<title>Finvora: Review done</title>')
fin = re.search(r'<div class="fin" id="fin">.*?</svg></div>', cel, re.S).group(0)
pu = cel[cel.index('  powerUp(anim, calm) {'):cel.index('  receipt(r, $, anim, roll, calm) {')]
extra_css = '''<style>
.badge{position:relative;width:96px;height:96px;border-radius:28px;background:linear-gradient(145deg,#8B5CF6,#5B21B6);box-shadow:0 6px 0 #3B0F7A;display:flex;align-items:center;justify-content:center;transform:rotate(-8deg)}
.badge svg{width:52px;height:52px}
.xpchip{display:inline-flex;align-items:center;gap:6px;background:#F1EBFB;color:#4C1D95;font-weight:800;font-size:22px;border-radius:999px;padding:6px 16px;font-variant-numeric:tabular-nums}
.fixedlist{display:flex;flex-direction:column;gap:6px;width:100%;max-width:320px}
.fixedlist div{display:flex;align-items:center;gap:8px;border:1.5px solid #E7E2F0;border-radius:12px;padding:8px 12px;font-size:15px;text-align:left}
.dot{width:20px;height:20px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;color:#FFFFFF;font-size:12px;font-weight:800}
.dot.g{background:#16A34A}.dot.o{background:#F97316}
.calm{width:110px;height:110px}
</style>
'''
head = head.replace('</helmet>', extra_css + '</helmet>', 1) if '</helmet>' in head else head
NAMES = "{ choice: 'Quick question', order: 'Order the steps', match: 'Match the pairs', scenario: 'Scenario', calc: 'Calculation' }"
body = '''<div class="root" id="cel">
    <div class="scr" id="sAll" hidden>
      ''' + fin + '''
      <h1 class="hl" id="allH">Came back stronger</h1>
      <p class="sub" id="allSub"></p>
      <div class="badge" id="badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" fill="#FFFFFF"></path></svg></div>
      <span class="xpchip" id="xpchip" role="status"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="#5B21B6"></path></svg><span>+<span id="xpAll">0</span></span> XP</span>
      <div class="foot"><a class="btn" href="UPJourney.dc.html" style="text-decoration:none">Back to the journey</a></div>
    </div>
    <div class="scr" id="sSome" hidden>
      <svg class="calm" viewBox="0 0 120 120" aria-hidden="true"><path d="M20 66q-8 6-6 16" fill="none" stroke="#0F55C9" stroke-width="8" stroke-linecap="round"></path><path d="M98 58q14 -10 12 -26" fill="none" stroke="#0F55C9" stroke-width="8" stroke-linecap="round"></path><circle cx="60" cy="62" r="42" fill="#0F55C9"></circle><circle cx="60" cy="58" r="42" fill="#1A73F5"></circle><circle cx="60" cy="58" r="33" fill="none" stroke="#9CC3FF" stroke-width="3" stroke-dasharray="4 5"></circle><ellipse cx="46" cy="52" rx="9" ry="11" fill="#FFFFFF"></ellipse><ellipse cx="74" cy="52" rx="9" ry="11" fill="#FFFFFF"></ellipse><circle cx="48" cy="54" r="4.6" fill="#0B1F44"></circle><circle cx="76" cy="54" r="4.6" fill="#0B1F44"></circle><path d="M46 70q14 12 28 -2" fill="none" stroke="#0B1F44" stroke-width="3.5" stroke-linecap="round"></path></svg>
      <h1 class="hl" id="someH" style="color:#0E0B14">Still to practise</h1>
      <p class="sub" id="someSub"></p>
      <div class="fixedlist" id="list"></div>
      <span class="xpchip" id="xpSome" role="status">+0 XP</span>
      <div class="foot"><a class="btn" href="UPJourney.dc.html" style="text-decoration:none">Back to the journey</a></div>
    </div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":844}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
  componentDidMount() { setTimeout(() => this.run(), 30); }
  run() {
    const FV = window.FV; if (!FV) return;
    const r = (FV.get().run && FV.get().run.review ? FV.finishRun() : null) || FV.lastReview();
    if (!r) { location.replace('UPJourney.dc.html'); return; }
    const $ = (id) => document.getElementById(id), N = ''' + NAMES + ''', name = (k) => N[k] || k;
    const calm = () => document.documentElement.classList.contains('fv-reduce') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const anim = (el, f, o) => calm() || !el.animate ? null : el.animate(f, o);
    const roll = (el, to, ms) => { if (calm()) { el.textContent = to; return; } const t0 = performance.now(); const tick = (t) => { const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e); if (p < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); };
    try { sessionStorage.setItem('fv.seen', JSON.stringify({ xp: FV.get().xp, streak: FV.streak() })); } catch (e) {}
    if (r.allFixed) {
      $('sAll').hidden = false;
      const n = r.fixed.length;
      $('allH').textContent = r.bonus ? 'Came back stronger' : 'All fixed!';
      $('allSub').textContent = 'You fixed ' + (n === 1 ? 'the question' : n === 2 ? 'both questions' : 'all ' + n + ' questions') + ' you missed in ' + r.lesson.title + '.';
      $('xpAll').textContent = '0';
      if (!r.bonus) $('badge').style.display = 'none';
      this.powerUp(anim, calm);
      if (calm()) { $('xpAll').textContent = r.xp; return; }
      if (r.bonus) $('badge').animate([{ transform: 'rotate(-200deg) scale(.2)', opacity: 0 }, { transform: 'rotate(10deg) scale(1.15)', opacity: 1, offset: .7 }, { transform: 'rotate(-8deg) scale(1)' }], { duration: 750, delay: 1500, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'backwards' });
      $('xpchip').animate([{ transform: 'translateY(12px) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 350, delay: 2100, easing: 'cubic-bezier(.3,1.5,.5,1)', fill: 'backwards' });
      setTimeout(() => roll($('xpAll'), r.xp, 600), 2200);
    } else {
      $('sSome').hidden = false;
      const left = r.stillMissed.length;
      $('someH').textContent = left + ' still to practise';
      $('someSub').textContent = r.fixed.length ? 'You fixed ' + (r.fixed.length === 1 ? 'one' : r.fixed.length) + '. Try the rest again later; ' + (left === 1 ? 'it' : 'they') + ' will wait for you.' : 'Not this time. ' + (left === 1 ? 'It' : 'They') + ' will wait for you, so try again later.';
      $('list').innerHTML = r.fixed.map((k) => '<div><span class="dot g">\\u2713</span>' + name(k) + ': fixed</div>').concat(r.stillMissed.map((k, i) => '<div><span class="dot o">' + (i + 1) + '</span>' + name(k) + ': still to practise</div>')).join('');
      $('xpSome').textContent = '+' + r.xp + ' XP';
      $('list').querySelectorAll('div').forEach((d, k) => anim(d, [{ opacity: 0, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 300 + k * 250, fill: 'backwards' }));
    }
  }
''' + pu + '''}
</script>
</body>
</html>
'''
wr('UPReviewDone', head + body)

# Lesson summary: a "Review what I missed" button when the lesson has misses.
for n in ['UPLessonComplete', 'UDyPLessonComplete']:
    s = rd(n)
    if '{{hasMisses}}' not in s:
        a = '<a href="{{readHref}}"'
        i = s.index(a)
        s = s[:i] + '<sc-if value="{{hasMisses}}" hint-placeholder-val="{{false}}"><a href="{{missHref}}" class="btn b-sec" style="text-decoration: none">{{missLabel}}</a></sc-if>' + s[i:]
        s = s.replace("      hasMistake: !!(this.result && this.result.wrong > 0),", "      hasMistake: !!(this.result && this.result.wrong > 0),\n      ...(() => { const F = window.FV, L = this.result && this.result.lesson, n = F && L && F.missCount ? F.missCount(L.id) : 0; return { hasMisses: n > 0, missN: n, missLabel: 'Review what I missed (' + n + ')', missHref: L ? 'UPLessonInfo.dc.html?l=' + L.id + '&review=1' : '' }; })(),", 1)
        wr(n, s)

# History names reviews.
for n in ['UPHistory', 'UDxHistory']:
    s = rd(n)
    if "review: 'Lesson review'" not in s:
        wr(n, s.replace("practice: 'Lesson replay',", "practice: 'Lesson replay', review: 'Lesson review',", 1))
print('review screens built')
