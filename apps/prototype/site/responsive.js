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
    SettingsNavy: "SettingsLaptopNavy", LessonInfoNavy: "LessonInfoLaptopNavy", LearnCompareNavy: "LearnCompareLaptopNavy", LearnTermNavy: "LearnTermLaptopNavy", LearnStepsNavy: "LearnStepsLaptopNavy", LearnMarketNavy: "LearnMarketLaptopNavy", LearnMythNavy: "LearnMythLaptopNavy", LessonOrderNavy: "LessonOrderLaptopNavy", LessonMatchNavy: "LessonMatchLaptopNavy", LessonScenarioNavy: "LessonScenarioLaptopNavy", LessonCalcNavy: "LessonCalcLaptopNavy", TopicNavy: "TopicLaptopNavy", DictionaryNavy: "DictionaryLaptopNavy", ProgressNavy: "ProgressLaptopNavy", DailyNavy: "DailyLaptopNavy", CourseReviewNavy: "CourseReviewLaptopNavy", CourseReviewQNavy: "CourseReviewQLaptopNavy", CourseReviewDoneNavy: "CourseReviewDoneLaptopNavy", CompaniesNavy: "CompaniesLaptopNavy", ExchangeNavy: "ExchangeLaptopNavy", InflationToolNavy: "InflationToolLaptopNavy", PracticeMarketNavy: "PracticeMarketLaptopNavy", PracticeCompanyNavy: "PracticeCompanyLaptopNavy", TradeNavy: "TradeLaptopNavy", PracticeWatchlistNavy: "PracticeWatchlistLaptopNavy", PracticeHistoryNavy: "PracticeHistoryLaptopNavy", PracticeDividendsNavy: "PracticeDividendsLaptopNavy", PracticeMeasuresNavy: "PracticeMeasuresLaptopNavy", PracticeTimeNavy: "PracticeTimeLaptopNavy", PracticeCrisisNavy: "PracticeCrisisLaptopNavy", PracticeDoneNavy: "PracticeDoneLaptopNavy", PracticeEmptyNavy: "PracticeEmptyLaptopNavy", SavedNavy: "SavedLaptopNavy", HistoryNavy: "HistoryLaptopNavy", CompareNavy: "CompareLaptopNavy", SignInCodeNavy: "SignInCodeLaptopNavy", CodeErrorNavy: "CodeErrorLaptopNavy", AskLimitNavy: "AskLimitLaptopNavy", DeleteAccountNavy: "DeleteAccountLaptopNavy", DeletedNavy: "DeletedLaptopNavy", ReportNavy: "ReportLaptopNavy", SuggestNavy: "SuggestLaptopNavy", LoadingNavy: "LoadingLaptopNavy", CompanyLoadingNavy: "CompanyLoadingLaptopNavy", AgeCheckNavy: "AgeCheckLaptopNavy", IntroNavy: "IntroLaptopNavy", NotifAskNavy: "NotifAskLaptopNavy", LeaveLessonNavy: "LeaveLessonLaptopNavy", MarketClosedNavy: "MarketClosedLaptopNavy", SimResetNavy: "SimResetLaptopNavy", CancelPlanNavy: "CancelPlanLaptopNavy", LockedNavy: "LockedLaptopNavy", RateNavy: "RateLaptopNavy", ReviewNavy: "ReviewLaptopNavy", EmptyHistoryNavy: "EmptyHistoryLaptopNavy", EmptySavedNavy: "EmptySavedLaptopNavy", EmptyNotifNavy: "EmptyNotifLaptopNavy", PaySlowNavy: "PaySlowLaptopNavy", PayOfflineNavy: "PayOfflineLaptopNavy", PayAlreadyNavy: "PayAlreadyLaptopNavy", HelpNavy: "HelpLaptopNavy", YourPlanNavy: "YourPlanLaptopNavy", PlanCompareNavy: "PlanCompareLaptopNavy", ReceiptNavy: "ReceiptLaptopNavy", SetEmailNavy: "SetEmailLaptopNavy", SetGoalNavy: "SetGoalLaptopNavy", SetPrivacyNavy: "SetPrivacyLaptopNavy", SetTermsNavy: "SetTermsLaptopNavy", LessonPEDoneNavy: "LessonPEDoneLaptopNavy", SignInNavy: "SignInLaptopNavy", SignOutNavy: "SignOutLaptopNavy", UpgradeNavy: "UpgradeLaptopNavy", MainNavy: "WelcomeLaptopNavy" };
  var BACK = {}; Object.keys(PAIRS).forEach(function (k) { BACK[PAIRS[k]] = k; });
  function route() {
    var m = location.pathname.match(/([A-Za-z]+)\.dc(\.html)?$/); if (!m) return false;
    var name = m[1], vw = document.documentElement.clientWidth, target = null;
    if (vw >= DESK && PAIRS[name]) target = PAIRS[name];
    if (vw < DESK && BACK[name]) target = BACK[name];
    // Admin on a phone (shorter side under 700px): the phone task list, as drawn ("Bigger edits on a laptop").
    if (/^Admin(?!Phone|SignIn)\w*Navy$/.test(name) && Math.min(innerWidth, innerHeight) < 700) target = "AdminPhoneTasksNavy";
    if (!target) return false;
    location.replace(location.pathname.replace(name + ".dc", target + ".dc") + location.search + location.hash);
    return true;
  }
  if (route()) return;
  // Lesson sounds (approved 9 Nov 2026, brought over from the earlier prototype): right or wrong when an answer is
  // checked and a sound per pair in matching (no lesson-complete sound: owner, 15 Nov 2026). Off when Settings > Sound effects is off.
  var SFX = {};
  function sfxOn() { try { var p = JSON.parse(localStorage.getItem("fv.prefs.v1") || "null"); return !p || p.sound !== false; } catch (e) { return true; } }
  function sfxGet(n) { if (!SFX[n]) { try { SFX[n] = new Audio("sfx/" + n + ".mp3"); SFX[n].preload = "auto"; } catch (e) { return null; } } return SFX[n]; }
  window.fvSound = function (n, delay) {
    if (!sfxOn()) return; var a = sfxGet(n); if (!a) return;
    var go = function () { try { a.currentTime = 0; var r = a.play(); if (r && r.catch) r.catch(function () {}); } catch (e) {} };
    if (delay) setTimeout(go, delay * 1000); else go();
  };
  (function () {
    var pth = location.pathname;
    if (/(Lesson(Calc|Order|Scenario|Match)?|LearnMyth|LearnCompare)Navy\.dc/.test(pth) && sfxOn()) ["correct", "wrong", "pairok", "pairno"].forEach(sfxGet);
    // Right or wrong: the moment the answer is checked (FV.answer runs in the Check handler). Matching plays its own per pair.
    var hook = function () { var F = window.FV; if (!F || !F.answer || F.answer.fvSound) return; var o = F.answer; F.answer = function (q, correct) { if (q !== "match") window.fvSound(correct ? "correct" : "wrong"); return o.apply(this, arguments); }; F.answer.fvSound = 1; };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook); else hook();
  })();
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(function () {});
  // Lesson steps get the 'step' transition type (slide), every other screen change cross-fades (skill: animate).
  var STEP = /(Lesson(Info|Calc|Order|Scenario|Match)?|Learn(Myth|Compare|Term|Steps|Market)|LessonDone|CourseReviewQ)(Laptop)?Navy\.dc/;
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
  // Pinned bottom nav (mobile-native §7, content insets): every tab screen reserves room under its last line for
  // the nav, its gap above the home indicator and 16px air, so the last content can be read and tapped.
  function fvNavPad(el, z) {
    var nav = el.querySelector('nav[aria-label="Main"]'); if (!nav || el.querySelector("#chat")) return; // chat already sits its input above the nav
    var r = nav.getBoundingClientRect(); if (!r.height) return;
    el.style.setProperty("padding-bottom", Math.ceil((window.innerHeight - r.top + 16) / (z || 1)) + "px", "important");
    el.style.setProperty("box-sizing", "border-box", "important");
  }
  function fit() {
    var el = root(); if (!el) return;
    setTimeout(function () { var e2 = root(); if (e2) fvNavPad(e2, parseFloat(e2.style.zoom) || 1); }, 0);
    if (!el.dataset.fvW) el.dataset.fvW = String(parseFloat(el.style.width) || 390);
    var designW = +el.dataset.fvW, vw = document.documentElement.clientWidth, html = document.documentElement;
    var phoneBoard = designW < 600, wide = vw >= 600;
    html.classList.toggle("fv-wide", phoneBoard && wide);
    html.style.overflowX = "hidden";
    if (!phoneBoard) {
      if (vw >= DESK || vw >= 700) { el.style.zoom = "1"; el.style.width = "100%"; el.style.minWidth = "0";
        // Fill the window height so the sidebar reaches the bottom on tall tablets; the main column scrolls.
        el.style.setProperty("height", window.innerHeight + "px", "important"); return; }
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
    var a = [].slice.call(nav.querySelectorAll("a")).filter(function (x) { var r = x.getBoundingClientRect(); return y >= r.top - 1 && y <= r.bottom + 1; })[0]; // by row, so narrow letters (I) are easy to hit
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

// Chip filters on company lists (Markets, Practice market, laptop Markets): All / a sector, or Most traded / Risers / Fallers.
// Rows are the drawn company links (…?t=TICKER); sectors and today's change come from the practice data (FV.SIM).
(function () {
  var SECT = { "Banking": ["Banking"], "Telecoms": ["Telecoms"], "Consumer goods": ["Consumer goods", "Food"], "Consumer": ["Consumer goods", "Food"], "Industrial": ["Industrial goods"], "Oil and gas": ["Oil and gas", "Energy"] };
  function rowsNear(chip) {
    for (var box = chip.parentElement; box && box.id !== "dc-root"; box = box.parentElement) {
      // Company rows: links with a ticker, plus drawn company rows the app has no data for yet (no ticker).
      var rows = [].slice.call(box.querySelectorAll('a[href*="t="], a[href="CompanyNavy.dc.html"], a[href="CompanyLaptopNavy.dc.html"]')).filter(function (a) { return !a.contains(chip) && (/[?&]t=[A-Z]+/.test(a.getAttribute("href")) || /[A-Z]{2,}/.test(a.textContent)) && !/Top (riser|faller)/.test(a.textContent); });
      if (rows.length > 2) return rows;
    }
    return [];
  }
  function tk(a) { var m = /[?&]t=([A-Z]+)/.exec(a.getAttribute("href")); return m ? m[1] : ""; }
  document.addEventListener("click", function (e) {
    var chip = e.target.closest && e.target.closest('#dc-root [style*="overflow-x: auto"] > button, #dc-root [style*="overflow-x: auto"] > a[href="#"], #dc-root div > button[style*="border-radius: 999px"]');
    if (!chip) return; var label = chip.textContent.trim(), S = window.FV && window.FV.SIM;
    var known = label === "All" || label === "Most traded" || label === "Risers" || label === "Fallers" || SECT[label]; if (!known) return;
    e.preventDefault();
    // Selected look: swap the drawn styles of the selected chip and the tapped one.
    var row = chip.parentElement, cur = [].slice.call(row.children).filter(function (c) { return /background: (rgb\(11, 25, 44\)|#0B192C)/.test(c.getAttribute("style") || ""); })[0];
    if (cur && cur !== chip) { var a = cur.getAttribute("style"), b = chip.getAttribute("style"); cur.setAttribute("style", b); chip.setAttribute("style", a); cur.setAttribute("aria-pressed", "false"); }
    chip.setAttribute("aria-pressed", "true");
    var rows = rowsNear(chip); if (!rows.length) return; var parent = rows[0].parentElement;
    if (!parent.__fvOrder) parent.__fvOrder = rows.slice();
    var list = parent.__fvOrder.slice();
    if (S && (label === "Risers" || label === "Fallers")) list.sort(function (x, y) { var d = S.change(tk(y)) - S.change(tk(x)); return label === "Risers" ? d : -d; });
    list.forEach(function (r) {
      var t0 = tk(r), co = t0 && S && S.company ? S.company(t0) : null, show = true;
      if (co && co.t !== t0) co = null; // no data for this company yet
      if (SECT[label]) show = !!co && SECT[label].indexOf(co.sector) >= 0;
      if (label === "Risers") show = !!co && S.change(t0) >= 0;
      if (label === "Fallers") show = !!co && S.change(t0) < 0;
      r.classList.toggle("fv-hide", !show); if (r.parentElement === parent) parent.appendChild(r);
    });
  });
})();

// Laptop sidebar: the drawn collapse button shrinks the sidebar to its icons and back. Remembered on this device.
(function () {
  function set(aside, on) { aside.classList.toggle("fv-collapsed", on); var b = aside.querySelector('button[aria-label="Collapse sidebar"], button[aria-label="Expand sidebar"]'); if (b) b.setAttribute("aria-label", on ? "Expand sidebar" : "Collapse sidebar"); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest('aside button[aria-label="Collapse sidebar"], aside button[aria-label="Expand sidebar"]'); if (!b) return;
    var aside = b.closest("aside"), on = !aside.classList.contains("fv-collapsed"); set(aside, on); try { localStorage.setItem("fv.sidebar", on ? "1" : "0"); } catch (x) {}
  });
  var tries = 0, t = setInterval(function () { var a = document.querySelector("#dc-root aside"); if (a || ++tries > 40) { clearInterval(t); try { if (a && localStorage.getItem("fv.sidebar") === "1") set(a, true); } catch (x) {} } }, 50);
})();

// ---- Owner-approved control behaviours (16 Nov 2026): question box + and paperclip, Ask conversations, chart ranges,
// statements, share, Markets tabs. Sheets reuse the canvas result-sheet look and its motion (responsive.css).
(function () {
  function el(tag, style, text) { var e = document.createElement(tag); if (style) e.setAttribute("style", style); if (text != null) e.textContent = text; return e; }
  function toast(msg) {
    var t = el("div", "position:fixed;left:50%;bottom:calc(104px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:60;max-width:calc(100vw - 32px);box-sizing:border-box;padding:12px 16px;border-radius:12px;background:#0B192C;color:#FFFFFF;font:500 14px 'Geist',system-ui,sans-serif;box-shadow:0 10px 24px rgba(17,28,45,.25);transition:opacity 400ms ease,transform 400ms ease", msg);
    t.setAttribute("role", "status"); document.body.appendChild(t);
    t.animate([{ opacity: 0, transform: "translate(-50%,12px)" }, { opacity: 1, transform: "translate(-50%,0)" }], { duration: 400, easing: "ease" });
    setTimeout(function () { t.style.opacity = "0"; setTimeout(function () { t.remove(); }, 400); }, 2500); // toasts last 2.5 seconds (D22)
  }
  function sheet(title, fill) {
    var host = document.getElementById("dc-root") || document.body, back = el("div", "position:fixed;inset:0;background:rgba(17,28,45,.45);z-index:50");
    back.setAttribute("aria-hidden", "true");
    var s = el("section", "position:fixed;left:0;right:0;bottom:0;z-index:51;max-width:560px;margin:0 auto;max-height:80dvh;overflow-y:auto;overscroll-behavior:contain;background:#FFFFFF;color:#0B192C;border-radius:22px 22px 0 0;padding:10px 20px 28px;display:flex;flex-direction:column;gap:10px;font-family:'Geist',system-ui,sans-serif");
    s.setAttribute("role", "dialog"); s.setAttribute("aria-modal", "true"); s.setAttribute("aria-label", title);
    s.appendChild(el("span", "width:36px;height:4px;border-radius:999px;background:#D5D9E0;align-self:center;margin-bottom:6px"));
    s.appendChild(el("h2", "margin:0;font-size:20px;font-weight:600", title));
    var close = function () { back.remove(); s.remove(); document.removeEventListener("keydown", esc); if (opener && opener.focus) opener.focus(); };
    var esc = function (e) { if (e.key === "Escape") close(); }, opener = document.activeElement;
    back.addEventListener("click", close); document.addEventListener("keydown", esc);
    fill(s, close); host.appendChild(back); host.appendChild(s);
    var f = s.querySelector("button, a"); if (f) f.focus(); return close;
  }
  function rowBtn(text, sub) {
    var b = el("button", "display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-height:52px;padding:10px 14px;border-radius:12px;border:1px solid #D5D9E0;background:#FFFFFF;color:#0B192C;font:inherit;font-size:15px;text-align:left;cursor:pointer");
    b.type = "button"; b.appendChild(el("span", "", text)); if (sub) b.appendChild(el("span", "font-size:13px;color:#5B6577", sub)); return b;
  }
  function swapSel(btn) {
    var list = btn.parentElement, cur = list.querySelector('[aria-selected="true"]');
    if (cur && cur !== btn) { var a = cur.getAttribute("style"); cur.setAttribute("style", btn.getAttribute("style")); btn.setAttribute("style", a); cur.setAttribute("aria-selected", "false"); }
    btn.setAttribute("aria-selected", "true");
  }
  var F = function () { return window.FV; }, D = function () { return window.FVD; };
  function tkr() { var m = /[?&]t=([A-Z]+)/.exec(location.search); return m ? m[1] : "ZENITHBANK"; }

  // 3. Chart ranges: redraw from the simulated daily prices; history before the simulation began is generated the same way.
  var DAYS = { "1W": 5, "1M": 21, "1Y": 250, "5Y": 1250 };
  function series(t, n) {
    var S = F() && F().SIM; if (!S) return [];
    var real = S.history(t, n); if (real.length >= n) return real;
    var need = n - real.length, first = real.length ? real[0] : S.price(t), back = D().priceSeries(t + ":past", 100000, need + 1, 0.016), out = [];
    for (var i = 1; i <= need; i++) out.unshift(Math.max(1, Math.round(first * back[i] / back[0])));
    return out.concat(real);
  }
  function draw(svg, pts, label) {
    var vb = (svg.getAttribute("viewBox") || "0 0 350 180").split(/\s+/).map(Number), W = vb[2] || 350, H = vb[3] || 180;
    var lo = Math.min.apply(null, pts), hi = Math.max.apply(null, pts), sp = hi - lo || 1, n = pts.length;
    var xy = pts.map(function (v, i) { return [Math.round(i * W / Math.max(1, n - 1) * 10) / 10, Math.round((H * 0.89 - (v - lo) / sp * H * 0.72) * 10) / 10]; });
    var line = "M" + xy.map(function (p) { return p[0] + " " + p[1]; }).join(" L");
    var paths = svg.querySelectorAll(":scope > path"); if (!paths.length) return;
    if (paths.length < 2) paths[0].setAttribute("d", line); else { paths[0].setAttribute("d", line + " L" + W + " " + H + " L0 " + H + " Z"); paths[1].setAttribute("d", line); }
    var c = svg.querySelector("circle"); if (c) { c.setAttribute("cx", xy[n - 1][0]); c.setAttribute("cy", xy[n - 1][1]); }
    svg.setAttribute("aria-label", label);
    svg._fv = { pts: pts, xy: xy, W: W, H: H }; hideTip(svg); scrubInit(svg);
  }
  // Tap or drag along the chart to read the price and date of any day (owner, 16 Nov 2026, from a Cowrywise reference).
  // One point per trading day, counted back over weekdays from today in Lagos.
  function dayOf(back) { var d = new Date(Date.now() + 3600000), n = 0; d.setUTCHours(12, 0, 0, 0);
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
    while (n < back) { d.setUTCDate(d.getUTCDate() - 1); if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) n++; }
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }); }
  function hideTip(svg) { var w = svg.parentElement, tip = w && w.querySelector(".fvScrub"); if (tip) tip.remove();
    svg.querySelectorAll(".fvScrubLine, .fvScrubDot").forEach(function (x) { x.remove(); }); }
  function showTip(svg, clientX) {
    var f = svg._fv; if (!f) return; var r = svg.getBoundingClientRect(), n = f.pts.length;
    var i = Math.max(0, Math.min(n - 1, Math.round((clientX - r.left) / r.width * (n - 1)))), p = f.xy[i];
    var NS = "http://www.w3.org/2000/svg", g = svg.querySelector(".fvScrubLine"), c = svg.querySelector(".fvScrubDot");
    if (!g) { g = document.createElementNS(NS, "line"); g.setAttribute("class", "fvScrubLine"); g.setAttribute("stroke", "#5B6577"); g.setAttribute("stroke-dasharray", "3 3"); g.setAttribute("vector-effect", "non-scaling-stroke"); svg.appendChild(g); }
    if (!c) { var ln = svg.querySelectorAll(":scope > path"); c = document.createElementNS(NS, "circle"); c.setAttribute("class", "fvScrubDot"); c.setAttribute("r", "4"); c.setAttribute("stroke", "#FFFFFF"); c.setAttribute("stroke-width", "2"); c.setAttribute("fill", ln.length ? ln[ln.length - 1].getAttribute("stroke") || "#10B981" : "#10B981"); svg.appendChild(c); }
    c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]);
    g.setAttribute("x1", p[0]); g.setAttribute("x2", p[0]); g.setAttribute("y1", 0); g.setAttribute("y2", f.H);
    var w = svg.parentElement; if (getComputedStyle(w).position === "static") w.style.position = "relative";
    var tip = w.querySelector(".fvScrub"); if (!tip) { tip = document.createElement("div"); tip.className = "fvScrub"; tip.setAttribute("aria-live", "polite"); w.appendChild(tip); }
    tip.innerHTML = '<span style="font-family: \'Geist Mono\', monospace; font-size: 14px; font-weight: 500; color: #FFFFFF">\u20a6' + (f.pts[i] / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span><span style="font-size: 12px; color: #C7D0DD">' + dayOf(n - 1 - i) + '</span>';
    var px = r.left - w.getBoundingClientRect().left + p[0] / f.W * r.width, py = r.top - w.getBoundingClientRect().top + p[1] / f.H * r.height;
    var tw = tip.offsetWidth, th = tip.offsetHeight, ww = w.clientWidth;
    tip.style.left = Math.max(4, Math.min(ww - tw - 4, px - tw / 2)) + "px";
    var top0 = r.top - w.getBoundingClientRect().top; tip.style.top = (py - th - 12 < top0 ? py + 12 : py - th - 12) + "px"; // stay inside the chart, never over the figures above it
  }
  function scrubInit(svg) {
    if (svg._fvOn) return; svg._fvOn = 1; svg.style.touchAction = "pan-y"; svg.style.cursor = "crosshair"; var down = false;
    svg.addEventListener("pointerdown", function (e) { down = true; try { svg.setPointerCapture(e.pointerId); } catch (x) {} showTip(svg, e.clientX); });
    svg.addEventListener("pointermove", function (e) { if (down || e.pointerType === "mouse") showTip(svg, e.clientX); });
    ["pointerup", "pointercancel"].forEach(function (k) { svg.addEventListener(k, function () { down = false; }); });
    svg.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") hideTip(svg); });
    document.addEventListener("pointerdown", function (e) { if (!svg.contains(e.target)) hideTip(svg); }, true);
  }
  function chart(range) {
    var tl = document.querySelector('[role="tablist"][aria-label="Chart range"]'); if (!tl) return;
    var svg = tl.previousElementSibling && tl.previousElementSibling.tagName.toLowerCase() === "svg" ? tl.previousElementSibling : (tl.closest("section") || document).querySelector("svg[viewBox][role=img]"); if (!svg) return;
    var t = tkr(), S = F() && F().SIM; if (!S) return;
    var naira = function (k) { return "₦" + (k / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 }); };
    if (range === "1D") { var p = S.price(t); draw(svg, [p, p], "Today's price, " + naira(p)); toast("Prices update once a day"); return; }
    var pts = series(t, DAYS[range]); if (pts.length < 2) return;
    draw(svg, pts, range + " price chart, from " + naira(pts[0]) + " to " + naira(pts[pts.length - 1]));
  }
  function initChart() { if (document.querySelector('[role="tablist"][aria-label="Chart range"]') && F() && F().SIM) { var sel = document.querySelector('[aria-label="Chart range"] [aria-selected="true"]'); chart(sel ? sel.textContent.trim() : "1Y"); return true; } }
  var tries = 0, it = setInterval(function () { if (initChart() || ++tries > 60) clearInterval(it); }, 100);
  // Practice charts drawn from the simulated prices so a tap reads a real day (owner, 16 Nov 2026): last month (the 1M the board shows selected), 21 trading days.
  // The range buttons under each chart (1D, 1W, 1M, 3M, 1Y, All) redraw it.
  function portfolioSeries(n) {
    var S = F().SIM, a = S.account(), d0 = S.day(), out = [], H = {}, P = {};
    a.holdings.forEach(function (h) { H[h.ticker] = h.quantity; });
    a.trades.forEach(function (t) { P[t.ticker] = 1; }); Object.keys(H).forEach(function (t) { P[t] = 1; });
    var hist = {}; Object.keys(P).forEach(function (t) { hist[t] = S.history(t, n); });
    for (var i = n - 1; i >= 0; i--) { var day = d0 - i, cash = a.cashKobo, q = Object.assign({}, H);
      a.trades.forEach(function (t) { if (t.day > day) { cash += t.side === "buy" ? t.netKobo : -t.netKobo; q[t.ticker] = (q[t.ticker] || 0) + (t.side === "buy" ? -t.quantity : t.quantity); } });
      var v = cash; Object.keys(q).forEach(function (t) { var h = hist[t], px = h[h.length - 1 - i]; if (q[t] > 0 && px) v += q[t] * px; }); out.push(v); }
    return out;
  }
  function initPractice() {
    if (!F() || !F().SIM) return false; var done = false;
    document.querySelectorAll('svg[aria-label^="Price chart"], svg[aria-label^="Portfolio value"], svg[aria-label^="Portfolio chart"]').forEach(function (svg) {
      svg._pc = /^Price/.test(svg.getAttribute("aria-label")); var row = rangeRow(svg), sel = row && [].filter.call(row.children, function (b) { return b.getAttribute("aria-selected") === "true"; })[0];
      practiceDraw(svg, sel ? sel.textContent.trim() : "1M"); done = true; });
    return done;
  }
  var PDAYS = { "1D": 2, "1W": 5, "1M": 21, "3M": 63, "1Y": 250 };
  function practiceDraw(svg, range) {
    var S = F().SIM, nm = function (k) { return "₦" + (k / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 }); }, n = PDAYS[range];
    if (range === "All") { var tr = S.account().trades; n = svg._pc ? 250 : Math.max(5, tr.length ? S.day() - tr[0].day + 2 : 5); }
    if (range === "1D") toast("Prices update once a day");
    var pts = svg._pc ? series(tkr(), n) : portfolioSeries(n); if (pts.length < 2) return;
    draw(svg, pts, range + (svg._pc ? " price chart" : " portfolio value") + ", from " + nm(pts[0]) + " to " + nm(pts[pts.length - 1]));
  }
  // The drawn range row sits right after the chart (or after its wrapper). It becomes a tab list; the drawn selected look moves with the choice.
  function rangeRow(svg) {
    var c = [svg.nextElementSibling, svg.parentElement && svg.parentElement.nextElementSibling], RX = /^(1D|1W|1M|3M|1Y|5Y|All)$/;
    for (var k = 0; k < c.length; k++) { var el = c[k]; if (!el || !el.children.length || ![].every.call(el.children, function (x) { return RX.test(x.textContent.trim()); })) continue;
      if (!el._fvRange) { el._fvRange = 1; el.setAttribute("role", "tablist"); el.setAttribute("aria-label", "Practice chart range");
        var kids = [].slice.call(el.children), on = kids.filter(function (x) { return x.style.fontWeight === "600"; })[0] || kids[0], off = kids.filter(function (x) { return x !== on; })[0] || on;
        var onS = { bg: on.style.background, c: on.style.color, w: on.style.fontWeight }, offS = { bg: off.style.background, c: off.style.color, w: off.style.fontWeight };
        var pick = function (b) { kids.forEach(function (x) { var y = x === b, st = y ? onS : offS; x.style.background = st.bg; x.style.color = st.c; x.style.fontWeight = st.w; x.setAttribute("aria-selected", y ? "true" : "false"); x.tabIndex = y ? 0 : -1; }); };
        kids.forEach(function (x) { x.setAttribute("role", "tab"); x.style.cursor = "pointer";
          x.addEventListener("click", function () { pick(x); practiceDraw(svg, x.textContent.trim()); });
          x.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); x.click(); } }); });
        pick(on); }
      return el; }
    return null;
  }
  var tries2 = 0, it2 = setInterval(function () { if (initPractice() || ++tries2 > 60) clearInterval(it2); }, 100);

  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target : null; if (!t) return;
    // 1. Question box: + opens the suggested questions; the paperclip says attaching comes later.
    var add = t.closest('[aria-label="Add"]');
    if (add && (add.closest("#dc-root") || 0)) {
      e.preventDefault(); var A = F() && F().ASK, qs = A ? A.suggestions().slice(0, 6) : [];
      sheet("Suggested questions", function (s) { qs.forEach(function (q) { var b = rowBtn(q); b.onclick = function () { location.href = (document.documentElement.clientWidth >= 1024 ? "AskLaptopNavy" : "AskFinvoraNavy") + ".dc.html?q=" + encodeURIComponent(q); }; s.appendChild(b); }); });
      return;
    }
    if (t.closest('[aria-label="Attach a report"], [aria-label="Attach"]')) { e.preventDefault(); toast("Attaching reports is coming in a later version"); return; }
    // 2. Conversations: your past questions in this browser, and a new conversation.
    if (t.closest('[aria-label="Conversations"]')) {
      e.preventDefault(); var Q = F() && F().ASK, msgs = Q ? Q.messages().slice().reverse() : [];
      sheet("Conversations", function (s, close) {
        var nb = el("button", "height:48px;border-radius:12px;border:0;background:#0B192C;color:#FFFFFF;font:inherit;font-size:15px;font-weight:600;cursor:pointer", "New conversation"); nb.type = "button";
        nb.onclick = function () { if (Q) Q.clear(); location.reload(); }; s.appendChild(nb);
        if (!msgs.length) s.appendChild(el("p", "margin:4px 0 0;font-size:14px;color:#5B6577", "No questions yet."));
        msgs.forEach(function (m) { var b = rowBtn(m.q); b.onclick = function () { close(); var hit = [].slice.call(document.querySelectorAll("#chat *")).filter(function (x) { return x.children.length === 0 && x.textContent.trim() === m.q; })[0]; if (hit) hit.scrollIntoView({ block: "center" }); }; s.appendChild(b); });
      });
      return;
    }
    // 3. Chart range buttons.
    var rb = t.closest('[role="tablist"][aria-label="Chart range"] > button');
    if (rb) { swapSel(rb); chart(rb.textContent.trim()); return; }
    // 4. Statements: only the income figures exist; the others say so instead of showing made-up numbers.
    var sb = t.closest('[role="tablist"][aria-label="Statement"] > button');
    if (sb) {
      swapSel(sb); var table = sb.parentElement.nextElementSibling, note = sb.parentElement.parentElement.querySelector(".fv-na");
      var inc = sb.textContent.trim() === "Income";
      if (table) table.classList.toggle("fv-hide", !inc);
      if (!inc && !note) { note = el("p", "margin:14px 0 4px;font-size:14px;color:#5B6577", "Not available yet."); note.className = "fv-na"; sb.parentElement.after(note); }
      if (note) note.classList.toggle("fv-hide", inc);
      return;
    }
    // 5. Share: the phone's share sheet, or copy the link.
    if (t.closest('[aria-label="Share"]')) {
      e.preventDefault(); var url = location.href, title = document.title;
      var copy = function () { try { navigator.clipboard.writeText(url).then(function () { toast("Link copied"); }, function () { toast(url); }); } catch (x) { toast(url); } };
      if (navigator.share) navigator.share({ title: title, url: url }).catch(function (x) { if (x && x.name !== "AbortError") copy(); }); else copy();
      return;
    }
    // 6. Markets tabs: Stocks, Indices, Sectors, Watchlist.
    var vt = t.closest('[role="tablist"][aria-label="View"] > button');
    if (vt) {
      swapSel(vt); var sec = vt.closest("section"), name = vt.textContent.trim(), S = F() && F().SIM;
      var kids = [].slice.call(sec.children).filter(function (c) { return c !== vt.parentElement && !c.classList.contains("fv-view"); });
      var old = sec.querySelector(".fv-view"); if (old) old.remove();
      var rows = [].slice.call(sec.querySelectorAll('a[href*="t="]'));
      kids.forEach(function (k) { k.classList.toggle("fv-hide", !(name === "Stocks" || name === "Watchlist")); });
      var wl = F() && F().PLUS ? F().PLUS.lists()[0].tickers : [];
      rows.forEach(function (r) { var m = /t=([A-Z]+)/.exec(r.getAttribute("href")); r.classList.toggle("fv-hide", name === "Watchlist" && !(m && wl.indexOf(m[1]) >= 0)); });
      var view = el("div", "margin-top:12px;display:flex;flex-direction:column"); view.className = "fv-view";
      var line = function (a, b, c, href) { var r = el(href ? "a" : "div", "display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:56px;border-bottom:1px solid #EDEFF2;text-decoration:none;color:#0B192C;font-size:15px"); if (href) r.href = href; r.appendChild(el("span", "font-weight:500", a)); var right = el("span", "display:flex;gap:10px;align-items:center;font-family:'Geist Mono',monospace;font-size:14px", b); if (c) right.appendChild(el("span", "font-size:12px;color:" + (/▼/.test(c) ? "#B9473F" : "#047857"), c)); r.appendChild(right); return r; };
      if (name === "Indices") [["NGX All-Share", "104,562.31", "▲ 0.7%"], ["NGX 30", "3,842.10", "▲ 0.5%"], ["NGX Banking", "1,092.44", "▲ 1.8%"], ["NGX Consumer Goods", "1,705.86", "▼ 0.4%"]].forEach(function (x) { view.appendChild(line(x[0], x[1], x[2])); });
      if (name === "Sectors" && S) { var cnt = {}; S.COMPANIES.forEach(function (c) { var co = S.company(c.t); var k = co && co.sector; if (k) cnt[k] = (cnt[k] || 0) + 1; });
        Object.keys(cnt).sort().forEach(function (k) { var r = line(k, cnt[k] + (cnt[k] === 1 ? " company" : " companies")); r.setAttribute("role", "button"); r.tabIndex = 0; r.style.cursor = "pointer";
          r.onclick = function () { var st = [].slice.call(vt.parentElement.children).filter(function (b) { return b.textContent.trim() === "Stocks"; })[0]; if (st) st.click(); var chip = [].slice.call(sec.querySelectorAll("button")).filter(function (b) { var l = b.textContent.trim(); return l === k || (k === "Industrial goods" && l === "Industrial") || (k === "Food" && l === "Consumer goods") || (k === "Energy" && l === "Oil and gas"); })[0]; if (chip) chip.click(); };
          view.appendChild(r); }); }
      if (name === "Watchlist" && !rows.some(function (r) { return !r.classList.contains("fv-hide"); })) view.appendChild(el("p", "margin:8px 0;font-size:14px;color:#5B6577", "No companies in your watchlist yet."));
      if (view.children.length) vt.parentElement.after(view);
    }
  });
})();

