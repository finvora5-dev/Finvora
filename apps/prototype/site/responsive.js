// Scales each canvas board to the screen. Phone boards (390px) fill narrow screens and grow
// up to 480px on tablets and desktops; wider boards (admin, 1440px) shrink to fit.
(function () {
  function root() { return document.querySelector("#dc-root > .sc-host > :first-child"); }
  function fit() {
    var el = root(); if (!el) return;
    var designW = parseFloat(el.style.width) || 390;
    var vw = document.documentElement.clientWidth;
    var phone = designW < 600;
    var target = phone ? Math.min(vw, 480) : Math.min(vw, designW);
    var z = target / designW;
    el.style.zoom = String(z);
    document.documentElement.classList.toggle("fv-phone", phone);
    document.documentElement.style.overflowX = "hidden";
  }
  var mo = new MutationObserver(fit);
  function start() { mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] }); fit(); }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  window.addEventListener("resize", fit);
})();
