// Fits each canvas board to the screen, and picks the desktop or phone board for the window size.
// Phones (< 600px): the 390px board is scaled to the screen width, so folded phones (280px) fit too.
// Tablets and desktop (>= 600px): the board reflows to fill the whole window, with no width cap:
// full-width sections stretch, two-column grids gain columns, and fixed-size drawings stay centred.
(function () {
  // Desktop (>= 1024px) uses the desktop boards; smaller screens use the phone boards.
  var DESK = 1024;
  var PAIRS = { UOHome: "UDHome", UPJourney: "UDJourney", UPLibrary: "UDLibrary", UPMarkets: "UDMarkets", USimHome: "UDSimulator", UPMe: "UDMe" };
  var BACK = {}; Object.keys(PAIRS).forEach(function (k) { BACK[PAIRS[k]] = k; });
  function route() {
    var m = location.pathname.match(/([A-Za-z]+)\.dc(\.html)?$/); if (!m) return false;
    var name = m[1], vw = document.documentElement.clientWidth, target = null;
    if (vw >= DESK && PAIRS[name]) target = PAIRS[name];
    if (vw < DESK && BACK[name]) target = BACK[name];
    if (!target) return false;
    location.replace(location.pathname.replace(name + ".dc", target + ".dc") + location.search + location.hash);
    return true;
  }
  if (route()) return;
  var resizeTimer = null;
  window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(route, 250); });
  function root() { return document.querySelector("#dc-root > .sc-host > :first-child"); }
  function fit() {
    var el = root(); if (!el) return;
    if (!el.dataset.fvW) el.dataset.fvW = String(parseFloat(el.style.width) || 390);
    var designW = +el.dataset.fvW, vw = document.documentElement.clientWidth;
    var phoneBoard = designW < 600, wide = vw >= 600;
    var html = document.documentElement;
    html.classList.toggle("fv-wide", phoneBoard && wide);
    html.style.overflowX = "hidden";
    var deskBoard = designW >= 1200 && !!el.querySelector(".dside");
    html.classList.toggle("fv-desk", deskBoard && vw >= DESK);
    if (deskBoard && vw >= DESK) { el.style.zoom = "1"; el.style.width = "100%"; return; }
    if (!phoneBoard) { el.style.zoom = String(Math.min(1, vw / designW)); return; }
    if (!wide) {
      var z = vw / designW; el.style.zoom = String(z); el.style.width = designW + "px";
      // The pinned nav bar sits inside the zoomed board; size it to the screen.
      el.querySelectorAll('nav[aria-label="Main"]').forEach(function (n) { n.style.setProperty("width", designW + "px", "important"); });
      return;
    }
    el.style.zoom = "1";
    el.style.width = "100%";
    // Line charts: stretch across the card on wide screens (the line widens, height stays).
    el.querySelectorAll('svg[role="img"][aria-label*="Price"]').forEach(function (svg) {
      svg.setAttribute("width", "100%"); svg.setAttribute("preserveAspectRatio", "none");
      svg.querySelectorAll("path, polyline, line").forEach(function (l) { l.setAttribute("vector-effect", "non-scaling-stroke"); });
    });
    // Elements drawn at the board's fixed width: stretch them, unless they hold positioned artwork.
    el.querySelectorAll("[style*='width: 390px'], [style*='width:390px']").forEach(function (n) {
      if (n === el) return;
      var art = n.querySelector("[style*='position: absolute']") || n.tagName === "svg";
      if (art) { n.style.marginLeft = "auto"; n.style.marginRight = "auto"; }
      else n.style.width = "100%";
    });
  }
  var queued = false;
  function schedule() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; fit(); }); }
  var mo = new MutationObserver(schedule);
  function start() { mo.observe(document.body, { childList: true, subtree: true }); fit(); }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  window.addEventListener("resize", fit);
})();
