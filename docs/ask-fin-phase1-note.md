# Ask Fin in Phase 1: a note for the client

Ask Fin in the current app is a stand-in for the Phase 2 AI.

*   **What it does:** it reads the question, refuses buy or sell advice, politely declines questions that are not about money, and answers everything else from approved text only: the hand-written answers, the 15 Library articles (plus any an admin publishes) and the company descriptions. Every answer is labelled "Example answer from the Finvora Library" and links the article it came from.
*   **What it never does:** it never writes new text and never invents a fact or a figure. Questions about a company's numbers get an explanation of the company and the term, but no number. Real figures come from the Mansa API in Phase 2.
*   **What it costs the learner:** free learners get 5 answers a day. Declines, refusals and "Did you mean" replies are free. After 5 answers, Ask Fin is closed until the next day.
*   **Known limits:** it matches words, so unusual phrasing can get "Did you mean" or "I don't have a Library article on that yet". Answers join Library sentences, so they can read a little stitched together.
*   **Phase 2:** the live AI replaces the answering step. The reply format and the 40 test questions (`packages/domain/src/askfin.cases.ts`) carry over, so the AI is checked against the same questions.
