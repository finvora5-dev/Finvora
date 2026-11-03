"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { evaluate, parseNumberInput, levelFor, type Answer, type Evaluation, type ScoredStep, type Step } from "@finvora/engine";
import { completeLesson, startLesson, saveStep, isUnlocked, shouldShow, type CompletionResult } from "@finvora/domain";
import { Dialog, ProgressBar, SessionGuard, Sheet, useToast } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Fin } from "@/components/Fin";
import { AskSheet } from "@/components/AskSheet";
import { RateSheet, ReportSheet } from "@/components/FeedbackSheets";
import { api, today } from "@/lib/api";
import { read, update, useStore, useHydrated } from "@/lib/store";

function shuffle<T>(arr: T[], seed: string): T[] {
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { h = (h * 1103515245 + 12345) | 0; const j = Math.abs(h) % (i + 1); [a[i], a[j]] = [a[j]!, a[i]!]; }
  // Never show an order/match already solved.
  return a.every((x, i) => x === arr[i]) && a.length > 1 ? [...a.slice(1), a[0]!] : a;
}

export function LessonPlayer({ id }: { id: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const lesson = api.lesson(id)!;
  const learning = useStore("learning");
  const feedbackCfg = useStore("feedback");
  const toast = useToast();
  const [index, setIndex] = useState<number | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [result, setResult] = useState<Evaluation | null>(null);
  const [firstTry, setFirstTry] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<CompletionResult | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [asking, setAsking] = useState(false);
  const [rating, setRating] = useState(false);
  const [reporting, setReporting] = useState(false);
  const order = api.lessonOrder();

  // Start or resume at the saved step (resume requirement).
  useEffect(() => {
    if (!hydrated || index !== null) return;
    const s = read("learning");
    const saved = s.lessons[id];
    update("learning", (l) => startLesson(l, id));
    setIndex(saved?.status === "inProgress" ? Math.min(saved.step, lesson.steps.length - 1) : 0);
  }, [hydrated, id, index, lesson.steps.length]);

  if (!hydrated || index === null) return <div className="frame"><SessionGuard /><main className="main" aria-busy="true" /></div>;

  if (!isUnlocked(learning, order, id) && learning.lessons[id]?.status !== "complete") {
    return (
      <div className="frame"><SessionGuard /><main id="main" className="main" style={{ alignItems: "center", textAlign: "center", justifyContent: "center" }}>
        <Fin mood="think" size={96} /><h1>Not unlocked yet</h1><p className="muted">Finish the earlier lessons in this world first.</p>
        <Link href="/learn/" className="btn">Back to Learn</Link>
      </main></div>
    );
  }

  const step: Step = lesson.steps[index]!;
  const scoredCount = lesson.steps.filter((s) => s.type !== "info").length;
  const isBoss = lesson.kind === "boss";

  function check() {
    if (step.type === "info" || !answer) return;
    const r = evaluate(step as ScoredStep, answer);
    setResult(r);
    if (!(step.id in firstTry)) setFirstTry((f) => ({ ...f, [step.id]: r.correct }));
  }

  function next() {
    const nextIndex = index! + 1;
    setAnswer(null); setResult(null);
    if (nextIndex >= lesson.steps.length) {
      const correct = Object.values(firstTry).filter(Boolean).length;
      const res = completeLesson(read("learning"), id, lesson.kind, correct, scoredCount, today());
      update("learning", () => res.state);
      setDone(res);
      return;
    }
    update("learning", (l) => saveStep(l, id, nextIndex));
    setIndex(nextIndex);
  }

  if (done) {
    const correct = Object.values(firstTry).filter(Boolean).length;
    const nextId = order[order.indexOf(id) + 1];
    const lvl = levelFor(done.state.xp);
    const canRate = shouldShow(feedbackCfg.prompts.rateLesson, feedbackCfg.history.rateLesson ?? {}, today(), Math.random());
    return (
      <div className="frame"><SessionGuard />
        <main id="main" className="main has-sticky" style={{ alignItems: "center", textAlign: "center", gap: 14 }}>
          <div className="pop" style={{ marginTop: 24 }}><Fin mood={done.passed ? "proud" : "oops"} size={120} /></div>
          <h1>{done.passed ? (isBoss ? "Challenge passed" : "Lesson complete") : "Nearly there"}</h1>
          <p className="muted">{done.passed ? `You got ${correct} of ${scoredCount} right on the first try.` : `You got ${correct} of ${scoredCount}. You need ${Math.ceil(scoredCount * 0.8)} to pass. Review and try again whenever you're ready.`}</p>
          {done.xpGained > 0 && <p className="tag" style={{ fontSize: 15, minHeight: 32 }}>+{done.xpGained} XP</p>}
          {done.leveledUp && <div className="notice notice-good" role="status"><div className="grow"><strong>Level up: {lvl.title}</strong></div></div>}
          {lesson.relatedArticles.length > 0 && <Link href={`/library/${lesson.relatedArticles[0]}/`} className="link-btn">Read more in the Library</Link>}
          {canRate && feedbackCfg.prompts.rateLesson.enabled && <button type="button" className="link-btn" onClick={() => setRating(true)}><Icon name="star" size={18} />Rate this lesson</button>}
        </main>
        <div className="sticky-cta">
          {done.passed
            ? <Link className="btn" href={nextId ? `/learn/${nextId}/` : "/learn/"}>{nextId ? "Next lesson" : "Back to Learn"}</Link>
            : <button type="button" className="btn" onClick={() => { setDone(null); setFirstTry({}); setIndex(0); update("learning", (l) => saveStep(startLesson(l, id), id, 0)); }}>Try again</button>}
          <Link href="/" className="link-btn">Home</Link>
        </div>
        {rating && <RateSheet where={`Lesson: ${lesson.title}`} onClose={() => { setRating(false); update("feedback", (f) => ({ ...f, history: { ...f.history, rateLesson: { lastShownDay: today() } } })); }} />}
      </div>
    );
  }

  const progress = index / lesson.steps.length;
  const canCheck = step.type === "info" || !!answer;

  return (
    <div className="frame"><SessionGuard />
      <div className="progress-top" style={{ position: "sticky", top: 0, background: "#FFFFFF", zIndex: 10 }}>
        <button type="button" className="icon-btn" aria-label="Leave lesson" onClick={() => setLeaving(true)}><Icon name="close" /></button>
        <div className="grow"><ProgressBar value={progress} label={`Step ${index + 1} of ${lesson.steps.length}`} /></div>
        <button type="button" className="icon-btn" aria-label="Ask Fin about this lesson" onClick={() => setAsking(true)}><Fin mood="happy" size={28} /></button>
        {feedbackCfg.prompts.reportMistake.enabled && <button type="button" className="icon-btn" aria-label="Report a mistake" onClick={() => setReporting(true)}><Icon name="flag" size={20} /></button>}
      </div>
      <main id="main" className="main has-sticky" key={step.id}>
        <span className="eyebrow muted">{isBoss ? "Challenge · " : ""}{lesson.title} · {index + 1}/{lesson.steps.length}</span>
        <StepView step={step} answer={answer} setAnswer={setAnswer} locked={!!result} result={result} />
      </main>
      <div className="sticky-cta" style={result ? { padding: 0, background: "none" } : undefined}>
        {result ? (
          <div className={`feedback ${result.correct ? "good" : "bad"} in`} role="status" aria-live="assertive">
            <div className="row" style={{ alignItems: "flex-start" }}>
              <Fin mood={result.correct ? "cheer" : "oops"} size={44} />
              <div className="grow"><strong style={{ fontSize: 18 }}>{result.correct ? "Correct" : "Not quite"}</strong>
                {result.feedback && <p className="small">{result.feedback}</p>}
                <p className="small">{result.explanation}</p></div>
            </div>
            <div className="col" style={{ padding: "12px 0 calc(14px + env(safe-area-inset-bottom))", gap: 6 }}>
              {result.correct || isBoss
                ? <button type="button" className={`btn ${result.correct ? "btn-g" : ""}`} onClick={next} autoFocus>Continue</button>
                : <><button type="button" className="btn btn-r" onClick={() => { setResult(null); setAnswer(null); }} autoFocus>Try again</button><button type="button" className="link-btn" onClick={next}>Skip for now</button></>}
            </div>
          </div>
        ) : (
          <button type="button" className="btn" disabled={!canCheck} onClick={step.type === "info" ? next : check}>{step.type === "info" ? "Continue" : "Check"}</button>
        )}
      </div>
      {leaving && <Dialog title="Leave this lesson?" body="Your place is saved, so you can pick up from this step later." confirm="Leave lesson" cancel="Keep learning" onConfirm={() => router.push("/learn/")} onCancel={() => setLeaving(false)} />}
      {asking && <AskSheet context={{ type: "lesson", id, label: lesson.title }} onClose={() => setAsking(false)} />}
      {reporting && <ReportSheet where={`Lesson: ${lesson.title}, step ${index + 1}`} onClose={() => setReporting(false)} onSent={() => toast("Thanks. We'll check this step.")} />}
    </div>
  );
}

function StepView({ step, answer, setAnswer, locked, result }: { step: Step; answer: Answer | null; setAnswer: (a: Answer | null) => void; locked: boolean; result: Evaluation | null }) {
  const optClass = (selected: boolean) => `option ${locked && selected ? (result?.correct ? "right" : "wrong") : ""}`;
  switch (step.type) {
    case "info":
      return (
        <div className="col in">
          <h1 style={{ fontSize: 24 }}>{step.title}</h1>
          {step.body.map((p, i) => <p key={i}>{p}</p>)}
          {step.example && <div className="card card-pad card-tint"><span className="eyebrow" style={{ color: "var(--link)" }}>Example</span><p>{step.example}</p></div>}
          {step.table && <table className="t" style={{ border: "1.5px solid var(--border)" }}><caption className="sr">{step.table.caption}</caption><tbody>{step.table.rows.map(([a, b]) => <tr key={a}><th scope="row" style={{ textTransform: "none", fontSize: 15, color: "var(--ink)" }}>{a}</th><td>{b}</td></tr>)}</tbody></table>}
        </div>
      );
    case "choice":
    case "scenario": {
      const opts = step.options;
      const sel = answer && (answer.type === "choice" || answer.type === "scenario") ? answer.optionId : null;
      return (
        <div className="col in">
          {step.type === "scenario" && <div className="card card-pad card-tint"><p>{step.situation}</p></div>}
          <h1 style={{ fontSize: 21 }} id="q">{step.type === "choice" ? step.prompt : step.question}</h1>
          <div className="col" role="radiogroup" aria-labelledby="q">
            {opts.map((o) => <button key={o.id} type="button" role="radio" aria-checked={sel === o.id} disabled={locked} className={optClass(sel === o.id)} onClick={() => setAnswer({ type: step.type, optionId: o.id } as Answer)}>{o.text}</button>)}
          </div>
        </div>
      );
    }
    case "truefalse": {
      const sel = answer?.type === "truefalse" ? answer.value : null;
      return (
        <div className="col in">
          <span className="eyebrow muted">True or false?</span>
          <h1 style={{ fontSize: 21 }} id="q">{step.statement}</h1>
          <div className="grid2" role="radiogroup" aria-labelledby="q">
            {[true, false].map((v) => <button key={String(v)} type="button" role="radio" aria-checked={sel === v} disabled={locked} className={optClass(sel === v)} style={{ justifyContent: "center" }} onClick={() => setAnswer({ type: "truefalse", value: v })}>{v ? "True" : "False"}</button>)}
          </div>
        </div>
      );
    }
    case "fill": {
      const sel = answer?.type === "fill" ? answer.value : null;
      const [a, b] = step.sentence.split("___");
      return (
        <div className="col in">
          <span className="eyebrow muted">Fill the gap</span>
          <h1 style={{ fontSize: 21 }} id="q">{a}<span style={{ display: "inline-block", minWidth: 80, borderBottom: "3px solid var(--primary)", color: "var(--link)" }}>{sel ?? " "}</span>{b}</h1>
          <div className="chips" role="radiogroup" aria-labelledby="q">
            {step.options.map((o) => <button key={o} type="button" role="radio" aria-checked={sel === o} disabled={locked} className="chip" aria-pressed={sel === o} onClick={() => setAnswer({ type: "fill", value: o })}>{o}</button>)}
          </div>
        </div>
      );
    }
    case "number":
      return <NumberStepView step={step} setAnswer={setAnswer} locked={locked} />;
    case "order":
      return <OrderStepView step={step} setAnswer={setAnswer} locked={locked} />;
    case "match":
      return <MatchStepView step={step} answer={answer} setAnswer={setAnswer} locked={locked} />;
  }
}

function NumberStepView({ step, setAnswer, locked }: { step: Extract<Step, { type: "number" }>; setAnswer: (a: Answer | null) => void; locked: boolean }) {
  const [raw, setRaw] = useState("");
  const [hint, setHint] = useState(false);
  const bad = raw !== "" && Number.isNaN(parseNumberInput(raw));
  return (
    <div className="col in">
      <span className="eyebrow muted">Work it out</span>
      <h1 style={{ fontSize: 21 }}><label htmlFor="num">{step.prompt}</label></h1>
      <div className="row">{step.prefix && <strong style={{ fontSize: 22 }}>{step.prefix}</strong>}
        <input id="num" className="field num" inputMode="decimal" disabled={locked} value={raw} aria-invalid={bad} aria-describedby="num-err" onChange={(e) => { setRaw(e.target.value); const v = parseNumberInput(e.target.value); setAnswer(Number.isNaN(v) ? null : { type: "number", value: v }); }} style={{ fontSize: 22 }} />
        {step.suffix && <strong>{step.suffix}</strong>}</div>
      {bad && <p id="num-err" className="error-text">Enter a number, like 55000.</p>}
      {step.hint && (hint ? <div className="notice notice-info"><span>{step.hint}</span></div> : <button type="button" className="link-btn" style={{ alignSelf: "flex-start" }} onClick={() => setHint(true)}>Show a hint</button>)}
    </div>
  );
}

function OrderStepView({ step, setAnswer, locked }: { step: Extract<Step, { type: "order" }>; setAnswer: (a: Answer | null) => void; locked: boolean }) {
  const initial = useMemo(() => shuffle(step.items, step.id), [step]);
  const [items, setItems] = useState(initial);
  useEffect(() => { setAnswer({ type: "order", ids: items.map((i) => i.id) }); }, [items, setAnswer]);
  const move = (i: number, d: -1 | 1) => setItems((arr) => { const a = [...arr]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j]!, a[i]!]; return a; });
  return (
    <div className="col in">
      <span className="eyebrow muted">Put in order</span>
      <h1 style={{ fontSize: 21 }}>{step.prompt}</h1>
      <ol className="col" style={{ listStyle: "none", margin: 0, padding: 0 }} aria-live="polite">
        {items.map((it, i) => (
          <li key={it.id} className="option" style={{ cursor: "default" }}>
            <span className="tile" style={{ width: 32, height: 32 }}>{i + 1}</span><span className="grow">{it.text}</span>
            <button type="button" className="icon-btn" disabled={locked || i === 0} aria-label={`Move "${it.text}" up`} onClick={() => move(i, -1)}><Icon name="arrowUp" size={20} /></button>
            <button type="button" className="icon-btn" disabled={locked || i === items.length - 1} aria-label={`Move "${it.text}" down`} onClick={() => move(i, 1)}><Icon name="arrowDown" size={20} /></button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function MatchStepView({ step, setAnswer, locked }: { step: Extract<Step, { type: "match" }>; answer: Answer | null; setAnswer: (a: Answer | null) => void; locked: boolean }) {
  const rights = useMemo(() => shuffle(step.pairs, step.id + "r"), [step]);
  const [left, setLeft] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const usedRight = new Set(Object.values(pairs));
  const complete = Object.keys(pairs).length === step.pairs.length;
  function pickRight(rid: string) {
    if (!left) return;
    const next = Object.fromEntries(Object.entries(pairs).filter(([, r]) => r !== rid));
    next[left] = rid;
    setLeft(null);
    setPairs(next);
    // Check stays disabled until every pair is matched.
    setAnswer(Object.keys(next).length === step.pairs.length ? { type: "match", pairs: next } : null);
  }
  return (
    <div className="col in">
      <span className="eyebrow muted">Match the pairs</span>
      <h1 style={{ fontSize: 21 }}>{step.prompt}</h1>
      <p className="small muted">Pick an item on the left, then its match on the right.</p>
      <div className="grid2">
        <div className="col" style={{ gap: 8 }}>{step.pairs.map((p) => {
          const matched = pairs[p.id] ? step.pairs.find((x) => x.id === pairs[p.id])?.right : undefined;
          return <button key={p.id} type="button" className="option" disabled={locked} aria-pressed={left === p.id} onClick={() => setLeft(p.id)} style={{ flexDirection: "column", alignItems: "flex-start", gap: 2, fontSize: 15 }}>{p.left}{matched && <span className="xs" style={{ color: "var(--link)" }}>→ {matched}</span>}</button>;
        })}</div>
        <div className="col" style={{ gap: 8 }}>{rights.map((p) => <button key={p.id} type="button" className="option" disabled={locked || !left} aria-label={`Match with ${p.right}`} onClick={() => pickRight(p.id)} style={{ fontSize: 15, opacity: usedRight.has(p.id) ? 0.6 : 1 }}>{p.right}</button>)}</div>
      </div>
      {!complete && <p className="help">Match all {step.pairs.length} pairs, then tap Check.</p>}
    </div>
  );
}
