# Ask Fin grounded answers (Part 3 of 5)

*   **Author:** Powellgraham5
*   **Status:** Approved 8 Nov 2026
*   **Date:** 2026-11-08

--------------------------------------------------------------------------------

## Overview

Ask Fin is Finvora's question helper. In Phase 2 it will use retrieval-augmented generation (RAG): check the question is about finance, find approved material, and answer only from that material, with references ([docs/phase2-ai-rag.md](docs/phase2-ai-rag.md)). The owner decided that the Phase 1 prototype should follow the same steps, using the app's own Library articles in the browser, with no live AI and no paid service (D4, D18 in [docs/open-questions.md](docs/open-questions.md)).

This design keeps Ask Fin's existing answer shape (kind, answer, citations, follow-ups), which Phase 2 plugs into, and changes how an answer is chosen.

## The Problem

*   **Off-topic questions get the wrong reply.** "What is the weather in Lagos?" gets "I don't have a good answer for that yet", as if Fin simply lacked an article, instead of a polite "I only help with money and investing".
*   **Company questions can mislead.** "What was Zenith Bank's profit last year?" gets a general explanation of profit. No figure is invented, but Fin never says it has no figures for that company.
*   **Answers do not come from the Library.** Fin picks one of 19 hand-written answers by keyword. It never reads the 15 Library articles, so a question the articles answer well but the keywords miss gets no answer.
*   **Every question uses up the free limit.** A free learner who asks something off-topic, or gets "I don't know", loses one of their 5 daily questions for nothing.
*   **Tests use made-up data.** The five Ask Fin tests (`domain.test.ts`) use one invented script. They never run the real answers, the Library, or off-topic and company questions.

## Goals

*   **Follow the RAG steps, in order:** check scope, refuse advice, recognise named companies, search the Library, answer from what was found or say there is not enough information.
*   **Polite finance-only decline** for questions outside money, saving and investing, pointing back to learning.
*   **"No figures" reply** for questions about a named company's numbers: Fin says it has no figures for that company, explains where real figures come from (annual reports, the exchange), and offers the related Library article.
*   **Answers from the Library:** search the text of the Library articles (including ones an admin published in this browser) and answer from the best match above a minimum score, citing that article. The hand-written answers stay as a first layer for common questions.
*   **Only real answers use up a free question.** Declines, "no figures" replies, advice refusals, "Did you mean" and "not enough information" are free (D18, widened 8 Nov).
*   **A test set of about 30 questions** covering answers, declines, advice refusals, company questions and unknowns, run with the domain tests.
*   **Label stays:** every reply keeps "Example answer from the Finvora Library" (Part 1).
*   **A short note for the client** saying this is a stand-in for the Phase 2 AI, so nobody mistakes it for the real thing.

## Non-Goals

*   **Live AI, embeddings or any paid service.** Phase 1 rule.
*   **Real company figures or market data.** Phase 2, with the data provider.
*   **Redesigning Ask Fin's chat screens.** They keep their layout and label (Part 1). Two small changes only: "Did you mean" buttons and the admin review checklist.
*   **Answering in languages other than English.**
*   **Remembering earlier questions in the conversation.**

## Decisions (approved 8 Nov 2026)

*   **Finance scope:** a question is in scope if it reaches the low score band against the Library, or contains a word from the finance list (`ASK_FINANCE_WORDS` in `config.ts`). Anything else gets the decline.
*   **"No figures" companies:** the 8 real NGX companies on the Markets screens and the 6 made-up Practice Market companies, by full name, ticker or a listed short name. For made-up ones, Fin says their figures are made up for practice.
*   **Minimum match score:** two thresholds, tuned on the test set and checked on held-out questions (see Test set).
*   **What uses up a free question:** only a real answer. Every other reply is free. (Owner, 8 Nov; widens D18.)
*   **When the 5 free questions are used up:** Ask Fin is blocked. The question box is replaced by the existing limit message and the Plus offer, and no further questions of any kind can be sent that day. (Owner, 8 Nov.)
*   **"Did you mean":** near matches get a free reply with the two closest articles as buttons. (Owner, 8 Nov.)
*   **Ask words in admin:** the admin article form gets an optional "Ask words" box. (Owner, 8 Nov.)

