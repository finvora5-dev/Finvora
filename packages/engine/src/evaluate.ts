import type { Answer, Evaluation, ScoredStep } from "./types";

/** Check an answer against a step. Pure and deterministic. */
export function evaluate(step: ScoredStep, answer: Answer): Evaluation {
  if (answer.type !== step.type) {
    return { correct: false, explanation: explanationOf(step) };
  }
  switch (step.type) {
    case "choice": {
      const a = answer as Extract<Answer, { type: "choice" }>;
      const picked = step.options.find((o) => o.id === a.optionId);
      return { correct: a.optionId === step.correct, feedback: picked?.feedback, explanation: step.explanation };
    }
    case "truefalse": {
      const a = answer as Extract<Answer, { type: "truefalse" }>;
      return { correct: a.value === step.answer, explanation: step.explanation };
    }
    case "fill": {
      const a = answer as Extract<Answer, { type: "fill" }>;
      return { correct: normalise(a.value) === normalise(step.answer), explanation: step.explanation };
    }
    case "order": {
      const a = answer as Extract<Answer, { type: "order" }>;
      const expected = step.items.map((i) => i.id);
      const correct = a.ids.length === expected.length && a.ids.every((id, i) => id === expected[i]);
      return { correct, explanation: step.explanation };
    }
    case "match": {
      const a = answer as Extract<Answer, { type: "match" }>;
      const correct = step.pairs.every((p) => a.pairs[p.id] === p.id);
      return { correct, explanation: step.explanation };
    }
    case "number": {
      const a = answer as Extract<Answer, { type: "number" }>;
      const correct = Number.isFinite(a.value) && Math.abs(a.value - step.answer) <= step.tolerance;
      return { correct, explanation: step.explanation };
    }
    case "scenario": {
      const a = answer as Extract<Answer, { type: "scenario" }>;
      const picked = step.options.find((o) => o.id === a.optionId);
      return { correct: !!picked?.sound, feedback: picked?.feedback, explanation: step.takeaway };
    }
  }
}

function explanationOf(step: ScoredStep): string {
  return step.type === "scenario" ? step.takeaway : step.explanation;
}

function normalise(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Parse a user-typed number: accepts "₦1,234.50", "1 234", "12%". Returns NaN if unreadable. */
export function parseNumberInput(raw: string): number {
  const cleaned = raw.replace(/[₦,%\s]/g, "").replace(/^n(?=\d)/i, "");
  if (!/^-?\d*\.?\d+$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}
