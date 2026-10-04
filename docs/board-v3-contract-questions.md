# Board v3 contract questions

## Q-1 — Stage label language

- **Section:** Contract §2.1 (groups and stages).
- **Fixtures:** `example-worked`, `example-faded`, `example-try`.
- **Interim behaviour:** Stage labels follow the session's explanation language, like the board's
  other words, under [ADR 0001](adr/0001-interface-and-explanation-language-are-separate.md).
- **Question:** The contract says “Stage labels use UI locale”. Can you confirm that “UI locale”
  here means the session's explanation language? This repo lets interface and explanation
  languages differ.

## Q-L1-1 — Mark scopes on the separate title

- **Section:** Contract §3.4, §3.9 and §6.1.
- **Fixtures:** `snapshot-full` carries title marks as an empty array; `legacy-annotations`
  targets the title with annotations. No fixture sends a mark to the title.
- **Interim behaviour:** Preserve valid item/span marks on title snapshots and accept those same
  scopes on title-targeted mark packets. Other scopes are ignored. The title remains excluded
  from item-focus sibling sets.
- **Question:** Title records explicitly carry marks, but §6.1 lists only the 17 add kinds and
  §3.4 calls its target an item. Are item/span marks supported on titles, or should all title
  marks be ignored?

## Q-L1-2 — Lesson progress across disconnect

- **Section:** Contract §1 (`board_reset` clears lesson progress on disconnect).
- **Fixtures:** None (client lifecycle).
- **Interim behaviour:** Disconnect clears the board and its revision baseline only. Lesson
  progress is kept until the next session start so the reconnect screen can resume the same
  lesson. Session start still resets everything, retaining the existing completed-lesson history.
- **Question:** Is keeping lesson progress across a disconnect, until the next start, acceptable
  given the frontend's resume flow?
