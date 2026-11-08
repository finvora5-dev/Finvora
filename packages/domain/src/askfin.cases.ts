// Ask Fin test questions (design Part 3). "tune" cases set the score bands; "held" cases only check them.
// expect: the reply kind; id: the hand-written answer id or article slug the answer must come from.
import type { AskKind } from "./askfin";

export interface AskCase { q: string; expect: AskKind; id?: string; set: "tune" | "held" }

export const ASK_CASES: AskCase[] = [
  // Answers from hand-written answers
  { q: "What is inflation?", expect: "answer", id: "inflation", set: "tune" },
  { q: "What is a dividend?", expect: "answer", id: "dividend", set: "tune" },
  { q: "How does compound interest work?", expect: "answer", id: "compound", set: "tune" },
  { q: "What are treasury bills?", expect: "answer", id: "tbills", set: "tune" },
  { q: "How do I make a budget?", expect: "answer", id: "budget", set: "tune" },
  { q: "What is diversification?", expect: "answer", id: "diversify", set: "tune" },
  { q: "what does p/e ratio mean", expect: "answer", id: "pe", set: "held" },
  { q: "what are trading fees", expect: "answer", id: "fees-and-costs", set: "held" },
  // Answers only the Library finds
  { q: "Why is everything so expensive now?", expect: "answer", id: "inflation", set: "tune" },
  { q: "What is the stock exchange?", expect: "answer", id: "stock-exchange", set: "tune" },
  { q: "What is market capitalisation?", expect: "answer", id: "market-capitalisation", set: "tune" },
  { q: "What is money?", expect: "answer", id: "what-is-money", set: "tune" },
  { q: "how do I buy shares on the NGX", expect: "answer", id: "stock-exchange", set: "tune" },
  { q: "what is a shareholder", expect: "answer", id: "what-is-a-share", set: "tune" },
  { q: "how is a company's worth measured", expect: "answer", id: "market-capitalisation", set: "held" },
  { q: "is it risky to lose money investing", expect: "answer", id: "risk-and-return", set: "held" },
  { q: "what is a stockbroker", expect: "answer", id: "stock-exchange", set: "held" },
  // Off topic
  { q: "What is the weather in Lagos?", expect: "decline", set: "tune" },
  { q: "Who won the football match yesterday?", expect: "decline", set: "tune" },
  { q: "How do I cook jollof rice?", expect: "decline", set: "tune" },
  { q: "Can you share a recipe?", expect: "decline", set: "tune" },
  { q: "Sing me a song", expect: "decline", set: "tune" },
  { q: "hello", expect: "decline", set: "tune" },
  { q: "Help me with my maths homework", expect: "decline", set: "held" },
  { q: "What time is it in Abuja?", expect: "decline", set: "held" },
  // Advice
  { q: "Should I buy MTN shares?", expect: "refusal", set: "tune" },
  { q: "Which stock should I buy?", expect: "refusal", set: "tune" },
  { q: "Is it a good time to buy Dangote?", expect: "refusal", set: "tune" },
  { q: "Recommend some stocks", expect: "refusal", set: "tune" },
  { q: "buy or sell Zenith?", expect: "refusal", set: "held" },
  // Companies (all answered, no figures)
  { q: "What was Zenith Bank's profit last year?", expect: "answer", id: "revenue-and-profit", set: "tune" },
  { q: "How much dividend does MTN pay?", expect: "answer", id: "dividend", set: "tune" },
  { q: "What is GTBank's share price?", expect: "answer", set: "tune" },
  { q: "Okeke Bank profit?", expect: "answer", set: "tune" },
  { q: "How does Dangote Cement make money?", expect: "answer", set: "tune" },
  { q: "What is Airtel's P/E ratio?", expect: "answer", id: "price-to-earnings", set: "held" },
  // Not enough information (finance words, no article)
  { q: "How do I file my tax return?", expect: "insufficient", set: "tune" },
  { q: "How does a pension fund work?", expect: "didyoumean", set: "tune" },
  { q: "Should I get a loan or a credit card first?", expect: "insufficient", set: "tune" },
  { q: "How do I send dollars abroad?", expect: "insufficient", set: "held" },
];
