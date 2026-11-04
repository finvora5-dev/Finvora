// Fits each canvas board to the screen, and picks the desktop or phone board for the window size.
// Phones (< 600px): the 390px board is scaled to the screen width, so folded phones (280px) fit too.
// Tablets and desktop (>= 600px): the board reflows to fill the whole window, with no width cap:
// full-width sections stretch, two-column grids gain columns, and fixed-size drawings stay centred.
(function () {
  // Desktop (>= 1024px) uses the desktop boards; smaller screens use the phone boards.
  var DESK = 1024;
  var PAIRS = { UOHome: "UDHome", UPJourney: "UDJourney", UPLibrary: "UDLibrary", UPMarkets: "UDMarkets", USimHome: "UDSimulator", UPMe: "UDMe" };
  // Sub-pages, focus flows and pop-ups (approved desktop patterns A, B and C).
  var MORE = {"UPTopic":"UDxTopic","UPSearch":"UDxSearch","UPDictionary":"UDxDictionary","UPEmptySearch":"UDxEmptySearch","UPExchange":"UDxExchange","URCompanies":"UDxRCompanies","URCompany":"UDxRCompany","URCompanyLoading":"UDxRCompanyLoading","UPChallenges":"UDxChallenges","UPInflation":"UDxInflation","USimCompany":"UDxSimCompany","USimMarket":"UDxSimMarket","USimHistory":"UDxSimHistory","USimEmpty":"UDxSimEmpty","UPAskKobo":"UDxAskKobo","UPProgress":"UDxProgress","UPAchievements":"UDxAchievements","UPHistory":"UDxHistory","UPSaved":"UDxSaved","UPNotifications":"UDxNotifications","UPSettings":"UDxSettings","URSetEmail":"UDxRSetEmail","URSetGoal":"UDxRSetGoal","URSetPrivacy":"UDxRSetPrivacy","URSetTerms":"UDxRSetTerms","URHelp":"UDxRHelp","URDeleteAccount":"UDxRDeleteAccount","USPlans":"UDxSPlans","USCompare":"UDxSCompare","USYourPlan":"UDxSYourPlan","UMEmptyHistory":"UDxMEmptyHistory","UMEmptyNotif":"UDxMEmptyNotif","UMEmptySaved":"UDxMEmptySaved","UPOnbGoal":"UDyPOnbGoal","UPSignIn":"UDyPSignIn","UPSignInCode":"UDyPSignInCode","URAgeCheck":"UDyRAgeCheck","URNotifAsk":"UDyRNotifAsk","URCodeError":"UDyRCodeError","UPDaily":"UDyPDaily","UPLevelUp":"UDyPLevelUp","UPStreak":"UDyPStreak","URStreakLost":"UDyRStreakLost","UPLessonInfo":"UDyPLessonInfo","UPLessonChoice":"UDyPLessonChoice","UPLessonCalc":"UDyPLessonCalc","UPLessonComplete":"UDyPLessonComplete","UPLearnTerm":"UDyPLearnTerm","UPLearnSteps":"UDyPLearnSteps","UPLearnCompare":"UDyPLearnCompare","UPLearnMarket":"UDyPLearnMarket","UPLearnMyth":"UDyPLearnMyth","UPLessonOrder":"UDyPLessonOrder","UPLessonMatch":"UDyPLessonMatch","UPLessonScenario":"UDyPLessonScenario","UPBossIntro":"UDyPBossIntro","UPBossQuestion":"UDyPBossQuestion","UPBossResult":"UDyPBossResult","USCheckPending":"UDySCheckPending","USCheckSuccess":"UDySCheckSuccess","USCheckFailed":"UDySCheckFailed","USCheckSlow":"UDySCheckSlow","USCheckOffline":"UDySCheckOffline","USCheckAlready":"UDySCheckAlready","USimDone":"UDySimDone","UPError":"UDyPError","UPOffline":"UDyPOffline","URDeleted":"UDyRDeleted","UFRate":"UDzFRate","UFReport":"UDzFReport","UFReview":"UDzFReview","UFSuggest":"UDzFSuggest","UMAskLimit":"UDzMAskLimit","UMCancelPlan":"UDzMCancelPlan","UMLeaveLesson":"UDzMLeaveLesson","UMLocked":"UDzMLocked","UMOrderClosed":"UDzMOrderClosed","UMSignOut":"UDzMSignOut","UMSimReset":"UDzMSimReset","USUpgrade":"UDzSUpgrade","USimSell":"UDzSimSell","UPArticle":"UDArticle","UPOnbWelcome":"UDWelcome","USimTrade":"UDBuy"};
  Object.keys(MORE).forEach(function (k) { PAIRS[k] = MORE[k]; });
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
    html.classList.toggle("fv-big", designW >= 1200 && vw >= DESK);
    fillFV(el);
    if (designW >= 1200 && vw >= DESK) { el.style.zoom = "1"; el.style.width = "100%"; stretchCharts(el); return; }
    if (!phoneBoard) { el.style.zoom = String(Math.min(1, vw / designW)); return; }
    if (designW < 300) { el.style.zoom = "1"; el.style.margin = "0 auto"; return; } // small component boards (Fin) stay actual size
    if (!wide) {
      var z = vw / designW; el.style.zoom = String(z); el.style.width = designW + "px";
      // Pop-ups: the page behind fills the screen exactly, so the sheet sits on the bottom edge.
      var dlg = el.querySelector(':scope > [role="dialog"], :scope > [role="alertdialog"]');
      if (dlg) { el.style.setProperty("height", Math.max(window.innerHeight / z, dlg.offsetHeight + 24) + "px", "important"); el.style.setProperty("min-height", "0", "important"); el.style.overflow = "hidden"; }
      // The pinned nav bar sits inside the zoomed board; size it to the screen.
      el.querySelectorAll('nav[aria-label="Main"]').forEach(function (n) { n.style.setProperty("width", designW + "px", "important"); });
      return;
    }
    el.style.zoom = "1";
    el.style.width = "100%";
    var dlgW = el.querySelector(':scope > [role="dialog"], :scope > [role="alertdialog"]');
    if (dlgW) { el.style.setProperty("height", Math.max(window.innerHeight, dlgW.offsetHeight + 24) + "px", "important"); el.style.setProperty("min-height", "0", "important"); el.style.overflow = "hidden"; }
    stretchCharts(el);
    // Elements drawn at the board's fixed width: stretch them, unless they hold positioned artwork.
    el.querySelectorAll("[style*='width: 390px'], [style*='width:390px']").forEach(function (n) {
      if (n === el) return;
      var art = n.querySelector("[style*='position: absolute']") || n.tagName === "svg";
      if (art) { n.style.marginLeft = "auto"; n.style.marginRight = "auto"; }
      else n.style.width = "100%";
    });
  }
  // Header chips on desktop boards: the learner's real streak, XP and level.
  function fillFV(el) {
    var FV = window.FV; if (!FV) return;
    var st = FV.get(), v = { streak: String(FV.streak()), xp: String(st.xp), levelText: "Level " + FV.level(st.xp) + " learner" };
    el.querySelectorAll("[data-fv]").forEach(function (n) { var t = v[n.getAttribute("data-fv")]; if (t != null && n.textContent !== t) n.textContent = t; });
    el.querySelectorAll("[data-fv-label]").forEach(function (n) {
      var k = n.getAttribute("data-fv-label"), t = k === "streak" ? "Streak: " + v.streak + (v.streak === "1" ? " day" : " days") : v.xp + " XP, " + v.levelText;
      if (n.getAttribute("aria-label") !== t) n.setAttribute("aria-label", t);
    });
  }
  // Line charts: stretch across the card on wide screens (the line widens, height stays).
  function stretchCharts(el) {
    el.querySelectorAll('svg[role="img"][aria-label*="Price"]').forEach(function (svg) {
      if (svg.getAttribute("width") !== "100%") svg.setAttribute("width", "100%");
      if (svg.getAttribute("preserveAspectRatio") !== "none") svg.setAttribute("preserveAspectRatio", "none");
      svg.querySelectorAll("path, polyline, line").forEach(function (l) { if (!l.getAttribute("vector-effect")) l.setAttribute("vector-effect", "non-scaling-stroke"); });
    });
  }
  var queued = false;
  function schedule() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; fit(); }); }
  var mo = new MutationObserver(schedule);
  function start() { mo.observe(document.body, { childList: true, subtree: true }); fit(); }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  window.addEventListener("resize", fit);
})();
