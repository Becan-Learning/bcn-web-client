# Board beats keep arriving after the student presses Ask

**Status: suggestions only — not implemented.** Verified against web `feat/student-question`
and agent `feat/student-question-rpc` (d1dbf0c). Agent paths are relative to
`bcn-lk-agent-main/src/tutor_agent_snd/`.

## Summary

After `start_turn` the tutor's voice stops, but the agent's board runtime keeps publishing
beats that were already matched or still being matched. The runtime only stops releasing
beats while the interrupted speech handle is still `current_speech`. That handle clears within
a moment of the interrupt, and no new generation exists while the student records, so nothing
invalidates the queue. The defect is in the agent, not the web client.

## Symptom

The student presses Ask. Audio stops. Over the next seconds, while the recorder is open, new
board items or marks still appear, on the old reply's schedule.

## Where it is NOT (frontend)

- `src/components/session/session-view.tsx:241-266`: each `ui-control` packet is parsed and
  `dispatch`ed straight from `RoomEvent.DataReceived`. No buffering.
- `src/lib/session/session-reducer.ts:103` hands board packets to the pure board reducer.
  `src/lib/session/board/` and `src/components/session/board/` contain no `setTimeout`,
  `setInterval`, or queue. The only timers in `session-view.tsx` and `parts.tsx` are the no-speech
  hint (`session-view.tsx:208`) and the recording clock (`parts.tsx:785`).
- Conclusion: a beat seen during recording was published by the agent at that moment.

## Root cause (agent)

1. **Beats are matched and scheduled ahead of audio.** `tee()` (`board/runtime.py:605`) feeds
   text to `_feed`/`_emit` (801/818) as it reaches `tts_node`. Each sentence starts a
   `_match_sentence` task (965). Results become `PendingOp`s in `_op_queue` (`_queue_match`, 1055).
2. **Release is on the playout clock.** `_executor_loop` (1213) calls `_await_release` (1225-1257),
   which sleeps until the word timestamp (or `anchor + offset / words_per_second` fallback) and
   publishes. An op whose time already passed (late matcher result) publishes immediately.
3. **Only two guards stop a queued op.** `_is_stale` (1269: epoch or generation changed) and
   `_is_interrupted()` (1232). The same two are re-checked in `_can_apply` (1296-1308) and, for
   matcher tasks, in `stale()`/`can_retry()` (975-980). Assistant releases (`_release_assistant`,
   536, which goes through `_await_release`), `_await_reply_text` (436-462) and `_offplan_reply`
   (575-590) use the same pair.
4. **`_is_interrupted` is a snapshot, not a latch.** It is `Assistant._speech_interrupted`
   (`agents/tutor_agent.py:164-166`): `current_speech is not None and speech.interrupted`.
   `start_turn` calls `session.interrupt(force=True)` (`student_question.py:53`). The speech
   unwinds and `_scheduling_task` sets `_current_speech = None`
   (`livekit/agents/voice/agent_activity.py:1354`). From then on the predicate is False.
   The true window is one executor wake-up (`MAX_RELEASE_SLEEP = 0.25`, runtime.py:54), so an op
   may never observe it.
5. **Staleness never fires.** The epoch advances only in `_invalidate_pending` (857). Its
   callers: `begin_topic`, `enter_remediation`, `exit_remediation`, `mark_answer`, `apply_now`,
   `on_student_transcript` (302), `_begin_generation` (780), and `aclose`. `_begin_generation` runs
   on the first non-blank delta of a new reply (`tee`, ~line 626). While the student records
   there is no new reply, so epoch and `_generation_id` stay put.
6. **Nothing tells the board about the interruption.** `start_turn` touches only the session.
   In `main.py:414-421` the `speech_created` done-callback calls `on_reply_finished` only when
   NOT interrupted. `on_speech_stopped` (663) only sets `_speech_stopped_at`, which is read
   solely by `_heard_sentences` (678) for the next prompt's context. It is never a release gate.
7. **Existing test masks it.** `tests/test_student_question.py:238` asserts a claim returns to
   pending after `start_turn`, using a `FakeSession` whose `current_speech` never clears. Real
   LiveKit clears it.

## Why it appeared now

With the open mic, an interruption was followed almost at once by the student's reply: a new
generation, which calls `_invalidate_pending()` and masked the gap. With push-to-ask the student
records for seconds before any new generation (or never, on cancel until resume), so the
gap is visible.

## The user's hypothesis — verdict

"Beats still in the queue that weren't sent yet": **partly right.** They are queued on the agent
(`_op_queue`, the op the executor is waiting on, in-flight `_match_sentence` tasks, assistant
release tasks), not on the client. But a queue is normal; the defect is that **the queue is never
invalidated on interruption**, and the interruption check stops working once `current_speech`
clears.

## Other release paths checked

- `_release_assistant`, `_plan_request`, `_offplan_reply`: same weakness; covered by an epoch
  bump (they compare epoch/generation after their awaits).
