# Ask Fin grounded answers (Part 3 of 5)

*   **Author:** Powellgraham5
*   **Status:** Draft
*   **Date:** 2026-11-08

--------------------------------------------------------------------------------

## Overview

Ask Fin is Finvora's question helper. In Phase 2 it will use retrieval-augmented generation (RAG): check the question is about finance, find approved material, and answer only from that material, with references ([docs/phase2-ai-rag.md](docs/phase2-ai-rag.md)). The owner decided that the Phase 1 prototype should follow the same steps, using the app's own Library articles in the browser, with no live AI and no paid service (D4, D18 in [docs/open-questions.md](docs/open-questions.md)).

This design keeps Ask Fin's existing answer shape (kind, answer, citations, follow-ups), which Phase 2 plugs into, and changes how an answer is chosen.

## The Problem

*   **Off-topic questions get the wrong reply.** "What is the weather in Lagos?" gets "I don't have a good answer for that yet", as if Fin simply lacked an article, instead of a polite "I only help with money and investing".
*   **Company questions can mislead.** "What was Zenith Bank's profit last year?" gets a general explanation of profit. No figure is invented, but Fin never says it has no figures for that company.
*   **Answers do not come from the Library.** Fin picks one of about 19 hand-written answers by keyword. It never reads the 15 Library articles, so a question the articles answer well but the keywords miss gets no answer.
*   **Every question uses up the free limit.** A free learner who asks something off-topic, or gets "I don't know", loses one of their 5 daily questions for nothing.
*   **There are no tests of behaviour.** Only the advice refusal is tested.

## Goals

*   **Follow the RAG steps, in order:** check scope, refuse advice, recognise named companies, search the Library, answer from what was found or say there is not enough information.
*   **Polite finance-only decline** for questions outside money, saving, investing, companies and markets, pointing back to learning.
*   **"No figures" reply** for questions about a named company's numbers: Fin says it has no figures for that company, explains where real figures come from (annual reports, the exchange), and offers the related Library article.
*   **Answers from the Library:** search the text of the Library articles (including ones an admin published in this browser) and answer from the best match above a minimum score, citing that article. The hand-written answers stay as a first layer for common questions.
*   **Declines and "no figures" replies do not use up the free limit** (D18). Answers and "not enough information" replies do.
*   **A test set of about 30 questions** covering answers, declines, advice refusals, company questions and unknowns, run with the domain tests.
*   **Label stays:** every reply keeps "Example answer from the Finvora Library" (Part 1).
*   **A short note for the client** saying this is a stand-in for the Phase 2 AI, so nobody mistakes it for the real thing.

## Non-Goals

*   **Live AI, embeddings or any paid service.** Phase 1 rule.
*   **Real company figures or market data.** Phase 2, with the data provider.
*   **Changing Ask Fin's screens.** Only the replies change; the screens already show the label (Part 1).
*   **Answering in languages other than English.**
*   **Remembering earlier questions in the conversation.**

## Decisions (approved 8 Nov 2026)

*   **Finance scope:** a question is in scope if it matches a hand-written answer or a Library article above the minimum score, or contains a word from a fixed finance list. Anything else gets the polite decline.
*   **"No figures" companies:** the 8 real NGX companies on the Markets screens and the 6 made-up Practice Market companies, by name, short name or ticker. For made-up ones, Fin says their figures are made up for practice.
*   **Minimum match score:** set from the test set, so every in-scope test question finds its article and no off-topic one does.

## Detailed Design

### Where the code goes

All rules go in `packages/domain/src/askfin.ts`, so they are tested and carry into Phase 2. `fv.js` only passes in the data and handles the free limit. No screen changes.

### The answer pipeline

`answerQuestion(question, context, sources)` runs these steps in order and stops at the first that applies. `sources` holds the hand-written answers, the Library articles (the same list the Library screen shows, including articles an admin published in this browser) and the two company lists.

1.  **Empty or very short** (fewer than 2 letters): "not enough information".
2.  **Advice:** the existing buy-or-sell check. Reply unchanged.
3.  **Company figures:** the question names a company (name, short name such as "Zenith" or "GTBank", or ticker, matched as whole words, ignoring case and accents) **and** asks for a number (profit, revenue, earnings, price, share price, dividend amount, "how much", results, last year, this year). Reply: "I don't have figures for Zenith Bank. Real figures come from the company's annual report and the Nigerian Exchange (NGX) website." plus the company's related Library article. For a Practice Market company: "Okeke Bank is a made-up company for practice. The prices on its page are made up too." A company question without a number ("How does MTN make money?") carries on to step 4.
4.  **Hand-written answer:** the existing keyword match, kept as the first layer for common questions, but it now needs the minimum score instead of any single keyword. This stops "how does" alone picking the revenue answer.
5.  **Library search:** score every article and answer from the best one if it reaches the minimum score (below).
6.  **Scope:** nothing matched. If the question has a word from the finance list, reply "not enough information" and point to Library search. Otherwise reply with the polite decline: "I only help with money, saving and investing. Try asking about budgeting, inflation or how shares work."

