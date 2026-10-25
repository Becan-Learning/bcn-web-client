# Agent contract: the Session budget and `allowance_reached`

The backend grants every Session a budget when it issues the LiveKit token, and the agent ends the Session at that budget. When the student's Allowance (not the per-Session cap) set the budget, the agent tells the web, which shows that the student has reached their limits. This contract only adds to the existing attributes and `ui-control` packets; nothing existing changes.

## Participant attributes (student participant, set by the backend)

| Attribute | Value |
|---|---|
| `session_seconds` | The granted budget in whole seconds, as a decimal string (e.g. `"1800"`). Always present and positive. For a continued Session, it is what remains of the original grant. |
| `session_limit` | `allowance` when the student's remaining minutes produced the budget, `session` when the Plan's longest Session did (a tie counts as `allowance`). |

They sit alongside the existing `course_id`, `chapter_id`, `language`, `experience`, `user_id` and `user_name`.

## `ui-control` packet

```json
{"action":"allowance_reached"}
```

- Published by the agent, reliably, on topic `ui-control`, with no other fields.
- Sent only when `session_limit` is `allowance`, immediately before the existing `session_ending` packet of that same ending.
- A Session ended by the per-Session cap (`session_limit` = `session`) sends `session_ending` alone, as before.
- The web does not read numbers from the packet. It reads the student's real Usage from the backend (`GET /api/v1/me/allowance`).

## Ending sequence (agent)

1. About 15 seconds before `session_seconds` runs out, the tutor lets the sentence it is speaking finish, then speaks one short closing line in the explanation language.
2. If `session_limit` is `allowance`: publish `allowance_reached`.
3. Publish `session_ending` (unchanged: `{"action":"session_ending","message":"…"}`).
4. Shut down with drain.

Usage is measured by the backend from LiveKit webhooks and capped at the grant, so running a few seconds over never charges the student more than the budget.
