/* Plus feature screens (owner approved the drafts, 17 Nov 2026): the parts you can use. Every figure is simulated.
   Money is integer kobo; naira strings are made only for display. */
(function () {
  "use strict";
  var RED = "#B9473F", EM = "#10B981", NAVY = "#0B192C", MUTE = "#5B6577", LINE = "#E3E6EB", SOFT = "#EEF0F3";
  var mono = "font-family:'Geist Mono',monospace";
  function naira(k, dp) { return "₦" + (k / 100).toLocaleString("en-NG", { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }); }
  function byText(sel, re) { return Array.prototype.filter.call(document.querySelectorAll(sel), function (e) { return re.test(e.textContent.trim()); }); }
  function cardOf(e) { while (e && !(e.style && /border-radius:\s*16px/.test(e.getAttribute("style") || ""))) e = e.parentElement; return e; }
  function lineSvg(a, h) { h = h || 120; var mx = Math.max.apply(null, a), mn = Math.min.apply(null, a), n = a.length;
    var pts = a.map(function (v, i) { return (i * 300 / Math.max(1, n - 1)).toFixed(1) + "," + (8 + (1 - (v - mn) / ((mx - mn) || 1)) * (h - 16)).toFixed(1); }).join(" ");
    return '<svg viewBox="0 0 300 ' + h + '" width="100%" height="' + h + '" preserveAspectRatio="none" style="display:block" role="img" aria-label="Chart, ' + (a[n - 1] < a[0] ? "falling" : "rising") + '"><polyline fill="none" stroke="' + (a[n - 1] < a[0] ? RED : EM) + '" stroke-width="2.5" vector-effect="non-scaling-stroke" points="' + pts + '"/></svg>'; }
  function pick(list, i, attr) { list.forEach(function (b, j) { var on = j === i; b.setAttribute(attr || "aria-pressed", String(on));
    b.style.background = on ? NAVY : SOFT; b.style.color = on ? "#FFFFFF" : NAVY; b.style.fontWeight = on ? "600" : "400"; }); }
  function asButton(el, fn) { el.setAttribute("role", "button"); el.tabIndex = 0; el.style.cursor = "pointer"; el.style.touchAction = "manipulation";
    el.addEventListener("click", fn); el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(e); } }); }

  /* Section highlight: these screens sit on the Home layout, so light the nav item they belong to. */
  function section() {
    var tab = document.body.getAttribute("data-fv-section"); if (!tab) return;
    var nav = document.querySelector('#dc-root nav[aria-label="Main"]');
    if (nav) { var links = Array.prototype.slice.call(nav.querySelectorAll("a")), home = links.filter(function (a) { return /Home/.test(a.textContent); })[0], to = links.filter(function (a) { return a.textContent.trim() === tab; })[0] || links.filter(function (a) { return a.textContent.trim() === "Markets" && tab === "Watchlist"; })[0];
      if (home && to && !to._fvOn) { var col = function (a) { var t = Array.prototype.filter.call(a.querySelectorAll("span,div"), function (e) { return e.textContent.trim() && !e.children.length; })[0] || a; return getComputedStyle(t).color; };
        var on = col(home), off = col(to), paint = function (a, c) { a.querySelectorAll("*").forEach(function (e) { if (e.textContent.trim() && !e.children.length) e.style.color = c; if (e.getAttribute("stroke") && e.getAttribute("stroke") !== "none") e.setAttribute("stroke", c); }); };
        paint(home, off); paint(to, on); home.removeAttribute("aria-current"); to.setAttribute("aria-current", "page"); to._fvOn = 1; } }
    var aside = document.querySelector("#dc-root aside");
    if (aside) { var cur = aside.querySelector('a[aria-current="page"]'), tgt = byText("#dc-root aside a", new RegExp("^" + (tab === "Practice" ? "Practice market" : tab) + "$"))[0];
      if (cur && tgt && cur !== tgt) { var cs = cur.getAttribute("style"), ts = tgt.getAttribute("style"), cst = (cur.querySelector("[stroke]") || {}).getAttribute ? cur.querySelector("[stroke]").getAttribute("stroke") : null, tst = tgt.querySelector("[stroke]") ? tgt.querySelector("[stroke]").getAttribute("stroke") : null;
        cur.setAttribute("style", ts); tgt.setAttribute("style", cs); cur.removeAttribute("aria-current"); tgt.setAttribute("aria-current", "page");
        if (cst && tst) { cur.querySelectorAll("[stroke]").forEach(function (e) { e.setAttribute("stroke", tst); }); tgt.querySelectorAll("[stroke]").forEach(function (e) { e.setAttribute("stroke", cst); }); } } }
  }

  /* Interactive financial scenarios: real sliders; what the money is worth is worked out in kobo. */
  function scenarios() {
    var lab = byText("#dc-root span", /^Inflation a year$/)[0]; if (!lab) return; var ctl = cardOf(lab), out = cardOf(byText("#dc-root h2", /^After \d+ years$/)[0]); if (!ctl || !out || ctl._fv) return; ctl._fv = 1;
    var S = { inf: 25, rate: 12, yrs: 5 }, P = 50000000;
    var row = function (id, l, min, max, v, unit) { return '<label style="display:flex;flex-direction:column;gap:8px;font-size:14px"><span style="display:flex;justify-content:space-between"><span>' + l + '</span><output id="o-' + id + '" style="' + mono + '">' + v + unit + '</output></span><input id="s-' + id + '" type="range" min="' + min + '" max="' + max + '" step="1" value="' + v + '" aria-label="' + l + '" style="width:100%;accent-color:' + NAVY + ';height:28px;margin:0;font-size:16px"></label>'; };
    ctl.innerHTML = '<div style="display:flex;flex-direction:column;gap:18px">' + row("inf", "Inflation a year", 0, 40, S.inf, "%") + row("rate", "Savings interest a year", 0, 30, S.rate, "%") + row("yrs", "Years", 1, 10, S.yrs, "") + "</div>";
    var draw = function () {
      var bank = P, real = [P]; for (var y = 1; y <= S.yrs; y++) { bank = Math.round(bank * (100 + S.rate) / 100); var r = bank; for (var k = 0; k < y; k++) r = Math.round(r * 100 / (100 + S.inf)); real.push(r); }
      var last = real[real.length - 1], mx = Math.max.apply(null, real), down = last < real[0], c = down ? RED : EM;
      var bars = '<svg viewBox="0 0 300 100" width="100%" height="130" preserveAspectRatio="none" style="display:block">' + real.map(function (v, i) { var w = 300 / real.length; return '<rect x="' + (i * w + w * 0.18) + '" y="' + (100 - v / mx * 100) + '" width="' + (w * 0.64) + '" height="' + (v / mx * 100) + '" fill="' + c + '"/>'; }).join("") + "</svg>"
        + '<div style="display:flex;margin-top:6px">' + real.map(function (v, i) { return '<span style="flex:1;text-align:center;font-size:11px;color:' + MUTE + '">' + (i ? "Y" + i : "Now") + "</span>"; }).join("") + "</div>";
      var rw = function (a, b, bold) { return '<div style="display:flex;justify-content:space-between;gap:10px;padding:11px 0;border-top:1px solid ' + LINE + ';font-size:14px"><span style="' + (bold ? "font-weight:600" : "") + '">' + a + '</span><span style="' + mono + ';font-size:13px">' + b + "</span></div>"; };
      out.innerHTML = '<h2 style="margin:0;font-size:15px;font-weight:600">After ' + S.yrs + (S.yrs === 1 ? " year" : " years") + "</h2>" + rw("In the bank", naira(bank)) + rw("What it can buy in today's money", '<span style="color:' + c + '">' + naira(last) + "</span>", 1) + '<div style="margin-top:12px">' + bars + '</div><p aria-live="polite" style="margin:10px 0 0;font-size:13px;line-height:1.5;color:' + MUTE + '">' + (S.inf > S.rate ? "When inflation is above your interest rate, your money buys less each year, even as the balance grows." : S.inf === S.rate ? "When interest matches inflation, your money keeps what it can buy." : "When interest beats inflation, your money buys more each year.") + "</p>";
    };
    ["inf", "rate", "yrs"].forEach(function (k) { var i = document.getElementById("s-" + k); i.addEventListener("input", function () { S[k] = +i.value; document.getElementById("o-" + k).textContent = i.value + (k === "yrs" ? "" : "%"); draw(); }); });
    var presets = { "Rent goes up": { inf: 32, rate: 12 }, "Salary rises 10%": { inf: 20, rate: 10 }, "Naira weakens": { inf: 35, rate: 15 } };
    Object.keys(presets).forEach(function (n) { var b = byText("#dc-root span", new RegExp("^" + n.replace("%", "\\%") + "$"))[0]; if (!b) return;
      asButton(b, function () { var p = presets[n]; ["inf", "rate"].forEach(function (k) { S[k] = p[k]; var i = document.getElementById("s-" + k); i.value = p[k]; document.getElementById("o-" + k).textContent = p[k] + "%"; }); draw(); }); });
    draw();
  }

  /* Market crisis simulator: step through a downturn month by month; the choice decides what your ₦100,000 does. */
  var CRISES = { // NGX All-Share, indexed to 100 at the start. Simulated shapes of each downturn, not exact history.
    "2008 to 2009 crash": [100, 96, 88, 79, 70, 61, 54, 48, 44, 40, 37, 35, 34, 36, 38, 41, 43, 45, 44, 46, 47, 49, 50, 52],
    "2016 recession": [100, 98, 95, 91, 88, 86, 83, 80, 78, 77, 76, 75, 76, 78, 81, 84, 88, 92, 95, 99, 102, 104, 107, 110],
    "2020 pandemic": [100, 97, 86, 78, 80, 83, 85, 88, 92, 97, 103, 110, 118, 121, 119, 122, 124, 123, 126, 128, 127, 130, 132, 134] };
  function crisis() {
    var nb = byText("#dc-root span", /^Next month$/)[0]; if (!nb || nb._fv) return; nb._fv = 1;
    var chart = cardOf(byText("#dc-root h2", /^Month \d+ of \d+$/)[0]), dec = cardOf(nb), chips = Object.keys(CRISES).map(function (n) { return byText("#dc-root span", new RegExp("^" + n + "$"))[0]; });
    var opts = byText("#dc-root span", /^(Sell everything|Hold and wait|Buy a little more each month)$/);
    var st = { c: Object.keys(CRISES)[0], m: 0, choice: 1, path: [] };
    var value = function (series, choices) { var units = 10000000 / series[0], cash = 0, added = 0; // ₦100,000 in kobo
      for (var i = 1; i < choices.length + 1 && i < series.length; i++) { var ch = choices[i - 1]; if (ch === 0 && units) { cash += Math.round(units * series[i]); units = 0; } if (ch === 2) { units += 500000 / series[i]; added += 500000; } }
      var m = Math.min(choices.length, series.length - 1); return { now: cash + Math.round(units * series[m]), added: added }; };
    var render = function () {
      var s = CRISES[st.c], m = st.m, v = value(s, st.path), start = 10000000 + v.added, pct = Math.round((v.now - start) / start * 1000) / 10, done = m >= s.length - 1;
      chart.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="margin:0;font-size:15px;font-weight:600">Month ' + (m + 1) + " of " + s.length + '</h2><span style="font-size:12px;color:' + MUTE + '">NGX All-Share</span></div><div style="margin-top:12px">' + lineSvg(s.slice(0, m + 1).length > 1 ? s.slice(0, m + 1) : [s[0], s[0]], 130) + '</div><div style="margin-top:8px;height:6px;border-radius:999px;background:' + SOFT + '"><div style="width:' + Math.round((m + 1) / s.length * 100) + '%;height:100%;border-radius:999px;background:' + NAVY + ';transition:width 200ms cubic-bezier(.23,1,.32,1)"></div></div><div style="display:flex;justify-content:space-between;margin-top:14px" aria-live="polite"><span><span style="font-size:12px;color:' + MUTE + '">Your portfolio</span><br><span style="' + mono + ';font-size:22px">' + naira(v.now) + '</span></span><span style="text-align:right"><span style="font-size:12px;color:' + MUTE + '">Since start</span><br><span style="' + mono + ';font-size:22px;color:' + (pct < 0 ? RED : "#047857") + '">' + (pct > 0 ? "+" : "") + pct.toFixed(1) + "%</span></span></div>";
      if (done) { var res = ["Sell everything", "Hold and wait", "Buy a little more each month"].map(function (n, i) { var all = []; for (var k = 0; k < s.length - 1; k++) all.push(k === 0 && i === 0 ? 0 : i === 0 ? 1 : i); var r = value(s, all); return [n, r.now, r.added]; });
        dec.innerHTML = '<h2 style="margin:0;font-size:15px;font-weight:600">How each choice turned out</h2>' + res.map(function (r) { return '<div style="display:flex;justify-content:space-between;padding:11px 0;border-top:1px solid ' + LINE + ';font-size:14px"><span>' + r[0] + (r[2] ? '<br><span style="font-size:12px;color:' + MUTE + '">You added ' + naira(r[2]) + "</span>" : "") + '</span><span style="' + mono + '">' + naira(r[1]) + "</span></div>"; }).join("") + '<p style="margin:10px 0 0;font-size:13px;line-height:1.5;color:' + MUTE + '">Selling in a fall locks in the loss. Markets have recovered before, but not always quickly.</p><a href="#" data-again style="margin-top:12px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:' + NAVY + ';color:#fff;font-weight:600;font-size:15px;text-decoration:none">Start again</a>';
        dec.querySelector("[data-again]").addEventListener("click", function (e) { e.preventDefault(); location.reload(); }); }
    };
    opts.forEach(function (o, i) { o.setAttribute("role", "radio"); asButton(o, function () { st.choice = i; opts.forEach(function (x, j) { x.setAttribute("aria-checked", String(j === i)); x.style.border = j === i ? "1.5px solid " + NAVY : "1px solid #D5D9E0"; x.style.background = j === i ? SOFT : "#FFFFFF"; }); }); o.setAttribute("aria-checked", String(i === 1)); });
    opts[0] && opts[0].parentElement.setAttribute("role", "radiogroup");
    asButton(nb, function () { var s = CRISES[st.c]; if (st.m >= s.length - 1) return; st.path.push(st.choice); if (st.choice === 0) st.choice = 1; st.m++; render(); });
    chips.forEach(function (c, i) { if (!c) return; asButton(c, function () { st = { c: Object.keys(CRISES)[i], m: 0, choice: 1, path: [] }; pick(chips, i); render(); }); });
    pick(chips, 0); render();
  }

  /* Historical comparisons: switch between revenue, profit, dividend and share price. */
  var HIST = { Revenue: ["Revenue", "₦ billion", [689, 760, 945, 2130, 2400], [520, 590, 700, 1450, 1690]], Profit: ["Profit after tax", "₦ billion", [175, 230, 235, 676, 1030], [120, 140, 165, 380, 610]],
    Dividend: ["Dividend a share", "₦", [3.0, 3.1, 3.2, 3.6, 4.0], [1.9, 2.0, 2.2, 2.5, 2.9]], "Share price": ["Share price", "₦", [24.0, 24.6, 22.1, 35.4, 47.3], [18.2, 19.0, 17.6, 27.1, 33.8]] };
  function history() {
    var seg = byText("#dc-root span", /^(Revenue|Profit|Dividend|Share price)$/).filter(function (e) { return e.parentElement && /border-radius:\s*10px/.test(e.parentElement.getAttribute("style") || ""); }); if (seg.length !== 4 || seg[0]._fv) return; seg[0]._fv = 1;
    var card = cardOf(seg[0]), h2 = card.querySelector("h2"), svg = card.querySelector("svg"); seg[0].parentElement.setAttribute("role", "tablist");
    var show = function (i) { var d = HIST[seg[i].textContent.trim()]; h2.textContent = d[0]; h2.nextElementSibling && (h2.nextElementSibling.textContent = d[1]);
      var all = d[2].concat(d[3]), mx = Math.max.apply(null, all), mn = Math.min.apply(null, all), pt = function (a) { return a.map(function (v, k) { return (k * 75) + "," + (8 + (1 - (v - mn) / ((mx - mn) || 1)) * 124).toFixed(1); }).join(" "); };
      var ps = svg.querySelectorAll("polyline"); ps[0].setAttribute("points", pt(d[2])); ps[0].setAttribute("stroke", d[2][4] < d[2][0] ? RED : EM); if (ps[1]) ps[1].setAttribute("points", pt(d[3]));
      seg.forEach(function (b, j) { var on = j === i; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(on)); b.style.background = on ? "#fff" : "transparent"; b.style.fontWeight = on ? "600" : "400"; b.style.color = on ? NAVY : MUTE; b.style.boxShadow = on ? "0 1px 2px rgba(0,0,0,.08)" : "none"; }); };
    seg.forEach(function (b, i) { asButton(b, function () { show(i); }); }); show(1);
  }

  /* Advanced watchlists: switch lists. */
  var LISTS = { "Banks · 4": [["Zenith Bank", "₦47.33", "+0.3%", "3.1", "8.3%", "Alert at ₦50"], ["GTCO", "₦52.10", "−0.6%", "4.6", "7.7%", ""], ["Access Holdings", "₦21.85", "+1.2%", "2.4", "9.1%", "Alert at ₦20"], ["UBA", "₦28.40", "+0.4%", "2.9", "8.8%", ""]],
    "Telecoms · 2": [["MTN Nigeria", "₦232.70", "+0.5%", "18.2", "4.6%", "Alert at ₦250"], ["Airtel Africa", "₦2,140.00", "−0.2%", "21.4", "2.1%", ""]],
    "Dividend picks · 5": [["Zenith Bank", "₦47.33", "+0.3%", "3.1", "8.3%", ""], ["Access Holdings", "₦21.85", "+1.2%", "2.4", "9.1%", ""], ["UBA", "₦28.40", "+0.4%", "2.9", "8.8%", ""], ["Seplat Energy", "₦5,300.00", "−0.8%", "9.7", "5.4%", ""], ["Nestlé Nigeria", "₦1,050.00", "−1.9%", "24.0", "3.9%", ""]] };
  function watchlists() {
    var tabs = Object.keys(LISTS).map(function (n) { return byText("#dc-root span", new RegExp("^" + n.split(" · ")[0] + " · \\d+$"))[0]; }).filter(Boolean); if (tabs.length !== 3 || tabs[0]._fv) return;
    var first = byText("#dc-root b", /^Zenith Bank$/)[0], card = cardOf(first), wide = !!byText("#dc-root span", /^Yield$/).length;
    var arrow = function (c) { if (/^[+−-]?0(\.0+)?%$/.test(c)) return '<span style="color:' + MUTE + '">' + c.replace(/^[+−-]/, "") + "</span>"; var up = c.charAt(0) === "+"; return '<span style="color:' + (up ? "#047857" : RED) + '">' + (up ? "▲ " : "▼ ") + c.slice(1) + "</span>"; };
    var grid = "display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr 1.4fr;gap:10px;align-items:center;padding:11px 0;border-top:1px solid " + LINE;
    var th = function (t, r) { return '<span style="font-size:12px;color:' + MUTE + ";" + (r ? "text-align:right" : "") + '">' + t + "</span>"; };
    var keys = Object.keys(LISTS);
    tabs.forEach(function (t, j) { t.textContent = keys[j].split(" · ")[0] + " · " + LISTS[keys[j]].length; t._fv = 1; });
    var show = function (i) { var D = LISTS[keys[i]];
      if (!D.length) { card.innerHTML = '<div style="padding:20px 4px;display:flex;flex-direction:column;gap:8px;align-items:flex-start"><b style="font-size:15px;font-weight:600">No companies in this list yet</b><span style="font-size:14px;color:' + MUTE + '">Add companies from Markets to follow them here.</span><a href="MarketsNavy.dc.html" style="margin-top:4px;font-size:14px;font-weight:600;color:#047857;text-decoration:none;display:inline-block;padding:12px 0;margin-bottom:-12px">Add a company</a></div>'; pick(tabs, i); return; }
      card.innerHTML = wide ? '<div style="' + grid + ';border-top:0">' + th("Company") + th("Price", 1) + th("Today", 1) + th("P/E", 1) + th("Yield", 1) + th("Alert", 1) + "</div>" + D.map(function (r) { return '<div style="' + grid + ';font-size:14px"><b style="font-weight:600">' + r[0] + '</b><span style="' + mono + ';text-align:right">' + r[1] + '</span><span style="' + mono + ';text-align:right">' + arrow(r[2]) + '</span><span style="' + mono + ';text-align:right">' + r[3] + '</span><span style="' + mono + ';text-align:right">' + r[4] + '</span><span style="text-align:right;font-size:13px;color:' + (r[5] ? NAVY : MUTE) + '">' + (r[5] || "No alert") + "</span></div>"; }).join("")
        : D.map(function (r) { return '<div style="padding:11px 0;border-top:1px solid ' + LINE + ';display:flex;flex-direction:column;gap:4px"><div style="display:flex;justify-content:space-between"><b style="font-size:14px;font-weight:600">' + r[0] + '</b><span style="' + mono + ';font-size:14px">' + r[1] + '</span></div><div style="display:flex;justify-content:space-between;font-size:12px;color:' + MUTE + '"><span>P/E ' + r[3] + " · Yield " + r[4] + (r[5] ? " · " + r[5] : "") + "</span>" + arrow(r[2]) + "</div></div>"; }).join("");
      pick(tabs, i); };
    tabs.forEach(function (t, i) { asButton(t, function () { show(i); }); }); show(0);
  }

  /* Financial report comparisons: choose the two reports. */
  var REPORTS = { "Zenith Bank FY2024": ["₦2.4tn", "₦0.9tn", "₦1.5tn", "₦0.7tn", "₦1.3tn", "₦1.0tn", "₦33.23"], "Zenith Bank FY2023": ["₦1.4tn", "₦0.4tn", "₦1.0tn", "₦0.5tn", "₦0.8tn", "₦0.7tn", "₦21.70"],
    "GTCO FY2024": ["₦1.3tn", "₦0.3tn", "₦1.0tn", "₦0.4tn", "₦1.2tn", "₦1.0tn", "₦35.02"], "GTCO FY2023": ["₦0.8tn", "₦0.2tn", "₦0.6tn", "₦0.3tn", "₦0.6tn", "₦0.5tn", "₦19.21"],
    "Access Holdings FY2024": ["₦3.5tn", "₦2.0tn", "₦1.5tn", "₦1.1tn", "₦0.9tn", "₦0.6tn", "₦17.12"] };
  /* break-ui (dev only, ?data=worst|empty|one|huge): worst realistic data at the same boundary as the demo data. */
  var MODE = (/[?&]data=(worst|empty|one|huge)\b/.exec(location.search) || [])[1] || "";
  if (MODE) {
    var W = [["Guaranty Trust Holding Company Plc", "₦58.80", "+0.4%", "4.6", "7.7%", "Alert at ₦60"], ["UBA", "₦28.40", "−12.5%", "2.9", "8.8%", ""], ["Stanbic IBTC Holdings", "₦1,250.00", "+10.0%", "—", "0.0%", "Alert at ₦1,300.50"], ["FBN Holdings", "₦23.10", "0.0%", "3.0", "—", ""], ["Nestlé Nigeria", "₦1,050.00", "−1.9%", "24.0", "3.9%", ""]];
    var huge = []; for (var h = 0; h < 156; h++) huge.push([W[h % 5][0] + (h > 4 ? " " + (h + 1) : ""), W[h % 5][1], W[h % 5][2], W[h % 5][3], W[h % 5][4], ""]);
    LISTS["Banks · 4"] = MODE === "worst" ? W : MODE === "empty" ? [] : MODE === "one" ? [W[1]] : huge;
    REPORTS["Stanbic IBTC Holdings FY2024"] = ["₦12.84tn", "₦11.9tn", "₦0.94tn", "₦1.27tn", "−₦0.33tn", "−₦0.31tn", "−₦2.41"];
  }
  function devToggle() { if (!MODE && !/[?&]data=demo\b/.test(location.search)) return; if (document.getElementById("fv-data")) return;
    var bar = document.createElement("div"); bar.id = "fv-data"; bar.setAttribute("style", "position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:999;display:flex;gap:2px;padding:3px;border-radius:10px;background:#E5E7EB;font:12px system-ui,sans-serif");
    ["demo", "worst", "empty", "one", "huge"].forEach(function (m) { var a = document.createElement("a"); a.textContent = { demo: "Demo data", worst: "Worst case", empty: "Empty", one: "One", huge: "156 rows" }[m]; a.href = location.pathname + "?data=" + m;
      a.setAttribute("style", "padding:6px 10px;border-radius:8px;text-decoration:none;color:#111;" + ((MODE || "demo") === m ? "background:#fff" : "")); bar.appendChild(a); });
    document.body.appendChild(bar); }
  var LINES = ["Interest income", "Interest expense", "Net interest income", "Operating costs", "Profit before tax", "Profit after tax", "Earnings a share"];
  function reports() {
    var pk = byText("#dc-root span", /^(Zenith Bank FY2024|GTCO FY2024)▾$/); if (pk.length !== 2 || pk[0]._fv) return; pk[0]._fv = 1;
    var table = cardOf(byText("#dc-root span", /^Income statement$/)[0]), sel = [];
    pk[0].parentElement.style.flexWrap = "wrap"; pk.forEach(function (p, i) { var s = document.createElement("select"); s.setAttribute("aria-label", i ? "Second report" : "First report");
      s.setAttribute("style", "flex:1 1 170px;min-width:0;height:44px;border-radius:12px;border:1px solid #D5D9E0;background:#fff;padding:0 12px;font:inherit;font-size:16px;color:" + NAVY);
      Object.keys(REPORTS).forEach(function (k) { var o = document.createElement("option"); o.textContent = k; s.appendChild(o); }); s.value = i ? "GTCO FY2024" : "Zenith Bank FY2024"; p.replaceWith(s); sel.push(s); s.addEventListener("change", draw); });
    var short = function (k) { return k.replace(" Holdings", "").replace(" Bank", ""); };
    var grid = "display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:10px;padding:11px 0;border-top:1px solid " + LINE + ";font-size:14px;align-items:center";
    var take = cardOf(byText("#dc-root h2", /^What stands out$/)[0]);
    var num = function (v) { var m = /([−-])?₦([\d.,]+)(tn|bn)?/.exec(v); if (!m) return 0; var n = parseFloat(m[2].replace(/,/g, "")) * (m[3] === "bn" ? 0.001 : 1); return m[1] ? -n : n; };
    var cell = function (v) { return /^[−-]/.test(v) ? '<span style="color:' + RED + '">' + v + "</span>" : v; };
    function draw() { var a = REPORTS[sel[0].value], b = REPORTS[sel[1].value];
      table.innerHTML = '<div style="' + grid + ';border-top:0;font-size:12px;color:' + MUTE + '"><span>Income statement</span><span style="text-align:right">' + short(sel[0].value) + '</span><span style="text-align:right">' + short(sel[1].value) + "</span></div>" + LINES.map(function (l, i) { return '<div style="' + grid + (i === 5 ? ";font-weight:600" : "") + '"><span>' + l + '</span><span style="' + mono + ';text-align:right">' + cell(a[i]) + '</span><span style="' + mono + ';text-align:right">' + cell(b[i]) + "</span></div>"; }).join("");
      if (take) { var na = short(sel[0].value), nb = short(sel[1].value), pts = [];
        if (sel[0].value === sel[1].value) pts.push("You picked the same report twice. Choose another to compare.");
        else { var ia = num(a[0]), ib = num(b[0]), pa = num(a[5]), pb = num(b[5]), ma = ia ? pa / ia : 0, mb = ib ? pb / ib : 0;
          pts.push(ia === ib ? na + " and " + nb + " earn about the same interest." : (ia > ib ? na : nb) + " earns more interest income.");
          if (pa < 0 || pb < 0) pts.push(pa < 0 && pb < 0 ? "Both made a loss." : (pa < 0 ? na : nb) + " made a loss after tax.");
          else pts.push(Math.abs(ma - mb) < 0.02 ? "Both keep a similar share of their interest income as profit." : (ma > mb ? na : nb) + " keeps more of its interest income as profit."); }
        take.innerHTML = '<h2 style="margin:0;font-size:15px;font-weight:600">What stands out</h2>' + pts.map(function (t) { return '<div style="padding:10px 0;border-top:1px solid ' + LINE + ';font-size:14px;line-height:1.5">' + t + "</div>"; }).join(""); } }
    draw();
  }

  /* Practice portfolio tabs (owner, 17 Nov 2026): Holdings, Insights, Dividends, Crisis on the practice screen. The chosen
     tab is kept on <body>, outside the screen's own re-renders, and CSS shows the matching part. */
  function ptabs() {
    var tabs = document.querySelectorAll("[data-fv-ptab]"); if (!tabs.length) return;
    if (!document.getElementById("fv-ptab-css")) { var st = document.createElement("style"); st.id = "fv-ptab-css";
      st.textContent = "[data-fv-panel]{display:none !important}body[data-fv-tab=insights] [data-fv-panel=insights],body[data-fv-tab=dividends] [data-fv-panel=dividends],body[data-fv-tab=crisis] [data-fv-panel=crisis]{display:flex !important}body[data-fv-tab]:not([data-fv-tab=holdings]) [data-fv-holdings]{display:none !important}";
      document.head.appendChild(st); }
    var cur = document.body.getAttribute("data-fv-tab") || (/[?&]tab=(insights|dividends|crisis)\b/.exec(location.search) || [])[1] || "holdings";
    var set = function (k) { document.body.setAttribute("data-fv-tab", k); try { sessionStorage.setItem("fv.ptab", k); } catch (x) {}
      document.querySelectorAll("[data-fv-ptab]").forEach(function (b) { var on = b.getAttribute("data-fv-ptab") === k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1;
        b.style.background = on ? "#FFFFFF" : "transparent"; b.style.color = on ? NAVY : MUTE; b.style.fontWeight = on ? "600" : "400"; b.style.boxShadow = on ? "0 1px 2px rgba(0,0,0,.08)" : "none"; }); };
    tabs.forEach(function (b) { if (b._fv) return; b._fv = 1; b.addEventListener("click", function () { set(b.getAttribute("data-fv-ptab")); });
      b.addEventListener("keydown", function (e) { if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return; var all = Array.prototype.slice.call(document.querySelectorAll("[data-fv-ptab]")), i = all.indexOf(b), n = all[(i + (e.key === "ArrowRight" ? 1 : all.length - 1)) % all.length]; n.click(); n.focus(); }); });
    set(cur);
  }
  function run() { ptabs(); devToggle(); section(); scenarios(); crisis(); history(); watchlists(); reports(); }
  var tries = 0, it = setInterval(function () { if (document.querySelector("#dc-root > *")) { run(); if (++tries > 3) clearInterval(it); } else if (++tries > 80) clearInterval(it); }, 150);
})();