### Library search and scoring

*   Each article is split into fields: title, definition, explanation, example, why it matters, common mistakes and the "how it works" text.
*   The question and the fields are lower-cased, accents and punctuation removed (the existing `normalise` in `search.ts`), common words dropped ("what", "is", "the", "how", "do", "i" and about 40 more) and plural or "-ing" endings trimmed, so "dividends" matches "dividend".
*   Score = sum over question words of: 3 if the word is in the title, 2 if in the definition, 1 if anywhere else. Rare words count more than common ones: each word's points are multiplied by how few articles contain it (a word in 1 article counts fully, a word in all 15 counts very little).
*   The minimum score is a constant `ASK_MIN_SCORE` in `config.ts`, chosen from the test set.

### Building an answer from an article

Fin does not write new text. The answer is the article's definition, then its first explanation sentence, then its example, joined as a short paragraph. It cites that article. Follow-ups are "What is X?" for up to two related articles that exist. This keeps every word traceable to approved Library text, which is the same rule the Phase 2 AI must follow.

### The reply shape

`AskResponse.kind` gains two values: `"decline"` (off topic) and `"no-figures"`. A new field `countsTowardLimit` is true for `"answer"` and `"insufficient"`, false for `"decline"`, `"no-figures"` and `"refusal"`. The Ask Fin screens already show any kind with the label "Example answer from the Finvora Library".

### Free limit

`FV.ASK.ask()` still checks the limit first. It records a question against the limit only when `countsTowardLimit` is true. A learner who has used all 5 questions is still blocked before asking, because Fin cannot know the kind of reply in advance.

### Admin Ask Fin review

The review list already shows replies that were not answers. It gains two tags: "Off topic" and "No figures".

### Test set

`packages/domain/src/askfin.cases.ts` holds about 30 questions, each with the expected kind and, for answers, the expected article:
*   12 answers (6 from hand-written answers, 6 that only the Library search finds);
*   6 off-topic declines (weather, football, recipes, maths homework, a song, "hello");
*   4 advice refusals;
*   5 company questions (3 real with figures, 1 made-up, 1 real without figures that should get an answer);
*   3 "not enough information" (finance words, no article, e.g. "How do I file my tax return?").

The domain tests run every case. A second test checks that `ASK_MIN_SCORE` sits between the lowest in-scope score and the highest off-topic score.

### Note for the client

`docs/ask-fin-phase1-note.md`: half a page saying Phase 1 Ask Fin is a stand-in that only rearranges Library text and never invents answers, and that Phase 2 replaces step 5 with the live AI while keeping steps 1 to 4, the reply shape and the test set.

## Alternatives Considered

*   **Only add more hand-written answers.** Rejected: it still ignores the Library, and every new article would need a new script.
*   **Reuse `search()` from `search.ts` as is.** Rejected: it ranks by title prefix and needs every query word to appear, so full questions such as "why do prices keep going up" find nothing. Its `normalise` is reused.
*   **Embeddings in the browser** (a small model downloaded to the phone). Rejected: tens of megabytes on Nigerian mobile data, and the Phase 1 rule says no embeddings.

## Risks

*   **Word-matching misses.** "Why is everything so expensive now?" has no shared word with the Inflation article. Mitigation: a short list of extra words per article (`askWords`, for example "expensive" and "prices" for Inflation), kept in the sample data. My judgement: this will catch most common phrasings, not all; the test set will show the gaps.
*   **Finance words used in other senses.** "Can you share a recipe?" contains "share", so it gets "not enough information" (counts toward the limit) instead of a decline. Mitigation: "share" and "interest" count as finance words only next to another finance word or a company. Some misses will remain.
*   **Answers read as stitched together**, because they are three Library sentences joined. Acceptable for a Phase 1 stand-in; the client note says so.

## Open Questions

None. The three earlier questions are answered in Decisions above.

<!-- earlier open questions kept for history -->

*   **What counts as finance-related?** Proposed: a question is in scope if it matches a Library article or hand-written answer above the minimum score, or contains a finance word from a fixed list (money, naira, kobo, save, invest, share, stock, dividend, profit, inflation, interest, bank, budget, market, NGX, and so on). Anything else is declined.
*   **Which companies trigger "no figures"?** Proposed: the real NGX companies on the Markets screens and the made-up Practice Market companies, by name or ticker. For made-up ones the reply says the figures on their page are made up for practice.
*   **Minimum match score:** proposed to be set from the 30-question test set so that every in-scope test question finds its article and no off-topic question does.
