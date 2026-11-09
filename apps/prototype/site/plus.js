// Plus learning tools screens (design Part 4). Draws into <main data-plus="..."> using the app's own classes.
// Rules live in packages/domain (plus.ts) through FV.PLUS; nothing here rates a company or gives advice.
(function () {
  var P, S;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function n(k) { return S.naira(k); }
  function bn(k) { var v = k / 100 / 1e9; return (v < 0 ? "−₦" : "₦") + Math.abs(v).toFixed(Math.abs(v) < 10 ? 1 : 0) + "bn"; }
  function q(name) { var m = new RegExp("[?&]" + name + "=([^&]+)").exec(location.search); return m ? decodeURIComponent(m[1]) : ""; }
  var MADE = '<p class="muted" style="margin: 0; font-size: 12px">All figures are made up for practice.</p>';
  function card(inner, pad) { return '<div class="card" style="' + (pad === 0 ? "overflow: hidden" : "padding: 16px; display: flex; flex-direction: column; gap: 10px") + '">' + inner + "</div>"; }
  function head(t, sub) { return '<div style="display: flex; flex-direction: column; gap: 4px"><h1 style="font-size: 24px">' + esc(t) + "</h1>" + (sub ? '<p class="muted" style="margin: 0; font-size: 14px">' + esc(sub) + "</p>" : "") + "</div>"; }
  function li(href, t, sub, right) { return '<a class="li press" href="' + href + '"><span style="flex: 1; display: flex; flex-direction: column"><b style="font-size: 16px">' + esc(t) + "</b>" + (sub ? '<span class="muted" style="font-size: 13px">' + esc(sub) + "</span>" : "") + "</span>" + (right || '<span aria-hidden="true" style="font-size: 20px; color: #5B21B6">›</span>') + "</a>"; }
  var LOCK = '<svg width="18" height="18" viewBox="0 0 24 24" aria-label="Plus only"><rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="#615A6E" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="#615A6E" stroke-width="2"/></svg>';
  var TOOLS = [
    ["USimMeasures.dc.html", "What this number means", "P/E, debt and dividends, explained"],
    ["USimPortfolio.dc.html", "Your practice portfolio", "Where your virtual naira sits"],
    ["USimCrisis.dc.html", "Crisis practice", "Live through a made-up market crash"],
    ["UPScenario.dc.html", "Money scenarios", "Salary day, surprise bills, rising prices"],
    ["USimDividends.dc.html", "Dividend tracker", "When your practice companies pay"],
    ["USimCompareTime.dc.html", "Compare over time", "Two companies, five years"],
    ["USimWatchlists.dc.html", "Watchlists", "Lists, notes and price alerts"]
  ];
  function locked() {
    return head("A Plus tool", "Practice with made-up companies and virtual naira.") + card('<p style="margin: 0">This tool comes with Plus. Plus also gives you every World and unlimited Ask Fin.</p><a class="btn" href="USUpgrade.dc.html">Get Plus</a>');
  }
  function chips(list, cur, href) {
    return '<div style="display: flex; flex-wrap: wrap; gap: 8px">' + list.map(function (c) { var on = c.ticker === cur; return '<a class="chip' + (on ? " chip-on" : "") + '" aria-pressed="' + on + '" href="' + href(c.ticker) + '">' + esc(c.name) + "</a>"; }).join("") + "</div>";
  }

  var R = {
    hub: function () {
      var on = P.on(), al = on ? P.alerts() : [];
      var alert = al.length ? card("<b>Price moves on your watchlists</b>" + al.map(function (a) { return '<span class="num">' + esc(P.company(a.t).name) + ": " + (a.change >= 0 ? "up " : "down ") + Math.abs(a.change).toFixed(1) + "% since the last trading day</span>"; }).join("")) : "";
      return head("Plus tools", "Practice with made-up companies and virtual naira.") + alert +
        card(TOOLS.map(function (t) { return on ? li(t[0], t[1], t[2]) : li("USUpgrade.dc.html", t[1], "", LOCK); }).join(""), 0) +
        (on ? "" : '<a class="btn" href="USUpgrade.dc.html">Get Plus</a>') + MADE;
    },
    measures: function () {
      var cos = P.companies(), t = q("t") || "ADF", c = P.company(t) || cos[0], r = P.measures(c.ticker), m = r.m, pos = r.pos;
      var rows = [
        ["P/E ratio", m.pe === null ? "No profit" : m.pe.toFixed(1), m.pe === null ? "P/E needs a profit. This company made a loss or no profit, so there is no P/E." : "Price divided by profit per share. People pay " + n(Math.round(m.pe * 100)) + " for each ₦1 of yearly profit.", pos.pe, "price-to-earnings"],
        ["Debt to equity", m.debtToEquity.toFixed(1), "For each ₦1 the owners put in, the company owes " + n(Math.round(m.debtToEquity * 100)) + ". Banks usually borrow much more than other companies.", pos.debtToEquity, "risk-and-return"],
        ["Price swing (30 days)", m.swingPct + "%", "How far the price moved between its high and low over the last 30 trading days.", pos.swingPct, "risk-and-return"],
        ["Dividend cover", m.dividendCover === null ? "No dividend" : m.dividendCover.toFixed(1) + "×", m.dividendCover === null ? "This company pays no dividend, so there is nothing to cover." : "Profit is " + m.dividendCover.toFixed(1) + " times the dividend paid out.", pos.dividendCover, "dividend"]
      ];
      return head("What this number means", c.name + " · made-up figures for practice") + chips(cos, c.ticker, function (x) { return "USimMeasures.dc.html?t=" + x; }) +
        card(rows.map(function (r) {
          return '<div style="padding: 16px; display: flex; flex-direction: column; gap: 6px; border-top: 1px solid #E7E2F0"><div class="row" style="justify-content: space-between"><b>' + r[0] + '</b><b class="num" style="font-size: 18px">' + r[1] + '</b></div><span class="muted" style="font-size: 14px">' + esc(r[2]) + '</span><div class="row" style="justify-content: space-between"><span class="chip" style="min-height: 30px; font-size: 12px">' + (r[3] === "not applicable" ? "Not applicable" : "Among the five: " + r[3]) + '</span><a href="UPArticle.dc.html?a=' + r[4] + '" style="font-size: 13px; font-weight: 700">Learn this</a></div></div>';
        }).join(""), 0) + MADE;
    },
    portfolio: function () {
      var x = P.mix();
      if (!x.companyCount) return head("Your practice portfolio") + card('<p style="margin: 0">You have no practice shares yet. Buy a few to see where your virtual naira sits.</p><a class="btn" href="USimMarket.dc.html">Find a company</a>');
      var bars = x.sectors.map(function (s) { return '<div style="display: flex; flex-direction: column; gap: 4px"><div class="row" style="justify-content: space-between; font-size: 14px"><span>' + esc(s.label) + '</span><b class="num">' + s.pct + '%</b></div><div class="bar"><div style="width: ' + s.pct + '%"></div></div></div>'; }).join("");
      return head("Your practice portfolio", "Virtual naira in made-up companies") +
        card('<span class="muted eyebrow">In shares</span><b class="num" style="font-size: 28px">' + n(x.investedKobo) + '</b><span class="muted num" style="font-size: 14px">Cash not invested: ' + n(x.cashKobo) + "</span>") +
        card("<b>By sector</b>" + bars + '<span class="muted" style="font-size: 13px">Money spread across sectors means one bad sector hurts less. It lowers risk but does not remove it.</span>') +
        card('<div class="row" style="justify-content: space-between"><b>Biggest holding</b><b class="num">' + esc(P.company(x.biggest.ticker).name) + " · " + x.biggest.pct + '%</b></div><span class="muted" style="font-size: 13px">The share of your invested money in one company.</span>' +
          '<div class="row" style="justify-content: space-between"><b>Companies</b><b class="num">' + x.companyCount + " of 5</b></div>" +
          '<div class="row" style="justify-content: space-between"><b>Fees paid so far</b><b class="num">' + n(x.feesKobo) + '</b></div><span class="muted" style="font-size: 13px">Every trade has a fee. Frequent small trades add up.</span>') + MADE;
    },
    crisis: function () {
      var r = P.run(), id = q("start");
      if (id) { P.startCrisis(id); location.replace("USimCrisis.dc.html"); return ""; }
      if (!r || q("pick")) {
        return head("Crisis practice", "Live through a made-up market crash with a copy of your practice portfolio. Your real practice portfolio does not change.") +
          card(window.FVD.CRISES.map(function (c) { return li("USimCrisis.dc.html?start=" + c.id, c.title, c.style + " · made-up figures"); }).join(""), 0) + MADE;
      }
      var c = P.crisis(r.id), done = r.step >= c.steps.length, now = P.total(r.pos), diff = now - r.start;
      var top = '<span class="muted eyebrow">' + (r.example ? "Example portfolio" : "Your practice portfolio") + '</span><b class="num" style="font-size: 30px">' + n(now) + '</b><span class="num" style="font-weight: 700; color: ' + (diff < 0 ? "#B42828" : "#0F6B39") + '">' + (diff < 0 ? "▼ " : "▲ ") + n(Math.abs(diff)) + " since the shock began</span>";
      if (!done) {
        var st = c.steps[r.step];
        return head(c.title, c.style + " · made-up figures · step " + (r.step + 1) + " of " + c.steps.length) + card(top + '<p style="margin: 0">' + esc(st.text) + "</p>") +
          '<b>What do you do?</b><button type="button" class="btn btn-w" data-choice="keep">Keep everything</button><button type="button" class="btn btn-w" data-choice="cash">Move some to cash</button><button type="button" class="btn btn-w" data-choice="add">Add more</button>' +
          '<p class="muted" style="margin: 0; font-size: 12px; text-align: center">There is no right answer. You will see what happened at the end.</p>';
      }
      var still = P.total(r.still), names = { keep: "Kept everything", cash: "Moved some to cash", add: "Added more" };
      return head(c.title + ": how it went", c.style + " · made-up figures") + card(top) +
        card('<div class="row" style="justify-content: space-between"><span>Your path</span><b class="num">' + n(now) + '</b></div><div class="row" style="justify-content: space-between"><span>If nothing changed</span><b class="num">' + n(still) + "</b></div>" +
          '<span class="muted" style="font-size: 13px">' + r.path.map(function (p, i) { return "Step " + (i + 1) + ": " + names[p]; }).join(" · ") + "</span>") +
        card('<p style="margin: 0">' + esc(c.end) + '</p><p class="muted" style="margin: 0; font-size: 13px">What really happened: ' + esc(c.history) + "</p>") +
        '<a class="btn" href="USimCrisis.dc.html?pick=1">Try another crisis</a><a class="btn btn-w" href="USimPlus.dc.html">Back to Plus tools</a>';
    },
    scenario: function () {
      var k = q("s") || "salary", tabs = [["salary", "Salary day"], ["bill", "Surprise bill"], ["prices", "Prices rising"]];
      var tabHtml = '<div style="display: flex; flex-wrap: wrap; gap: 8px">' + tabs.map(function (t) { return '<a class="chip' + (t[0] === k ? " chip-on" : "") + '" href="UPScenario.dc.html?s=' + t[0] + '">' + t[1] + "</a>"; }).join("") + "</div>";
      function slider(id, label, min, max, step, val, fmt) { return '<label for="' + id + '" style="display: flex; flex-direction: column; gap: 6px"><span class="row" style="justify-content: space-between"><b>' + label + '</b><span class="num" id="' + id + '-v">' + fmt(val) + '</span></span><input id="' + id + '" type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" data-fmt="' + id + '" style="width: 100%; accent-color: #5B21B6"></label>'; }
      var body = k === "salary"
        ? card(slider("sal", "Monthly salary", 50000, 500000, 10000, 150000, function (v) { return n(v * 100); }) + slider("needs", "Needs (rent, food, transport)", 30, 80, 5, 50, function (v) { return v + "%"; }) + slider("wants", "Wants (outings, treats)", 0, 40, 5, 30, function (v) { return v + "%"; })) + card('<div id="out"></div>')
        : k === "bill"
          ? card(slider("bill", "Surprise bill", 10000, 300000, 10000, 50000, function (v) { return n(v * 100); }) + slider("sav", "Emergency savings", 0, 300000, 10000, 20000, function (v) { return n(v * 100); }) + slider("rate", "Loan interest a month", 1, 15, 1, 5, function (v) { return v + "%"; })) + card('<div id="out"></div>')
          : card(slider("save", "Savings", 10000, 1000000, 10000, 100000, function (v) { return n(v * 100); }) + slider("inf", "Inflation a year", 5, 35, 1, 20, function (v) { return v + "%"; }) + slider("yrs", "Years", 1, 10, 1, 3, function (v) { return v + (v === 1 ? " year" : " years"); })) + card('<div id="out"></div>');
      return head("Money scenarios", "Move the sliders and see what happens.") + tabHtml + body + '<button type="button" class="btn" data-done="' + k + '">I tried this one</button>';
    },
    dividends: function () {
      var rows = P.dividends(), today = P.day();
      if (!rows.length) return head("Dividend tracker") + card('<p style="margin: 0">You own no practice shares yet. Companies that pay dividends show up here once you buy some.</p><a class="btn" href="USimMarket.dc.html">Find a company</a>');
      var total = rows.reduce(function (s, r) { return s + r.receivedKobo; }, 0);
      return head("Dividend tracker", "Made-up yearly dividends on your practice shares") +
        card('<span class="muted eyebrow">Received so far</span><b class="num" style="font-size: 28px">' + n(total) + '</b><span class="muted" style="font-size: 13px">Shown here only; practice dividends are not added to your cash.</span>') +
        card(rows.map(function (r) {
          var right = r.pays ? '<span class="num" style="text-align: right; font-size: 14px"><b>' + n(r.nextKobo) + "</b><br>in " + (r.nextDay - today) + " trading days</span>" : '<span class="muted" style="font-size: 13px">Pays no dividend</span>';
          return '<div class="li"><span style="flex: 1; display: flex; flex-direction: column"><b>' + esc(r.name) + '</b><span class="muted num" style="font-size: 13px">' + (r.pays ? n(r.perShareKobo) + " a share · received " + n(r.receivedKobo) : "Keeps its profit to grow") + "</span></span>" + right + "</div>";
        }).join(""), 0) + MADE;
    },
    compare: function () {
      var cos = P.companies(), a = q("a") || "ADF", b = q("b") || "NTB", A = P.company(a), B = P.company(b);
      var CA = "#5B21B6", CB = "#0FA394", ha = P.history(a), hb = P.history(b), metrics = [["Revenue", "revenueKobo"], ["Profit", "profitKobo"], ["Dividend a share", "dividendPerShareKobo"]];
      function chart(key) {
        var all = ha.concat(hb).map(function (y) { return Math.abs(y[key]); }), max = Math.max.apply(null, all) || 1;
        var fmt = key === "dividendPerShareKobo" ? n : bn;
        return '<div style="display: grid; grid-template-columns: 44px 1fr; gap: 6px 10px; align-items: center; font-size: 13px">' + ha.map(function (y, i) {
          var yb = hb[i];
          return '<span class="muted num">' + y.year + '</span><span style="display: flex; flex-direction: column; gap: 3px"><span class="row" style="gap: 6px"><span style="height: 10px; border-radius: 6px; background: ' + CA + "; width: " + Math.max(2, Math.abs(y[key]) / max * 70) + '%"></span><span class="num">' + fmt(y[key]) + '</span></span><span class="row" style="gap: 6px"><span style="height: 10px; border-radius: 6px; background: ' + CB + "; width: " + Math.max(2, Math.abs(yb[key]) / max * 70) + '%"></span><span class="num">' + fmt(yb[key]) + "</span></span></span>";
        }).join("") + "</div>";
      }
      var other = function (x) { return cos.filter(function (c) { return c.ticker !== x; }); };
      return head("Compare over time", "Five made-up years, side by side") +
        '<span class="muted eyebrow">First</span>' + chips(other(b), a, function (x) { return "USimCompareTime.dc.html?a=" + x + "&b=" + b; }) +
        '<span class="muted eyebrow">Second</span>' + chips(other(a), b, function (x) { return "USimCompareTime.dc.html?a=" + a + "&b=" + x; }) +
        '<div class="row" style="gap: 14px; font-size: 13px"><span class="row" style="gap: 6px"><span style="width: 12px; height: 12px; border-radius: 4px; background: ' + CA + '"></span>' + esc(A.name) + '</span><span class="row" style="gap: 6px"><span style="width: 12px; height: 12px; border-radius: 4px; background: ' + CB + '"></span>' + esc(B.name) + "</span></div>" +
        metrics.map(function (m) { return card("<b>" + m[0] + "</b>" + chart(m[1])); }).join("") +
        '<p class="muted" style="margin: 0; font-size: 13px">Compare trends, not single years. A company can grow revenue while profit falls if its costs grow faster.</p>' + MADE;
    },
    watchlists: function () {
      var lists = P.lists(), i = Math.min(+q("l") || 0, lists.length - 1), L = lists[i], cos = P.companies(), al = P.alertBps();
      return head("Watchlists", "Follow practice companies and get a note when a price moves a lot") +
        '<div style="display: flex; flex-wrap: wrap; gap: 8px">' + lists.map(function (l, k) { return '<a class="chip' + (k === i ? " chip-on" : "") + '" href="USimWatchlists.dc.html?l=' + k + '">' + esc(l.name) + "</a>"; }).join("") + '<button type="button" class="chip" data-newlist="1">+ New list</button></div>' +
        card(cos.map(function (c) {
          var on = L.tickers.indexOf(c.ticker) >= 0, ch = S.change(c.ticker);
          return '<div class="li" style="flex-wrap: wrap"><label class="row" style="flex: 1; gap: 10px; cursor: pointer"><input type="checkbox" data-watch="' + c.ticker + '"' + (on ? " checked" : "") + ' style="width: 20px; height: 20px; accent-color: #5B21B6"><span style="display: flex; flex-direction: column"><b>' + esc(c.name) + '</b><span class="muted num" style="font-size: 13px">' + n(S.price(c.ticker)) + " · " + (ch >= 0 ? "▲ " : "▼ ") + Math.abs(ch).toFixed(1) + "%</span></span></label>" +
            (on ? '<label style="width: 100%"><span class="sr">Note on ' + esc(c.name) + '</span><input class="field" data-note="' + c.ticker + '" value="' + esc(L.notes[c.ticker] || "") + '" placeholder="Add a note, for example why you follow it" style="width: 100%; box-sizing: border-box; height: 44px; border-radius: 12px; border: 1.5px solid #E7E2F0; padding: 0 12px; font: 500 14px \'Plus Jakarta Sans\', sans-serif"></label>' : "") + "</div>";
        }).join(""), 0) +
        card('<b>Price alerts</b><span class="muted" style="font-size: 13px">Shown on Plus tools when a company on your lists moves more than this since the last trading day.</span><div style="display: flex; gap: 8px">' + [200, 500, 1000].map(function (b) { return '<button type="button" class="chip' + (b === al ? " chip-on" : "") + '" aria-pressed="' + (b === al) + '" data-alert="' + b + '">' + b / 100 + "%</button>"; }).join("") + "</div>") + MADE;
    }
  };

  function scenarioOut(main) {
    var D = window.FVD, v = function (id) { var e = main.querySelector("#" + id); return e ? +e.value : 0; }, out = main.querySelector("#out"); if (!out) return;
    main.querySelectorAll("input[type=range]").forEach(function (r) { var lab = main.querySelector("#" + r.id + "-v"), f = r.id; if (lab) lab.textContent = /needs|wants|rate|inf/.test(f) ? r.value + "%" : f === "yrs" ? r.value + (r.value === "1" ? " year" : " years") : n(+r.value * 100); });
    if (main.querySelector("#sal")) {
      var w = Math.min(v("wants"), 100 - v("needs")), x = D.salarySplit(v("sal") * 100, v("needs") * 100, w * 100);
      out.innerHTML = '<div class="row" style="justify-content: space-between"><span>Needs</span><b class="num">' + n(x.needsKobo) + '</b></div><div class="row" style="justify-content: space-between"><span>Wants</span><b class="num">' + n(x.wantsKobo) + '</b></div><div class="row" style="justify-content: space-between"><span>Savings</span><b class="num">' + n(x.savingsKobo) + '</b></div><p class="muted" style="margin: 8px 0 0; font-size: 13px">' + (x.savingsKobo > 0 ? "Saving " + n(x.savingsKobo) + " a month is " + n(x.savingsKobo * 12) + " in a year, before any interest." : "Nothing is left to save. Try lowering wants.") + "</p>";
    } else if (main.querySelector("#bill")) {
      var y = D.surpriseBill(v("bill") * 100, v("sav") * 100, v("rate") * 100, 3);
      out.innerHTML = '<div class="row" style="justify-content: space-between"><span>Paid from savings</span><b class="num">' + n(y.fromSavingsKobo) + '</b></div><div class="row" style="justify-content: space-between"><span>Borrowed</span><b class="num">' + n(y.borrowedKobo) + '</b></div><div class="row" style="justify-content: space-between"><span>Paid back after 3 months</span><b class="num">' + n(y.repayKobo) + '</b></div><p class="muted" style="margin: 8px 0 0; font-size: 13px">' + (y.borrowedKobo ? "Borrowing cost you " + n(y.extraCostKobo) + " extra. An emergency fund avoids that cost." : "Your emergency savings covered it, with nothing extra to pay.") + "</p>";
    } else {
      var start = v("save") * 100, left = D.buyingPower(start, v("inf") * 100, v("yrs"));
      out.innerHTML = '<div class="row" style="justify-content: space-between"><span>Saved today</span><b class="num">' + n(start) + '</b></div><div class="row" style="justify-content: space-between"><span>What it buys after ' + v("yrs") + (v("yrs") === 1 ? " year" : " years") + '</span><b class="num">' + n(left) + '</b></div><p class="muted" style="margin: 8px 0 0; font-size: 13px">Money that sits still loses ' + n(start - left) + " of buying power in today's prices. Growth faster than inflation keeps up.</p>";
    }
  }

  function render() {
    var main = document.querySelector("[data-plus]"); if (!main || !window.FV || !window.FV.PLUS) return;
    P = window.FV.PLUS; S = window.FV.SIM;
    var kind = main.getAttribute("data-plus");
    main.style.maxWidth = "720px"; main.style.width = "100%"; main.style.margin = "0 auto"; main.style.boxSizing = "border-box";
    var html = kind !== "hub" && !P.on() ? locked() : R[kind]();
    if (html) main.innerHTML = html;
    main.onclick = function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.choice) { P.choose(b.dataset.choice); render(); window.scrollTo(0, 0); }
      if (b.dataset.done) { var t = { salary: "Salary day", bill: "Surprise bill", prices: "Prices rising" }[b.dataset.done]; var xp = P.scenarioDone(b.dataset.done, t); if (!xp && window.fvToast) window.fvToast("Done. You already earned XP for this one."); }
      if (b.dataset.alert) { P.setAlert(+b.dataset.alert); render(); if (window.fvToast) window.fvToast("Alert size saved."); }
      if (b.dataset.newlist) { P.addList("List " + (P.lists().length + 1)); location.href = "USimWatchlists.dc.html?l=" + (P.lists().length - 1); }
    };
    main.onchange = function (e) {
      var w = e.target.dataset.watch, note = e.target.dataset.note, i = Math.min(+q("l") || 0, P.lists().length - 1);
      if (w) { P.toggle(i, w); render(); }
      if (note) { P.note(i, note, e.target.value); if (window.fvToast) window.fvToast("Note saved."); }
    };
    main.oninput = function (e) { if (e.target.type === "range") scenarioOut(main); };
    if (kind === "scenario") scenarioOut(main);
  }
  window.fvPlusRender = render;
})();
