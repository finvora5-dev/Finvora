// Fits each navy canvas board to the screen, and picks the laptop or phone board for the window size.
// Ported from the earlier prototype's responsive.js (fit and route only; no sounds, XP or celebrations).
// Phones (< 600px): the 390px board is scaled to the screen width, so folded phones (280px) fit too.
// Wider screens without a laptop board: the phone column is shown centred (build plan §6).
// Laptops (>= 1024px): the laptop board is used when one exists; 1440px boards fill the window.
(function () {
  var DESK = 1024;
  var PAIRS = { HomeNavy: "HomeLaptopNavy", MarketsNavy: "MarketsLaptopNavy", CompanyNavy: "CompanyLaptopNavy", AskFinvoraNavy: "AskLaptopNavy",
    LearnNavy: "LearnLaptopNavy", LibraryNavy: "LibraryLaptopNavy", MeNavy: "MeLaptopNavy", ArticleNavy: "ArticleLaptopNavy", SearchNavy: "SearchLaptopNavy",
    EmptySearchNavy: "EmptyLaptopNavy", ErrorNavy: "ErrorLaptopNavy", OfflineNavy: "OfflineLaptopNavy", GoalNavy: "GoalLaptopNavy", LessonNavy: "LessonLaptopNavy",
    LessonDoneNavy: "LessonDoneLaptopNavy", NotificationsNavy: "NotificationsLaptopNavy", PayFailedNavy: "PayFailedLaptopNavy", PaySuccessNavy: "PayLaptopNavy",
    PayPendingNavy: "PayPendingLaptopNavy", PlusNavy: "PlansLaptopNavy", PracticeNavy: "PracticeLaptopNavy", PracticeSellNavy: "SellLaptopNavy",
    SettingsNavy: "SettingsLaptopNavy", SignInNavy: "SignInLaptopNavy", SignOutNavy: "SignOutLaptopNavy", UpgradeNavy: "UpgradeLaptopNavy", MainNavy: "WelcomeLaptopNavy" };
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
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(function () {});
  var resizeTimer = null;
  window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(function () { if (!route()) fit(); }, 250); });
  function root() { return document.querySelector("#dc-root > .sc-host > :first-child"); }
  function fit() {
    var el = root(); if (!el) return;
    if (!el.dataset.fvW) el.dataset.fvW = String(parseFloat(el.style.width) || 390);
    var designW = +el.dataset.fvW, vw = document.documentElement.clientWidth, html = document.documentElement;
    var phoneBoard = designW < 600, wide = vw >= 600;
    html.classList.toggle("fv-wide", phoneBoard && wide);
    html.style.overflowX = "hidden";
    if (!phoneBoard) {
      if (vw >= DESK || vw >= 700) { el.style.zoom = "1"; el.style.width = "100%"; el.style.minWidth = "0"; return; }
      el.style.zoom = String(Math.min(1, vw / designW)); return;
    }
    if (!wide) {
      var z = vw / designW; el.style.zoom = String(z); el.style.width = designW + "px";
      // Fill the visible screen, not the 844px drawing, so bottom buttons sit on the bottom edge.
      el.style.setProperty("min-height", (window.innerHeight / z) + "px", "important");
      el.style.setProperty("height", "auto", "important");
      return;
    }
    // Wider screens without a laptop board: the phone column, centred at its designed width (build plan §6).
    el.style.zoom = "1"; el.style.width = designW + "px";
    el.style.setProperty("min-height", window.innerHeight + "px", "important");
    el.style.setProperty("height", "auto", "important");
  }
  var mo = new MutationObserver(function () { if (root()) { fit(); } });
  function start() { mo.observe(document.body, { childList: true, subtree: true }); fit(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
