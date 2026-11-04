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
    sendCode: function (email) { var a = authLoad(); a.pending = String(email).trim().toLowerCase(); a.sentAt = Date.now(); a.wrong = 0; a.lockUntil = 0; authSave(a); },
    resendIn: function () { var a = authLoad(); return Math.max(0, Math.ceil(((a.sentAt || 0) + 60000 - Date.now()) / 1000)); },
    lockedFor: function () { var a = authLoad(); return Math.max(0, Math.ceil(((a.lockUntil || 0) - Date.now()) / 1000)); },
    triesLeft: function () { return Math.max(0, 3 - (authLoad().wrong || 0)); },
    /** "ok", "wrong", "expired" or "locked". */
    verify: function (code) {
      var a = authLoad();
      if (AUTH.lockedFor() > 0) return "locked";
      if (code === "111111" || Date.now() - (a.sentAt || 0) > 600000) return "expired";
      if (code === "000000") { a.wrong = (a.wrong || 0) + 1; if (a.wrong >= 3) a.lockUntil = Date.now() + 900000; authSave(a); return a.wrong >= 3 ? "locked" : "wrong"; }
      a.email = a.pending; a.name = (a.email || "").split("@")[0].replace(/^\w/, function (c) { return c.toUpperCase(); }); a.wrong = 0; authSave(a); return "ok";
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
    setRead: function (slug, pct) { var l = libLoad(); l.read = l.read || {}; var old = l.read[slug]; if (!old || pct > old.pct) { l.read[slug] = { pct: pct, at: Date.now() }; libSave(l); } else if (old) { old.at = Date.now(); libSave(l); } },
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
  var FV = {
    LESSONS: LESSONS, BOSS: BOSS,
    get: load,
    streak: function () { return streak(load().days); },
    level: function (xp) { return xp >= 500 ? 4 : xp >= 250 ? 3 : xp >= 100 ? 2 : 1; },
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
      s.xp += xp; var d = lagosDay(); if (s.days.indexOf(d) < 0) s.days.push(d);
      s.run = null; save(s);
      return { xp: xp, pct: pct, wrong: wrong, right: right, total: keys.length, answers: a, given: given, lesson: lesson, streak: streak(s.days) };
    },
    passBoss: function (score) {
      var s = load(); var passed = score >= 4;
      if (passed && !s.bossPassed) { s.bossPassed = true; s.xp += 30; }
      var d = lagosDay(); if (s.days.indexOf(d) < 0) s.days.push(d);
      save(s); return passed;
    },
    SIM: SIM, ASK: ASK, PAY: PAY, AUTH: AUTH, LIB: LIB, ADMIN: ADMIN,
    plan: plan, billing: billLoad, saveBilling: billSave,
    reset: function () { save(fresh()); }
  };
  window.FV = FV;
})();
