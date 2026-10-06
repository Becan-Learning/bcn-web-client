# The student's voice reaches the tutor only through student questions

The tutor hears the student only during a **student question**: the student presses Ask, the
tutor stops at once, the student speaks, and the turn closes on its own when they finish (or on
Send / cancel). Outside a student question the microphone track is muted, and there is no
open-mic mode. With the mic open all session, the tutor took nearby conversations as turns and
cut into the explanation, and its adaptive interruption waited to confirm a real interruption
before going quiet. Gating the mic on a deliberate press removes both problems, because every
sound the tutor hears is meant for it.

## Considered Options

- **Open mic with tuned interruption** (the previous behaviour): rejected. No VAD or
  interruption threshold separates a student's question from a roommate talking. Raising the
  thresholds makes real interruptions slower still.
- **Open mic as a second mode next to Ask**: rejected. It keeps the failure for whoever picks
  it, and doubles the turn-handling paths on both the agent and the web side.
- **Hold to talk**: rejected. Holding is tiring for a long question on a phone. Tapping once,
  with automatic end-of-turn, is easier, and Send and cancel stay available.

## Consequences

- The agent contract gains three RPCs (`start_turn` · `end_turn` · `cancel_turn`). See
  `docs/agent-contract-student-question.md`.
- Answering a checkpoint by voice also goes through a student question.
- End-of-turn detection stays on the agent (STT endpointing). The web side keeps only two
  guards: cancel after silence, and send at a length cap.