## Detailed Design

### Files

| File | Change |
|---|---|
| `packages/domain/src/askfin.ts` | Modify: new pipeline, scorer, `countsTowardLimit(kind)` |
| `packages/domain/src/config.ts` | Modify: `ASK_FINANCE_WORDS`, `ASK_FIGURE_WORDS`, `ASK_STOP_WORDS`, `ASK_SCORE_HIGH`, `ASK_SCORE_LOW` |
| `packages/sample-data/src/companies.ts` | Modify: `askAliases` on both company types |
| `packages/sample-data/src/library.ts` | Modify: extend article `keywords` with everyday words |
| `packages/domain/src/askfin.cases.ts` | Create: tuning and held-out questions |
| `packages/domain/src/domain.test.ts` | Modify: old Ask Fin tests to the new signature; run the cases |
| `apps/prototype/site/fv.js` | Modify: sources from `LIB.all()`, limit by kind, admin tags, "Ask words" stored on admin articles |
| `apps/prototype/site/fvd.js` | Regenerate with `tools/build_fvd.mjs` |
| `UPAskKobo`, `UDxAskKobo` boards | Modify: show "Did you mean" buttons (wiring script) |
| `UAAskKoboReview.dc.html` | Modify: checklists for the new kinds |
| Admin article form board | Modify: optional "Ask words" box |
| `docs/ask-fin-phase1-note.md` | Create: note for the client |

### Signature

`answerQuestion(question, context, sources)` replaces the current four-argument form. `context` works as today: the label of the screen Fin was opened from (a lesson, company or article) adds its words to the question.

```ts
interface AskSources {
  scripts: ScriptedAnswer[];          // the 19 hand-written answers
  articles: AskArticle[];             // LIB.all(): built-in, admin-edited and admin-published
  companies: { name: string; ticker: string; askAliases: string[]; slug?: string; madeUp: boolean }[];
}
```

`AskArticle` is the existing article shape (`slug`, `title`, `definition`, `explanation[]`, `example`, `whyItMatters`, `misconceptions[]`, `related[]`, `keywords`, optional `deep.how`). Any field may be empty; empty fields are skipped. A company's `slug` is the first of `learnSlugs` (real) or `learnSlug` (practice); with none, the reply has no citation.

### The steps

1.  **Too short:** after normalising, fewer than 2 letters. Reply "not enough information".
2.  **Advice:** the existing buy-or-sell check. Reply unchanged.
3.  **Company figures:** the question names a company **and** contains a figure word (`ASK_FIGURE_WORDS`: profit, revenue, earnings, price, share price, dividend, how much, results, last year, this year and similar). Names match as whole words. Tickers of 3 letters or fewer (NB) match only when typed in capitals. With two companies named, the reply names both. Real: "I don't have figures for Zenith Bank. Real figures come from the company's annual report and the Nigerian Exchange (NGX) website." Made-up: "Okeke Bank is a made-up company for practice. The prices on its page are made up too." A company question with no figure word carries on.
4.  **Score:** hand-written answers and articles are scored together by the one scorer below. Hand-written answers get a 10% boost, so a common question keeps its tuned wording when both match.
    *   Score at or above `ASK_SCORE_HIGH`: **answer** from the best match.
    *   Between `ASK_SCORE_LOW` and `ASK_SCORE_HIGH`: **"Did you mean"**: "I'm not sure I understood. Did you mean one of these?" with the two best articles as buttons. Tapping one asks "What is {title}?".
5.  **Below `ASK_SCORE_LOW`:** if the question has a word from `ASK_FINANCE_WORDS`, reply **not enough information**: "I don't have a Library article on that yet. Try searching the Library, or ask in a different way, for example \"What is inflation?\"". Otherwise reply with the **decline**: "I only help with money, saving and investing. Try asking about budgeting, inflation or how shares work."

### The scorer

