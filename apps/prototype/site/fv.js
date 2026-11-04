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

  // ---- Plan (free or Plus). Set only by the simulated checkout; read by Ask Fin and Plus features.
  var BILL_KEY = "fv.billing.v1";
  function billLoad() {
    try { var b = JSON.parse(localStorage.getItem(BILL_KEY) || "null"); if (b && b.sub && Array.isArray(b.orders)) return b; } catch (e) {}
    return { sub: { plan: "free" }, orders: [] };
  }
  function billSave(b) { try { localStorage.setItem(BILL_KEY, JSON.stringify(b)); } catch (e) {} }
  function plan() { return D().effectivePlan(billLoad().sub, lagosDay()); }

  // ---- Ask Fin: scripted answers and refusals from packages/domain, free daily limit, saved chat.
  var ASK_KEY = "fv.ask.v1";
  function askLoad() {
    try { var a = JSON.parse(localStorage.getItem(ASK_KEY) || "null"); if (a && Array.isArray(a.msgs)) return a; } catch (e) {}
    return { usage: null, msgs: [] };
  }
  function askSave(a) { try { localStorage.setItem(ASK_KEY, JSON.stringify(a)); } catch (e) {} }
  var ASK = {
    status: function () { return D().canAsk(askLoad().usage, lagosDay(), D().entitlements(plan()).askFinDailyLimit); },
    limit: function () { return D().entitlements(plan()).askFinDailyLimit; },
    messages: function () { return askLoad().msgs; },
    suggestions: function () { return D().suggestedPrompts(null); },
    /** Answers one question, or returns null when today's free questions are used up. */
    ask: function (q) {
      q = String(q || "").trim(); if (!q) return null;
      if (!ASK.status().allowed) return null;
      var title = function (slug) { var a = D().ARTICLES.filter(function (x) { return x.slug === slug; })[0]; return a && a.title; };
      var r = D().answerQuestion(q, null, D().SCRIPTED_ANSWERS, title);
      var a = askLoad(); a.usage = D().recordAsk(a.usage, lagosDay());
      a.msgs = a.msgs.concat([{ q: q, r: r, at: new Date().toISOString() }]).slice(-30); askSave(a);
      return r;
    },
    clear: function () { var a = askLoad(); a.msgs = []; askSave(a); }
  };

  // ---- Simulated checkout (build-backlog B5). No card details, no real payment. Order rules come
  // from packages/domain: one order per purchase, retries reuse it, only our "server check" decides.
  // Reviewers can pick the next check result by opening a plan page with ?outcome=failed|slow|offline.
  var PRICE = { monthly: 150000, yearly: 1500000 }; // the designs' figures; the client hasn't set prices yet
  var PAY = {
    PRICE: PRICE,
    order: function (id) { return billLoad().orders.filter(function (o) { return o.id === id; })[0] || null; },
    orderNo: function (o) { return o ? "FV-" + o.id.slice(-5).toUpperCase() : ""; },
    current: function () { var m = /[?&]o=([\w-]+)/.exec(location.search); return m ? PAY.order(m[1]) : null; },
    remember: function () { var m = /[?&]outcome=(success|failed|slow|offline)/.exec(location.search); if (m) try { localStorage.setItem("fv.checkout.next", m[1]); } catch (e) {} },
    /** Starts a purchase, or returns what already exists (Plus, or an order still being checked). */
    start: function (period) {
      var b = billLoad(), can = D().canStartPurchase(b.sub, b.orders);
      if (!can.ok) return can;
      var o = D().createOrder("ord-" + Date.now().toString(36), period, PRICE[period], new Date().toISOString());
      b.orders = [o].concat(b.orders); billSave(b); return { ok: true, orderId: o.id };
    },
    /** Our server's check with the payment provider (simulated). Returns the order after the check. */
    check: function (id, slowAlready) {
      var next = "success"; try { next = localStorage.getItem("fv.checkout.next") || "success"; } catch (e) {}
      var result = next === "slow" ? (slowAlready ? "success" : "pending") : next;
      if (next !== "slow" || slowAlready) try { localStorage.removeItem("fv.checkout.next"); } catch (e) {}
      var b = billLoad(), o = b.orders.filter(function (x) { return x.id === id; })[0]; if (!o) return null;
      if (result === "offline") return { order: o, offline: true };
      var n = D().applyCheck(o, result, new Date().toISOString());
      if (n.status === "confirmedSuccess" && o.status !== "confirmedSuccess") b.sub = { plan: "plus", period: o.period, renewsOn: D().addPeriod(lagosDay(), o.period) };
      b.orders = b.orders.map(function (x) { return x.id === id ? n : x; }); billSave(b);
      return { order: n, offline: false };
    },
    retry: function (id) {
      var b = billLoad(), o = b.orders.filter(function (x) { return x.id === id; })[0];
      if (!o || o.status !== "confirmedFailed") return o;
      var n = D().retry(o, new Date().toISOString()); b.orders = b.orders.map(function (x) { return x.id === id ? n : x; }); billSave(b); return n;
    },
    cancel: function () { var b = billLoad(); b.sub.cancelled = true; billSave(b); },
    resume: function () { var b = billLoad(); b.sub.cancelled = false; billSave(b); },
    renewsOn: function (period) { return D().addPeriod(lagosDay(), period); },
    date: function (day) { return new Date(day + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
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
    SIM: SIM, ASK: ASK, PAY: PAY,
    plan: plan, billing: billLoad, saveBilling: billSave,
    reset: function () { save(fresh()); }
  };
  window.FV = FV;
})();
