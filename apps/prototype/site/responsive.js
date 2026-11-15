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

// Chip filters on company lists (Markets, Practice market, laptop Markets): All / a sector, or Most traded / Risers / Fallers.
// Rows are the drawn company links (…?t=TICKER); sectors and today's change come from the practice data (FV.SIM).
(function () {
  var SECT = { "Banking": ["Banking"], "Telecoms": ["Telecoms"], "Consumer goods": ["Consumer goods", "Food"], "Consumer": ["Consumer goods", "Food"], "Industrial": ["Industrial goods"], "Oil and gas": ["Oil and gas", "Energy"] };
  function rowsNear(chip) {
    for (var box = chip.parentElement; box && box.id !== "dc-root"; box = box.parentElement) {
      var rows = [].slice.call(box.querySelectorAll('a[href*="t="]')).filter(function (a) { return /[?&]t=[A-Z]+/.test(a.getAttribute("href")) && !a.contains(chip); });
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
      var co = S && S.company ? S.company(tk(r)) : null, show = true;
      if (SECT[label]) show = !!co && SECT[label].indexOf(co.sector) >= 0;
      if (label === "Risers") show = !S || S.change(tk(r)) >= 0;
      if (label === "Fallers") show = !S || S.change(tk(r)) < 0;
      r.style.display = show ? "" : "none"; if (r.parentElement === parent) parent.appendChild(r);
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