*   **Words:** `normalise` from `search.ts` (lower case, accents removed, anything outside a to z and 0 to 9 becomes a space; this drops "₦", "%" and "-", which the old tokenizer kept). Words in `ASK_STOP_WORDS` are dropped. Endings trimmed: "-ies" to "-y", "-ing" and a final "-s" removed, except words in a short keep list ("savings", "earnings", "news", "less") so they still match whole.
*   **Fields and points:** title 3, definition 2, keywords 2, everything else 1 (explanation, example, why it matters, misconceptions, `deep.how`). A hand-written answer's keywords count as title, its answer text as everything else. Each question word counts once, at its best field. A repeated question word counts once.
*   **Rare words count more:** each word's points are multiplied by `log(1 + N / df)`, where N is the number of documents and df the number that contain the word.
*   **Score:** the sum, divided by the most the question's words could score (every word in a title, in exactly one document). The result runs from 0 to 1, so long questions and new admin articles do not shift the thresholds.

### Building an answer

*   **From a hand-written answer:** its text, its citations and its follow-ups, as today.
*   **From an article:** its definition, the first sentence of its first explanation (split at the first ". "), then its example, joined into one paragraph and cited. Empty parts are skipped. Follow-ups are "What is {title}?" for up to two `related` articles that exist. No new words are written.

### Free limit and blocking

`countsTowardLimit(kind)` in `askfin.ts` returns true only for `"answer"`. `FV.ASK.ask()` records usage only then. Once 5 answers have been counted, `FV.ASK.status().allowed` is false and the chat shows the existing limit message and Plus offer instead of the question box, so no question of any kind can be sent until the next Lagos day. Saved messages from before this change keep their old count.

### Admin

*   Review list tags (`fv.js` line 355): `refusal` "Asks for a pick", `decline` "Off topic", `no-figures` "No figures", `insufficient` "No answer", `didyoumean` "Unsure". The review screen gets a short checklist for each.
*   The admin article form gets an optional "Ask words" box (comma separated). Its words are stored as the published article's `keywords`.

### Test set

`askfin.cases.ts` holds 40 questions with the expected kind and, for answers, the expected article or hand-written answer. 30 are used to choose the two thresholds and 10 are held out.

| Group | Tuning | Held out |
|---|---|---|
| Answers (hand-written) | 6 | 2 |
| Answers only the Library finds | 6 | 3 |
| Off topic, including "Can you share a recipe?" | 6 | 2 |
| Advice | 4 | 1 |
| Company: 3 real asking for a figure, 1 made-up, 1 real with no figure word (expects an answer) | 5 | 1 |
| Not enough information (finance words, no article, e.g. "How do I file my tax return?") | 3 | 1 |

Tests: every case gets its expected kind; the lowest in-scope answer score is at least 0.05 above `ASK_SCORE_HIGH`, and the highest off-topic score at least 0.05 below `ASK_SCORE_LOW`; adding one made-up article to the sources does not change any held-out result. A held-out failure is fixed by adding keywords, never by moving the thresholds.

### Note for the client

`docs/ask-fin-phase1-note.md`: half a page. Phase 1 Ask Fin only rearranges approved Library text and never invents answers. Phase 2 replaces it with the live AI; the reply shape and the test set carry over so the AI can be checked against the same questions.

## Alternatives Considered

*   **Only add more hand-written answers.** Rejected: it still ignores the Library, and every new article would need a new hand-written answer.
*   **Reuse `search()` from `search.ts` as is.** Rejected: it ranks by title prefix and needs every query word to appear, so full questions such as "why do prices keep going up" find nothing. Its `normalise` is reused.
*   **Embeddings in the browser** (a small model downloaded to the phone). Rejected: tens of megabytes on mobile data, and the Phase 1 rule says no embeddings.

## Risks

*   **Word-matching misses.** "Why is everything so expensive now?" shares no word with the Inflation article. Mitigation: everyday words in article `keywords`, and "Did you mean" for near misses. How many phrasings this catches is known only once the test set runs.
*   **Short names that are ordinary words.** Short names are listed by hand and kept specific ("Zenith", "GTBank", not "Access" alone); 3-letter tickers match only in capitals.
*   **Answers read as stitched together**, because they join Library sentences. Accepted for Phase 1; the client note says so.

## Open Questions

None.
