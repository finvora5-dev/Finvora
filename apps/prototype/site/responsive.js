// Fits each canvas board to the screen, and picks the desktop or phone board for the window size.
// Phones (< 600px): the 390px board is scaled to the screen width, so folded phones (280px) fit too.
// Tablets and desktop (>= 600px): the board reflows to fill the whole window, with no width cap:
// full-width sections stretch, two-column grids gain columns, and fixed-size drawings stay centred.
(function () {

  // Reviewer tools are hidden from the client (owner, 9 Nov 2026). Open any page with ?reviewer=1 to show them in this browser; ?reviewer=0 hides them again.
  (function () {
    var on = false;
    try { var q = new URLSearchParams(location.search).get("reviewer"); if (q === "1") localStorage.setItem("fv.reviewer", "1"); if (q === "0") localStorage.removeItem("fv.reviewer"); on = localStorage.getItem("fv.reviewer") === "1"; } catch (e) {}
    if (on) return;
    document.documentElement.classList.add("fv-noreview");
    if (/\/URReviewer\.dc/.test(location.pathname)) location.replace("UPSettings.dc.html");
  })();
  // Desktop (>= 1024px) uses the desktop boards; smaller screens use the phone boards.
  var DESK = 1024;
  var PAIRS = { UOHome: "UDHome", UPJourney: "UDJourney", UPLibrary: "UDLibrary", UPMarkets: "UDMarkets", USimHome: "UDSimulator", UPMe: "UDMe" };
  // Sub-pages, focus flows and pop-ups (approved desktop patterns A, B and C).
  var MORE = {"UPTopic":"UDxTopic","UPSearch":"UDxSearch","UPDictionary":"UDxDictionary","UPEmptySearch":"UDxEmptySearch","UPExchange":"UDxExchange","URCompanies":"UDxRCompanies","URCompany":"UDxRCompany","URCompanyLoading":"UDxRCompanyLoading","UPChallenges":"UDxChallenges","UPInflation":"UDxInflation","USimCompany":"UDxSimCompany","USimMarket":"UDxSimMarket","USimHistory":"UDxSimHistory","USimEmpty":"UDxSimEmpty","UPAskKobo":"UDxAskKobo","UPProgress":"UDxProgress","UPAchievements":"UDxAchievements","UPHistory":"UDxHistory","UPSaved":"UDxSaved","UPNotifications":"UDxNotifications","UPSettings":"UDxSettings","URSetEmail":"UDxRSetEmail","URSetGoal":"UDxRSetGoal","URSetPrivacy":"UDxRSetPrivacy","URSetTerms":"UDxRSetTerms","URHelp":"UDxRHelp","URDeleteAccount":"UDxRDeleteAccount","USPlans":"UDxSPlans","USCompare":"UDxSCompare","USYourPlan":"UDxSYourPlan","UMEmptyHistory":"UDxMEmptyHistory","UMEmptyNotif":"UDxMEmptyNotif","UMEmptySaved":"UDxMEmptySaved","UPOnbGoal":"UDyPOnbGoal","UPSignIn":"UDyPSignIn","UPSignInCode":"UDyPSignInCode","URAgeCheck":"UDyRAgeCheck","URNotifAsk":"UDyRNotifAsk","URCodeError":"UDyRCodeError","UPDaily":"UDyPDaily","UPLevelUp":"UDyPLevelUp","UPStreak":"UDyPStreak","URStreakLost":"UDyRStreakLost","UPLessonInfo":"UDyPLessonInfo","UPLessonChoice":"UDyPLessonChoice","UPLessonCalc":"UDyPLessonCalc","UPLessonComplete":"UDyPLessonComplete","UPLearnTerm":"UDyPLearnTerm","UPLearnSteps":"UDyPLearnSteps","UPLearnCompare":"UDyPLearnCompare","UPLearnMarket":"UDyPLearnMarket","UPLearnMyth":"UDyPLearnMyth","UPLessonOrder":"UDyPLessonOrder","UPLessonMatch":"UDyPLessonMatch","UPLessonScenario":"UDyPLessonScenario","UPBossIntro":"UDyPBossIntro","UPBossQuestion":"UDyPBossQuestion","UPBossResult":"UDyPBossResult","USCheckPending":"UDySCheckPending","USCheckSuccess":"UDySCheckSuccess","USCheckFailed":"UDySCheckFailed","USCheckSlow":"UDySCheckSlow","USCheckOffline":"UDySCheckOffline","USCheckAlready":"UDySCheckAlready","USimDone":"UDySimDone","UPError":"UDyPError","UPOffline":"UDyPOffline","URDeleted":"UDyRDeleted","UFRate":"UDzFRate","UFReport":"UDzFReport","UFReview":"UDzFReview","UFSuggest":"UDzFSuggest","UMAskLimit":"UDzMAskLimit","UMCancelPlan":"UDzMCancelPlan","UMLeaveLesson":"UDzMLeaveLesson","UMLocked":"UDzMLocked","UMOrderClosed":"UDzMOrderClosed","UMSignOut":"UDzMSignOut","UMSimReset":"UDzMSimReset","USUpgrade":"UDzSUpgrade","USimSell":"UDzSimSell","UPArticle":"UDArticle","UPOnbWelcome":"UDWelcome","USimTrade":"UDBuy"};
  Object.keys(MORE).forEach(function (k) { PAIRS[k] = MORE[k]; });
  var BACK = {}; Object.keys(PAIRS).forEach(function (k) { BACK[PAIRS[k]] = k; });
  // Admin on phones (design Part 5): the shorter screen side decides, so landscape phones count as phones.
  function adminPhone() { var w = document.documentElement.clientWidth, h = window.innerHeight; return w < 700 || (h < 500 && w < 1024); }  // phones, and phones turned sideways; never a laptop with a short window
  var ADMIN_PHONE = { UAOverview: "UAPhoneTasks", UAAISummaries: "UAPhoneTask?type=sums", UAAskKoboReview: "UAPhoneTask?type=ask", UAFeedbackInbox: "UAPhoneTask?type=feedback" };
  function route() {
    var m = location.pathname.match(/([A-Za-z]+)\.dc(\.html)?$/); if (!m) return false;
    var name = m[1], vw = document.documentElement.clientWidth, target = null;
    // Phones show the same admin pages as laptops (owner, 9 Nov); the old phone task pages send people back to them.
    if (/^UAPhoneTasks?$/.test(name)) { var back = name === "UAPhoneTasks" ? "UAOverview" : ({ sums: "UAAISummaries", ask: "UAAskKoboReview", feedback: "UAFeedbackInbox" })[(/type=(\w+)/.exec(location.search) || [])[1]] || "UAOverview"; location.replace(location.pathname.replace(name + ".dc", back + ".dc")); return true; }
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
  // Admin on phones: the same pages as on a laptop, with a bottom navigation bar instead of the sidebar.
  var ADMIN_TABS = [["UAOverview", "Overview"], ["UAContent", "Content"], ["UAAskKoboReview", "Ask Fin"], ["UAAISummaries", "Summaries"]];
  // Folded phones: the whole board is shrunk, so 44px buttons end up about 32px. Give small controls an invisible tap area back to 44px on screen.
  function hitAreas(el, z) {
    document.documentElement.style.setProperty("--fv-hit", z < 0.95 ? Math.ceil((44 / z - 44) / 2) + "px" : "0px");
    if (z >= 0.95) return;
    setTimeout(function () {
      el.querySelectorAll("button, a[href], [role=button], [role=switch]").forEach(function (b) {
        var r = b.getBoundingClientRect(); if (!r.width || (r.width >= 44 && r.height >= 44) || b.closest("p")) return;
        if (getComputedStyle(b, "::after").content !== "none") return;
        if (getComputedStyle(b).position === "static") b.style.position = "relative";
        b.classList.add("fv-hit");
      });
    }, 300);
  }
  function adminPhoneBar(el) {
    if (document.querySelector(".fv-abnav")) return;
    var links = [].slice.call(el.querySelectorAll("aside a[href^='UA']")).filter(function (a) { return a.querySelector("svg"); });
    var here = (location.pathname.match(/(UA[A-Za-z]+)\.dc/) || [])[1];
    function icon(page) { var a = links.filter(function (x) { return x.getAttribute("href").indexOf(page + ".") === 0; })[0], k = "fv.navIcon." + page; try { if (a) { localStorage.setItem(k, a.querySelector("svg").outerHTML); return a.querySelector("svg").outerHTML; } return localStorage.getItem(k) || ""; } catch (e) { return a ? a.querySelector("svg").outerHTML : ""; } } // boards without a sidebar (confirm screens) reuse icons saved from one that has it
    var inTabs = ADMIN_TABS.some(function (t) { return t[0] === here; });
    var nav = document.createElement("nav"); nav.className = "fv-abnav"; nav.setAttribute("aria-label", "Admin");
    nav.innerHTML = ADMIN_TABS.map(function (t) { return '<a href="' + t[0] + '.dc.html"' + (t[0] === here ? ' aria-current="page"' : "") + ">" + icon(t[0]) + "<span>" + t[1] + "</span></a>"; }).join("") +
      '<button type="button"' + (inTabs ? "" : ' aria-current="page"') + ' aria-expanded="false"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>More</span></button>';
    var sheet = document.createElement("div"); sheet.className = "fv-absheet"; sheet.hidden = true; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-label", "All admin pages");
    var staff = (window.FV && FV.ADMIN && FV.ADMIN.staff && FV.ADMIN.staff()) || { name: "Tobi O." };
    sheet.innerHTML = '<div class="fv-absheet-in"><span class="fv-abhandle"></span><h2>All admin pages</h2><div class="fv-abgrid">' + links.map(function (a) { var c = a.cloneNode(true); c.removeAttribute("class"); if (c.getAttribute("href").indexOf(here + ".") === 0) c.setAttribute("aria-current", "page"); else c.removeAttribute("aria-current"); return c.outerHTML; }).join("") + '</div><div class="fv-abme"><span class="fv-abav">' + (function (n) { var w = String(n || "Tobi").trim().split(/\s+/); return (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2)).toUpperCase(); })(staff.name) + '</span><span><strong>' + String(staff.name || "Tobi").replace(/[<&]/g, "") + '</strong><span>Content editor</span></span><button type="button" class="fv-about">Sign out</button></div></div>';
    var more = nav.querySelector("button");
    more.addEventListener("click", function () { sheet.hidden = !sheet.hidden; more.setAttribute("aria-expanded", String(!sheet.hidden)); });
    sheet.addEventListener("click", function (e) { if (e.target === sheet) { sheet.hidden = true; more.setAttribute("aria-expanded", "false"); } });
    sheet.querySelector(".fv-about").addEventListener("click", function () { if (window.FV && FV.ADMIN && FV.ADMIN.signOut) FV.ADMIN.signOut(); location.href = "UASignIn.dc.html"; });
    document.body.appendChild(sheet); document.body.appendChild(nav);
    // Top bar as in the approved mock-up: Finvora mark, the page's own title, the staff avatar.
    var hd = el.querySelector("header");
    if (hd && !hd.querySelector(".fv-abmark")) {
      var mk = document.createElement("span"); mk.className = "fv-abmark"; mk.textContent = "F"; mk.setAttribute("aria-hidden", "true"); hd.insertBefore(mk, hd.firstChild);
      var av = document.createElement("span"); av.className = "fv-abav"; av.setAttribute("role", "img"); av.setAttribute("aria-label", staff.name || "Staff"); av.textContent = sheet.querySelector(".fv-abav").textContent; hd.appendChild(av);
    }
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
    // Admin on tablets and small laptop windows: real size, with the sidebar folded to an icon strip.
    var adminBoard = designW >= 1200 && /\/UA[A-Za-z]+\.dc/.test(location.pathname);
    html.classList.toggle("fv-admin-rail", adminBoard && !adminPhone());
    if (adminBoard && !adminPhone()) { el.style.zoom = "1"; el.style.width = "100%"; el.style.minWidth = "0"; el.querySelectorAll("aside a.nav").forEach(function (a) { if (a.querySelector(".fv-nl")) return; var txt = a.textContent.trim(); a.setAttribute("aria-label", txt); [].slice.call(a.childNodes).forEach(function (n) { if (n.nodeType === 3 && n.textContent.trim()) { var sp = document.createElement("span"); sp.className = "fv-nl"; sp.textContent = n.textContent; a.replaceChild(sp, n); } }); }); return; }
    if (designW >= 1200 && /\/UA[A-Za-z]+\.dc/.test(location.pathname) && adminPhone()) { html.classList.add("fv-admin-phone"); el.style.zoom = "1"; el.style.width = "100%"; el.style.minWidth = "0"; adminPhoneBar(el); return; }
    if (designW >= 1200 && vw >= DESK) { el.style.zoom = "1"; el.style.width = "100%"; stretchCharts(el); return; }
    // Fluid boards (the email previews) reflow at real size on every screen.
    if (el.hasAttribute("data-fv-fluid")) { el.style.zoom = "1"; el.style.width = "100%"; el.style.minWidth = "0"; return; }
    if (!phoneBoard) { el.style.zoom = String(Math.min(1, vw / designW)); return; }
    if (designW < 300) { el.style.zoom = "1"; el.style.margin = "0 auto"; return; } // small component boards (Fin) stay actual size
    if (!wide) {
      // Lesson path follows the phone's text size (D15): lay out narrower, so text renders larger.
      var ts = textScale(), lw = LESSON_PATH.test(location.pathname) && ts > 1.05 ? Math.round(designW / ts) : designW;
      var z = vw / lw; el.style.zoom = String(z); el.style.width = lw + "px"; hitAreas(el, z);
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

  // ---- Learn path: after finishing a lesson, the path shows you moving forward (owner, 9 Nov 2026; mock-up approved).
  // Plays once per newly finished lesson: the finished node pops, the path to the next lesson fills, Start slides down.
  // Learn path moment (approved 9 Nov 2026): the finished lesson pops with a ring, confetti and +15 XP, a comet runs the real path lighting each dot, the next lesson bounces and the Start bubble springs in.
  function pathMoment() {
    if (!/U[PD]Journey\.dc/.test(location.pathname) || !window.FV) return;
    placeStart();
    var done = FV.get().done || 0, seen = -1;
    try { seen = +(localStorage.getItem("fv.pathSeen") || -1); localStorage.setItem("fv.pathSeen", String(done)); } catch (e) { return; }
    if (seen < 0 || done <= seen || done < 1) return;

  var nodes = [].slice.call(document.querySelectorAll('a[href*="LessonInfo"][aria-label]')).filter(function (a) { return /lesson \d+ of/.test(a.getAttribute("aria-label")); });
  var prev = nodes.filter(function (a) { return /completed/.test(a.getAttribute("aria-label")); }).pop();
  var next = nodes.filter(function (a) { return /current lesson/.test(a.getAttribute("aria-label")); })[0];
  if (!prev || !next) return;
  var box = function (a) { var el = a.querySelector("svg") || a, r = el.getBoundingClientRect(); return { x: r.left + r.width / 2 + scrollX, y: r.top + r.height / 2 + scrollY, w: r.width, el: el }; };
  var A = box(prev), B = box(next);
  var start = [].slice.call(document.querySelectorAll("a, span, div, p")).filter(function (e) { return [].some.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim() === "Start"; }) && e.getBoundingClientRect().width > 0; })[0];
  var sb = start || null;

  var hide = sb ? sb.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 4000 }) : null;
  var layer = document.createElement("div"); layer.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;z-index:5;pointer-events:none"; document.body.appendChild(layer);
  var put = function (css) { var d = document.createElement("div"); d.style.cssText = "position:absolute;" + css; layer.appendChild(d); return d; };
  var buzz = function () { try { navigator.vibrate && navigator.vibrate(12); } catch (e) {} };

  // Route points along the real dotted path, in page coordinates.
  var routes = [].slice.call(document.querySelectorAll("svg path[stroke-dasharray]")).filter(function (p) { return p.closest("svg").getBoundingClientRect().height > 400; });
  var pts = [];
  routes.forEach(function (p) { var m = p.getScreenCTM(), L = p.getTotalLength(); for (var l = 0; l <= L; l += 2) { var q = p.getPointAtLength(l); pts.push({ x: m.a * q.x + m.e + scrollX, y: m.d * q.y + m.f + scrollY }); } });
  var near = function (P) { var bi = 0, bd = 1e9; pts.forEach(function (q, i) { var d = (q.x - P.x) * (q.x - P.x) + (q.y - P.y) * (q.y - P.y); if (d < bd) { bd = d; bi = i; } }); return bi; };
  var iA = near(A), iB = near(B), seg = pts.slice(Math.min(iA, iB), Math.max(iA, iB) + 1);
  // keep only the stretch outside the two node circles
  seg = seg.filter(function (q) { return Math.hypot(q.x - A.x, q.y - A.y) > A.w / 2 + 6 && Math.hypot(q.x - B.x, q.y - B.y) > B.w / 2 + 6; });

  // Camera: bring the finished lesson into view.
  if (calm() || !document.body.animate) { if (hide) hide.cancel(); window.scrollTo({ top: Math.max(0, B.y - innerHeight * 0.45) }); return; }
  window.scrollTo({ top: Math.max(0, A.y - innerHeight * 0.32), behavior: "smooth" });

  setTimeout(function () {
    // 1. Finished lesson: press, pop, green ring, confetti, +15 XP.
    prev.animate([{ transform: "scale(1)" }, { transform: "scale(.88)", offset: .25 }, { transform: "scale(1.1)", offset: .6 }, { transform: "scale(1)" }], { duration: 520, easing: "ease-out" });
    setTimeout(buzz, 150);
    var ring = put("left:" + A.x + "px;top:" + A.y + "px;width:" + A.w + "px;height:" + A.w + "px;margin:-" + A.w / 2 + "px 0 0 -" + A.w / 2 + "px;border-radius:50%;border:4px solid #16A34A;box-sizing:border-box");
    ring.animate([{ transform: "scale(.9)", opacity: .9 }, { transform: "scale(1.9)", opacity: 0 }], { duration: 650, delay: 140, easing: "cubic-bezier(.2,.7,.3,1)", fill: "both" });
    var COL = ["#7C3AED", "#176EEB", "#16A34A", "#FF8FA3", "#0FA394", "#5B21B6"];
    for (var k = 0; k < 18; k++) {
      var c = put("left:" + A.x + "px;top:" + A.y + "px;width:" + (6 + (k % 3) * 2) + "px;height:" + (k % 2 ? 6 : 12) + "px;border-radius:" + (k % 4 === 0 ? "50%" : "2px") + ";background:" + COL[k % COL.length]);
      var ang = -Math.PI / 2 + (Math.random() - .5) * 2.6, v = 90 + Math.random() * 70, dx = Math.cos(ang) * v, dy = Math.sin(ang) * v, rot = (Math.random() - .5) * 720;
      c.animate([{ transform: "translate(-50%,-50%) rotate(0)", opacity: 1 }, { transform: "translate(calc(-50% + " + dx * .7 + "px), calc(-50% + " + dy * .8 + "px)) rotate(" + rot / 2 + "deg)", opacity: 1, offset: .45 }, { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + (dy + 110) + "px)) rotate(" + rot + "deg)", opacity: 0 }], { duration: 1100, delay: 160, easing: "cubic-bezier(.15,.6,.4,1)", fill: "both" });
    }
    var xp = put("left:" + (A.x + A.w / 2 + 4) + "px;top:" + (A.y - 18) + "px;padding:4px 10px;border-radius:999px;background:#F1EBFB;color:#5B21B6;font:800 14px 'Plus Jakarta Sans',sans-serif;white-space:nowrap;box-shadow:0 2px 0 #DDD3F5");
    xp.textContent = "+15 XP";
    xp.animate([{ transform: "translateY(10px) scale(.6)", opacity: 0 }, { transform: "translateY(0) scale(1.08)", opacity: 1, offset: .2 }, { transform: "translateY(-6px) scale(1)", opacity: 1, offset: .75 }, { transform: "translateY(-26px) scale(.95)", opacity: 0 }], { duration: 1500, delay: 300, easing: "ease-out", fill: "both" });

    // 2. Comet along the real path, lighting each dot; the screen follows it.
    var dots = [], acc = 0;
    for (var i = 1; i < seg.length; i++) { acc += Math.hypot(seg[i].x - seg[i - 1].x, seg[i].y - seg[i - 1].y); if (acc >= 16) { acc = 0; dots.push({ i: i, el: put("left:" + seg[i].x + "px;top:" + seg[i].y + "px;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:#5B21B6;opacity:0"), lit: false }); } }
    var comet = put("width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;background:radial-gradient(circle at 40% 40%,#FFFFFF 0,#C4B5FD 30%,#7C3AED 70%);box-shadow:0 0 20px 8px rgba(124,58,237,.5);opacity:0");
    var segLen = 0; for (var j = 1; j < seg.length; j++) segLen += Math.hypot(seg[j].x - seg[j - 1].x, seg[j].y - seg[j - 1].y);
    var T0 = performance.now() + 650, DUR = Math.max(650, Math.min(1100, segLen * 6)), lastTrail = 0;
    if (sb) sb.animate([{ transform: "translateX(-24px) scale(.6)", opacity: 0 }, { transform: "translateX(4px) scale(1.08)", opacity: 1, offset: .55 }, { transform: "translateX(-2px) rotate(-3deg)", offset: .75 }, { transform: "translateX(0) rotate(2deg)", offset: .88 }, { transform: "none", opacity: 1 }], { duration: 750, delay: 650 + DUR + 280, easing: "ease-out", fill: "backwards" });
    if (sb && hide) hide.cancel();
    (function step(now) {
      var t = (now - T0) / DUR;
      if (t < 0) { requestAnimationFrame(step); return; }
      var e = t >= 1 ? 1 : (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2), idx = Math.min(seg.length - 1, Math.floor(e * (seg.length - 1))), P = seg[idx];
      comet.style.opacity = t >= 1 ? 0 : 1; comet.style.left = P.x + "px"; comet.style.top = P.y + "px";
      window.scrollTo(0, Math.max(0, P.y - innerHeight * 0.45));
      if (now - lastTrail > 28 && t < 1) { lastTrail = now; var tr = put("left:" + P.x + "px;top:" + P.y + "px;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#A78BFA"); tr.animate([{ transform: "scale(1)", opacity: .7 }, { transform: "scale(.2)", opacity: 0 }], { duration: 380, fill: "forwards" }).onfinish = function () { this.effect.target.remove(); }; }
      dots.forEach(function (d) { if (!d.lit && d.i <= idx) { d.lit = true; d.el.animate([{ transform: "scale(0)", opacity: 1 }, { transform: "scale(1.8)", opacity: 1, offset: .4 }, { transform: "scale(1)", opacity: 1 }], { duration: 320, easing: "ease-out", fill: "forwards" }); } });
      if (t < 1) requestAnimationFrame(step); else land();
    })(T0);

    // 3. Landing on the next lesson: bounce, ripple, shine, Start drops in.
    function land() {
      buzz();
      next.animate([{ transform: "scale(1)" }, { transform: "scale(.86)", offset: .2 }, { transform: "scale(1.16)", offset: .55 }, { transform: "scale(.97)", offset: .8 }, { transform: "scale(1)" }], { duration: 650, easing: "ease-out" });
      [0, 160].forEach(function (dl) {
        var r2 = put("left:" + B.x + "px;top:" + B.y + "px;width:" + B.w + "px;height:" + B.w + "px;margin:-" + B.w / 2 + "px 0 0 -" + B.w / 2 + "px;border-radius:50%;border:3px solid #7C3AED;box-sizing:border-box");
        r2.animate([{ transform: "scale(1)", opacity: .8 }, { transform: "scale(2.1)", opacity: 0 }], { duration: 800, delay: dl, easing: "cubic-bezier(.2,.7,.3,1)", fill: "both" });
      });
      var sh = put("left:" + B.x + "px;top:" + B.y + "px;width:" + B.w + "px;height:" + B.w + "px;margin:-" + B.w / 2 + "px 0 0 -" + B.w / 2 + "px;border-radius:50%;overflow:hidden");
      var band = document.createElement("div"); band.style.cssText = "position:absolute;top:-20%;left:-60%;width:40%;height:140%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);transform:rotate(20deg)"; sh.appendChild(band);
      band.animate([{ left: "-60%" }, { left: "130%" }], { duration: 650, delay: 250, easing: "ease-in-out", fill: "both" });
      if (false) sb.animate([{ transform: "translateX(-24px) scale(.6)", opacity: 0 }, { transform: "translateX(4px) scale(1.08)", opacity: 1, offset: .55 }, { transform: "translateX(-2px) rotate(-3deg)", offset: .75 }, { transform: "translateX(0) rotate(2deg)", offset: .88 }, { transform: "none", opacity: 1 }], { duration: 750, delay: 280, easing: "ease-out", fill: "both" }).onfinish = function () { sb.style.opacity = ""; };
      setTimeout(function () { layer.remove(); }, 1600);
    }
  }, 700);
  }
  // The Start bubble sits beside the current lesson, on a side with room and no picture, so it never covers the label above.
  function placeStart() {
    var next = [].slice.call(document.querySelectorAll('a[href*="LessonInfo"][aria-label]')).filter(function (a) { return /current lesson/.test(a.getAttribute("aria-label")); })[0];
    if (!next) return;
    var sb = [].slice.call(next.querySelectorAll("span, div")).filter(function (e) { return [].some.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim() === "Start"; }); })[0];
    if (!sb || sb.getAttribute("data-fv-placed")) return; sb.setAttribute("data-fv-placed", "1");
  // Start bubble beside the lesson (on the roomier side) so it never covers the label above.
  {
    sb.style.width = "auto"; sb.style.padding = "0 14px";
    var nr = next.getBoundingClientRect(), need = sb.offsetWidth + 16;
    // prefer a side with room and no picture in the way
    var clear = function (x) { var y = nr.top + nr.height / 2; return document.elementsFromPoint(x, y).every(function (e) { return !e.closest("svg g, img") || e.closest("a") === next; }); };
    var right = innerWidth - nr.right >= need && clear(Math.min(innerWidth - 2, nr.right + need / 2));
    if (!right && !(nr.left >= need && clear(nr.left - need / 2))) right = innerWidth - nr.right > nr.left;
    sb.style.top = "50%"; sb.style.marginTop = (-sb.offsetHeight / 2) + "px"; sb.style.left = right ? "calc(100% + 10px)" : "auto"; sb.style.right = right ? "auto" : "calc(100% + 10px)"; sb.style.marginLeft = "0";
    var ar = sb.querySelector("span"); if (ar) { ar.style.bottom = "auto"; ar.style.top = "50%"; ar.style.marginTop = "-7px"; ar.style.marginLeft = "0"; ar.style.left = right ? "-6px" : "auto"; ar.style.right = right ? "auto" : "-6px"; }
  }
  }
  if (document.readyState === "complete") setTimeout(pathMoment, 600); else window.addEventListener("load", function () { setTimeout(pathMoment, 600); });

  // ---- Phone top bars (mobile pattern): hide while scrolling down, come back as soon as you scroll up.
  function revealHeader() {
    var el = root(); if (!el || +el.dataset.fvW >= 600 || document.documentElement.clientWidth >= 600) return;
    if (el.querySelector(':scope > [role="dialog"], :scope > [role="alertdialog"]')) return;
    var h = el.querySelector(":scope > header") || el.querySelector(":scope > div > header");
    if (!h || h.dataset.fvReveal || h.querySelector('[role="progressbar"]') || getComputedStyle(h).position !== "static") return;
    h.dataset.fvReveal = "1"; h.classList.add("fv-reveal");
    var last = window.scrollY, hidden = false, ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY, dy = y - last, hh = h.getBoundingClientRect().height;
        if (y <= hh) { if (hidden) { h.classList.remove("fv-reveal-hide"); hidden = false; } }
        else if (dy > 6 && !hidden) { h.classList.add("fv-reveal-hide"); hidden = true; }
        else if (dy < -6 && hidden) { h.classList.remove("fv-reveal-hide"); hidden = false; }
        if (Math.abs(dy) > 6) last = y; ticking = false;
      });
    }, { passive: true });
    h.addEventListener("focusin", function () { h.classList.remove("fv-reveal-hide"); hidden = false; });
  }
  if (document.readyState === "complete") setTimeout(revealHeader, 400); else window.addEventListener("load", function () { setTimeout(revealHeader, 400); });
  // Admin pagination (approved 9 Nov 2026): 20 rows a page. Laptop and tablet: numbered pages, page number in the link (?page=). Phone admin: "Show 20 more".
  var PAGED = { UAUsers: "learners", UAAudit: "entries", UAContent: "items", UAFeedbackInbox: "messages", UAAskKoboReview: "answers", UAAISummaries: "summaries" };
  function pager() {
    var m = location.pathname.match(/\/(UA[A-Za-z]+)\.dc/), noun = m && PAGED[m[1]]; if (!noun) return;
    var SIZE = 20, shown = SIZE, sig = "", busy = false;
    var page = Math.max(1, parseInt(new URLSearchParams(location.search).get("page"), 10) || 1);
    function rowsOf() {
      var t = document.querySelector("section.card table");
      if (t) return { box: t, rows: [].slice.call(t.querySelectorAll("tr")).filter(function (r) { return !r.querySelector("th"); }) };
      var q = [].filter.call(document.querySelectorAll("section.card"), function (c) { return c.querySelector(":scope > button.press"); })[0];
      return q ? { box: q, rows: [].slice.call(q.querySelectorAll(":scope > button.press")) } : null;
    }
    function setPage(n) { page = n; var u = new URL(location.href); if (n > 1) u.searchParams.set("page", n); else u.searchParams.delete("page"); history.replaceState(history.state, "", u); draw(); }
    function draw() {
      var g = rowsOf(); if (!g) return; busy = true;
      var N = g.rows.length, phone = document.documentElement.classList.contains("fv-admin-phone"), pages = Math.max(1, Math.ceil(N / SIZE));
      var now = N + "|" + (g.rows[0] ? g.rows[0].textContent.slice(0, 40) : "");
      if (sig && now !== sig) { page = 1; shown = SIZE; } sig = now; // search or filter changed: back to the start
      if (page > pages) page = pages;
      var from = phone ? 0 : (page - 1) * SIZE, to = phone ? Math.min(N, shown) : Math.min(N, page * SIZE);
      g.rows.forEach(function (r, i) { r.hidden = i < from || i >= to; });
      var card = g.box.closest("section.card") || g.box, f = card.querySelector(":scope > .fv-pager");
      if (!f) { f = document.createElement("div"); f.className = "fv-pager"; card.appendChild(f); }
      if (!N) { f.innerHTML = ""; busy = false; return; }
      var fmt = function (x) { return x.toLocaleString("en-NG"); };
      if (phone) {
        f.innerHTML = '<p class="fv-pg-count" aria-live="polite">Showing ' + fmt(to) + " of " + fmt(N) + " " + noun + "</p>" + (to < N ? '<button type="button" class="fv-pg-more">Show ' + Math.min(SIZE, N - to) + " more</button>" : "");
      } else {
        var b = function (label, n, opts) { opts = opts || {}; return '<button type="button" data-p="' + n + '"' + (opts.cur ? ' aria-current="page"' : "") + (opts.dis ? " disabled" : "") + (opts.aria ? ' aria-label="' + opts.aria + '"' : "") + ">" + label + "</button>"; };
        var nums = [], add = function (n) { if (nums.indexOf(n) < 0 && n >= 1 && n <= pages) nums.push(n); };
        add(1); add(page - 1); add(page); add(page + 1); add(pages); nums.sort(function (a, c) { return a - c; });
        var html = "", last = 0; nums.forEach(function (n) { if (n - last > 1) html += '<span class="fv-pg-gap" aria-hidden="true">…</span>'; html += b(n, n, { cur: n === page, aria: "Page " + n }); last = n; });
        f.innerHTML = '<span class="fv-pg-count">Showing <b>' + fmt(from + 1) + "–" + fmt(to) + "</b> of " + fmt(N) + " " + noun + "</span>" +
          (pages > 1 ? '<nav aria-label="Pages">' + b("‹ Previous", page - 1, { dis: page === 1 }) + html + b("Next ›", page + 1, { dis: page === pages }) + "</nav>" : "");
      }
      setTimeout(function () { busy = false; }, 0);
    }
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest(".fv-pager button"); if (!t) return;
      if (t.classList.contains("fv-pg-more")) { var g = rowsOf(), first = g && g.rows[shown]; shown += SIZE; draw(); if (first) { first.setAttribute("tabindex", "-1"); first.focus({ preventScroll: true }); } return; }
      setPage(+t.getAttribute("data-p")); var c = document.querySelector(".fv-pager"); if (c) (c.closest("section.card") || c).scrollIntoView({ block: "start", behavior: "smooth" });
    });
    var tm; new MutationObserver(function () { if (busy) return; clearTimeout(tm); tm = setTimeout(draw, 50); }).observe(document.body, { childList: true, subtree: true });
    draw();
  }
  if (document.readyState === "complete") setTimeout(pager, 300); else window.addEventListener("load", function () { setTimeout(pager, 300); });
})();
