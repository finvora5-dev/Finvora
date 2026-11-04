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
  // Streak in Lagos days. One rest day a week (Monday to Sunday) keeps it going, as the Streak screen says.
  function iso(t) { return t.toISOString().slice(0, 10); }
  function weekOf(t) { var d = new Date(t.getTime()); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return iso(d); }
  function runEnding(set, start, openToday) {
    var t = new Date(start + "T00:00:00Z"), n = 0, rest = {}, restDays = [];
    if (openToday && !set[iso(t)]) t = new Date(t.getTime() - 86400000);
    for (var guard = 0; guard < 4000; guard++) {
      if (set[iso(t)]) { n++; }
      else {
        var prev = new Date(t.getTime() - 86400000), wk = weekOf(t);
        if (rest[wk] || !set[iso(prev)] || n === 0 && !openToday) break;
        rest[wk] = true; restDays.push(iso(t)); n++;
      }
      t = new Date(t.getTime() - 86400000);
    }
    return { n: n, rest: restDays };
  }
  function streak(days) { var set = {}; days.forEach(function (d) { set[d] = 1; }); return runEnding(set, lagosDay(), true).n; }

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
    reset: function () { try { localStorage.removeItem(SIM_KEY); localStorage.removeItem(SIM_KEY + ".last"); localStorage.removeItem(SIM_KEY + ".queue"); } catch (e) {} },
    /** The practice market follows trading hours from packages/domain config (weekdays, Lagos time). */
    isOpen: function () {
      try { if (JSON.parse(localStorage.getItem("fv.prefs.v1") || "{}").alwaysOpen) return true; } catch (e) {}
      var C = D().CONFIG, now = new Date(Date.now() + 3600000), day = now.getUTCDay(), hm = now.toISOString().slice(11, 16);
      return day >= 1 && day <= 5 && hm >= C.MARKET_OPEN && hm < C.MARKET_CLOSE;
    },
    hours: function () { var C = D().CONFIG; return "weekdays " + C.MARKET_OPEN + " to " + C.MARKET_CLOSE + ", Lagos time"; },
    queued: function () { try { return JSON.parse(localStorage.getItem(SIM_KEY + ".queue") || "[]"); } catch (e) { return []; } },
    queue: function (side, t, qty) { var q = SIM.queued(); q.push({ side: side, t: t, qty: qty, key: "q-" + Date.now() }); try { localStorage.setItem(SIM_KEY + ".queue", JSON.stringify(q)); } catch (e) {} },
    cancelQueued: function (key) { try { localStorage.setItem(SIM_KEY + ".queue", JSON.stringify(SIM.queued().filter(function (o) { return o.key !== key; }))); } catch (e) {} },
    /** Places queued orders once the market is open. Returns how many were placed. */
    runQueue: function () {
      if (!SIM.isOpen()) return 0; var q = SIM.queued(), n = 0; if (!q.length) return 0;
      q.forEach(function (o) { if (SIM.trade(o.side, o.t, o.qty, o.key).ok) n++; });
      try { localStorage.setItem(SIM_KEY + ".queue", "[]"); } catch (e) {} return n;
    }
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

  // ---- Sign-in (simulated, no email is sent). Any 6 digits sign you in, except the reviewer
  // codes 000000 (wrong) and 111111 (expired). Three wrong codes lock the form for 15 minutes.
  var AUTH_KEY = "fv.auth.v1";
  function authLoad() { try { var a = JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); if (a && typeof a === "object") return a; } catch (e) {} return {}; }
  function authSave(a) { try { localStorage.setItem(AUTH_KEY, JSON.stringify(a)); } catch (e) {} }
  var AUTH = {
    get: authLoad,
    signedIn: function () { return !!authLoad().email; },
    setGoal: function (g) { var a = authLoad(); a.goal = g; authSave(a); },
    validEmail: function (e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim()); },
    sendCode: function (email, changing) { var a = authLoad(); a.pending = String(email).trim().toLowerCase(); a.sentAt = Date.now(); a.wrong = 0; a.lockUntil = 0; a.changing = !!changing; authSave(a); },
    resendIn: function () { var a = authLoad(); return Math.max(0, Math.ceil(((a.sentAt || 0) + 60000 - Date.now()) / 1000)); },
    lockedFor: function () { var a = authLoad(); return Math.max(0, Math.ceil(((a.lockUntil || 0) - Date.now()) / 1000)); },
    triesLeft: function () { return Math.max(0, 3 - (authLoad().wrong || 0)); },
    /** "ok", "wrong", "expired" or "locked". */
    verify: function (code) {
      var a = authLoad();
      if (AUTH.lockedFor() > 0) return "locked";
      if (code === "111111" || Date.now() - (a.sentAt || 0) > 600000) return "expired";
      if (code === "000000") { a.wrong = (a.wrong || 0) + 1; if (a.wrong >= 3) a.lockUntil = Date.now() + 900000; authSave(a); return a.wrong >= 3 ? "locked" : "wrong"; }
      var keepName = a.changing && a.name; a.email = a.pending; a.name = keepName || (a.email || "").split("@")[0].replace(/^\w/, function (c) { return c.toUpperCase(); }); a.wrong = 0; authSave(a); return "ok";
    },
    setBirth: function (d) { var a = authLoad(); a.birth = d; authSave(a); },
    setReminder: function (on) { var a = authLoad(); a.reminder = on ? "19:00" : null; a.asked = true; authSave(a); },
    signOut: function () { var a = authLoad(); delete a.email; delete a.pending; authSave(a); }
  };

  // ---- Library: the 15 articles in packages/sample-data, saved articles, reading progress, search.
  var LIB_KEY = "fv.lib.v1";
  var TOPICS = [
    { name: "Money basics", cats: ["Money basics"], blurb: "from what money does to budgeting" },
    { name: "Investing", cats: ["Investing", "Decisions and risk"], blurb: "from first share to building a mix" },
    { name: "Markets across Africa", cats: ["Markets", "Nigerian market"], blurb: "how exchanges and markets work" },
    { name: "Companies and reports", cats: ["Company analysis"], blurb: "reading profit, dividends and value" }
  ];
  function libLoad() { try { var l = JSON.parse(localStorage.getItem(LIB_KEY) || "null"); if (l && Array.isArray(l.saved)) return l; } catch (e) {} return { saved: [], read: {}, recent: [] }; }
  function libSave(l) { try { localStorage.setItem(LIB_KEY, JSON.stringify(l)); } catch (e) {} }
  function arts() { return D().ARTICLES; }
  var LIB = {
    TOPICS: TOPICS,
    all: arts,
    article: function (slug) { return arts().filter(function (a) { return a.slug === slug; })[0] || null; },
    /** The article the page is about: ?a=slug in the address, else Dividend (the designed example). */
    current: function () { var m = /[?&]a=([\w-]+)/.exec(location.search); return LIB.article(m ? m[1] : "dividend") || LIB.article("dividend"); },
    minutes: function (a) { var w = [a.definition, a.example, a.whyItMatters].concat(a.explanation, a.misconceptions || []).join(" ").split(/\s+/).length; return Math.max(1, Math.round(w / 60)); },
    topicOf: function (a) { return TOPICS.filter(function (t) { return t.cats.indexOf(a.category) >= 0; })[0] || TOPICS[0]; },
    inTopic: function (name) { var t = TOPICS.filter(function (x) { return x.name === name; })[0] || TOPICS[1]; return { topic: t, items: arts().filter(function (a) { return t.cats.indexOf(a.category) >= 0; }) }; },
    wordOfDay: function () { var n = Math.floor((Date.now() + 3600000) / 86400000); return arts()[n % arts().length]; },
    isSaved: function (slug) { return libLoad().saved.indexOf(slug) >= 0; },
    toggleSave: function (slug) { var l = libLoad(), i = l.saved.indexOf(slug); if (i >= 0) l.saved.splice(i, 1); else l.saved.unshift(slug); libSave(l); return i < 0; },
    saved: function () { return libLoad().saved.map(LIB.article).filter(Boolean); },
    setRead: function (slug, pct) { var l = libLoad(); l.read = l.read || {}; var old = l.read[slug]; if (!old) { var a0 = LIB.article(slug), m0 = load(); logEvent(m0, 'article', a0 ? a0.title : slug, 'UPArticle.dc.html?a=' + slug, 0); save(m0); } if (!old || pct > old.pct) { l.read[slug] = { pct: pct, at: Date.now() }; libSave(l); } else if (old) { old.at = Date.now(); libSave(l); } },
    reading: function () { var r = libLoad().read || {}; return Object.keys(r).filter(function (k) { return r[k].pct < 90 && LIB.article(k); }).sort(function (a, b) { return r[b].at - r[a].at; }).map(function (k) { return { a: LIB.article(k), pct: r[k].pct }; }); },
    addRecent: function (q) { q = String(q).trim(); if (!q) return; var l = libLoad(); l.recent = [q].concat((l.recent || []).filter(function (x) { return x.toLowerCase() !== q.toLowerCase(); })).slice(0, 5); libSave(l); },
    recent: function () { return libLoad().recent || []; },
    index: function () {
      var items = arts().map(function (a) { return { kind: "article", id: a.slug, title: a.title, subtitle: "Term · " + a.category, href: "UPArticle.dc.html?a=" + a.slug, keywords: a.definition }; });
      LESSONS.forEach(function (l, i) { items.push({ kind: "lesson", id: l.id, title: l.title, subtitle: "Lesson " + (i + 1) + " · " + l.min + " min", href: "UPJourney.dc.html", keywords: l.title }); });
      return items;
    },
    search: function (q) { var idx = LIB.index(); return { results: D().search(idx, q), didYouMean: D().suggest(idx, q) }; }
  };

  // ---- Admin (a demonstration in this browser, not real staff access): feedback prompt settings,
  // the feedback inbox and an append-only audit log of admin changes.
  var ADM_KEY = "fv.admin.v1";
  function admLoad() { try { var a = JSON.parse(localStorage.getItem(ADM_KEY) || "null"); if (a && a.on) return a; } catch (e) {} return { on: { rate: true, report: true, suggest: true, review: true }, n: 3, audit: [], inbox: [], rates: 0 }; }
  function admSave(a) { try { localStorage.setItem(ADM_KEY, JSON.stringify(a)); } catch (e) {} }
  function stamp() { return new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).replace(",", ","); }
  var ADMIN = {
    settings: admLoad,
    on: function (k) { return admLoad().on[k] !== false; },
    /** Rating prompt shows on 1 in N finished lessons. */
    showRate: function () { var a = admLoad(); return a.on.rate !== false && (load().done % Math.max(1, a.n || 1) === 0); },
    log: function (area, what) { var a = admLoad(); a.audit.unshift({ when: stamp(), who: "You (admin)", area: area, what: what }); admSave(a); },
    set: function (k, on) { var a = admLoad(); a.on[k] = on; admSave(a); },
    setN: function (n) { var a = admLoad(); a.n = n; admSave(a); },
    submit: function (kind, where, what, note) { var a = admLoad(); a.inbox.unshift({ id: "fb-" + Date.now(), kind: kind, where: where, what: what, note: note || "", at: Date.now(), done: false }); admSave(a); },
    markDone: function (id) { var a = admLoad(); a.inbox.forEach(function (x) { if (x.id === id) x.done = true; }); admSave(a); },
    inbox: function () { return admLoad().inbox; },
    audit: function () { return admLoad().audit; }
  };

  // ---- Lesson content for World 1. "interest" is the designed lesson; the other five reuse its
  // screens with their own words. Amounts are naira; every example is made up for learning.
  var CONTENT = {
    money: {
      lead: "Money does three jobs: you pay with it, you compare prices with it, and you keep value in it for later.",
      exTitle: "Money's three jobs", rows: [["Paying ₦500 for a danfo ride", "Paying"], ["A shirt is ₦8,000, jeans are ₦12,000", "Comparing"], ["Keeping ₦20,000 for next month", "Keeping value"]],
      tip: "The naira is Nigeria's money. ₦1 is 100 kobo.",
      q: "Ada compares two phones by their prices in naira to see which costs less. Which job of money is she using?",
      opts: [["Paying for things", "Paying is when money changes hands. Ada hasn't bought anything yet."], ["Comparing prices", ""], ["Keeping value for later", "Keeping value means saving money to use later. Ada is comparing, not saving."], ["Borrowing", "Borrowing isn't one of money's three jobs. Ada is using prices to compare."]], right: 1,
      rightText: "Prices in naira give everything the same measuring stick, so you can see which phone costs less.",
      calc: "How many kobo are in ₦25?", unit: "kobo", answer: 2500, hint: "₦1 is 100 kobo, so multiply the naira by 100.",
      wrongs: { 25: "That's the amount in naira. Multiply by 100 to get kobo.", 250: "Close. ₦1 is 100 kobo, not 10, so multiply by 100." },
      calcRight: "₦25 × 100 = 2,500 kobo.", calcNote: "Prices in kobo are why some prices end in .50, like ₦1.50.",
      learned: ["Money helps you pay for things.", "Prices in naira let you compare things.", "Money can keep value for later, though inflation can shrink it."], article: "what-is-money"
    },
    income: {
      lead: "Income is money coming in. Expenses are money going out. What's left over is what you can save.",
      exTitle: "Tunde's month", rows: [["Salary (income)", "₦150,000"], ["Rent and food (expenses)", "−₦95,000"], ["Transport (expense)", "−₦25,000"], ["Left over", "₦30,000"]],
      tip: "Writing both down for one month shows where your money really goes.",
      q: "Which of these is an expense?",
      opts: [["Your salary from work", "A salary is money coming in, so it's income."], ["Profit from a small shop", "Profit is money coming in, so it's income."], ["Your monthly data bundle", ""], ["A gift from your aunt", "A gift is money coming in, so it counts as income."]], right: 2,
      rightText: "A data bundle is money going out every month, so it's an expense.",
      calc: "Tunde earns ₦120,000 a month and spends ₦95,000. How much is left over in naira?", unit: "naira", answer: 25000, hint: "Take the expenses away from the income.",
      wrongs: { 215000: "It looks like you added them. Left over is income minus expenses.", 95000: "That's what Tunde spends. Take it away from ₦120,000." },
      calcRight: "₦120,000 − ₦95,000 = ₦25,000.", calcNote: "If expenses are bigger than income, the gap usually becomes debt.",
      learned: ["Income is money coming in.", "Expenses are money going out.", "Income minus expenses is what you can save."], article: "budgeting"
    },
    budget: {
      lead: "A budget is a plan for your income before you spend it. A simple guide splits it 50% needs, 30% wants and 20% savings.",
      exTitle: "50/30/20 on ₦150,000", rows: [["Needs: rent, food, transport (50%)", "₦75,000"], ["Wants: outings, new clothes (30%)", "₦45,000"], ["Savings (20%)", "₦30,000"]],
      tip: "It's a starting point. Change the split to fit your life.",
      q: "Using the 50/30/20 guide, which of these is a want?",
      opts: [["Rent", "Rent is a need: you have to pay it to have a home."], ["Electricity bill", "Electricity is a need for most homes."], ["Weekend suya with friends", ""], ["School fees", "School fees are a need if you or your children are in school."]], right: 2,
      rightText: "Suya with friends is nice to have but not essential, so it's a want.",
      calc: "Ada earns ₦200,000 a month. How much is 20% for savings, in naira?", unit: "naira", answer: 40000, hint: "20% is the same as one fifth. Divide by 5.",
      wrongs: { 20000: "That's 10%. Twenty percent is double that.", 4000: "Check the zeros. 20% of ₦200,000 is a five-figure amount." },
      calcRight: "₦200,000 × 20% = ₦40,000.", calcNote: "Saving first, before spending on wants, makes the plan easier to keep.",
      learned: ["A budget is a plan for your income.", "50/30/20 splits it into needs, wants and savings.", "Change the split to fit your life."], article: "budgeting"
    },
    inflation: {
      lead: "Inflation is when prices rise over time, so each naira buys a little less than before.",
      exTitle: "A bag of rice", rows: [["Last year", "₦50,000"], ["This year", "₦60,000"], ["Price rise", "20%"]],
      tip: "If your savings grow slower than prices, you can buy less with them.",
      q: "Prices rise 20% this year and your savings earn 5%. What happens to what your savings can buy?",
      opts: [["It goes up", "Your savings grow by 5%, but prices grow by 20%, so you can buy less."], ["It stays the same", "Prices rose faster than your savings, so it doesn't stay the same."], ["It goes down", ""], ["It doubles", "Nothing here doubles. Prices rose faster than your savings."]], right: 2,
      rightText: "Your money grew 5% but prices grew 20%, so the same savings buy less.",
      calc: "A ₦2,000 meal goes up 15% in a year. What does it cost now, in naira?", unit: "naira", answer: 2300, hint: "15% of ₦2,000 is ₦300. Add it to the old price.",
      wrongs: { 300: "That's the increase. Add it to the old price of ₦2,000.", 1700: "It looks like you took the 15% away. Prices went up." },
      calcRight: "₦2,000 + 15% = ₦2,300.", calcNote: "Inflation is usually given as a yearly percentage.",
      learned: ["Inflation means prices rise over time.", "It lowers what each naira can buy.", "Savings growing slower than inflation lose buying power."], article: "inflation"
    },
    emergency: {
      lead: "An emergency fund is money kept safe and easy to reach for surprises, like a medical bill or losing your income.",
      exTitle: "Building a fund", rows: [["Monthly costs", "₦80,000"], ["Goal: 3 months of costs", "₦240,000"], ["Where to keep it", "Savings you can reach fast"]],
      tip: "Many people aim for 3 to 6 months of costs, built up a little at a time.",
      q: "Where is the best place to keep an emergency fund?",
      opts: [["In shares that can fall", "Shares can drop just when you need the money, so they're risky for emergencies."], ["In savings you can reach quickly", ""], ["Lent to a friend", "A friend may not be able to pay it back when you need it."], ["Locked away for 2 years", "You can't reach locked money in an emergency."]], right: 1,
      rightText: "An emergency fund needs to be safe and easy to reach, which is what savings give you.",
      calc: "Your costs are ₦60,000 a month. How much is 3 months of emergency savings, in naira?", unit: "naira", answer: 180000, hint: "Multiply the monthly costs by 3.",
      wrongs: { 20000: "It looks like you divided. Multiply ₦60,000 by 3.", 63000: "Multiply by 3 rather than adding 3,000." },
      calcRight: "₦60,000 × 3 = ₦180,000.", calcNote: "Start small: even one month of costs is a good first goal.",
      learned: ["An emergency fund is for surprises.", "Keep it safe and easy to reach.", "Aim for a few months of costs, built up over time."], article: "saving-vs-investing"
    }
  };
  /** The lesson being played: the one started in this run, else the next one to do (else the designed one). */
  function lessonNow() {
    var s = load(), id = s.run && s.run.l;
    var L = LESSONS.filter(function (x) { return x.id === id; })[0] || (s.done < LESSONS.length ? LESSONS[s.done] : LESSONS[4]);
    var i = LESSONS.indexOf(L);
    return { id: L.id, index: i, title: L.title, min: L.min, designed: L.id === "interest", c: CONTENT[L.id] || null };
  }

  // ---- Learning loop: levels, streak details, daily question, boss challenge, challenges, micro modules.
  var LEVELS = [{ n: 1, name: "Money Explorer", at: 0 }, { n: 2, name: "Finance Learner", at: 100 }, { n: 3, name: "Market Explorer", at: 250 }, { n: 4, name: "Company Detective", at: 500 }, { n: 5, name: "Financial Analyst in Training", at: 900 }];
  function lvOf(xp) { var L = LEVELS[0]; LEVELS.forEach(function (x) { if (xp >= x.at) L = x; }); return L; }
  function addXp(s, n) { var before = lvOf(s.xp).n; s.xp += n; if (lvOf(s.xp).n > before) s.levelUp = lvOf(s.xp).n; }
  // Activity log (newest first): drives History, the weekly XP chart, badges and notifications.
  function logEvent(s, kind, title, href, xp) { s.log = [{ at: Date.now(), day: lagosDay(), kind: kind, title: title, href: href, xp: xp || 0 }].concat(s.log || []).slice(0, 200); }
  function markDay(s) { var d = lagosDay(); if (s.days.indexOf(d) < 0) s.days.push(d); }
  var DAILY = [
    ["Which currency is used in Ghana?", ["Naira", "Cedi", "Rand", "Shilling"], 1, "Ghana uses the cedi (GH₵). Shares on the Ghana Stock Exchange are priced in cedis.", ["The naira is Nigeria's currency.", "", "The rand is South Africa's currency.", "Kenya uses the shilling."]],
    ["What is ₦1 in kobo?", ["10 kobo", "50 kobo", "100 kobo", "1,000 kobo"], 2, "₦1 is 100 kobo.", ["Too small: ₦1 is 100 kobo.", "That's half a naira.", "", "Too big: ₦1 is 100 kobo."]],
    ["What does NGX stand for?", ["Nigerian Exchange", "National Gold Exchange", "New Growth Index", "Naira Global Exchange"], 0, "NGX is the Nigerian Exchange, where shares of listed companies are bought and sold.", ["", "Not quite. NGX is the Nigerian Exchange.", "Not quite. NGX is the Nigerian Exchange.", "Not quite. NGX is the Nigerian Exchange."]],
    ["In the 50/30/20 guide, what is the 20% for?", ["Rent", "Savings", "Wants", "Food"], 1, "20% goes to savings. 50% is needs and 30% is wants.", ["Rent is a need, in the 50%.", "", "Wants are the 30%.", "Food is a need, in the 50%."]],
    ["If prices rise faster than your savings, what happens?", ["You can buy more", "Nothing changes", "You can buy less", "Your savings double"], 2, "When prices rise faster than your savings, each naira buys less.", ["Prices rose faster, so you can buy less.", "Prices rose faster, so you can buy less.", "", "Nothing doubles here."]],
    ["What is a dividend?", ["A loan from a bank", "Part of profit paid to shareholders", "A tax on shares", "A type of savings account"], 1, "A dividend is part of a company's profit paid to the people who own its shares.", ["That's borrowing.", "", "A dividend is a payment to owners, not a tax.", "That's a bank product."]],
    ["Which is the safest place for an emergency fund?", ["Shares", "Savings you can reach quickly", "A friend", "A 2-year fixed deposit"], 1, "An emergency fund should be safe and easy to reach.", ["Shares can fall when you need the money.", "", "A friend may not pay it back in time.", "You can't reach locked money quickly."]],
    ["Compound interest earns interest on...", ["Only the first amount", "The amount plus interest already earned", "Only the interest", "Nothing"], 1, "Compound interest is paid on your money and on the interest already earned.", ["That's simple interest.", "", "It earns on both the amount and the interest.", "It does earn interest."]],
    ["Which of these is income?", ["Rent", "A salary", "A data bundle", "School fees"], 1, "A salary is money coming in, so it's income.", ["Rent is an expense.", "", "A data bundle is an expense.", "School fees are an expense."]],
    ["Using the Rule of 72, how long does money take to double at 8% a year?", ["4 years", "8 years", "9 years", "72 years"], 2, "72 ÷ 8 = 9 years.", ["Divide 72 by 8.", "Divide 72 by 8.", "", "Divide 72 by the rate."]]
  ];
  var BOSS_Q = [
    { q: "Tolu earns ₦100,000 a month. Using the 50/30/20 guide, how much is for needs?", opts: [["₦20,000", "₦20,000 is the 20% for savings."], ["₦30,000", "₦30,000 is the 30% for wants."], ["₦50,000", ""], ["₦70,000", "50% of ₦100,000 is ₦50,000."]], right: 2, explain: "Needs are 50%, so ₦100,000 × 50% = ₦50,000." },
    { q: "Tolu's rent, food and transport come to ₦70,000 a month. Which plan builds an emergency fund fastest without missing a bill?", card: true, opts: [["Spend the ₦30,000 and save next year", "Waiting means no cushion if something goes wrong. Saving a little each month starts the fund now."], ["Save ₦20,000 a month, keep ₦10,000 for wants", ""], ["Save ₦30,000 and cut food to ₦0", "Food is a need. A plan that skips needs will not last."], ["Borrow ₦210,000 now to fill the fund", "An emergency fund built with debt adds repayments, which makes emergencies harder, not easier."]], right: 1, explain: "₦20,000 a month builds a ₦210,000 cushion, three months of needs, in about 11 months, while still leaving room for wants." },
    { q: "Prices rise 20% this year but Tolu's ₦100,000 salary stays the same. What happens?", opts: [["Tolu can buy more", "Prices went up, so the same salary buys less."], ["Nothing changes", "Prices went up, so the same salary buys less."], ["Tolu can buy less", ""], ["Tolu's salary doubles", "The salary stays the same."]], right: 2, explain: "When prices rise and income doesn't, each naira buys less. That's inflation." },
    { q: "Tolu saves ₦50,000 at 10% a year, compounded yearly. How much after 2 years?", opts: [["₦55,000", "That's after one year only."], ["₦60,000", "That's simple interest. Year 2 also earns on the ₦5,000 of interest."], ["₦60,500", ""], ["₦100,000", "Doubling at 10% takes about 7 years."]], right: 2, explain: "₦50,000 × 1.1 × 1.1 = ₦60,500." },
    { q: "Tolu keeps ₦20,000 aside to use next month. Which job of money is that?", opts: [["Paying for things", "Nothing is being bought yet."], ["Comparing prices", "Tolu isn't comparing anything."], ["Keeping value for later", ""], ["Borrowing", "Borrowing isn't one of money's jobs."]], right: 2, explain: "Keeping money for later uses money as a store of value." }
  ];
  var CHALLENGES = [{ id: "inflation", title: "The inflation challenge", xp: 15 }];
  var MICRO = { term: "Dividend", steps: "How a share price moves", compare: "Saving vs investing", market: "Meet the NGX", myth: "Myth or fact?" };
  var LOOP = {
    LEVELS: LEVELS, BOSS_Q: BOSS_Q,
    levelInfo: function (xp) { var L = lvOf(xp), nx = LEVELS[L.n] || null; return { n: L.n, name: L.name, at: L.at, next: nx, pct: nx ? Math.round((xp - L.at) / (nx.at - L.at) * 100) : 100 }; },
    pendingLevelUp: function () { return load().levelUp || 0; },
    clearLevelUp: function () { var s = load(); delete s.levelUp; save(s); },
    streakInfo: function () {
      var s = load(), set = {}; s.days.forEach(function (d) { set[d] = 1; });
      var r = runEnding(set, lagosDay(), true), today = new Date(lagosDay() + "T00:00:00Z"), mon = new Date(today.getTime() - ((today.getUTCDay() + 6) % 7) * 86400000), week = [];
      for (var i = 0; i < 7; i++) { var d = iso(new Date(mon.getTime() + i * 86400000)); week.push({ d: d, learned: !!set[d], rest: r.rest.indexOf(d) >= 0, today: d === lagosDay(), future: d > lagosDay() }); }
      return { n: r.n, week: week, restUsed: week.some(function (w) { return w.rest; }), learnedToday: !!set[lagosDay()] };
    },
    /** A streak that ended since the last visit: its length, once per break. */
    lostStreak: function () {
      var s = load(); if (!s.days.length || streak(s.days) > 0) return 0;
      var last = s.days.slice().sort().pop(); if (s.lostSeen === last) return 0;
      var set = {}; s.days.forEach(function (d) { set[d] = 1; }); return runEnding(set, last, false).n;
    },
    seenLost: function () { var s = load(); s.lostSeen = s.days.slice().sort().pop(); save(s); },
    daily: function () { var n = Math.floor(new Date(lagosDay() + "T00:00:00Z").getTime() / 86400000); var q = DAILY[n % DAILY.length]; return { q: q[0], opts: q[1], right: q[2], explain: q[3], whys: q[4], done: load().dailyDay === lagosDay() }; },
    dailyAnswer: function (correct) { var s = load(); if (s.dailyDay === lagosDay()) return false; s.dailyDay = lagosDay(); addXp(s, 5 + (correct ? 3 : 0)); markDay(s); logEvent(s, 'daily', 'Daily question', 'UPDaily.dc.html', 5 + (correct ? 3 : 0)); s.dailyCount = (s.dailyCount || 0) + 1; save(s); return true; }, // XP rules from packages/engine: daily 5, +3 if right
    startBoss: function () { var s = load(); s.boss = { i: 0, score: 0, first: {} }; save(s); },
    bossState: function () { var s = load(); return s.boss || { i: 0, score: 0, first: {} }; },
    bossAnswer: function (i, correct) { var s = load(); s.boss = s.boss || { i: 0, score: 0, first: {} }; if (!(i in s.boss.first)) { s.boss.first[i] = !!correct; if (correct) s.boss.score++; } save(s); },
    bossNext: function () { var s = load(); s.boss = s.boss || { i: 0, score: 0, first: {} }; s.boss.i++; save(s); return s.boss.i; },
    challenge: function (id) { return (load().challenges || {})[id] || null; },
    finishChallenge: function (id) { var s = load(), c = CHALLENGES.filter(function (x) { return x.id === id; })[0]; s.challenges = s.challenges || {}; var first = !s.challenges[id]; if (first && c) addXp(s, c.xp); s.challenges[id] = { at: Date.now() }; markDay(s); logEvent(s, 'challenge', c ? c.title : 'Challenge', 'UPInflation.dc.html', first && c ? c.xp : 0); save(s); return first ? (c ? c.xp : 0) : 0; },
    micro: function (k) { return !!((load().micro || {})[k]); },
    finishMicro: function (k) { var s = load(); s.micro = s.micro || {}; var first = !s.micro[k]; if (first) addXp(s, 15); s.micro[k] = Date.now(); markDay(s); logEvent(s, 'micro', MICRO[k] || 'Micro module', 'UPLearn' + k.charAt(0).toUpperCase() + k.slice(1) + '.dc.html', first ? 15 : 0); save(s); return first ? 15 : 0; },
    MICRO: MICRO
  };

  // ---- Markets: real African companies and exchanges, described in plain words. No live prices or figures.
  // Facts here are general knowledge for learning; check each exchange's own site before relying on them.
  var MK = {
    COMPANIES: [
      { t: "ZB", name: "Zenith Bank", tag: "Banking", country: "Nigeria", line: "Banking · NGX: ZENITHBANK", color: "#7B4AF0", how: "It lends money at a higher rate than it pays savers. The gap is its main income. It also earns fees on transfers and cards.", bank: true, learn: "price-to-earnings" },
      { t: "DC", name: "Dangote Cement", tag: "Building materials", country: "Nigeria", line: "Building materials · NGX: DANGCEM", color: "#E8361C", how: "It sells cement to builders, governments and distributors, from plants in Nigeria and other African countries.", learn: "market-capitalisation" },
      { t: "MTN", name: "MTN Nigeria", tag: "Telecoms", country: "Nigeria", line: "Telecoms · NGX: MTNN", color: "#4C1D95", how: "Mostly from people paying for airtime and data, plus mobile money and other digital services.", learn: "revenue-and-profit" },
      { t: "NN", name: "Nestlé Nigeria", tag: "Food and drink", country: "Nigeria", line: "Food and drink · NGX: NESTLE", color: "#5B21B6", how: "It makes packaged foods and drinks and sells them through shops and distributors across Nigeria.", learn: "revenue-and-profit" },
      { t: "SC", name: "Safaricom", tag: "Telecoms", country: "Kenya", line: "Telecoms · NSE Kenya: SCOM", color: "#0FA394", how: "Kenya's biggest mobile network. It earns from calls and data, and from M-Pesa, its mobile money service, which charges small fees on transfers and payments.", learn: "revenue-and-profit" },
      { t: "MG", name: "MTN Ghana", tag: "Telecoms", country: "Ghana", line: "Telecoms · GSE: MTNGH", color: "#0B6A60", how: "Ghana's biggest mobile network. It earns from calls and data, and from MoMo, its mobile money service.", learn: "revenue-and-profit" }
    ],
    EXCHANGES: [
      { t: "NGX", name: "Nigerian Exchange", where: "Lagos · prices in naira (₦)", sub: "Lagos, Nigeria · Naira (₦)", about: "Nigeria's main stock exchange, where shares of listed companies are bought and sold. It was known as the Nigerian Stock Exchange until 2021.", currency: "Naira (₦)", regulator: "SEC Nigeria", micro: true },
      { t: "JSE", name: "Johannesburg Stock Exchange", where: "Johannesburg · prices in rand (R)", sub: "South Africa · Rand (R)", about: "South Africa's main stock exchange and the largest in Africa. It started in 1887, during the gold rush.", currency: "Rand (R)", regulator: "FSCA (South Africa)" },
      { t: "NSE", name: "Nairobi Securities Exchange", where: "Nairobi · prices in shillings (KSh)", sub: "Kenya · Shilling (KSh)", about: "Kenya's stock exchange. It was called the Nairobi Stock Exchange until 2011. Safaricom is one of its best-known companies.", currency: "Kenyan shilling (KSh)", regulator: "Capital Markets Authority (Kenya)" },
      { t: "GSE", name: "Ghana Stock Exchange", where: "Accra · prices in cedis (GH₵)", sub: "Accra, Ghana · Cedi (GH₵)", about: "Ghana's stock exchange, where shares of companies like MTN Ghana are bought and sold.", currency: "Cedi (GH₵)", regulator: "SEC Ghana" },
      { t: "BRVM", name: "BRVM", where: "Abidjan · prices in CFA francs", sub: "Abidjan, Côte d'Ivoire · CFA franc", about: "A regional stock exchange shared by 8 West African countries that use the CFA franc, including Côte d'Ivoire, Senegal and Mali.", currency: "West African CFA franc", regulator: "AMF-UMOA (regional)" }
    ],
    company: function (t) { var m = /[?&]c=([A-Z]+)/.exec(location.search), k = t || (m ? m[1] : "ZB"); return MK.COMPANIES.filter(function (c) { return c.t === k; })[0] || MK.COMPANIES[0]; },
    exchange: function (t) { var m = /[?&]x=([A-Z]+)/.exec(location.search), k = t || (m ? m[1] : "NGX"); return MK.EXCHANGES.filter(function (c) { return c.t === k; })[0] || MK.EXCHANGES[0]; }
  };

  // ---- Me: badges (rules from packages/engine where they exist), weekly XP, history, notifications, settings.
  var BADGES = [
    { id: "first", title: "First step", desc: "Complete your first lesson.", ok: function (s) { return s.done >= 1; } },
    { id: "clean", title: "Clean sheet", desc: "Every answer right first time.", ok: function (s) { return s.best.some(function (b) { return b === 100; }); } },
    { id: "found", title: "Foundations laid", desc: "Pass the Money Foundations boss.", ok: function (s) { return !!s.bossPassed; } },
    { id: "week", title: "A week of learning", desc: "Learn on 7 days in a row.", ok: function (s) { return Math.max(s.bestStreak || 0, streak(s.days)) >= 7; } },
    { id: "daily", title: "Daily habit", desc: "Complete 3 daily questions.", ok: function (s) { return (s.dailyCount || 0) >= 3; } },
    { id: "solver", title: "Problem solver", desc: "Complete 3 practical challenges.", ok: function (s) { return Object.keys(s.challenges || {}).length >= 3; } },
    { id: "curious", title: "Curious mind", desc: "Read 5 library articles.", ok: function (s) { return Object.keys((libLoad().read) || {}).length >= 5; } },
    { id: "back", title: "Came back stronger", desc: "Ace a lesson you found hard.", ok: function () { return false; } },
    { id: "investor", title: "Investor's mindset", desc: "Pass the Investing boss.", ok: function () { return false; } }
  ];
  var PREF_KEY = "fv.prefs.v1";
  var ME = {
    BADGES: BADGES,
    badges: function () { var s = load(); return BADGES.map(function (b) { return { id: b.id, title: b.title, desc: b.desc, earned: !!b.ok(s) }; }); },
    log: function () { return load().log || []; },
    weekXp: function () {
      var log = load().log || [], today = new Date(lagosDay() + "T00:00:00Z"), mon = new Date(today.getTime() - ((today.getUTCDay() + 6) % 7) * 86400000), out = [];
      for (var i = 0; i < 7; i++) { var d = iso(new Date(mon.getTime() + i * 86400000)); out.push({ d: d, xp: log.filter(function (e) { return e.day === d; }).reduce(function (n, e) { return n + (e.xp || 0); }, 0), future: d > lagosDay(), today: d === lagosDay() }); }
      return out;
    },
    clearHistory: function () { var s = load(); s.log = []; save(s); },
    prefs: function () { try { var p = JSON.parse(localStorage.getItem(PREF_KEY) || "null"); if (p) return p; } catch (e) {} return { sound: true, reduceMotion: false }; },
    setPref: function (k, v) { var p = ME.prefs(); p[k] = v; try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (e) {} applyPrefs(); },
    notifications: function () {
      var s = load(), out = [], log = s.log || [];
      if (s.dailyDay !== lagosDay()) out.push({ title: "Today's question is ready", sub: "1 minute, +5 XP.", at: new Date(lagosDay() + "T07:00:00+01:00").getTime(), href: "UPDaily.dc.html" });
      log.filter(function (e) { return e.kind === "boss" && e.xp; }).forEach(function (e) { out.push({ title: "New badge: Foundations laid", sub: "You passed the World 1 boss.", at: e.at, href: "UPAchievements.dc.html" }); });
      log.filter(function (e) { return e.kind === "lesson"; }).slice(0, 3).forEach(function (e) { out.push({ title: "Lesson done: " + e.title, sub: "+" + e.xp + " XP earned.", at: e.at, href: "UPProgress.dc.html" }); });
      return out.sort(function (a, b) { return b.at - a.at; }).slice(0, 8);
    }
  };
  function applyPrefs() { try { document.documentElement.classList.toggle("fv-reduce", !!ME.prefs().reduceMotion); } catch (e) {} }
  applyPrefs();
  var FV = {
    LESSONS: LESSONS, BOSS: BOSS,
    get: load,
    streak: function () { return streak(load().days); },
    level: function (xp) { return xp >= 900 ? 5 : xp >= 500 ? 4 : xp >= 250 ? 3 : xp >= 100 ? 2 : 1; },
    current: function () { var s = load(); return s.done < LESSONS.length ? LESSONS[s.done] : null; },
    // A lesson run: started on the first lesson screen, scored on the questions, committed on Lesson complete.
    lesson: lessonNow,
    startRun: function () { var s = load(), L = s.done < LESSONS.length ? LESSONS[s.done] : LESSONS[4]; s.run = { answers: {}, given: {}, l: L.id }; save(s); },
    answer: function (q, correct, given) {
      var s = load(); if (!s.run) s.run = { answers: {}, given: {} };
      if (!(q in s.run.answers)) { s.run.answers[q] = !!correct; s.run.given = s.run.given || {}; s.run.given[q] = given; } // first try counts
      save(s);
    },
    finishRun: function () {
      var s = load(); if (!s.run) return null;
      var lesson = lessonNow(), given = s.run.given || {};
      var a = s.run.answers, keys = Object.keys(a), right = keys.filter(function (k) { return a[k]; }).length;
      var pct = keys.length ? Math.round(right / keys.length * 100) : 100;
      var xp = 10 + Math.round(5 * pct / 100), wrong = keys.length - right;
      if (s.done < LESSONS.length) { s.best[s.done] = pct; s.done += 1; }
      addXp(s, xp); var d = lagosDay(); if (s.days.indexOf(d) < 0) s.days.push(d);
      logEvent(s, 'lesson', lesson.title, 'UPJourney.dc.html', xp); s.bestStreak = Math.max(s.bestStreak || 0, streak(s.days));
      s.run = null; save(s);
      return { xp: xp, pct: pct, wrong: wrong, right: right, total: keys.length, answers: a, given: given, lesson: lesson, streak: streak(s.days) };
    },
    passBoss: function (score) {
      var s = load(); var passed = score >= 4;
      if (passed && !s.bossPassed) { s.bossPassed = true; addXp(s, 55); }
      var d = lagosDay(); if (s.days.indexOf(d) < 0) s.days.push(d);
      logEvent(s, 'boss', 'Boss challenge: ' + score + ' of 5', 'UPBossIntro.dc.html', passed && s.bossPassed && !s.bossLogged ? 55 : 0); if (passed) s.bossLogged = true;
      save(s); return passed;
    },
    SIM: SIM, ASK: ASK, PAY: PAY, AUTH: AUTH, LIB: LIB, ADMIN: ADMIN, LOOP: LOOP, MK: MK, ME: ME,
    plan: plan, billing: billLoad, saveBilling: billSave,
    reset: function () { save(fresh()); }
  };
  window.FV = FV;
  // Queued practice orders are placed as soon as the market is open.
  try { var placed = SIM.runQueue(); if (placed) sessionStorage.setItem("fv.flash", placed + (placed === 1 ? " queued order was" : " queued orders were") + " placed now that the market is open."); } catch (e) {}
})();
