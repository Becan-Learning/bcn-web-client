# Agent contract: checkpoint (`set_checkpoint`)

Status: agreed 2026-10-06. The agent ships first (`bcn-lk-agent-main@feat/open-question`); the web
follows. There is no compatibility path: `set_topic.question` / `set_topic.choices` are gone.
Why: ADR-0007 in `bcn-lk-agent-main` (`docs/adr/0007-agent-owns-the-checkpoint.md`). Term:
**Checkpoint** in [GLOSSARY.md](../GLOSSARY.md), which the agent's `CONTEXT.md` now shares.

## Why it changed

The agent used to send the checkpoint once, inside `set_topic`, when the topic **started**. The
web opened the answer dialog whenever the agent was `listening` and a checkpoint existed, and cleared
it for good on choose, answer by voice, or dismiss. "The agent is listening and a checkpoint exists"
is not the same as "the tutor has asked it", which caused three bugs:

| Bug | Cause |
|---|---|
| The dialog opened before the explanation ended | Any `listening` moment in the topic opened it: after a student question, a pause, or an interrupted reply. |
| The dialog opened over the student-question recorder | `start_turn` interrupts the tutor, the agent goes `listening`, and the modal opened. |
| The dialog never came back after a wrong answer | Choosing cleared the checkpoint, and no new `set_topic` arrives for the re-ask. |

## The model

The agent tells the web exactly when a checkpoint is open and when it is closed.

- The tutor asks the checkpoint and then calls `question_asked`. The tool waits until the question
  **has finished playing**. If the student did not interrupt it, the tool opens the checkpoint.
- When the tutor judges an answer, right or wrong, the agent closes the checkpoint before the tutor
  replies.
- After a wrong answer the tutor explains again and asks again. That ask opens with a **new** `id`.
- Starting a topic or loading a lesson always closes it.
- If the student interrupts while the question is being spoken, nothing opens. It opens when the
  tutor asks it again.
- Topics without a checkpoint end on a readiness question, which never opens one.

## Messages: agent → web, on `ui-control`

### `set_checkpoint`

This is a state message, not an event: each one replaces the previous state. It is sent reliably,
without `rev`.

```json
{"action": "set_checkpoint", "checkpoint": {"id": "t3-q:1", "text": "وحدة الكتلة في النظام الدولي؟", "choices": ["جرام", "كيلوجرام"]}}
{"action": "set_checkpoint", "checkpoint": null}
```

| Field | Type | Meaning |
|---|---|---|
| `checkpoint` | object or `null` | The open checkpoint, or `null` when none is open. |
| `checkpoint.id` | string | Unique per ask: `<assessment id>:<attempt>`, with a one-based attempt. A re-ask has a new id. The same id may arrive twice and means the same ask. |
| `checkpoint.text` | string | The authored question, in the explanation language. |
| `checkpoint.choices` | string[] | The authored choices in order. It may be empty, which means the student answers by voice. |

### `set_topic` (changed)

`{"action":"set_topic","topic":…,"current_topic_index":…}`. It no longer carries the checkpoint.

### Unchanged

Answers still go as text on `lk.chat` (the tapped choice) or by voice through a student question.
`topic_done`, `set_lesson`, `scroll`, `board_*` and the student-question RPCs are unchanged.

## Web behaviour

- The session state holds the open checkpoint, set **only** by `set_checkpoint`.
- **A handled id stays on this device.** Choosing, answering by voice, and dismissing (✕, Escape,
  or a tap outside) mark the current id as handled. That hides only this ask: a re-ask has a new id
  and shows again. It also stops the dialog flashing back in the moment between tapping a choice and
  the agent closing the checkpoint.
- Answering by voice and then cancelling (✕, Escape, or the 8s no-speech guard) un-marks the id, so
  the choices come back while the checkpoint is still open.
- The dialog, and the bar's `question` phase, show only when **all** of these hold: a checkpoint is
  open, the agent is `listening`, no student question is in progress, and the id is not handled.
- During a student question the dialog stays hidden and the checkpoint stays open. It returns once
  the tutor is listening again.

## Edge cases

| Situation | Expected |
|---|---|
| The student presses Ask mid-explanation, the tutor answers, and the topic continues | No dialog at any point. |
| The student presses Ask while the tutor is speaking the question | No dialog. It opens when the tutor asks again. |
| A checkpoint is open and the student presses Ask in the bar | The dialog hides while recording and returns after the tutor answers, if the checkpoint is still open. |
| The student answers by voice, then cancels | The dialog returns. |
| The student taps a wrong choice | The dialog hides at once. `set_checkpoint: null` arrives; after the remediation a new id arrives and the dialog shows again. |
| The student taps the right choice | The dialog hides. `set_checkpoint: null`, then `topic_done`, then the next `set_topic`. No dialog until the next checkpoint is asked. |
| A second wrong answer | `set_checkpoint: null`; the tutor explains the answer and moves on. |
| The student dismisses | Hidden for this id. It comes back only on a re-ask. Answering by voice still works. |
| A topic without a checkpoint | No `set_checkpoint` carries a checkpoint, so there is no dialog. |
| A reconnect (`session_reset`) | The checkpoint and the handled id are cleared; the agent starts a fresh session. |

## Contract fixtures

`progress-events` in `src/lib/session/board/__fixtures__/` (copied verbatim from the agent) records a
topic start closing the checkpoint, the checkpoint opening, and an answer closing it.
