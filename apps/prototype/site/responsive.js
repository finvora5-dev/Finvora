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
  // Admin on phones (design Part 5): the shorter screen side decides, so landscape phones count as phones.
  function adminPhone() { return Math.min(document.documentElement.clientWidth, window.innerHeight) < 700; }
  var ADMIN_PHONE = { UAOverview: "UAPhoneTasks", UAAISummaries: "UAPhoneTask?type=sums", UAAskKoboReview: "UAPhoneTask?type=ask", UAFeedbackInbox: "UAPhoneTask?type=feedback" };
  function route() {
    var m = location.pathname.match(/([A-Za-z]+)\.dc(\.html)?$/); if (!m) return false;
    var name = m[1], vw = document.documentElement.clientWidth, target = null;
    if (adminPhone() && ADMIN_PHONE[name]) { var t = ADMIN_PHONE[name].split("?"); location.replace(location.pathname.replace(name + ".dc", t[0] + ".dc") + (t[1] ? "?" + t[1] : "")); return true; }
    if (!adminPhone() && /^UAPhoneTasks?$/.test(name)) { var back = name === "UAPhoneTasks" ? "UAOverview" : ({ sums: "UAAISummaries", ask: "UAAskKoboReview", feedback: "UAFeedbackInbox" })[(/type=(\w+)/.exec(location.search) || [])[1]] || "UAOverview"; location.replace(location.pathname.replace(name + ".dc", back + ".dc")); return true; }
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
  // The phone's preferred text size compared with normal: the browser's base font size, or Apple's system text size.
  var LESSON_PATH = /\/U(P|Dy)P?(LessonInfo|LearnMyth|LearnCompare|LessonChoice|LessonOrder|LessonMatch|LessonScenario|LessonCalc|Celebrate|LessonComplete)\.dc/;
  var tsCache = null;
  function textScale() {
    if (tsCache !== null) return tsCache;
    var r = 1;
    try { var f = +localStorage.getItem("fv.textscale"); if (f >= 1 && f <= 3) { tsCache = f; return f; } } catch (e) {}
    try {
      var p = document.createElement("span"); p.style.cssText = "position:absolute;visibility:hidden;font-size:1rem"; document.body.appendChild(p);
      r = Math.max(r, parseFloat(getComputedStyle(p).fontSize) / 16);
      p.style.font = "-apple-system-body"; var ios = parseFloat(getComputedStyle(p).fontSize); if (ios && /iP(hone|ad|od)/.test(navigator.userAgent)) r = Math.max(r, ios / 17);
      p.remove();
    } catch (e) {}
    tsCache = Math.min(2, r); return tsCache;
  }
  function adminPhoneBar(el) {
    if (el.querySelector(".fv-apbar")) return;
    var bar = document.createElement("div"); bar.className = "fv-apbar";
    bar.innerHTML = '<a href="UAPhoneTasks.dc.html" aria-label="Admin tasks" class="fv-apmark">F</a><b>Finvora admin</b><a href="UAPhoneTasks.dc.html">All tasks</a>';
    el.insertBefore(bar, el.firstChild);
    el.querySelectorAll("table").forEach(function (t) { var n = document.createElement("p"); n.className = "fv-apnote"; n.textContent = "Open on a larger screen to see the full table."; t.parentNode.insertBefore(n, t); });
  }
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
    // Admin on phones (design Part 5): wide admin pages reflow at real size instead of shrinking.
    if (designW >= 1200 && /\/UA[A-Za-z]+\.dc/.test(location.pathname) && adminPhone()) { html.classList.add("fv-admin-phone"); el.style.zoom = "1"; el.style.width = "100%"; el.style.minWidth = "0"; adminPhoneBar(el); return; }
    if (designW >= 1200 && vw >= DESK) { el.style.zoom = "1"; el.style.width = "100%"; stretchCharts(el); return; }
    // Fluid boards (the email previews) reflow at real size on every screen.
    if (el.hasAttribute("data-fv-fluid")) { el.style.zoom = "1"; el.style.width = "100%"; el.style.minWidth = "0"; return; }
    if (!phoneBoard) { el.style.zoom = String(Math.min(1, vw / designW)); return; }
    if (designW < 300) { el.style.zoom = "1"; el.style.margin = "0 auto"; return; } // small component boards (Fin) stay actual size
    if (!wide) {
      // Lesson path follows the phone's text size (D15): lay out narrower, so text renders larger.
      var ts = textScale(), lw = LESSON_PATH.test(location.pathname) && ts > 1.05 ? Math.round(designW / ts) : designW;
      var z = vw / lw; el.style.zoom = String(z); el.style.width = lw + "px";
      el.querySelectorAll('nav[aria-label="Main"]').forEach(function (n) { n.style.setProperty("width", lw + "px", "important"); });
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
    document.body.appendChild(t); setTimeout(function () { if (t.parentNode) t.remove(); }, opts.ms || 2500);
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
  // A new version took over: say so once (design Part 1, section 5).
  if ("serviceWorker" in navigator) { var hadSW = !!navigator.serviceWorker.controller; navigator.serviceWorker.addEventListener("controllerchange", function () { if (hadSW && window.fvToast) window.fvToast("Finvora was updated."); hadSW = true; }); }
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
  // ---- Lesson moments (approved mock-up, 9 Nov 2026): a full screen between two steps, then Continue.
  // On a roll (3 in a row), Unstoppable (4 in a row; a lesson has 5 questions, so 5 would land after the last one), Back on track (right after a miss, repeatable),
  // Halfway there, One more to go. At most one per gap, each once per lesson except Back on track.
  var MLINES = {
    roll: [["3 in a row!", "Three right on the first try. Your money brain is on fire."], ["On a roll!", "Three in a row. Fin is impressed."], ["Hot streak!", "Three right answers, back to back. Keep it going."]],
    unstop: [["Unstoppable!", "Four in a row. That is how investors think: one good decision at a time."], ["Four for four!", "Not one slip. Are you sure you're new to this?"], ["Money master mode!", "Four right in a row. The coins are raining."]],
    back: [["Back on track!", "One slip, then straight back. That is how learning sticks."], ["Nice recovery!", "You got the next one right. Mistakes are part of it."], ["That's the spirit!", "Missed one, nailed the next. Keep going."]],
    half: [["Halfway there, {n}!", "Keep this pace and you'll finish in about two minutes."], ["You're halfway!", "The hard part is starting, and you've done that."], ["Half done, {n}!", "Fin is cheering you on. Let's finish it."]],
    almost: [["One more to go!", "Last question. Finish strong."], ["Final question!", "You're nearly there. One more and it's done."], ["Last one, {n}!", "The finish line is right there."]]
  };
  var MFL = '<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-7 0 2 1 3 2 3 0-3-1-5 1-8z" fill="#F97316"/><path class="core" d="M12 12.6c1.7 1.5 3.2 2.6 3.2 4.7a3.2 3.2 0 0 1-6.4 0c0-1.7 1.3-2.8 3.2-4.7z" fill="#FDBA74"/>';
  var MFIN = '<svg class="fvm-fin" viewBox="0 0 120 120" aria-hidden="true" style="overflow:visible"><g class="fvm-body"><path class="armL" d="M20 66q-8 6-6 16" fill="none" stroke="#0F55C9" stroke-width="8" stroke-linecap="round"/><path class="armR" d="M100 66q8 6 6 16" fill="none" stroke="#0F55C9" stroke-width="8" stroke-linecap="round"/><rect x="44" y="96" width="10" height="14" rx="5" fill="#0F55C9"/><rect x="66" y="96" width="10" height="14" rx="5" fill="#0F55C9"/><circle cx="60" cy="62" r="42" fill="#0F55C9"/><circle class="coin" cx="60" cy="58" r="42" fill="#1A73F5"/><circle cx="60" cy="58" r="33" fill="none" stroke="#9CC3FF" stroke-width="3" stroke-dasharray="4 5"/><path d="M38 55 q8 -10 16 0 M66 55 q8 -10 16 0" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/><circle cx="36" cy="68" r="5" fill="#FF8FA3" opacity=".8"/><circle cx="84" cy="68" r="5" fill="#FF8FA3" opacity=".8"/><path d="M44 68q16 20 32 0z" fill="#0B1F44"/><path d="M54 77 q6 4 12 0" fill="#FF8FA3"/></g></svg>';
  var MTINY = '<svg viewBox="0 0 120 120" width="34" height="34" aria-hidden="true"><circle cx="60" cy="62" r="42" fill="#0F55C9"/><circle cx="60" cy="58" r="42" fill="#1A73F5"/><path d="M38 55 q8 -10 16 0 M66 55 q8 -10 16 0" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round"/><path d="M44 68q16 20 32 0z" fill="#0B1F44"/></svg>';
  function lessonBar() { return document.querySelector('[role="progressbar"][aria-label="Lesson progress"]'); }
  function chooseMoment() {
    var FV = window.FV, bar = lessonBar(); if (!FV || !bar || !FV.inLesson || !FV.inLesson() || !FV.momentState) return null;
    var m = FV.momentState(); if (!m || m.review) return null;
    var now = +bar.getAttribute("aria-valuenow"), max = +bar.getAttribute("aria-valuemax"), sh = m.shown;
    if (m.combo === 4 && !sh.unstop) return "unstop";
    if (m.combo === 3 && !sh.roll) return "roll";
    if (m.back && !sh[m.backKey]) return { kind: "back", key: m.backKey };
    if (max >= 4 && now >= Math.floor(max / 2) + 1 && !sh.half) return "half";
    if (max >= 4 && now === max && !sh.almost) return "almost";
    return null;
  }
  var MHOLD = { roll: 2300, unstop: 2900, back: 2300, half: 2700, almost: 2200 };
  function showMoment() {
    var FV = window.FV, bar = lessonBar(); if (bar) bar.classList.toggle("fv-hot", !!(FV && FV.momentState && (FV.momentState() || {}).combo >= 3));
    var c = chooseMoment(); if (!c) return;
    var kind = c.kind || c, key = c.key || c; FV.markMoment(key);
    var who = (FV.AUTH && FV.AUTH.get().name) || "", L = MLINES[kind][Math.floor(Math.random() * MLINES[kind].length)];
    var title = L[0].replace(", {n}", who ? ", " + who : "").replace("{n}", who), sub = L[1];
    var art = kind === "roll" || kind === "unstop" ? '<div class="fvm-flame' + (kind === "unstop" ? " big" : "") + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + MFL + "</svg></div>" + (kind === "roll" ? '<div class="fvm-three"><span><svg viewBox="0 0 24 24">' + MFL + '</svg></span><span><svg viewBox="0 0 24 24">' + MFL + '</svg></span><span><svg viewBox="0 0 24 24">' + MFL + "</svg></span></div>" : "")
      : kind === "back" ? '<div class="fvm-backart"><span class="fvm-ring"></span>' + MFIN + '<span class="fvm-tick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>'
      : kind === "half" ? '<div class="fvm-power"><span class="fvm-aura"></span>' + MFIN + "</div>"
      : '<div class="fvm-almostart"><svg class="fvm-flag" viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="6" width="4" height="54" rx="2" fill="#38323F"/><path class="cloth" d="M16 8h34l-8 10 8 10H16z" fill="#5B21B6"/><path d="M22 12h6v6h-6zM34 12h6v6h-6zM28 18h6v6h-6z" fill="#FFFFFF" opacity=".9"/></svg><div class="fvm-race"><div class="fvm-racefill"></div><span class="fvm-runner">' + MTINY + "</span></div></div>";
    var w = document.createElement("div"); w.id = "fv-moment"; w.className = "fvm-" + kind; w.setAttribute("role", "status"); w.setAttribute("aria-live", "polite");
    var top = bar ? Math.round(bar.getBoundingClientRect().bottom + 10) : 0; w.style.top = Math.max(0, top) + "px";
    w.innerHTML = '<div class="fvm-art">' + art + '</div><h2 id="fvm-h" class="fvm-h">' + title + '</h2><p class="fvm-sub">' + sub + '</p>';
    document.body.appendChild(w); document.documentElement.classList.add("fv-moment-open");
    var gone = false, done = function () { if (gone) return; gone = true; clearTimeout(w._hold); document.documentElement.classList.remove("fv-moment-open"); clearInterval(w._emb);
      if (calm() || !w.animate) { w.remove(); return; } w.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(-60px)" }], { duration: 260, easing: "ease-in" }).onfinish = function () { w.remove(); }; };
    // No button: the moment plays, then slides away by itself. A tap skips it.
    w.addEventListener("click", done); w._hold = setTimeout(done, calm() ? 1600 : MHOLD[kind]);
    if (calm() || !w.animate) { w.classList.add("on"); return; }
    w.animate([{ opacity: 0, transform: "translateX(60px)" }, { opacity: 1, transform: "none" }], { duration: 300, easing: "ease-out" });
    ({ roll: mRoll, unstop: mUnstop, back: mBack, half: mHalf, almost: mAlmost })[kind](w);
  }
  function mFire(w) {
    var fl = w.querySelector(".fvm-flame");
    var a = fl.querySelector("svg").animate([{ transform: "scale(.1)", opacity: .2 }, { transform: "scale(1.45,1.55) rotate(-6deg)", opacity: 1, offset: .5 }, { transform: "scale(.92,.96) rotate(5deg)", offset: .72 }, { transform: "scale(1)" }], { duration: 850, easing: "ease-out" });
    a.onfinish = function () { fl.classList.add("lit");
      w._emb = setInterval(function () { if (!w.isConnected) { clearInterval(w._emb); return; } var e = document.createElement("span"); e.className = "fvm-ember"; fl.appendChild(e); var dx = (Math.random() - .5) * 70;
        e.animate([{ transform: "translate(-50%,-50%)", opacity: 1 }, { transform: "translate(calc(-50% + " + dx + "px), -110px) scale(.2)", opacity: 0 }], { duration: 1200 + Math.random() * 600, easing: "ease-out", fill: "forwards" }).onfinish = function () { e.remove(); }; }, 170); };
  }
  function mRoll(w) { mFire(w); w.querySelectorAll(".fvm-three span").forEach(function (d, k) { d.animate([{ transform: "scale(0)" }, { transform: "scale(1.3)", offset: .6 }, { transform: "scale(1)" }], { duration: 400, delay: 700 + k * 200, easing: "ease-out", fill: "backwards" }); }); }
  function mUnstop(w) { mFire(w);
    for (var i = 0; i < 18; i++) { (function (i) { var c = document.createElement("span"); c.className = "fvm-coin"; c.textContent = "₦"; c.style.left = (8 + Math.random() * 84) + "%"; w.appendChild(c);
      c.animate([{ transform: "translateY(0) rotate(0)" }, { transform: "translateY(" + (window.innerHeight + 60) + "px) rotate(" + (360 + Math.random() * 360) + "deg)" }], { duration: 1400 + Math.random() * 900, delay: 300 + i * 90, easing: "cubic-bezier(.4,0,.8,.6)", fill: "backwards" }).onfinish = function () { c.remove(); }; })(i); } }
  function mBack(w) {
    var f = w.querySelector(".fvm-fin"), r = w.querySelector(".fvm-ring"), t = w.querySelector(".fvm-tick");
    w.querySelector(".armL").setAttribute("d", "M22 52q-12-8-10-22"); w.querySelector(".armR").setAttribute("d", "M98 52q12-8 10-22");
    f.animate([{ transform: "translateY(40px) scale(.7)", opacity: 0 }, { transform: "translateY(-18px) scale(1.06)", opacity: 1, offset: .55 }, { transform: "translateY(0) scale(.97,1.03)", offset: .8 }, { transform: "none" }], { duration: 700, easing: "ease-out" });
    f.animate([{ transform: "none" }, { transform: "translateY(-10px)" }, { transform: "none" }], { duration: 600, delay: 800, iterations: 2, easing: "ease-in-out" });
    r.animate([{ transform: "scale(.5)", opacity: .9 }, { transform: "scale(1.35)", opacity: 0 }], { duration: 800, delay: 400, easing: "ease-out", iterations: 2 });
    t.animate([{ transform: "scale(0) rotate(-90deg)" }, { transform: "scale(1.3) rotate(10deg)", offset: .6 }, { transform: "scale(1)" }], { duration: 500, delay: 550, easing: "ease-out", fill: "backwards" });
  }
  function mHalf(w) {
    var box = w.querySelector(".fvm-power"), body = w.querySelector(".fvm-body"), aura = w.querySelector(".fvm-aura"), aL = w.querySelector(".armL"), aR = w.querySelector(".armR");
    var BOLT = '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="#C4B5FD" stroke="#5B21B6" stroke-width="1.2" stroke-linejoin="round"/></svg>';
    body.animate([{ transform: "scale(1,1)" }, { transform: "scale(1.12,.84)" }], { duration: 600, delay: 200, easing: "ease-in", fill: "forwards" });
    aura.animate([{ opacity: 0, transform: "scale(.3)" }, { opacity: 1, transform: "scale(.9)" }], { duration: 650, delay: 150, easing: "ease-in", fill: "forwards" });
    setTimeout(function () { aL.setAttribute("d", "M22 52q-12-8-10-22"); aR.setAttribute("d", "M98 52q12-8 10-22");
      body.animate([{ transform: "scale(1.12,.84)" }, { transform: "scale(.9,1.15) translateY(-28px)", offset: .35 }, { transform: "scale(1.06,.95)", offset: .75 }, { transform: "none" }], { duration: 650, easing: "ease-out", fill: "forwards" });
      for (var k = 0; k < 3; k++) { var sh = document.createElement("span"); sh.className = "fvm-shock"; box.appendChild(sh); sh.animate([{ transform: "scale(.4)", opacity: .9 }, { transform: "scale(2.1)", opacity: 0 }], { duration: 700, delay: k * 140, easing: "ease-out", fill: "forwards" }).onfinish = (function (x) { return function () { x.remove(); }; })(sh); }
      for (var j = 0; j < 8; j++) { (function (j) { var b = document.createElement("span"); b.className = "fvm-bolt"; b.innerHTML = BOLT; box.appendChild(b); var a = j / 8 * Math.PI * 2 + .3, r = 110 + Math.random() * 30;
        b.animate([{ transform: "translate(-50%,-50%) scale(.4)", opacity: 1 }, { transform: "translate(calc(-50% + " + Math.cos(a) * r + "px), calc(-50% + " + Math.sin(a) * r + "px)) scale(1.2)", opacity: 0 }], { duration: 700, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards" }).onfinish = function () { b.remove(); }; })(j); }
      setTimeout(function () { body.getAnimations().forEach(function (a) { a.cancel(); }); aura.getAnimations().forEach(function (a) { a.cancel(); }); w.classList.add("on"); }, 680);
    }, 850);
  }
  function mAlmost(w) {
    var bar = lessonBar(), max = bar ? +bar.getAttribute("aria-valuemax") : 7, from = Math.round((max - 1) / max * 100), to = 100;
    var fill = w.querySelector(".fvm-racefill"), run = w.querySelector(".fvm-runner"); w.classList.add("on"); fill.style.width = from + "%"; run.style.left = from + "%";
    fill.animate([{ width: from + "%" }, { width: to + "%" }], { duration: 900, delay: 400, easing: "cubic-bezier(.3,1.3,.5,1)", fill: "forwards" });
    run.animate([{ left: from + "%" }, { left: to + "%" }], { duration: 900, delay: 400, easing: "cubic-bezier(.3,1.3,.5,1)", fill: "forwards" });
    w.querySelector(".fvm-flag").animate([{ transform: "scale(.4) rotate(-20deg)", opacity: 0 }, { transform: "scale(1.1) rotate(4deg)", opacity: 1, offset: .7 }, { transform: "none" }], { duration: 600, easing: "ease-out" });
  }
  function lessonMotion() { setTimeout(showMoment, 450); }
  function motionStart() { arrive(); lessonMotion(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(motionStart, 300); }); else setTimeout(motionStart, 300);

  // ---- Review what I missed (design Part 2): a finished lesson with misses opens a small sheet.
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href*="UPLessonInfo.dc.html?l="]') : null; if (!a || a.hasAttribute("data-fv-replay") || /review=1/.test(a.getAttribute("href"))) return;
    var FV = window.FV, m = /[?&]l=(\w+)/.exec(a.getAttribute("href")); if (!FV || !m || !FV.missCount || !FV.missCount(m[1])) return;
    e.preventDefault(); openReviewSheet(m[1], a.getAttribute("href"));
  }, true);
  function openReviewSheet(id, replayHref) {
    var FV = window.FV, L = FV.LESSONS.filter(function (x) { return x.id === id; })[0], i = FV.LESSONS.indexOf(L), best = (FV.get().best || [])[i];
    var NAMES = { choice: "Quick question", order: "Order the steps", match: "Match the pairs", scenario: "Scenario", calc: "Calculation" };
    var list = FV.missList(id), n = list.length, old = document.getElementById("fv-rsheet"); if (old) old.remove();
    var w = document.createElement("div"); w.id = "fv-rsheet";
    w.innerHTML = '<div class="fv-rdim"></div><div class="fv-rbox" role="dialog" aria-modal="true" aria-labelledby="fv-rh"><span class="fv-rgrab" aria-hidden="true"></span>' +
      '<h2 id="fv-rh">' + L.title + '</h2><p class="fv-rmeta">Lesson ' + (i + 1) + (best != null ? ' · best score ' + best + '%' : '') + '</p>' +
      '<div class="fv-rmiss"><b>' + n + '</b><span>' + (n === 1 ? 'question' : 'questions') + ' to review: ' + list.map(function (k) { return NAMES[k] || k; }).join(', ') + '</span></div>' +
      '<a class="fv-rbtn" href="UPLessonInfo.dc.html?l=' + id + '&review=1">Review what I missed<span class="fv-rcount">' + n + '</span></a>' +
      '<a class="fv-rlink" href="' + replayHref + '" data-fv-replay="1">Replay the whole lesson</a></div>';
    document.body.appendChild(w);
    var close = function () { w.remove(); document.removeEventListener("keydown", esc); }, esc = function (ev) { if (ev.key === "Escape") close(); };
    w.querySelector(".fv-rdim").addEventListener("click", close); document.addEventListener("keydown", esc);
    w.querySelector('[data-fv-replay]').addEventListener("click", function (ev) { ev.stopPropagation(); });
    var box = w.querySelector(".fv-rbox"); if (!calm() && box.animate) box.animate([{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 260, easing: "ease-out" });
    w.querySelector(".fv-rbtn").focus();
  }
})();
