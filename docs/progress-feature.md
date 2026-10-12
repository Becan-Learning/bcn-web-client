# Progress: removed for now, to be rebuilt

Status: removed 2026-10-12 together with the move to a real Catalog and real Enrollments
([backend-courses-handoff.md](backend-courses-handoff.md)). Every progress number the web showed was
display data with no source. Pattern 4 ("real data instead of claims") forbids showing it to a
real student, so it was removed rather than faked. This file records what existed, so it can be
rebuilt on real data. The removed code is in git history before the removal commit on the
`feat/courses-enrollment` branch.

**What stays:** the live session's own tracking of the current session (current Lesson, current
Topic, `topic_done`, "Topic 3 of 7" in the session screen). It comes from the agent over
`ui-control` and is not stored anywhere.

## What was removed, page by page

| Where | What it showed | Data it used |
|---|---|---|
| Dashboard `/home` (`home-view.tsx`, `lib/data/home.ts`) | A progress bar per enrolled course, "N of M chapters completed". Cards sorted by nearest exam date. | `ENROLLED[].done`, `examLabel`, `daysLeft`, all hard-coded. |
| Course card (`courses/course-card.tsx` → `CardProgress`) | A bar plus "N of M completed" (only used by the dashboard). | `done`, `total`. |
| Course page `/c/[code]` (`course-view.tsx`) | `MiniDashboard`: mastery %, chapters completed, expected exam date (today + 21 days), and a **Continue** button to the resume Chapter. Each chapter card had mastery %, a status (`done` / `next` / `almost` / `none`) and a "resume" mark. `?state=guest\|new\|progress` previews. | `masteryOf(n)`, hard-coded; `examDate` computed. |
| Session summary `/session/[code]/[n]/done` | Days-to-exam block or "set your exam date", a headline from 5 preview states (`done` `clean` `cut` `last` `nodate` via `?s=`), a course progress bar, a "where you struggled" list with a penalty note, and "Continue this chapter" / "Back to plan" / "Review stumbles" buttons. | `DAYS_LEFT`, `COVERED`, `STUMBLES` constants; `done = chapter number`. |
| Checkout result `/checkout/result` | After payment the button returned to "where you were": the next unfinished Chapter of the course with the nearest exam. | `resumePoint()` from `lib/data/home.ts`. |
| Settings → delete Account | One line saying deletion removes "your progress in each course and your saved exam dates". | Copy only (`deletedProgress`). |

## Concepts the rebuild needs (not yet in the glossary)

Define these in `GLOSSARY.md` when the feature is designed, not before:

- **Chapter completion.** When is a Chapter "done"? Options: every Lesson reached, every
  Checkpoint passed, or a mastery threshold. The old UI mixed "completed" with "mastery %" without
  defining either.
- **Mastery.** A per-Chapter score from Checkpoint outcomes, which the agent knows and the web
  does not.
- **Resume point.** The first Chapter (and Lesson) the student started but did not finish.
- **Struggle (تعثّر).** Checkpoints answered wrong at least once. Pattern 6 requires the summary
  to name these rather than praise.
- **Exam date.** A per-Enrollment date the student sets. It drives the urgency pattern (7) and
  the dashboard order.

## Data it will need

- **Source of truth: the agent.** It already knows the Lesson, Topic and Checkpoint outcomes
  during a session. It must report them to the backend at session end, or at each `topic_done`
  and Checkpoint close. That is a new agent → backend contract, and it also needs the
  `tutoring_session` record from the quota work ([backend-courses-handoff.md §7](backend-courses-handoff.md)).
- Likely tables:
  - `chapter_progress (user_id, course_id, chapter_number, lessons_reached, mastery, completed_at)`
    keyed to the **Course**, not to an Enrollment, so it survives un-enrolling and re-enrolling.
  - `checkpoint_result` for struggles.
  - `exam_date` on the active Enrollment.
- The dashboard and course page would read it with `GET /me/enrollments` (add a summary per
  course), so it stays one indexed query per page.
