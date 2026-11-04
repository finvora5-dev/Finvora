// Finvora prototype progress store. Saved in this browser only (localStorage).
// Boards read it through window.FV; nothing here is sent anywhere.
(function () {
  var KEY = "fv.proto.v1";
  var LESSONS = [
    { id: "money", title: "What money does", min: 3 },
    { id: "income", title: "Income and expenses", min: 3 },
    { id: "budget", title: "Budgeting", min: 4 },
    { id: "inflation", title: "Inflation and purchasing power", min: 4 },
    { id: "interest", title: "Simple and compound interest", min: 4 },
    { id: "emergency", title: "Emergency funds", min: 3 }
  ];
  var BOSS = { id: "boss", title: "The ₦100,000 plan" };
  function lagosDay(d) { return new Date((d || new Date()).getTime() + 3600000).toISOString().slice(0, 10); }
  function fresh() { return { done: 0, best: [], xp: 0, bossPassed: false, days: [], run: null }; }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!s || typeof s.done !== "number" || !Array.isArray(s.best) || !Array.isArray(s.days)) return fresh();
      s.done = Math.max(0, Math.min(LESSONS.length, s.done | 0));
      return s;
    } catch (e) { return fresh(); }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function streak(days) {
    var set = {}; days.forEach(function (d) { set[d] = 1; });
    var t = new Date(lagosDay() + "T00:00:00Z"), n = 0;
    if (!set[t.toISOString().slice(0, 10)]) t = new Date(t.getTime() - 86400000);
    while (set[t.toISOString().slice(0, 10)]) { n++; t = new Date(t.getTime() - 86400000); }
    return n;
  }

  // ---- Simulator: virtual money, made-up companies. Rules (fees, trades, valuation) come from
  // packages/domain via fvd.js. Prices move once a day on a fixed made-up path.
  var SIM_KEY = "fv.sim.v1", SIM_START = Date.UTC(2026, 9, 1), SIM_DAYS = 800;
  var COMPANIES = [
    { t: "ADF", name: "Adire Foods", sector: "Food", label: "Food and drink", base: 3000, div: 150, color: "#5B21B6" },
    { t: "KSP", name: "Kola Solar Power", sector: "Energy", label: "Energy", base: 12450, div: 0, color: "#0FA394" },
    { t: "NTB", name: "Nupe Trust Bank", sector: "Banking", label: "Banking", base: 5620, div: 300, color: "#7B4AF0" },
    { t: "OKM", name: "Okeke Motors", sector: "Transport", label: "Transport", base: 8100, div: 200, color: "#E8361C" },
    { t: "ZLT", name: "Zuri Telecom", sector: "Telecoms", label: "Telecoms", base: 2275, div: 0, color: "#4C1D95" }
  ];
  var series = {};
  function D() { return window.FVD; }
  function simDay() { return Math.max(1, Math.min(SIM_DAYS - 1, Math.floor((Date.now() + 3600000 - SIM_START) / 86400000))); }
  function pathOf(t) {
    if (!series[t]) { var c = COMPANIES.filter(function (x) { return x.t === t; })[0]; series[t] = D().priceSeries(t, c.base, SIM_DAYS, 0.016); }
    return series[t];
  }
  function simLoad() {
    try {
      var a = JSON.parse(localStorage.getItem(SIM_KEY) || "null");
      if (a && typeof a.cashKobo === "number" && Array.isArray(a.holdings) && Array.isArray(a.trades)) return a;
    } catch (e) {}
    return D().newAccount("sim-" + Date.now(), new Date().toISOString());
  }
  function simSave(a) { try { localStorage.setItem(SIM_KEY, JSON.stringify(a)); } catch (e) {} }
  function naira(k, sign) {
    var neg = k < 0; k = Math.abs(Math.round(k));
    var s = "₦" + Math.floor(k / 100).toLocaleString("en-NG") + (k % 100 ? "." + String(k % 100).padStart(2, "0") : "");
    return (sign ? (neg ? "−" : "+") : (neg ? "−" : "")) + s;
  }
  var SIM = {
    COMPANIES: COMPANIES, naira: naira, day: simDay,
    company: function (t) { return COMPANIES.filter(function (x) { return x.t === t; })[0] || COMPANIES[0]; },
    /** The company the page is about: ?t=ADF in the address, else Adire Foods. */
    current: function () { var m = /[?&]t=([A-Z]{3})/.exec(location.search); return SIM.company(m ? m[1] : "ADF"); },
    price: function (t) { return pathOf(t)[simDay()]; },
    prev: function (t) { return pathOf(t)[simDay() - 1]; },
    history: function (t, n) { var d = simDay(); return pathOf(t).slice(Math.max(0, d - n + 1), d + 1); },
    change: function (t) { var p = SIM.price(t), q = SIM.prev(t); return (p - q) / q * 100; },
    account: simLoad,
    started: function () { return !!localStorage.getItem(SIM_KEY); },
    held: function (t) { var h = simLoad().holdings.filter(function (x) { return x.ticker === t; })[0]; return h ? h.quantity : 0; },
    fee: function (gross) { return D().feeFor(gross); },
    valuation: function () { return D().valuePortfolio(simLoad(), SIM.price, SIM.prev); },
    /** Places one trade. The key stops a double tap placing it twice. */
    trade: function (side, t, qty, key) {
      var a = simLoad(), p = SIM.price(t);
      var r = D().executeTrade(a, { side: side, ticker: t, quantity: qty, quotedPriceKobo: p, currentPriceKobo: p, idempotencyKey: key, day: simDay(), at: new Date().toISOString(), tradeId: "tr-" + Date.now() });
      if (r.ok && !r.duplicate) { simSave(r.account); try { localStorage.setItem(SIM_KEY + ".last", JSON.stringify(r.trade)); } catch (e) {} }
      return r;
    },
    last: function () { try { return JSON.parse(localStorage.getItem(SIM_KEY + ".last") || "null"); } catch (e) { return null; } },
    reset: function () { try { localStorage.removeItem(SIM_KEY); localStorage.removeItem(SIM_KEY + ".last"); } catch (e) {} }
  };
  var FV = {
    LESSONS: LESSONS, BOSS: BOSS,
    get: load,
    streak: function () { return streak(load().days); },
    level: function (xp) { return xp >= 500 ? 4 : xp >= 250 ? 3 : xp >= 100 ? 2 : 1; },
    current: function () { var s = load(); return s.done < LESSONS.length ? LESSONS[s.done] : null; },
    // A lesson run: started on the first lesson screen, scored on the questions, committed on Lesson complete.
    startRun: function () { var s = load(); s.run = { answers: {} }; save(s); },
    answer: function (q, correct) {
      var s = load(); if (!s.run) s.run = { answers: {} };
      if (!(q in s.run.answers)) s.run.answers[q] = !!correct; // first try counts
      save(s);
    },
    finishRun: function () {
      var s = load(); if (!s.run) return null;
      var a = s.run.answers, keys = Object.keys(a), right = keys.filter(function (k) { return a[k]; }).length;
      var pct = keys.length ? Math.round(right / keys.length * 100) : 100;
      var xp = 10 + Math.round(5 * pct / 100), wrong = keys.length - right;
      if (s.done < LESSONS.length) { s.best[s.done] = pct; s.done += 1; }
      s.xp += xp; var d = lagosDay(); if (s.days.indexOf(d) < 0) s.days.push(d);
      s.run = null; save(s);
      return { xp: xp, pct: pct, wrong: wrong, streak: streak(s.days) };
    },
    passBoss: function (score) {
      var s = load(); var passed = score >= 4;
      if (passed && !s.bossPassed) { s.bossPassed = true; s.xp += 30; }
      var d = lagosDay(); if (s.days.indexOf(d) < 0) s.days.push(d);
      save(s); return passed;
    },
    SIM: SIM,
    reset: function () { save(fresh()); }
  };
  window.FV = FV;
})();
