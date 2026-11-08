# EGM review: Ask Fin grounded answers (Part 3)

**Reviewed:** `design_draft.md`, 8 Nov 2026 · **Reviewers:** design, codebase details, implementation readiness, zoom-out, inventive catalyst, comprehension, style · **Verdict:** needs revision. No reviewer disputed the approach (six steps, browser only, cited Library text). The findings are gaps in detail and two factual errors.

## Needs the owner's decision

| # | Question | Raised by | My recommendation |
|---|---|---|---|
| O1 | Do advice refusals use up a free question? D18 only exempts declines and "no figures"; the draft quietly made refusals free too. | 6 of 7 | Free. A refusal is Fin declining, same as off-topic. |
| O2 | Should anything other than a real answer use up a question? Today "not enough information" counts, so Fin's own misses (e.g. "Can you share a recipe?") cost the learner. | inventive | Only real answers count. Every reply is free to produce in the browser. |
| O3 | After the 5 free questions are used, should Fin still give declines, refusals and "no figures" replies? The draft said Fin can't know the reply in advance; it can, the steps are local and instant. | inventive | Yes: work out the reply first, block only if it would be a counted answer. |
| O4 | Add a "Did you mean…?" reply for near matches (top 2 articles as buttons, free) between "answer" and "not enough information"? | inventive | Yes. It turns many misses into one tap. |
| O5 | Add an "Ask words" box to the admin article form, so admin-published articles can be found by everyday words? This is a small screen change. | inventive, design | Yes, one optional text box. |

## Factual errors (will fix)

1. The Problem says there are no behaviour tests. There are five (`domain.test.ts:172-197`); they use one invented script, not the real answers or Library.
2. "No screen changes" is wrong. The admin Ask Fin review screen (`UAAskKoboReview.dc.html:79`) picks its checklist by kind and would mislabel the new kinds; `fv.js:355` tags every non-refusal "No answer".
3. Companies have no short names. "GTBank", "Zenith" and "MTN" need a new `askAliases` field in `companies.ts`. Very short tickers such as "NB" must not match ordinary words.

## Gaps to fill (will fix)

4. **One scorer.** Hand-written answers and articles go into one index, with hand-written answers getting a small boost, so there is one score scale and one threshold. (5 reviewers)
5. **Exact formula.** Write it out: field weights 3/2/1, a word counts once at its best field, rare-word weight `log(1 + N/df)`, score divided by the best the question could score (0 to 1), so long questions and admin-added articles do not shift the threshold. (5 reviewers)
6. **Test set honesty.** Tune the threshold on 30 cases, check it on about 10 held-out cases, and require a gap on both sides. Add a test that publishes an extra article. (3 reviewers)
7. **Name the data.** `AskSources` type; company article = first of `learnSlugs` (real) or `learnSlug` (practice), none if missing; follow-ups from `related`; "common mistakes" = `misconceptions`; "how it works" = `deep.how`. Empty fields on admin articles are skipped. (5 reviewers)
8. **Reuse, don't duplicate.** Use the existing article `keywords` instead of a new `askWords` list; work out "counts toward limit" from the kind with one function instead of storing a second field. (zoom-out, design)
9. **Word lists and trimming.** Put the finance words, figure words and common words in `config.ts` as named lists. The trimming rules get a short exception list ("savings" stays "savings") and tests. Drop the "share/interest next to another finance word" rule: not needed if a miss is free (O2).
10. **Wiring.** `fv.js` builds sources from `LIB.all()` (not `D().ARTICLES`), regenerates `fvd.js`, records usage by kind; old saved messages count as before.
11. **Signature change** from 4 arguments to `(question, context, sources)`; update `fv.js` and the existing tests. `normalise` drops "₦", "%" and "-"; say so.
12. **Client note:** promise only that the reply shape and test set carry into Phase 2, not steps 1 to 4.

## Writing (will fix)

13. Delete the old open questions block. One wording for the decline, written once. One name for "not enough information" with its exact reply text. "3 real companies asking for a figure" instead of "3 real with figures". Exact count of hand-written answers (19). Mark new files as Create. Replace the unsupported "will catch most phrasings" with "coverage is known once the test set runs".
