"""Installable app (PWA) and the launch animation (client chose option 2, "Draw"; owner, 16 Nov 2026).
Writes site/manifest.json and site/index.html (the start page: plays the logo animation once, then opens Home for a signed-in
visitor or the welcome screen), and links the manifest, the iPhone tags and the icon from every board.
Icons are drawn by tools/build_pwa_icons.cjs. Idempotent. Run before build_sw.py. Usage: build_pwa.py <site>"""
import json, os, re, sys
SITE = sys.argv[1]
src = open(os.path.join(SITE, 'HomeLaptopNavy.dc.html')).read()
i = src.index('aria-label="Finvora"'); svg = src[src.index('<svg', i):src.index('</svg>', i)]
STEM, LEAF = re.findall(r' d="([^"]*)"', svg)[:2]

json.dump({
    "name": "Finvora", "short_name": "Finvora", "description": "Learn money and investing with Nigerian companies.",
    "start_url": "./index.html", "scope": "./", "display": "standalone", "orientation": "portrait",
    "background_color": "#0B192C", "theme_color": "#0B192C", "lang": "en-NG",
    "icons": [{"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
              {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
              {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]},
    open(os.path.join(SITE, 'manifest.json'), 'w'), indent=2, ensure_ascii=False)

HEAD = '<link rel="manifest" href="./manifest.json"><link rel="apple-touch-icon" href="./icons/apple-touch-icon.png"><link rel="icon" type="image/png" sizes="192x192" href="./icons/icon-192.png"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Finvora">'
n = 0
for f in sorted(os.listdir(SITE)):
    if not f.endswith('.dc.html'): continue
    p = os.path.join(SITE, f); s = open(p).read()
    if 'rel="manifest"' in s: continue
    m = re.search(r'<meta name="theme-color" content="#[0-9A-Fa-f]{6}">', s)  # navy-header boards and light-header boards
    if not m: continue
    open(p, 'w').write(s.replace(m.group(0), m.group(0) + HEAD, 1)); n += 1
print('boards linked to the manifest:', n)

# Start page. Launch animation "Draw": the outline is drawn, colour floods in, the letters arrive one by one (1.4 s), then the
# first screen opens. Plays once per app session; a return to the start page in the same session goes straight through.
# Reduced motion: a plain fade. The next screen is fetched while the animation plays.
INDEX = '''<!doctype html>
<html lang="en-NG"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex"><meta name="theme-color" content="#0B192C"><meta name="color-scheme" content="light">''' + HEAD + '''<title>Finvora</title>
<style>
html,body{margin:0;height:100%;background:#0B192C}
.lock{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:'Geist',system-ui,-apple-system,'Segoe UI',sans-serif}
.mark{width:84px;height:96px;overflow:visible}
.stem,.leaf{stroke-width:9;stroke-linejoin:round;stroke-dasharray:1}
.stem{stroke:#FFFFFF;animation:line 760ms cubic-bezier(0.77,0,0.175,1) both,fill 320ms ease 700ms both}
.leaf{stroke:#00E676;animation:line 620ms cubic-bezier(0.77,0,0.175,1) 240ms both,fill 320ms ease 820ms both}
.word{display:flex;font-weight:600;font-size:19px;letter-spacing:.08em;color:#FFFFFF}
.word i{font-style:normal;display:inline-block;animation:up 300ms cubic-bezier(0.23,1,0.32,1) both;animation-delay:calc(900ms + var(--i) * 40ms)}
@keyframes line{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes fill{from{fill-opacity:0}to{fill-opacity:1;stroke-width:0}}
@keyframes up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.skip .lock{display:none}
@media (prefers-reduced-motion: reduce){.stem,.leaf,.word i{animation:none;stroke-width:0}.lock{animation:rm 300ms ease both}@keyframes rm{from{opacity:0}}}
</style>
<script>
(function () {
  var signedIn = false, seen = false;
  try { signedIn = !!(JSON.parse(localStorage.getItem("fv.auth.v1") || "{}").email); seen = sessionStorage.getItem("fv.launched") === "1"; sessionStorage.setItem("fv.launched", "1"); } catch (e) {}
  var next = (signedIn ? "HomeNavy.dc.html" : "MainNavy.dc.html") + location.search + location.hash;
  if (seen) { document.documentElement.className = "skip"; location.replace(next); return; }
  var l = document.createElement("link"); l.rel = "prefetch"; l.href = next; document.head.appendChild(l);
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  setTimeout(function () { location.replace(next); }, still ? 700 : 1500);
})();
</script>
<noscript><meta http-equiv="refresh" content="0; url=MainNavy.dc.html"></noscript></head>
<body><div class="lock" role="img" aria-label="Finvora"><svg class="mark" viewBox="75 55 490 560" aria-hidden="true"><path class="stem" pathLength="1" fill-rule="evenodd" fill="#FFFFFF" d="__STEM__"/><path class="leaf" pathLength="1" fill-rule="evenodd" fill="#00E676" d="__LEAF__"/></svg><span class="word" aria-hidden="true">__WORD__</span></div>
<noscript><a href="MainNavy.dc.html" style="color:#FFFFFF">Open Finvora</a></noscript></body></html>
'''
word = ''.join('<i style="--i:%d">%s</i>' % (k, c) for k, c in enumerate('FINVORA'))
open(os.path.join(SITE, 'index.html'), 'w').write(INDEX.replace('__STEM__', STEM).replace('__LEAF__', LEAF).replace('__WORD__', word))
print('index.html and manifest.json written')
