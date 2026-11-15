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
  // Lesson steps get the 'step' transition type (slide), every other screen change cross-fades (skill: animate).
  var STEP = /(Lesson(Info|Calc|Order|Scenario|Match)?|LearnMyth|LearnCompare|LessonDone|CourseReviewQ)Navy\.dc/;
  window.addEventListener("pagereveal", function (e) {
    try { var from = navigation.activation && navigation.activation.from && navigation.activation.from.url;
      if (e.viewTransition && from && STEP.test(from) && STEP.test(location.pathname)) e.viewTransition.types.add("step"); } catch (x) {}
    // Bottom nav and sidebar tabs switch instantly: tapped many times a day, so no animation (skill: animate, frequency gate; owner, 15 Nov 2026).
    try { if (e.viewTransition && sessionStorage.getItem("fv.tab") === "1") e.viewTransition.skipTransition(); sessionStorage.removeItem("fv.tab"); } catch (x) {}
  });
  document.addEventListener("click", function (e) { var a = e.target.closest && e.target.closest('nav[aria-label="Main"] a, aside a'); try { if (a) sessionStorage.setItem("fv.tab", "1"); } catch (x) {} }, true);
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
      el.style.setProperty("height", el.querySelector("#chat") ? (window.innerHeight / z) + "px" : "auto", "important");
      return;
    }
    // Wider screens without a laptop board: the phone column, centred at its designed width (build plan §6).
    el.style.zoom = "1"; el.style.width = designW + "px";
    el.style.setProperty("min-height", window.innerHeight + "px", "important");
    el.style.setProperty("height", el.querySelector("#chat") ? window.innerHeight + "px" : "auto", "important");
  }
  var mo = new MutationObserver(function () { if (root()) { fit(); } });
  function start() { mo.observe(document.body, { childList: true, subtree: true }); fit(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

// Sheets that close in place (a "#" action such as Try again or Next) slide out the way they came in,
// then the original click runs. Links to other pages are left to the page transition.
(function () {
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('section[role="dialog"] a[href="#"]');
    if (!a || a.__fvGo) return;
    var sh = a.closest('section[role="dialog"]');
    if (sh.classList.contains("fv-leaving")) { e.preventDefault(); e.stopPropagation(); return; }
    e.preventDefault(); e.stopPropagation(); sh.classList.add("fv-leaving");
    var done = false, go = function () { if (done) return; done = true; a.__fvGo = true; a.click(); a.__fvGo = false; sh.classList.remove("fv-leaving"); };
    var end = function (ev) { if (ev.target === sh && ev.propertyName === "transform" || ev.target === sh && ev.propertyName === "opacity") { sh.removeEventListener("transitionend", end); go(); } };
    sh.addEventListener("transitionend", end); setTimeout(go, 260);
  }, true);
})();

// Dictionary letter index: tap a letter or drag along the strip (as in the iOS contacts index) to jump to
// that letter's section, or the next letter that has terms. No animation: it follows the finger.
(function () {
  function jump(nav, x, y) {
    var el = document.elementFromPoint(nav.getBoundingClientRect().left + nav.offsetWidth / 2, y), a = el && el.closest && el.closest(".fv-index a");
    if (!a || a === nav.__fvLast) return; nav.__fvLast = a;
    var L = a.textContent.trim(), hs = [].slice.call(document.querySelectorAll("main h2, #dc-root h2"));
    var h = hs.filter(function (x) { return x.textContent.trim().length === 1 && x.textContent.trim() >= L; })[0];
    if (h) h.scrollIntoView({ block: "start" });
  }
  document.addEventListener("pointerdown", function (e) {
    var nav = e.target.closest && e.target.closest(".fv-index"); if (!nav) return;
    e.preventDefault(); nav.__fvLast = null; try { nav.setPointerCapture(e.pointerId); } catch (x) {}
    jump(nav, e.clientX, e.clientY);
    var move = function (ev) { jump(nav, ev.clientX, ev.clientY); }, up = function () { nav.removeEventListener("pointermove", move); nav.removeEventListener("pointerup", up); nav.removeEventListener("pointercancel", up); };
    nav.addEventListener("pointermove", move); nav.addEventListener("pointerup", up); nav.addEventListener("pointercancel", up);
  });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".fv-index a")) e.preventDefault(); }, true);
})();
