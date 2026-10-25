# Students rate a Session from a one-time popup on the Course page

Status: **implemented** (2026-10-20).

A Session used to end on a summary page, `/session/{code}/{n}/done`. After the removal of the
fake progress figures (stumbles, days to the exam) it was a heading, a time-limit or usage notice, a
"back to the course" button, a "next chapter" link and the rating form (five stars, optional notes).
Its one real job was the rating, and every other thing on it already lived on the Course page.

Now both endings (the student presses End, or the tutor signals `session_ending`) send the student
straight to `/c/{slug}?rate={room}`, with `&limit=1` when the Session ended at its time limit. A
disconnect still shows the "cut" screen and asks for no rating.

The Course page shows a small non-modal card, «كيف كانت الحصة؟», with the five stars and a close button
(bottom of the screen on a phone, bottom corner on the inline-end side on a desktop). Tapping a star opens
a Radix Dialog with that star preselected, the same five stars, the optional notes field and the send
button, which is the single amber primary of that screen. The payload and the `/api/feedback` route
are unchanged: `{ sessionId: room, sessionExperience, notes }`, scored in Langfuse against the room.

## Decisions

- **Shown once.** Closing the card, or sending the rating, removes `rate` and `limit` from the URL with
  `router.replace`, so a reload or Back does not bring the card back. The card is not remembered anywhere
  else: a Session that is not rated is simply never asked again.
- **Closing the dialog without sending returns to the card.** The URL is untouched, so the student can
  still rate; their stars and notes stay if they reopen it, so a stray Escape does not lose what they typed.
  After a send the dialog stays open on the thank-you until the student closes it, but the card is gone.
- **`/done` stays as a redirect** to `/c/{slug}` that carries `room` over as `rate` (and `limit`), so a link
  that was already in flight when this shipped still reaches the rating. It uses the Course code in the link
  as the slug. Sign-in and Enrollment rules belong to the Course page.
- **What the summary showed, and where it went.** The used-up Usage block (`QuotaBlock`) now shows on the
  Course page for any signed-in student who is enrolled in the Course (or is an unlimited account) and has
  used the Allowance up, with or without the rating params, so it does not vanish when the card is
  closed. The generic "your session time is up" sentence shows when `limit=1` and the Allowance is not used
  up. "Back to the course" is the page itself. "Next chapter" is gone: the Chapter cards are on the page.
  The gates (unknown Chapter, coming soon, not enrolled) are the Course page's own.
- **The card is for a signed-in account only.** A guest has no Session to rate.

## Considered Options

- **Keep the summary page and put the popup on it** — rejected: the page held nothing the student needs
  after the Session except the rating, and one more screen between the Session and the Course is a
  step before the student can do anything.
- **Rate inside the Session screen** — rejected: the Session screen is dark and silent (pattern 9), the
  student has just ended it, and the Allowance ending already has its own surface there.
- **A modal dialog straight away** — rejected: it blocks a student who wants to start the next Chapter.
  The card asks and waits.
- **Remember "already rated" in storage** — rejected: the URL parameter is enough and needs no storage.

## Consequences

- `SessionSummary` messages, the summary page and `feedback-form.tsx` are gone; the strings that remain
  moved to `SessionRating` and `Course.sessionLimit`.
- The Course page now reads `searchParams`. It already read the account and Allowance on every request,
  so it was already dynamic.
- Milestone 2 (Chapter-id URLs, ADR 0005) was reverted on 2026-10-25. This ADR was written against it and now
  describes the same behavior on the `/session/{code}/{n}` routes.
