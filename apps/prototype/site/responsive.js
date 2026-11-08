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
  // Remember the previous page (desktop and phone versions swap pages, which loses the browser's referrer).
  try { window.FV_PREV = sessionStorage.getItem("fv.here") || ""; sessionStorage.setItem("fv.here", location.pathname.split("/").pop() + location.search); } catch (e) { window.FV_PREV = ""; }
  var resizeTimer = null;
  window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(route, 250); });
  function root() { return document.querySelector("#dc-root > .sc-host > :first-child"); }
  function fit() {
    var el = root(); if (!el) return;
    unskeleton();
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
    // Fluid boards (the email previews) reflow at real size on every screen.
    if (el.hasAttribute("data-fv-fluid")) { el.style.zoom = "1"; el.style.width = "100%"; el.style.minWidth = "0"; return; }
    if (!phoneBoard) { el.style.zoom = String(Math.min(1, vw / designW)); return; }
    if (designW < 300) { el.style.zoom = "1"; el.style.margin = "0 auto"; return; } // small component boards (Fin) stay actual size
    if (!wide) {
      var z = vw / designW; el.style.zoom = String(z); el.style.width = designW + "px";
      // Fill the visible screen, not the 844px drawing, so bottom buttons sit on the bottom edge.
      el.style.setProperty("min-height", (window.innerHeight / z) + "px", "important");
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
    el.querySelectorAll("[data-fv]").forEach(function (n) { if (n.hasAttribute("data-fv-anim")) return; var t = v[n.getAttribute("data-fv")]; if (t != null && n.textContent !== t) n.textContent = t; });
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

  // ---- App states: toast, loading skeleton, offline notice, offline support (service worker).
  var ICON = { ok: "M5 12l5 5 9-10", info: "M12 8h.01 M11 12h1v5h1", warn: "M12 8v5 M12 16h.01" };
  window.fvToast = function (msg, opts) {
    opts = opts || {}; var old = document.getElementById("fv-toast"); if (old) old.remove();
    var t = document.createElement("div"); t.id = "fv-toast"; t.className = "fv-toast"; t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite");
    var bg = opts.kind === "warn" ? "#B42828" : "#0E0B14";
    t.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(96px + env(safe-area-inset-bottom,0px));z-index:60;width:min(358px,calc(100vw - 32px));box-sizing:border-box;display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;font:700 15px 'Plus Jakarta Sans',sans-serif;box-shadow:0 8px 24px rgba(16,30,70,.16);color:#FFFFFF;background:" + bg;
    t.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style="flex:none"><path d="' + (ICON[opts.kind || "ok"] || ICON.ok) + '" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path></svg><span style="flex:1"></span>';
    t.querySelector("span").textContent = msg;
    if (opts.action) { var b = document.createElement("button"); b.type = "button"; b.textContent = opts.action; b.style.cssText = "border:0;background:transparent;color:inherit;font:800 14px 'Plus Jakarta Sans',sans-serif;text-decoration:underline;cursor:pointer;min-height:44px"; b.onclick = function () { t.remove(); if (opts.onAction) opts.onAction(); }; t.appendChild(b); }
    document.body.appendChild(t); setTimeout(function () { if (t.parentNode) t.remove(); }, opts.ms || 4000);
  };
  // Loading: a skeleton until the screen has drawn (the design's loading state, not a blank page).
  function skeleton() {
    if (document.getElementById("fv-sk") || !document.body) return;
    var k = document.createElement("div"); k.id = "fv-sk"; k.setAttribute("role", "status"); k.setAttribute("aria-label", "Loading");
    k.style.cssText = "position:fixed;inset:0;z-index:50;background:#FFFFFF;padding:24px 16px;box-sizing:border-box;display:flex;flex-direction:column;gap:14px";
    k.innerHTML = '<div class="fv-sk" style="width:55%;height:28px"></div><div class="fv-sk" style="width:80%;height:16px"></div><div class="fv-sk" style="height:120px"></div><div class="fv-sk" style="height:64px"></div><div class="fv-sk" style="height:64px"></div>';
    document.body.appendChild(k);
  }
  function unskeleton() { var k = document.getElementById("fv-sk"); if (k) k.remove(); }
  if (document.body) skeleton(); else document.addEventListener("DOMContentLoaded", skeleton);
  setTimeout(unskeleton, 6000);
  // A toast saved before leaving a screen shows on the next one.
  window.fvFlash = function (msg) { try { sessionStorage.setItem("fv.flash", msg); } catch (e) {} };
  function showFlash() { try { var m = sessionStorage.getItem("fv.flash"); if (m) { sessionStorage.removeItem("fv.flash"); setTimeout(function () { window.fvToast(m); }, 300); } } catch (e) {} }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showFlash); else showFlash();
  window.addEventListener("offline", function () { window.fvToast("You're offline. Pages you've opened and saved articles still work.", { kind: "info", ms: 6000 }); });
  window.addEventListener("online", function () { window.fvToast("You're back online."); });
  if ("serviceWorker" in navigator && (location.protocol === "https:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) { window.addEventListener("load", function () { navigator.serviceWorker.register("./sw.js").catch(function () {}); }); }
  var queued = false;
  function schedule() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; fit(); }); }
  var mo = new MutationObserver(schedule);
  function start() { mo.observe(document.body, { childList: true, subtree: true }); fit(); }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  window.addEventListener("resize", fit);

  // ---- Motion for XP and streak (approved mock-up, 9 Nov 2026). Calm fallbacks when motion is reduced.
  function calm() { return document.documentElement.classList.contains("fv-reduce") || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function bumpChip(kind, from, to) {
    document.querySelectorAll('[data-fv="' + kind + '"]').forEach(function (n) {
      var chip = n.closest("a,button,span,div") || n; n.textContent = String(from);
      if (calm()) { n.textContent = String(to); return; }
      n.setAttribute("data-fv-anim", "1"); chip.classList.remove("fv-bump", "fv-fire"); void chip.offsetWidth; chip.classList.add(kind === "xp" ? "fv-bump" : "fv-fire");
      var t0 = performance.now();
      (function tick(t) { var q = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - q, 3); n.textContent = String(Math.round(from + (to - from) * e)); if (q < 1) requestAnimationFrame(tick); else n.removeAttribute("data-fv-anim"); })(t0);
    });
  }
  // On arrival: chips count up from what this tab last showed.
  function arrive() {
    var FV = window.FV; if (!FV) return;
    var now = { xp: FV.get().xp, streak: FV.streak() }, seen = null;
    try { seen = JSON.parse(sessionStorage.getItem("fv.seen") || "null"); sessionStorage.setItem("fv.seen", JSON.stringify(now)); } catch (e) {}
    if (!seen) return;
    setTimeout(function () { if (now.xp > seen.xp) bumpChip("xp", seen.xp, now.xp); if (now.streak > seen.streak) bumpChip("streak", seen.streak, now.streak); }, 450);
  }
  var BOLT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="#FFFFFF"/></svg>';
  /** "+3 XP" pill that springs up, throws sparks and flies into the XP chip (or floats up when there is none). */
  window.fvXpBurst = function (n, msg) {
    var FV = window.FV, after = FV ? FV.get().xp : 0, before = after - n;
    try { sessionStorage.setItem("fv.seen", JSON.stringify({ xp: after, streak: FV ? FV.streak() : 0 })); } catch (e) {}
    var b = document.createElement("div"); b.className = "fv-burst"; b.setAttribute("aria-hidden", "true"); b.innerHTML = BOLT + "+" + n + " XP"; document.body.appendChild(b);
    var done = function () { if (b.parentNode) b.remove(); bumpChip("xp", before, after); if (msg && window.fvToast) window.fvToast(msg); };
    if (calm() || !b.animate) { setTimeout(done, 700); return; }
    b.animate([{ transform: "translate(-50%,-50%) scale(.4)", opacity: 0 }, { transform: "translate(-50%,-50%) scale(1.15)", opacity: 1, offset: .55 }, { transform: "translate(-50%,-50%) scale(1)", opacity: 1 }], { duration: 450, easing: "cubic-bezier(.3,1.5,.5,1)", fill: "forwards" });
    var cols = ["#5B21B6", "#A78BFA", "#F97316", "#147D44"];
    for (var i = 0; i < 10; i++) { (function (i) { var sp = document.createElement("span"); sp.className = "fv-spark"; sp.style.background = cols[i % 4]; document.body.appendChild(sp); var a = i / 10 * Math.PI * 2, r = 60 + Math.random() * 30;
      sp.animate([{ transform: "translate(-50%,-50%)", opacity: 1 }, { transform: "translate(calc(-50% + " + Math.cos(a) * r + "px), calc(-50% + " + Math.sin(a) * r + "px)) scale(.3)", opacity: 0 }], { duration: 650, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards" }).onfinish = function () { sp.remove(); }; })(i); }
    setTimeout(function () {
      var chip = document.querySelector('[data-fv="xp"]'), br = b.getBoundingClientRect(), dx = 0, dy = -120;
      if (chip && chip.getBoundingClientRect().width) { var cr = chip.getBoundingClientRect(); dx = cr.left + cr.width / 2 - (br.left + br.width / 2); dy = cr.top + cr.height / 2 - (br.top + br.height / 2); }
      b.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) scale(.35)", opacity: .1 }], { duration: 480, easing: "cubic-bezier(.5,0,.75,0)", fill: "forwards" }).onfinish = done;
    }, 750);
  };
  // Inside a lesson: "3 in a row!" on the progress bar, and Fin's cheer just past halfway.
  var FIN = '<svg viewBox="0 0 120 120" aria-hidden="true" style="overflow:visible"><path d="M22 52q-12-8-10-22" fill="none" stroke="#0F55C9" stroke-width="8" stroke-linecap="round"/><path d="M98 52q12-8 10-22" fill="none" stroke="#0F55C9" stroke-width="8" stroke-linecap="round"/><circle cx="60" cy="62" r="42" fill="#0F55C9"/><circle cx="60" cy="58" r="42" fill="#1A73F5"/><circle cx="60" cy="58" r="33" fill="none" stroke="#9CC3FF" stroke-width="3" stroke-dasharray="4 5"/><path d="M38 55 q8 -10 16 0 M66 55 q8 -10 16 0" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/><circle cx="36" cy="68" r="5" fill="#FF8FA3" opacity=".8"/><circle cx="84" cy="68" r="5" fill="#FF8FA3" opacity=".8"/><path d="M44 68q16 20 32 0z" fill="#0B1F44"/><path d="M54 77 q6 4 12 0" fill="#FF8FA3"/></svg>';
  function combo(pop) {
    var FV = window.FV, bar = document.querySelector('[role="progressbar"][aria-label="Lesson progress"]'); if (!FV || !FV.runCombo || !bar || !FV.inLesson || !FV.inLesson()) return;
    var c = FV.runCombo(), tag = document.getElementById("fv-combo");
    bar.classList.toggle("fv-hot", c >= 3);
    if (c < 3) { if (tag) tag.remove(); return; }
    if (!tag) { tag = document.createElement("span"); tag.id = "fv-combo"; tag.setAttribute("role", "status"); bar.insertAdjacentElement("afterend", tag); }
    tag.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-7 0 2 1 3 2 3 0-3-1-5 1-8z" fill="#F97316"/></svg>' + c + " in a row!";
    if (pop && !calm() && tag.animate) tag.animate([{ transform: "scale(.4)", opacity: 0 }, { transform: "scale(1.2)", opacity: 1, offset: .6 }, { transform: "scale(1)" }], { duration: 450, easing: "ease-out" });
  }
  function hype() {
    var FV = window.FV, bar = document.querySelector('[role="progressbar"][aria-label="Lesson progress"]'); if (!FV || !bar || !FV.inLesson || !FV.inLesson()) return;
    var now = +bar.getAttribute("aria-valuenow"), max = +bar.getAttribute("aria-valuemax");
    if (!max || max < 4 || now !== Math.floor(max / 2) + 1 || !FV.hypeOnce()) return;
    var a = FV.AUTH ? FV.AUTH.get() : {}, h = document.createElement("div"); h.id = "fv-hype";
    h.innerHTML = FIN + '<div class="fv-bubble" role="status">Halfway there' + (a.name ? ", " + a.name : "") + "! You're on a roll.</div>";
    document.body.appendChild(h);
    var out = function () { if (calm() || !h.animate) { h.remove(); return; } h.animate([{ transform: "none", opacity: 1 }, { transform: "translateY(140px)", opacity: 0 }], { duration: 350, easing: "ease-in", fill: "forwards" }).onfinish = function () { h.remove(); }; };
    if (!calm() && h.animate) { h.querySelector("svg").animate([{ transform: "translateY(140px) rotate(-20deg)" }, { transform: "translateY(-10px) rotate(6deg)", offset: .65 }, { transform: "none" }], { duration: 600, easing: "ease-out" });
      h.querySelector(".fv-bubble").animate([{ transform: "scale(.3)", opacity: 0 }, { transform: "scale(1.06)", opacity: 1, offset: .7 }, { transform: "none", opacity: 1 }], { duration: 450, delay: 300, easing: "ease-out", fill: "backwards" }); }
    setTimeout(out, 2600);
  }
  function lessonMotion() {
    var FV = window.FV; if (!FV) return;
    if (FV.answer && !FV.answer.__fv) { var orig = FV.answer; FV.answer = function () { var r = orig.apply(this, arguments); setTimeout(function () { combo(true); }, 50); return r; }; FV.answer.__fv = true; }
    setTimeout(function () { combo(false); hype(); }, 500);
  }
  function motionStart() { arrive(); lessonMotion(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(motionStart, 300); }); else setTimeout(motionStart, 300);
})();
