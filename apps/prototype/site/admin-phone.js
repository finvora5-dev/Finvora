// Admin tasks on phones (design Part 5). Draws into <main data-admin="..."> using FV.ADMIN, the same calls as desktop.
// Every action waits 2.5 seconds behind an Undo toast (D22) and only then runs, so the audit log never shows an undone action.
(function () {
  var A;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function q(name) { var m = new RegExp("[?&]" + name + "=([^&]+)").exec(location.search); return m ? decodeURIComponent(m[1]) : ""; }
  var pending = null;
  function later(msg, run, after) {
    if (pending) { pending.run(); clearTimeout(pending.t); }
    var p = { run: function () { if (p.done) return; p.done = true; run(); }, t: 0 };
    p.t = setTimeout(function () { p.run(); pending = null; }, 2500); pending = p;
    if (window.fvToast) window.fvToast(msg, { action: "Undo", ms: 2500, onAction: function () { p.done = true; clearTimeout(p.t); pending = null; if (window.fvToast) window.fvToast("Undone. Nothing was saved."); render(); } });
    after();
  }
  window.addEventListener("pagehide", function () { if (pending) pending.run(); });

  var TYPES = {
    sums: { title: "AI summaries", list: function () { return A.sumQueue(); },
      body: function (x) { return '<span class="chip" style="align-self: flex-start; min-height: 30px; font-size: 12px">' + esc(x.kind) + " · " + esc(x.title) + '</span><div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 8px"><span class="muted eyebrow">Fin’s summary</span><p style="margin: 0; line-height: 1.6">' + esc(x.text) + '</p></div><div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 6px"><span class="muted eyebrow">Source</span><span>' + esc(x.source) + "</span>" + (x.flag ? '<span style="color: #B42828; font-weight: 700">' + esc(x.flag) + "</span>" : "") + "</div>"; },
      buttons: [["Reject", "btn btn-w", function (x) { A.decideSum(x, "Rejected", x.text); }, "Rejected."], ["Approve", "btn", function (x) { A.decideSum(x, "Approved", x.text); }, "Approved."]] },
    ask: { title: "Ask Fin replies", list: function () { return A.reviewQueue(); },
      body: function (x) { return '<span class="chip" style="align-self: flex-start; min-height: 30px; font-size: 12px">' + esc(x.tag) + '</span><div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 8px"><span class="muted eyebrow">Learner asked</span><p style="margin: 0; font-weight: 700">' + esc(x.q) + '</p><span class="muted eyebrow">Fin replied</span><p style="margin: 0; line-height: 1.6">' + esc(x.a) + '</p></div><label style="display: flex; flex-direction: column; gap: 6px"><b style="font-size: 13px">Note (optional)</b><input id="note" class="field" placeholder="What should change?" style="height: 48px; border-radius: 12px; border: 1.5px solid #E7E2F0; padding: 0 12px; font: 500 16px \'Plus Jakarta Sans\', sans-serif"></label>'; },
      buttons: [["Escalate", "btn btn-w", function (x, n) { A.decide(x.id, x.q, "Escalated", n); }, "Escalated."], ["Needs a better answer", "btn btn-w", function (x, n) { A.decide(x.id, x.q, "Needs a better answer", n); }, "Marked: needs a better answer."], ["Answer is fine", "btn", function (x, n) { A.decide(x.id, x.q, "Answer is fine", n); }, "Marked: answer is fine."]] },
    feedback: { title: "Feedback", list: function () { return A.inbox().filter(function (x) { return !x.done; }); },
      body: function (x) { return '<span class="chip" style="align-self: flex-start; min-height: 30px; font-size: 12px">' + esc(x.kind) + '</span><div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 8px"><span class="muted eyebrow">Where</span><span>' + esc(x.where) + '</span><span class="muted eyebrow">What</span><p style="margin: 0; line-height: 1.6">' + esc(x.what) + "</p>" + (x.note ? '<span class="muted eyebrow">Note</span><p style="margin: 0">' + esc(x.note) + "</p>" : "") + "</div>"; },
      buttons: [["Mark done", "btn", function (x) { A.markDone(x.id); A.log("Feedback inbox", "Marked done: " + (x.what || x.kind)); }, "Marked done."]] },
  };
  var SWITCHES = [["rate", "Rate this lesson"], ["report", "Report a mistake"], ["suggest", "Suggest a topic"], ["review", "App store review"]];
  var skipped = {};
  function visible(type) { return TYPES[type].list().filter(function (x) { return !skipped[x.id] && !(pending && pending.id === x.id); }); }

  function tasks() {
    var staff = A.staff ? A.staff() : null, name = staff && staff.name ? staff.name : "";
    var c = { sums: visible("sums").length, ask: visible("ask").length, feedback: visible("feedback").length }, total = c.sums + c.ask + c.feedback;
    function card(href, t, n, sub) { return '<a href="' + href + '" class="card press" style="padding: 16px; display: flex; align-items: center; gap: 12px; text-decoration: none; color: #0E0B14"><span style="flex: 1; display: flex; flex-direction: column"><b style="font-size: 16px">' + t + '</b><span class="muted" style="font-size: 13px">' + sub + '</span></span><span class="num" style="min-width: 34px; height: 34px; border-radius: 999px; background: ' + (n ? "#F1EBFB" : "#E1F7EA") + "; color: " + (n ? "#4C1D95" : "#0F6B39") + '; font-weight: 800; display: flex; align-items: center; justify-content: center">' + (n || "✓") + "</span></a>"; }
    var sw = SWITCHES.map(function (s) { var on = A.on(s[0]); return '<div class="li"><span style="flex: 1">' + s[1] + '</span><button type="button" role="switch" aria-checked="' + on + '" aria-label="' + s[1] + '" data-sw="' + s[0] + '" style="width: 52px; height: 32px; border-radius: 999px; border: 0; padding: 3px; display: flex; justify-content: ' + (on ? "flex-end" : "flex-start") + "; background: " + (on ? "#5B21B6" : "#D3CDE0") + '; cursor: pointer"><span style="width: 26px; height: 26px; border-radius: 999px; background: #FFFFFF"></span></button></div>'; }).join("");
    return '<div style="display: flex; flex-direction: column; gap: 4px"><h1 style="font-size: 24px">' + (name ? "Hello, " + esc(name) : "Admin tasks") + '</h1><p class="muted" style="margin: 0">' + (total ? total + (total === 1 ? " thing needs" : " things need") + " you" : "All done for now.") + "</p></div>" +
      card("UAPhoneTask.dc.html?type=sums", "AI summaries to approve", c.sums, "Check each summary matches its source") +
      card("UAPhoneTask.dc.html?type=ask", "Ask Fin replies to check", c.ask, "Replies Fin refused or could not answer") +
      card("UAPhoneTask.dc.html?type=feedback", "Feedback to read", c.feedback, "Reports and suggestions from learners") +
      '<section class="card" style="overflow: hidden"><div style="padding: 14px 16px 4px"><b>Learner prompts on or off</b></div>' + sw + "</section>" +
      '<p class="muted" style="margin: 0; font-size: 13px; text-align: center">Charts, users, payments and the audit log: open on a larger screen.</p>';
  }
  function task(type) {
    var T = TYPES[type] || TYPES.sums, items = visible(type), x = items[0];
    if (!x) return '<div style="display: flex; flex-direction: column; gap: 12px; align-items: center; text-align: center; padding: 40px 0"><h1 style="font-size: 24px">All done</h1><p class="muted" style="margin: 0">Nothing left in ' + T.title + ".</p></div>" + '<a class="btn" href="UAPhoneTasks.dc.html">Back to tasks</a>';
    return '<div class="row" style="justify-content: space-between"><h1 style="font-size: 20px">' + T.title + '</h1><span class="muted num" style="font-size: 14px">' + items.length + " left</span></div>" + T.body(x) +
      '<div style="height: 140px"></div><div data-bar style="position: fixed; left: 0; right: 0; bottom: 0; padding: 12px 16px calc(16px + env(safe-area-inset-bottom, 0px)); background: #FFFFFF; border-top: 1px solid #E7E2F0; display: flex; flex-wrap: wrap; gap: 10px; z-index: 20">' +
      T.buttons.map(function (b, i) { return '<button type="button" class="' + b[1] + '" data-act="' + i + '" style="flex: 1 1 ' + (T.buttons.length > 2 ? "100%" : "40%") + '">' + b[0] + "</button>"; }).join("") + "</div>";
  }

  function render() {
    var main = document.querySelector("[data-admin]"); if (!main || !window.FV || !window.FV.ADMIN) return;
    A = window.FV.ADMIN;
    var kind = main.getAttribute("data-admin"), type = q("type") || "sums";
    main.innerHTML = kind === "tasks" ? tasks() : task(type);
    main.onclick = function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.sw) {
        var k = b.dataset.sw, on = A.on(k), label = SWITCHES.filter(function (s) { return s[0] === k; })[0][1];
        later(label + " turned " + (on ? "off" : "on") + ".", function () { A.set(k, !on); A.log("Feedback settings", label + " turned " + (on ? "off" : "on")); }, function () {
          b.setAttribute("aria-checked", String(!on)); b.style.justifyContent = on ? "flex-start" : "flex-end"; b.style.background = on ? "#D3CDE0" : "#5B21B6"; });
        return;
      }
      if (b.dataset.act) {
        var T = TYPES[type], x = visible(type)[0], btn = T.buttons[+b.dataset.act], note = (main.querySelector("#note") || {}).value || "";
        later(btn[3], function () { btn[2](x, note.trim()); }, function () { if (pending) pending.id = x.id; render(); window.scrollTo(0, 0); });
      }
    };
  }
  window.fvAdminRender = render;
})();
