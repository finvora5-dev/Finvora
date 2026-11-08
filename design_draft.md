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

## Open Questions

*   **What counts as finance-related?** Proposed: a question is in scope if it matches a Library article or hand-written answer above the minimum score, or contains a finance word from a fixed list (money, naira, kobo, save, invest, share, stock, dividend, profit, inflation, interest, bank, budget, market, NGX, and so on). Anything else is declined.
*   **Which companies trigger "no figures"?** Proposed: the real NGX companies on the Markets screens and the made-up Practice Market companies, by name or ticker. For made-up ones the reply says the figures on their page are made up for practice.
*   **Minimum match score:** proposed to be set from the 30-question test set so that every in-scope test question finds its article and no off-topic question does.
