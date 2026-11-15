import type { Lesson, World } from "@finvora/engine";

export const WORLDS: World[] = [
  { id: "money-foundations", order: 1, title: "Money Foundations", summary: "How money works, why prices rise and how saving grows.", lessonIds: ["what-is-money", "inflation", "saving-vs-investing", "compound-interest", "risk-and-return", "budgeting"], bossId: "boss-foundations", available: true },
  { id: "understanding-investing", order: 2, title: "Understanding Investing", summary: "Shares, bonds and funds, explained with Nigerian examples.", lessonIds: [], available: false, plannedTopics: ["What is a share?", "Bonds and treasury bills", "Mutual funds", "Diversification"] },
  { id: "reading-companies", order: 3, title: "Reading Companies", summary: "Revenue, profit and dividends, and what they tell you.", lessonIds: [], available: false, plannedTopics: ["Revenue and profit", "Dividends", "P/E ratio", "Annual reports"] },
];

export const LESSONS: Lesson[] = [
  {
    id: "what-is-money", worldId: "money-foundations", title: "What money really is", objective: "Explain the three jobs money does.", minutes: 3, kind: "lesson", relatedArticles: ["what-is-money"], concepts: ["money"],
    steps: [
      { id: "s1", type: "info", title: "Money does three jobs", body: ["Money lets you swap things easily (a medium of exchange).", "It lets you compare prices (a unit of account).", "And it lets you keep value for later (a store of value)."], example: "Instead of swapping a bag of rice for a phone charger, you pay ₦2,000. The naira makes the swap simple." },
      { id: "s2", type: "choice", prompt: "Ada keeps ₦5,000 in her drawer to spend next month. Which job is the money doing?", options: [{ id: "a", text: "Medium of exchange", feedback: "That's when you spend it. Ada is keeping it." }, { id: "b", text: "Store of value" }, { id: "c", text: "Unit of account", feedback: "That's for comparing prices." }], correct: "b", explanation: "Keeping money to use later is money working as a store of value." },
      { id: "s3", type: "truefalse", statement: "Comparing the price of garri in two markets uses money as a unit of account.", answer: true, explanation: "Prices in naira let you compare value easily. That is money as a unit of account." },
      { id: "s4", type: "match", prompt: "Match each example to the job money is doing.", pairs: [{ id: "p1", left: "Paying a danfo fare", right: "Medium of exchange" }, { id: "p2", left: "Saving for school fees", right: "Store of value" }, { id: "p3", left: "Checking which phone is cheaper", right: "Unit of account" }], explanation: "Spending, saving and comparing are the three jobs of money." },
    ],
  },
  {
    id: "inflation", worldId: "money-foundations", title: "Why prices go up", objective: "Explain inflation and how it affects savings.", minutes: 4, kind: "lesson", relatedArticles: ["inflation"], concepts: ["inflation"],
    steps: [
      { id: "s1", type: "info", title: "Inflation means prices rise over time", body: ["When prices rise, each naira buys a little less than before.", "Inflation is usually shown as a yearly percentage."], example: "If a loaf of bread cost ₦1,000 last year and ₦1,200 this year, its price rose 20%." },
      { id: "s2", type: "number", prompt: "A bag of rice cost ₦50,000. Prices rise 10% in a year. What does it cost now?", prefix: "₦", answer: 55000, tolerance: 1, explanation: "10% of ₦50,000 is ₦5,000, so the new price is ₦55,000.", hint: "Work out 10% first, then add it." },
      { id: "s3", type: "fill", sentence: "If your savings earn less than inflation, your money buys ___ than before.", options: ["more", "less", "the same"], answer: "less", explanation: "When prices rise faster than your savings grow, you can buy less with the same money." },
      { id: "s4", type: "scenario", situation: "Tunde has ₦200,000 in a savings account paying 5% a year. Prices are rising about 20% a year.", question: "What is the most useful thing for Tunde to understand?", options: [{ id: "a", text: "His money is losing buying power each year.", feedback: "Yes. 5% growth against 20% price rises means he can buy less over time.", sound: true }, { id: "b", text: "His balance is going up, so he's fine.", feedback: "The number grows, but what it can buy shrinks.", sound: false }], takeaway: "Compare what your money earns with inflation. That shows whether your buying power grows or shrinks." },
    ],
  },
  {
    id: "saving-vs-investing", worldId: "money-foundations", title: "Saving vs investing", objective: "Tell saving and investing apart.", minutes: 3, kind: "lesson", relatedArticles: ["saving-vs-investing", "what-is-a-share"], concepts: ["saving", "investing"],
    steps: [
      { id: "s1", type: "info", title: "Two different jobs", body: ["Saving keeps money safe and easy to reach, for short-term needs and emergencies.", "Investing puts money into things that may grow, like shares or bonds, over longer periods. The value can also fall."], table: { caption: "At a glance", rows: [["Saving", "Low risk, low growth, easy to reach"], ["Investing", "Higher risk, possible growth, best for years"]] } },
      { id: "s2", type: "choice", prompt: "Which is the best place for an emergency fund?", options: [{ id: "a", text: "A savings account" }, { id: "b", text: "Shares of one company", feedback: "Share prices can fall just when you need the money." }], correct: "a", explanation: "Emergency money should be safe and quick to reach, which is what saving is for." },
      { id: "s3", type: "order", prompt: "Put these steps in a sensible order.", items: [{ id: "a", text: "Build an emergency fund" }, { id: "b", text: "Learn how investments work" }, { id: "c", text: "Invest money you won't need soon" }], explanation: "A safety net first, then learning, then investing money you can leave for years." },
    ],
  },
  {
    id: "compound-interest", worldId: "money-foundations", title: "Compound interest", objective: "See how growth builds on growth.", minutes: 4, kind: "lesson", relatedArticles: ["compound-interest"], concepts: ["compounding"],
    steps: [
      { id: "s1", type: "info", title: "Interest on your interest", body: ["With compound interest, you earn interest on your savings and on the interest already added.", "The longer you leave it, the faster it grows."], example: "₦100,000 at 10% a year becomes ₦110,000 after one year and ₦121,000 after two." },
      { id: "s2", type: "number", prompt: "₦100,000 earns 10% a year, compounded yearly. How much after 2 years?", prefix: "₦", answer: 121000, tolerance: 1, explanation: "Year 1: ₦110,000. Year 2: ₦110,000 + 10% = ₦121,000.", hint: "Add 10% twice, not 20% once." },
      { id: "s3", type: "truefalse", statement: "Starting earlier usually matters more than starting with a large amount.", answer: true, explanation: "Time gives compounding more rounds to work." },
    ],
  },
  {
    id: "risk-and-return", worldId: "money-foundations", title: "Risk and return", objective: "Understand why higher returns come with higher risk.", minutes: 3, kind: "lesson", relatedArticles: ["risk-and-return", "diversification"], concepts: ["risk"],
    steps: [
      { id: "s1", type: "info", title: "No free lunch", body: ["Investments that might grow more can also fall more.", "Spreading money across different investments (diversification) lowers the chance that one bad result hurts you a lot."] },
      { id: "s2", type: "choice", prompt: "Someone promises 50% a month with \"no risk\". What's the best response?", options: [{ id: "a", text: "Be very careful: this sounds like a scam." }, { id: "b", text: "Invest a little to test it.", feedback: "Even a small amount can be lost. Very high, guaranteed returns are a warning sign." }], correct: "a", explanation: "Real investments that can earn a lot can also lose. Guaranteed high returns are a common sign of fraud." },
      { id: "s3", type: "fill", sentence: "Spreading money across many investments is called ___.", options: ["diversification", "inflation", "compounding"], answer: "diversification", explanation: "Diversification means not putting all your eggs in one basket." },
    ],
  },
  {
    id: "budgeting", worldId: "money-foundations", title: "A simple budget", objective: "Split income into needs, wants and savings.", minutes: 3, kind: "lesson", relatedArticles: ["budgeting"], concepts: ["budgeting"],
    steps: [
      { id: "s1", type: "info", title: "Plan before you spend", body: ["A budget is a plan for your money. One simple guide: about 50% needs, 30% wants, 20% savings.", "Adjust it to your life. The point is to decide on purpose."] },
      { id: "s2", type: "number", prompt: "Chioma earns ₦150,000 a month. Using 20% for savings, how much does she save?", prefix: "₦", answer: 30000, tolerance: 1, explanation: "20% of ₦150,000 is ₦30,000." },
      { id: "s3", type: "match", prompt: "Sort each cost.", pairs: [{ id: "p1", left: "Rent", right: "Need" }, { id: "p2", left: "Weekend suya with friends", right: "Want" }, { id: "p3", left: "Emergency fund", right: "Savings" }], explanation: "Needs keep life running, wants make it nicer, savings protect the future." },
    ],
  },
  {
    id: "boss-foundations", worldId: "money-foundations", title: "Money Foundations challenge", objective: "Show what you've learned. Pass with 4 of 5.", minutes: 5, kind: "boss", relatedArticles: [], concepts: ["money", "inflation", "compounding", "risk", "budgeting"],
    steps: [
      { id: "b1", type: "choice", prompt: "Prices rose 15% this year. Your savings earned 5%. What happened to your buying power?", options: [{ id: "a", text: "It went down" }, { id: "b", text: "It went up" }, { id: "c", text: "It stayed the same" }], correct: "a", explanation: "Prices grew faster than your savings, so the same money buys less." },
      { id: "b2", type: "number", prompt: "₦50,000 earns 20% a year compounded yearly. Value after 2 years?", prefix: "₦", answer: 72000, tolerance: 1, explanation: "₦50,000 → ₦60,000 → ₦72,000." },
      { id: "b3", type: "truefalse", statement: "An emergency fund is best kept in a single company's shares.", answer: false, explanation: "Emergency money needs to be safe and quick to reach." },
      { id: "b4", type: "fill", sentence: "Investments that can grow more can usually also ___ more.", options: ["fall", "save", "inflate"], answer: "fall", explanation: "Higher possible return comes with higher risk." },
      { id: "b5", type: "choice", prompt: "Which is a want, not a need?", options: [{ id: "a", text: "A new phone case" }, { id: "b", text: "Transport to work" }, { id: "c", text: "Rent" }], correct: "a", explanation: "A phone case is nice to have; the others keep life running." },
    ],
  },
];

export const DAILY_QUESTION = {
  id: "daily-1",
  prompt: "Which usually grows your buying power over many years?",
  options: [{ id: "a", text: "Money kept in a drawer" }, { id: "b", text: "Investments that beat inflation" }],
  correct: "b",
  explanation: "Cash in a drawer loses buying power to inflation. Investments that grow faster than prices can keep up, though they carry risk.",
};
