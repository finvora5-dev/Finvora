import { describe, expect, it } from "vitest";
import { evaluate, parseNumberInput, levelFor, lagosDay, addDays, daysBetween } from "./index";

describe("evaluate", () => {
  it("checks each step type", () => {
    expect(evaluate({ id: "c", type: "choice", prompt: "", options: [{ id: "a", text: "A", feedback: "nope" }, { id: "b", text: "B" }], correct: "b", explanation: "e" }, { type: "choice", optionId: "a" })).toEqual({ correct: false, feedback: "nope", explanation: "e" });
    expect(evaluate({ id: "t", type: "truefalse", statement: "", answer: true, explanation: "e" }, { type: "truefalse", value: true }).correct).toBe(true);
    expect(evaluate({ id: "f", type: "fill", sentence: "", options: [], answer: "Interest", explanation: "e" }, { type: "fill", value: "  interest " }).correct).toBe(true);
    expect(evaluate({ id: "o", type: "order", prompt: "", items: [{ id: "1", text: "" }, { id: "2", text: "" }], explanation: "e" }, { type: "order", ids: ["2", "1"] }).correct).toBe(false);
    expect(evaluate({ id: "m", type: "match", prompt: "", pairs: [{ id: "x", left: "", right: "" }], explanation: "e" }, { type: "match", pairs: { x: "x" } }).correct).toBe(true);
    expect(evaluate({ id: "n", type: "number", prompt: "", answer: 110, tolerance: 1, explanation: "e" }, { type: "number", value: 110.5 }).correct).toBe(true);
    expect(evaluate({ id: "s", type: "scenario", situation: "", question: "", options: [{ id: "a", text: "", feedback: "f", sound: true }], takeaway: "t" }, { type: "scenario", optionId: "a" })).toEqual({ correct: true, feedback: "f", explanation: "t" });
  });
  it("marks a mismatched answer type wrong", () => {
    expect(evaluate({ id: "t", type: "truefalse", statement: "", answer: true, explanation: "e" }, { type: "number", value: 1 }).correct).toBe(false);
  });
});

describe("rules", () => {
  it("parses number input", () => {
    expect(parseNumberInput("₦1,234.50")).toBe(1234.5);
    expect(parseNumberInput("12%")).toBe(12);
    expect(parseNumberInput("abc")).toBeNaN();
  });
  it("computes levels and Lagos days", () => {
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(120).level).toBe(2);
    expect(lagosDay("2026-11-03T23:30:00Z")).toBe("2026-11-04");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(daysBetween("2026-11-01", "2026-11-03")).toBe(2);
  });
});
