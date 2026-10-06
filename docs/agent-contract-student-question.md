# Agent contract: student question (push-to-ask)

Status: agreed 2026-10-05. The web side ships first; the agent follows right after.
Why: [ADR 0003](adr/0003-student-voice-only-through-student-questions.md). Term: **Student question**
in [GLOSSARY.md](../GLOSSARY.md).

## The model

The student's microphone track is **published muted for the whole session**. The web side unmutes
it only between `start_turn` and the end of the turn, so the agent hears audio only during a student
question. That gate lives on the web side, so the agent does not need its own audio gate.

## RPCs: student → agent

The student calls these on the agent participant (`performRpc`, destination = the agent's identity).
The payload is an empty string. The agent replies with an empty string, or throws on failure.

| Method | Agent does | Web side then |
|---|---|---|
| `start_turn` | **Interrupt the current speech at once** (`session.interrupt()`, no adaptive or false-interruption wait) and clear any half-collected user turn (`session.clear_user_turn()`). | Unmutes the mic and shows the recorder. |
| `end_turn` | Commit the user turn now (`session.commit_user_turn()`). Used for Send and for the 60s cap. | Mutes the mic. |
| `cancel_turn` | Drop the user turn (`session.clear_user_turn()`), then **resume the interrupted explanation** from the interrupted line (a `generate_reply` that continues; it must not restart the topic). Used for ✕, Escape, and the web side's 8s no-speech guard. | Mutes the mic. |

### Automatic end of turn

Keep `turn_detection="stt"` with the current dynamic endpointing. Audio arrives only during a
student question, so the agent's endpointing decides when the student has finished, without any
explicit `end_turn`. The web side treats the agent's state going to `thinking` (or `speaking`) as
"the turn closed": it mutes the mic and returns the bar to normal.

#Verify with the installed `livekit-agents` version that `commit_user_turn()` works with
`turn_detection="stt"`. If it requires `"manual"`, switch to manual and keep automatic end of turn
by committing when STT reports end of speech. Either way, the RPC behaviour above doesn't change.

## Interruption settings

Speech can now be interrupted only by `start_turn` or by text on `lk.chat`. The adaptive
interruption and `resume_false_interruption` settings no longer do anything useful and may be
removed or relaxed. Text sent on `lk.chat` keeps its current behaviour.

## Board consistency

An interrupted line must not leave the board ahead of what was spoken (pattern 2: no line appears
before it is spoken). On `start_turn`, the board runtime treats the current reply as interrupted, as
it already does for `speech.interrupted`. On `cancel_turn` + resume, the board continues from the
resumed line.

## Not in this contract

- Live caption of the student's words (the agent runs `text_output=False`). Not planned.
- Any capability attribute or fallback. The web side assumes this contract.