- `begin_topic`, `enter_remediation`, `mark_answer`: publish immediately, but only from tool
  calls inside a speech. `advance_to_next_topic` and `check_topic_understanding` do not check
  `speech_handle.interrupted` (only the lesson tool does, `tutor_agent.py:300,323`). A tool
  finishing just after the interrupt could still publish a topic frame. Narrow; see open questions.
- `apply_now`, `publish_snapshot`: no callers in `src/`.
- Cancel/resume (`cancel_turn` → `generate_reply`): the new speech reaches `tee`, and its first
  non-blank delta runs `_begin_generation`, which bumps the epoch and resets state. Correct, but
  only after LLM latency (about a second or more), during which stale ops still release. Without a
  fix, a cancel does not stop the leak either.

## Suggested fixes

**(A) Recommended — invalidate on interruption, from the speech done-callback.**
Add `BoardRuntime.on_reply_interrupted(generation_id)`: if `generation_id == self._generation_id`,
call `_invalidate_pending()`. Call it from `main.py` `on_done` when `speech.interrupted`.
- Pro: one place; covers `start_turn`, `lk.chat` interrupts and any future interrupt source;
  claims return to pending (`_invalidate_pending` releases them), so the resumed reply re-matches
  them. Matches existing `on_reply_finished(speech.id)` plumbing.
- Guard: the id check means a queued speech that was interrupted and skipped without ever
  teeing (id never became `_generation_id`) does not invalidate the live generation.
- Con: fires when the speech is done, which can lag the interrupt (typically a few ticks, up to
  `INTERRUPTION_TIMEOUT` 5 s in `speech_handle.py:14`). The existing `_is_interrupted()` covers
  that gap while the handle is current. Add a test for the ordering.
- Hole to close: after the bump, a delta still in flight through `forward()` could `_emit` a
  new matcher task on the NEW epoch with the SAME generation id, so it is not stale. Close it
  by also remembering the id (small set or `self._interrupted_generation`) and having `_emit`,
  `_queue_match` and `_is_stale` treat it as stale. That is option B's idea used as a latch.

**(B) Sticky per-generation interruption.** Record interrupted generation ids and make
`_is_stale` return True for them, instead of reading `current_speech`.
- Pro: fixes the root predicate; no reliance on callback ordering.
- Con: still needs a producer of the event (the same done-callback), and does not by itself
  drain the queue or release claims. Best as the latch half of A.

**(C) Invalidate inside `StudentQuestion.start_turn`.** Call `board_runtime` right after
`interrupt()`.
- Pro: immediate, no waiting for the speech to finish.
- Con: misses `lk.chat` interrupts; couples the RPC handler to the board; `StudentQuestion`
  currently has no runtime reference.

**(D) Not recommended — gate on `_speech_stopped_at`.** Agent state also leaves "speaking" at
natural gaps (between tool steps), so a gate would drop legitimate beats; and the field is reset
by `on_speech_started`.

**Recommendation:** A with the latch from B. Optionally add C's immediacy later if the
done-callback lag shows in traces.

In-flight matcher tasks: **covered by the epoch bump** for tasks already running
(`stale()` re-checked at 975-1010 before `_queue_match`, so no late result queues). Not covered:
the `_emit` race above, hence the latch. A beat dropped this way returns to pending, so the
resumed reply can fire it again.

## Suggested test

Style: `tests/test_board_runtime.py` (`ManualClock`, `_make_runtime`, `_drain_tee`, `_settle`).
Mirror `test_interruption_drops_an_operation_waiting_for_a_timestamp` (line 918) but make the
flag go True then False, as `current_speech` does in production:

1. `begin_topic`, `tee("... ", "gen-1")`, `clock.now = 10`, `on_speech_started()`,
   `begin_timed_step("gen-1")` (op now waits on the timestamp), `_settle()`.
2. `interrupted[0] = True`; `runtime.on_reply_interrupted("gen-1")`; `interrupted[0] = False`.
3. `end_timed_step(...)`, `clock.advance_to(20)`, `_settle()`.
4. Assert `published == []` and the claim is `pending`. Without the fix this publishes.

Add: (a) a slow matcher (`SlowClient` pattern, line 871) whose result lands after the interrupt:
nothing queues; (b) a different id (`"other"`) does not invalidate; (c) a post-interrupt `tee` delta
on the same generation emits no op; (d) in `tests/test_student_question.py`, replace the
never-clearing `FakeSession.current_speech` with one that sets `None` after `start_turn`.
The done-callback in `main.py` is a closure; extract it or test through a fake `SpeechHandle`.

## Open questions

- Should beats whose sentence was already heard before the interrupt, but matched late, be
  dropped too? Fix A drops them and the resumed reply re-fires them; confirm that is desired.
- Should `advance_to_next_topic` / `check_topic_understanding` check `speech_handle.interrupted`
  like the lesson tool does, so a topic frame cannot publish after Ask?
- Does LiveKit keep consuming LLM text into `tee` after interrupt, or is the TTS task
  cancelled at once? Decides how real the `_emit` race is.
