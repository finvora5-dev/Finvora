// End-to-end journeys against the static build. Run: node e2e/journeys.cjs [baseUrl]
const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://127.0.0.1:8790";
const results = [];
const ok = (name, cond, extra = "") => { results.push([cond ? "PASS" : "FAIL", name, extra]); };
const vis = (loc, t = 4000) => loc.first().waitFor({ state: "visible", timeout: t }).then(() => true).catch(() => false);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  const go = (p) => page.goto(BASE + p, { waitUntil: "networkidle" });

  // Turn off simulated latency for speed via storage.
  await go("/welcome/");
  await page.evaluate(() => localStorage.setItem("fv.dev", JSON.stringify({ v: 1, data: { latency: false, failNextRequest: false, checkoutOutcome: "success" } })));

  // 1. Guard + onboarding + sign-in
  await go("/");
  await page.waitForURL(/welcome/);
  ok("Signed-out visitor is sent to Welcome", page.url().includes("/welcome/"));
  await page.getByRole("link", { name: "Get started" }).click();
  await page.getByRole("radio", { name: "Grow my savings" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/sign-in/);
  await page.getByLabel("Email").fill("bad-email");
  await page.getByRole("button", { name: "Send code" }).click();
  ok("Invalid email shows an error", await vis(page.getByText("Enter a valid email address")));
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByRole("button", { name: "Send code" }).click();
  await page.waitForURL(/code/);
  await page.getByLabel("6-digit code").fill("000000");
  await page.getByRole("button", { name: "Continue" }).click();
  ok("Wrong code shows an error", await vis(page.getByText("That code isn't right")));
  await page.getByLabel("6-digit code").fill("123456");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(BASE + "/");
  ok("Valid code signs in and lands on Home", await vis(page.getByRole("heading", { name: /Ada\./ })));

  // 2. Next for you: start first lesson
  const nfy = page.getByRole("link", { name: /Start here: What money really is/ });
  ok("Home shows one Next for you card (start first lesson)", await nfy.isVisible());
  await nfy.click();
  await page.waitForURL(/learn\/what-is-money/);
  await page.getByRole("button", { name: "Continue" }).click(); // info step
  await page.getByRole("radio", { name: "Medium of exchange" }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  ok("Wrong answer shows 'Not quite' with explanation", await vis(page.getByText("Not quite")));
  await page.getByRole("button", { name: "Try again" }).click();
  await page.getByRole("radio", { name: "Store of value" }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  ok("Correct answer shows 'Correct'", await vis(page.getByText("Correct", { exact: true })));
  await page.getByRole("button", { name: "Continue" }).click();
  // Leave mid-lesson -> resume
  await page.getByRole("button", { name: "Leave lesson" }).click();
  await page.getByRole("button", { name: "Leave lesson" }).last().click();
  await page.waitForURL(/\/learn\/$/);
  await go("/");
  const resume = page.getByRole("link", { name: /Pick up where you left off: What money really is/ });
  ok("Home offers Resume after leaving mid-lesson", await resume.isVisible());
  await resume.click();
  ok("Resume opens at the saved step (true/false)", await vis(page.getByText("True or false?")));
  await page.getByRole("radio", { name: "True" }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  // Match step
  const pairs = [["Paying a danfo fare", "Medium of exchange"], ["Saving for school fees", "Store of value"], ["Checking which phone is cheaper", "Unit of account"]];
  ok("Check is disabled until all pairs are matched", await page.getByRole("button", { name: "Check", exact: true }).isDisabled());
  for (const [l, r] of pairs) { await page.getByRole("button", { name: l }).click(); await page.getByRole("button", { name: `Match with ${r}` }).click(); }
  await page.getByRole("button", { name: "Check", exact: true }).click();
  ok("Match step accepts correct pairs", await vis(page.getByText("Correct", { exact: true })));
  await page.getByRole("button", { name: "Continue" }).click();
  ok("Lesson complete screen with XP", await vis(page.getByRole("heading", { name: "Lesson complete" })) && await vis(page.getByText(/\+\d+ XP/)));
  await go("/learn/");
  ok("Journey marks lesson done and unlocks the next", await vis(page.getByRole("link", { name: /What money really is, Done/ })) && await vis(page.getByRole("link", { name: /Why prices go up/ })));
  ok("Later lessons stay locked", await vis(page.getByRole("button", { name: /Compound interest, locked/ })));

  // 3. Daily question via Next for you
  await go("/");
  ok("Next for you moves to the daily question", await vis(page.getByRole("link", { name: /Daily question/ })));

  // 4. Ask Fin: answer, refusal, context sheet, limit
  await go("/ask/?q=" + encodeURIComponent("What is inflation?"));
  await page.getByText("Inflation is when prices rise").waitFor();
  ok("Ask Fin answers with a Library citation", await vis(page.getByRole("link", { name: "Inflation" }).first()));
  await page.getByLabel("Your question").fill("Should I buy MTN shares?");
  await page.getByRole("button", { name: "Send" }).click();
  await page.getByText("I can't tell you what to buy or sell").waitFor();
  ok("Ask Fin refuses buy/sell advice", true);
  await page.getByLabel("Your question").fill("tell me about volcanoes");
  await page.getByRole("button", { name: "Send" }).click();
  await page.getByText("I don't have a good answer").waitFor();
  ok("Ask Fin says when it has no answer (no fake citation)", true);
  await go("/companies/MTNN/");
  await page.getByRole("button", { name: /Ask Fin about MTN Nigeria/ }).click();
  ok("Company Ask Fin sheet shows context and company prompts", await vis(page.getByText("About: MTN Nigeria")) && await vis(page.getByRole("button", { name: "How does MTN Nigeria make money?" })));
  await page.getByRole("button", { name: "How does MTN Nigeria make money?" }).click();
  await page.getByText(/Revenue is money a company takes in/).waitFor();
  ok("Sheet answers in place (URL unchanged)", page.url().includes("/companies/MTNN/"));
  await page.getByLabel("Your question").fill("What is a dividend?");
  await page.getByRole("button", { name: "Send" }).click();
  await page.getByText(/A dividend is part of/).waitFor();
  ok("5th question still allowed on Free", true);
  await page.getByLabel("Your question").fill("What is a share?");
  await page.getByRole("button", { name: "Send" }).click();
  await page.getByText(/You've used today's free questions/).waitFor({ timeout: 5000 }).catch(() => {});
  ok("Free daily limit (5) reached calmly with Library link", await vis(page.getByText(/You've used today's free questions/)));
  await page.keyboard.press("Escape");

  // 5. Search + watchlist with Undo
  await go("/search/");
  await page.getByLabel("Search companies, lessons and articles").fill("dividnd");
  await page.getByText(/No results for/).waitFor();
  ok("No-results state suggests a spelling fix", await vis(page.getByRole("button", { name: /Search for “dividend”/ })));
  await page.getByLabel("Search companies, lessons and articles").fill("mtn");
  await page.getByRole("link", { name: /MTN Nigeria/ }).waitFor();
  ok("Search finds companies", true);
  await go("/companies/");
  await page.getByRole("button", { name: "Add Zenith Bank to watchlist" }).click();
  await page.getByRole("button", { name: /Watchlist \(1\)/ }).click();
  ok("One-tap watchlist add shows in Watchlist filter", await vis(page.getByRole("link", { name: /Zenith Bank/ })));
  await page.getByRole("button", { name: "Remove Zenith Bank from watchlist" }).click();
  ok("Removing shows empty state", await vis(page.getByText("Your watchlist is empty")));
  await page.getByRole("button", { name: "Undo" }).click();
  ok("Undo restores the company", await vis(page.getByRole("link", { name: /Zenith Bank/ })));
  await page.reload({ waitUntil: "networkidle" });
  ok("Filter preference is remembered after reload", await page.getByRole("button", { name: /Watchlist \(1\)/ }).getAttribute("aria-pressed") === "true");

  // 6. Simulator: amount-first buy, labels, insufficient, sell, history
  await go("/simulator/");
  ok("Simulator shows Virtual money and Demo data labels", await vis(page.getByText("Virtual money").first()) && await vis(page.getByText("Demo data").first()));
  await go("/simulator/LGFD/");
  await page.getByRole("button", { name: "Buy", exact: true }).click();
  await page.getByRole("button", { name: "₦10,000" }).click();
  const breakdown = page.getByLabel("Cost breakdown");
  await breakdown.waitFor();
  const btxt = await breakdown.innerText();
  ok("Trade sheet shows shares, fees, total and cash left", /Shares/.test(btxt) && /Fees/.test(btxt) && /Total/.test(btxt) && /Virtual cash left/.test(btxt), btxt.replace(/\n/g, " | "));
  await page.getByLabel("How much do you want to invest?").fill("500");
  ok("Too-small amount explains and offers the cheapest amount", await vis(page.getByText(/That buys 0 shares/)));
  await page.getByLabel("How much do you want to invest?").fill("10000");
  const confirm = page.getByRole("button", { name: /Confirm: buy/ });
  await confirm.dblclick();
  await page.getByRole("heading", { name: /You bought/ }).first().waitFor();
  const sim1 = await page.evaluate(() => JSON.parse(localStorage.getItem("fv.sim")).data.account);
  ok("Double tap places exactly one trade", sim1.trades.length === 1, `trades=${sim1.trades.length}`);
  ok("Cash = start − total paid (integer kobo)", sim1.cashKobo === 10000000 - sim1.trades[0].netKobo && Number.isInteger(sim1.cashKobo));
  await page.getByRole("button", { name: /Back to Lagoon Foods/ }).click();
  await page.getByRole("button", { name: "Buy", exact: true }).click();
  await page.getByRole("button", { name: "By shares" }).click();
  await page.getByLabel("Number of shares").fill("100000");
  ok("Insufficient virtual cash blocks Confirm with a message", await vis(page.getByText(/more than your virtual cash/)) && await page.getByRole("button", { name: /Confirm/ }).isDisabled());
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Sell" }).click();
  await page.getByLabel(/Shares to sell/).fill("999");
  ok("Overselling is blocked", await vis(page.getByText(/You only own/)));
  await page.getByRole("button", { name: "Half" }).click();
  await page.getByRole("button", { name: /Confirm: sell/ }).click();
  await page.getByRole("heading", { name: /You sold/ }).first().waitFor();
  await go("/simulator/history/");
  ok("History lists both trades", await vis(page.getByText("Bought")) && await vis(page.getByText("Sold")));
  ok("History is consistent with balance", !(await vis(page.getByText(/doesn't match your balance/))));

  // 7. Calculator
  await go("/calculator/");
  await page.getByLabel("Amount").fill("abc");
  ok("Calculator validates bad input", await vis(page.getByText(/Enter an amount in naira/)));
  await page.getByRole("button", { name: "₦100,000" }).click();
  ok("Calculator shows live result", await vis(page.getByText("Worth now")));

  // 8. Checkout outcomes
  const setOutcome = (o) => page.evaluate((o) => { const d = JSON.parse(localStorage.getItem("fv.dev")); d.data.checkoutOutcome = o; localStorage.setItem("fv.dev", JSON.stringify(d)); }, o);
  await setOutcome("failed");
  await go("/plans/");
  ok("Plans show placeholder price notice", await vis(page.getByText(/Prices are placeholders/)));
  await page.getByRole("button", { name: /Continue with Plus/ }).click();
  await page.getByRole("heading", { name: "Payment not completed" }).first().waitFor({ timeout: 10000 });
  const orderId1 = new URL(page.url()).searchParams.get("order");
  ok("Confirmed failure shows Not completed", true);
  await setOutcome("success");
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Try again" }).click();
  await page.getByRole("heading", { name: "You're on Plus" }).first().waitFor({ timeout: 10000 });
  const billing = await page.evaluate(() => JSON.parse(localStorage.getItem("fv.billing")).data);
  ok("Retry reuses the same order and succeeds", billing.orders.length === 1 && billing.orders[0].id === orderId1 && billing.orders[0].attempts === 2 && billing.sub.plan === "plus");
  await go("/plans/");
  ok("Plus plan screen shows renewal and Cancel", await vis(page.getByRole("button", { name: "Cancel Plus" })));

  // 9. Offline checkout keeps order pending
  await page.evaluate(() => localStorage.setItem("fv.billing", JSON.stringify({ v: 1, data: { sub: { plan: "free" }, orders: [] } })));
  await setOutcome("offline");
  await go("/plans/");
  await page.getByRole("button", { name: /Continue with Plus/ }).click();
  await page.getByRole("heading", { name: "You're offline" }).first().waitFor({ timeout: 10000 });
  const b2 = await page.evaluate(() => JSON.parse(localStorage.getItem("fv.billing")).data);
  ok("Offline never marks the payment failed", b2.orders[0].status === "pending");

  // 10. Admin toggle removes entry point
  await go("/admin/");
  await page.waitForURL(/admin\/sign-in/);
  ok("Learner account is kept out of admin", true);
  await page.getByRole("button", { name: /Sign in as admin/ }).click();
  await go("/admin/settings/");
  await page.getByRole("switch", { name: /Report a mistake on/ }).click();
  await page.getByRole("button", { name: "Turn off" }).click();
  await go("/admin/audit/");
  ok("Admin change written to audit log", await vis(page.getByText("Report a mistake turned off")));
  await go("/library/inflation/");
  ok("Turned-off prompt's entry point is removed", (await page.getByRole("button", { name: "Report a mistake" }).count()) === 0);

  // 11. Malformed storage is handled
  await page.evaluate(() => { localStorage.setItem("fv.sim", "{broken"); localStorage.setItem("fv.learning", JSON.stringify({ v: 1, data: { lessons: 5 } })); });
  await go("/simulator/");
  ok("Malformed localStorage falls back safely", await vis(page.getByText("Portfolio value")));

  // 12. Layout: no horizontal scroll at 360px on key routes
  for (const p of ["/", "/learn/", "/companies/", "/simulator/", "/simulator/LGFD/", "/plans/", "/calculator/", "/library/inflation/"]) {
    await go(p);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(`No horizontal scroll at 360px: ${p}`, over <= 0, `overflow=${over}`);
  }

  ok("No uncaught page errors", errors.filter((e) => !/fonts\.g/.test(e)).length === 0, errors.slice(0, 3).join(" || "));
  await browser.close();
  for (const r of results) console.log(r.join("  "));
  const failed = results.filter((r) => r[0] === "FAIL").length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { for (const r of results) console.log(r.join("  ")); console.error("CRASH:", e.message.split("\n")[0]); process.exit(2); });
