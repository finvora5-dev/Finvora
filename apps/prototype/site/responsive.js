// Fits each canvas board to the screen.
// Phones (< 600px): the 390px board is scaled to the screen width, so folded phones (280px) fit too.
// Tablets and desktop (>= 600px): the board reflows to fill the whole window, with no width cap:
// full-width sections stretch, two-column grids gain columns, and fixed-size drawings stay centred.
(function () {
  function root() { return document.querySelector("#dc-root > .sc-host > :first-child"); }
  function fit() {
    var el = root(); if (!el) return;
    if (!el.dataset.fvW) el.dataset.fvW = String(parseFloat(el.style.width) || 390);
    var designW = +el.dataset.fvW, vw = document.documentElement.clientWidth;
    var phoneBoard = designW < 600, wide = vw >= 600;
    var html = document.documentElement;
    html.classList.toggle("fv-wide", phoneBoard && wide);
    html.style.overflowX = "hidden";
    if (!phoneBoard) { el.style.zoom = String(Math.min(1, vw / designW)); return; }
    if (!wide) { el.style.zoom = String(vw / designW); el.style.width = designW + "px"; return; }
    el.style.zoom = "1";
    el.style.width = "100%";
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
