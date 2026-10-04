# Board v3 contract questions

## Q-1 — Stage label language

- **Section:** Contract §2.1 (groups and stages).
- **Fixtures:** `example-worked`, `example-faded`, `example-try`.
- **Interim behaviour:** Stage labels follow the session's explanation language, like the board's
  other words, under [ADR 0001](adr/0001-interface-and-explanation-language-are-separate.md).
- **Question:** The contract says “Stage labels use UI locale”. Can you confirm that “UI locale”
  here means the session's explanation language? This repo lets interface and explanation
  languages differ.

## Q-L3-1 — Focus on an unrevealed row or division

- **Section:** Contract §5.10, §5.16, §6.1–§6.3.
- **Fixtures:** `add-table-progressive`, `mark-row-states`, `mark-division-states`; none combines
  an unrevealed target with focus.
- **Interim behaviour:** A stored row/division focus starts dimming its visible siblings only
  when its target is revealed. Its content remains absent before reveal, and the mark is retained.
- **Question:** Should an unrevealed focused row/division dim visible siblings immediately,
  or should all its visual effects wait for reveal? Waiting avoids suggesting hidden content
  before the tutor reaches it.