// Laptop sidebar profile card: the signed-in learner's initials, name and plan (phone twin: MeNavy header).
(function () {
  var n = 0, t = setInterval(function () {
    var card = document.querySelector('#dc-root aside a[href^="MeLaptopNavy"]'); if (!card && ++n < 40) return; clearInterval(t); if (!card || !window.FV) return;
    [600, 1500].forEach(function (ms) { setTimeout(function () { fill(card); }, ms); }); // again once the account data is ready
    fill(card);
  }, 50);
  function fill(card) {
    if (!window.FV) return;
    try { var a = window.FV.AUTH.get(), nm = a.name || (a.email ? a.email.split("@")[0] : "Ada Okafor"), plus = window.FV.billing().sub.plan === "plus";
      var sp = card.querySelectorAll("span"); if (sp.length < 4) return;
      sp[0].textContent = nm.split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase();
      sp[2].textContent = nm; sp[2].title = nm; sp[3].textContent = plus ? "Plus plan" : "Free plan"; } catch (e) {}
  }
})();

// Dictionary letter strip: letters with no terms are dimmed and marked unavailable (nothing to jump to).
(function () {
  var n = 0, t = setInterval(function () {
    var nav = document.querySelector(".fv-index"); if (!nav && ++n < 40) return; clearInterval(t); if (!nav) return;
    var have = {}; [].slice.call(document.querySelectorAll("#dc-root h2")).forEach(function (h) { var x = h.textContent.trim(); if (x.length === 1) have[x] = 1; });
    if (!Object.keys(have).length) return;
    [].slice.call(nav.querySelectorAll("a")).forEach(function (a) { if (!have[a.textContent.trim()]) { a.setAttribute("aria-disabled", "true"); a.style.opacity = ".35"; a.tabIndex = -1; } });
  }, 60);
})();
