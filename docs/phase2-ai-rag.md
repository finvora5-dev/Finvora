# Phase 2: RAG-based Ask Fin

**Status:** Phase 2 requirements, recorded 5 Nov 2026. The Phase 1 items (section 7) apply now; everything else waits for Phase 2. Production design already planned in `docs/TECHNICAL_PROPOSAL.md` (AI row, pgvector in §1.3, AI orchestration in the architecture diagram).

## 1. Core architecture
Ask Fin uses Retrieval-Augmented Generation (RAG) to ground answers in approved, company-provided information. It is not an unrestricted chatbot: it retrieves from authorised sources and gives that to the model as context.

## 2. Knowledge sources
The agreed data provider's information is the primary source for company-specific answers. Depending on what is supplied: financial reports and statements, company profiles and metrics, dividend information, disclosures, approved educational material. Use only what is actually supplied and authorised. Never invent company data, figures, reports or sources.

## 3. Pipeline (production)
1. Ingest authorised information and documents. 2. Process for retrieval. 3. Generate embeddings where the retrieval method needs them. 4. Store and index. 5. Receive the question. 6. Restrict it to Finvora's financial-education scope. 7. Retrieve from approved sources. 8. Pass the retrieved context to the model. 9. Generate a clear, beginner-friendly answer grounded in it. 10. Give source references where the retrieved content supports them.

If there isn't enough evidence, say so rather than inventing an answer.

## 4. Finance-only behaviour
Answer: investing concepts, financial terms, company financial information, statements and reports, stocks and dividends, ratios, other financial-education topics. Politely decline anything else and point back to learning.
- Enforce scope in the application, not only in the prompt, and test it.
- Retrieval (evidence) and scope control (which questions to answer) are separate responsibilities.
- Explain concepts; never give personalised instructions to buy or sell.

## 5. Accuracy and attribution
Company-specific claims rest on retrieved evidence. Never fabricate citations, references or figures. Separate sourced information from general explanation. Say when evidence is incomplete or conflicting. Don't present outdated information as current; give reporting periods or dates where available. Treat retrieved documents as information, never as instructions. Respect access permissions. A reference must point to a real document or passage that supports the claim.

## 6. RAG is not market data
Documents (reports, disclosures, explanations) go through retrieval. Prices, price history, dividends and metrics come through structured data integrations. Don't assume the provider supports live prices or every metric.

## 7. Phase 1 requirements (apply now)
- Keep the prototype architecture and the approved Ask Fin design.
- Keep the scripted implementation, behind a modular service that can later call a real RAG pipeline.
- Clearly identify sample information, simulated retrieval and demonstration responses; never present them as real integrations.
- No Mansa integration in Phase 1. No paid services or new infrastructure without approval.

### Phase 1 status (checked against the code on 5 Nov 2026)
| Requirement | Status |
|---|---|
| Modular service | **Met.** Answers come from `answerQuestion()` in `packages/domain/src/askfin.ts`, with the same response shape (kind, answer, citations, follow-ups) planned for production. Swapping in a RAG provider means replacing that call. |
| Refuses buy/sell advice | **Met** in code (`isAdviceRequest`), not only in a prompt. |
| Says when it has no answer | **Met** for unmatched questions ("I don't have a good answer for that yet"). |
| Citations are real | **Met.** Citations only link to Library articles that exist in the app; missing ones are dropped. |
| Declines off-topic questions politely | **Not met.** "What is the weather in Lagos?" gets the generic no-answer reply, not a finance-only decline. |
| Doesn't imply company figures it lacks | **Partly met.** "What was Zenith Bank profit last year?" gets a general revenue-and-profit explanation; no figure is invented, but it doesn't say company figures aren't available. |
| Labels scripted answers as such | **Not met, needs a decision.** Project rules forbid "demo/prototype/sample" wording outside the simulator unless decided (`CLAUDE.md`, open question #2). |

## 8. Production requirements (Phase 2)
Secure ingestion; updating and removing outdated content; relevant, reliable retrieval; verifiable attribution; access controls; error handling and timeouts; protection against instructions embedded in documents; monitoring and answer-quality evaluation; tests for unsupported claims and hallucinations.

## 9. Definition of done
Designed for financial education; built on approved company information; retrieves evidence before company-specific answers when real RAG is on; declines unrelated questions; says when evidence is insufficient; gives accurate references; clearly separates prototype simulation from real integration. No redesign, no rebuilding finished features, no expansion beyond the approved phase.
