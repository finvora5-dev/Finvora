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
    reset: function () { save(fresh()); }
  };
  window.FV = FV;
})();
