# Phase 2 brief: quality, credibility and educational value of Learn

**Status:** parked for Phase 2. Recorded 5 Nov 2026. Nothing here blocks Phase 1, and no work starts until the prototype is approved and this brief is approved again.

**Where it came from:** a client-side brief drafted with an AI assistant. Some of its assumptions don't match the project yet; see "Corrections before starting" first.

## Corrections before starting (checked against the repo on 5 Nov 2026)

- **There is no Supabase setup.** Supabase is only the *planned* production database, auth and storage in `docs/TECHNICAL_PROPOSAL.md` §1.3. The Phase 1 prototype keeps everything in the browser (`localStorage`). Where the brief says "our existing Supabase setup", read "the planned Phase 2 database".
- **Current lessons are prototype content, not verified content.** World 1 has 6 short lessons (one designed, five written during the prototype build) and a 5-question boss challenge. They were written from the Library articles in `packages/sample-data`, not checked against primary sources, and not reviewed by a subject expert.
- **What the content model already has:** lessons have an objective, minutes, steps of 8 types (info, choice, true/false, fill-the-gap, order, match, number, scenario), related articles and concepts (`packages/engine/src/types.ts`). Articles already have an optional `sources` list. Lessons do **not** yet have difficulty, sources, review dates, a reviewer or a version.
- **The audit in section 8 has not been done.** No source in section 2 has been reviewed yet.

## The brief

### 1. Product context
Finvora is an investing education platform for Nigerians, especially beginners. Similar in purpose to Investopedia, with an engaging, interactive learning experience inspired by Duolingo. Learn should be structured learning paths, short lessons, practical examples, quizzes, challenges and progression, not a collection of articles.

### 2. Research and content sources
Candidates: SEC Nigeria (sec.gov.ng), Investor.gov, Investopedia, Nigerian Exchange Group (ngxgroup.com), Central Bank of Nigeria (cbn.gov.ng).
- Evaluate each for authority, accuracy, relevance to Nigerian learners, educational usefulness and fit with our topics. Don't assume every source is suitable.
- Use primary sources for Nigerian regulation, market rules, official announcements and economic information; educational sites are supplementary.
- No copying. Lessons use original explanations, examples, questions and structure, and respect each source's licensing and reuse terms.

### 3. Proposed learning paths (to be assessed, not accepted as is)
1. **Money Basics:** saving vs investing; inflation and purchasing power; interest and compound growth; budgeting and planning.
2. **Understanding Investments:** shares and bonds; how stock markets work; dividends and returns; risk and diversification.
3. **Understanding the Nigerian Market:** how NGX works; stockbrokers and other participants; how Nigerians access the market; listed companies and terminology.
4. **Analysing Companies:** revenue, profit and expenses; company debt; cash flow and financial statements; dividend sustainability; basic ratios; reading annual reports.
5. **Practical Learning:** virtual portfolios; hypothetical scenarios; market fluctuations; comparing decisions; learning from simulated gains and losses.

Assess the sequencing for beginners, find missing foundations, and say what belongs at intermediate level.

### 4. Content quality and verification
Every lesson must meet three standards: **accuracy** (correct and supported by credible sources), **relevance** (useful to Nigerian beginners) and **educational quality** (clear, practical, engaging, right level).
- Each lesson has a learning objective, source references and a review process.
- Claims about Nigerian regulation, products, tax, market rules or figures are verified against authoritative sources.
- Verified facts are clearly separated from hypothetical examples. Never invent statistics, announcements, results or citations.
- No personalised advice; simulated performance never implies real returns.

### 5. Lesson format
Inspired by Duolingo's microlearning, not a copy. Evaluate: a learning objective; 3 to 6 short screens where appropriate; Nigerian examples; one practical scenario; interactive questions with explanations of right and wrong answers; a short challenge or knowledge check; references; difficulty and estimated time. Don't force every topic into one format.

### 6. Pilot of ten lessons
Before filling the library:
- 5 foundational: money, inflation, shares, dividends, investment risk.
- 3 Nigerian capital market: the market, its participants, company reports.
- 2 practical: hypothetical portfolios and decision-making scenarios.

Check the ten form a coherent progression; the aim is to validate accuracy, clarity, Nigerian relevance and engagement before expanding. More lessons do not automatically mean better learning.

### 7. Technical and product requirements
Inspect the codebase first and establish: what content exists; whether it's verified or placeholder; how lessons, modules, quizzes and progress are represented; whether the model supports references, difficulty, review dates and versioning; how approved content is stored and served (Phase 2 database); whether an admin review-and-approve workflow is needed. Don't add tables, paid APIs, services or infrastructure without explaining why. Don't rebuild working features.

### 8. First deliverable: an assessment, then wait for approval
1. Current state of the learning experience.
2. Suitability of the proposed sources.
3. Content gaps and accuracy risks.
4. Recommended paths and progression.
5. The ten-lesson pilot: topics, objectives and sources.
6. Content-management and verification workflow.
7. Necessary technical changes, with reasons.

Separate verified findings from assumptions. Don't claim to have reviewed a source, verified a fact or inspected a feature unless it was actually done. Wait for approval before significant changes.

**Goal:** a credible, engaging, genuinely useful financial education experience for Nigerians, not a large library of finance articles.
