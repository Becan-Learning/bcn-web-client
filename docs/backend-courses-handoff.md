# Backend handoff: Catalog, Enrollment and the session token

Status: agreed 2026-10-12. Target repo: `Becan-Learning/bcn-backend-main@dev`.
**Superseded in part on 2026-10-15 by B1** (`Becan-Learning/bcn-backend-main#42`, issue #38; web side: #54, [ADR 0005](adr/0005-chapter-ids-in-urls-and-content-paths-from-the-backend.md))
and **B5** (`Becan-Learning/bcn-backend-main#45`, issue #44; web side: #57): Archived Courses and the Chapter lookup by id, and
**B4** (`Becan-Learning/bcn-backend-main#47`; web side: #55): the Admin preview reads and version pinning.
The current contract is §0 below. The numbered sections that follow are the original design and are kept as history; each section the
migration changed is marked **Superseded**. Where they disagree with §0, §0 wins.
Builds on the Account work ([backend-auth-handoff.md](backend-auth-handoff.md), merged in web
PR #21). Terms: **Catalog, Course, Chapter, Lesson, Enrollment** in [GLOSSARY.md](../GLOSSARY.md).
The web side of the same feature: [specs/courses-enrollment.md](specs/courses-enrollment.md).

Out of scope here: subscriptions, payment, quota and progress. Each one gets a hook below (§7) so
it can be added later without reshaping these tables.

## 0. Current contract (B1, 2026-10-15)

Courses and Chapters now have UUID ids. A Course also has a `slug` (its URL), and a Chapter's `number` is an editable position.
Content paths come from the backend, so the web builds no `ch_{n}` paths. The Maintenance window deploys every repo together.

### Catalog (`GET /api/v1/courses`, `GET /api/v1/courses/:slug`, `public, max-age=60, s-maxage=300`)

The list holds only `published` Courses, and Chapters are only `coming_soon` and `published`. The detail route takes the **slug**
(a UUID is 404 `COURSE_NOT_FOUND`) and also answers for an **Archived** Course (B5). There is no `published` boolean any more.
Every Course carries `status`. When a slug is shared, the non-Archived Course wins; among Archived ones the newest does.

```ts
type CourseSummary = {
  id: string;                     // uuid
  slug: string;                   // /c/{slug}, /session/{slug}/…
  status: "published" | "archived"; // B5. The list is always "published"; "archived" = retired, closed to new Enrollments
  code: string; name: Localized;
  institution: { id: string; name: Localized };
  icon: IconKey; tone: Tone;
  chapterCount: number;           // coming_soon + published
  publishedChapterCount: number;  // published
};
type ChapterDto = {
  id: string;                     // uuid, the id in session URLs
  number: number;                 // position; "Chapter N" on screen
  title: Localized; minutes: number; lessonCount: number;
  state: "coming_soon" | "published";
  contentPath: string | null;     // live version prefix when published ("courses/becan-test/ch_1/"), else null
};
```

### Chapter lookup (`GET /api/v1/chapters/:chapterId`, B5, same cache headers)

`:chapterId` is the Chapter uuid. 200 `{ chapter: ChapterDto, course: CourseSummary & { chapters: ChapterDto[] } }`, where `course` is exactly
the body of `GET /courses/:slug` and `chapter` equals its matching entry. It answers only for a `coming_soon` or `published` Chapter of a
`published` or `archived` Course. Anything else (Draft or Archived Chapter, Draft Course, unknown or malformed id) is 404
`CHAPTER_NOT_FOUND`.

### Enrollment

`PUT|DELETE /api/v1/me/enrollments/:courseId` takes the **Course UUID** (`course.id`, never the slug). `GET /me/enrollments` and `PUT`
return `{ enrolledAt, course: CourseSummary }`, and `course.status` is `"published"` or `"archived"`. PUT into a Course that is not `published`
is 404 `COURSE_NOT_FOUND`. Active Enrollments in an `archived` Course keep working, and the token is issued for their `published` Chapters.

### Token (`POST /api/v1/livekit/token`)

```jsonc
// request (courseId / chapterNumber are rejected as 400)
{ "chapterId": "<uuid>", "language": "Arabic" | "English", "experience": "quick" | "relaxed" }
// 200, Cache-Control: no-store
{ "token": "<jwt>", "serverUrl": "wss://…", "contentPath": "courses/becan-test/ch_1/", "courseContentPath": "courses/becan-test/" }
```

`contentPath` and `courseContentPath` are the prefixes **pinned** to the Session; a continued Session keeps them even if another version
went live since. Participant attributes: `course_id` and `chapter_id` are UUIDs; new `content_path`, `course_content_path`,
`chapter_number` (decimal) and `chapter_title` (`title_ar` when `language` is `Arabic`, else `title_en`). See
[agent-contract-allowance.md](agent-contract-allowance.md).

| status | code | web behaviour |
|---|---|---|
| 404 | `CHAPTER_NOT_FOUND` | generic connection failure (the page already 404s an unknown Chapter) |
| 403 | `NOT_ENROLLED` | generic connection failure (the page redirects the not-enrolled to the Course page) |
| 409 | `CHAPTER_NOT_PUBLISHED` | localized "chapter isn't available" screen, back to the Course |
| 409 | `CONTENT_NOT_AVAILABLE` | localized "content isn't ready" screen, back to the Course |
| 403 | `SESSIONS_USED_UP`, `MINUTES_USED_UP` | refresh the server gate (Allowance screen) |
| 404 | `COURSE_NOT_FOUND` | Course detail / PUT enrollment: the Course page is not found |

### How the web uses it

- URLs: `/c/{slug}`, `/session/{slug}/{chapterId}`, and `/session/{slug}/{chapterId}/done` (only a redirect to the Course page since web ADR 0006). The session page (and `done`, to find the current slug) resolve by `chapterId`
  with **one** read of `GET /chapters/:chapterId` (`findSessionTarget`; the pure decision is `resolveSessionTarget` in
  `src/lib/session/resolve.ts`). The Course in the answer holds the Chapter, so: the URL's slug equals `course.slug` = found; a different slug
  (a renamed Course) = redirect to `course.slug`, keeping the query; 404 `CHAPTER_NOT_FOUND`, a malformed id (no request is made), or any
  failed read = not found. The Catalog scan of B1 is gone. The read is cached for 5 minutes, like the Catalog.
- Archived Courses: `/c/{slug}` renders them (`GET /courses/:slug` answers), marked archived. Enrolling is hidden. A student with an active
  Enrollment starts the `published` Chapters as usual; a student without one gets an explanation and no start (`startDecision` returns
  `reason: "archived"` for a not-enrolled student of an archived Course, so the session page sends them back to the Course page).
  An unlimited account (Admin) is the same as before: it starts any `published` Chapter without enrolling. Un-enrolling stays possible
  (it frees a Course slot), with a note that the Course can't be joined again. "My courses" marks each Enrollment whose `course.status` is
  `archived`. A slug shared by an Archived and a non-Archived Course resolves `/c/{slug}` to the non-Archived one, so the "back to the Course"
  link of an Archived Course's session can land on that other Course (rare, and the backend's rule).
- Content: the page renders before the student presses Start, and the token (which opens a Session and charges against the
  Allowance) can only be requested then. So before Start the page reads `lessons_list.json` on the server, and shows `slides.pdf`,
  from the Catalog's `contentPath`. When the token arrives, the client switches to the **pinned** `contentPath` and, if it differs,
  re-reads the lessons and the slides from it. Both go through `/api/fetch-bunny/{contentPath}{file}`.

### Admin preview (B4, `bcn-backend-main#47`; web: W2, #55)

Admin-only, uncached reads, for a viewer whose `GET /me/allowance` says `unlimited: true` (an Admin with two-factor). They use the public
Catalog's shapes, widened. All answer `Cache-Control: private, no-store`, 401 `UNAUTHENTICATED` / 403 `ADMIN_PERMISSION_REQUIRED` / 403
`ADMIN_TWO_FACTOR_REQUIRED` for anyone else, and are limited to 120 per minute per Admin.

| Route | Answers |
|---|---|
| `GET /api/v1/admin/preview/courses` | Draft and Published Courses (not Archived): `CourseSummary[]`, `status` widened |
| `GET /api/v1/admin/preview/courses/:slug` | A Course detail of any status (an Archived one marked `archived`), 404 `COURSE_NOT_FOUND` |
| `GET /api/v1/admin/preview/chapters/:chapterId` | `{ chapter, course }` like `GET /chapters/:chapterId`; Archived, unknown and malformed ids 404 `CHAPTER_NOT_FOUND` |

```ts
CourseSummary = { …public fields, status: "draft" | "published" | "archived" }
CourseDetail  = CourseSummary & { chapters: Chapter[]; versions: Version[] }   // Course content versions
Chapter       = { …public fields, state: "draft" | "coming_soon" | "published",
                  contentPath: string | null,   // the LIVE prefix in any state; null if none is live
                  versions: Version[] }          // valid versions only, newest first
Version       = { id: uuid, version: number, live: boolean, previewed: boolean, contentPath: string } // prefix ends in "/"
```

Token request: `POST /api/v1/livekit/token` also takes optional `contentVersionId` and `courseContentVersionId` (uuids, a version `id` above). For a
non-Admin either field is 403 `VERSION_PIN_FORBIDDEN`. Otherwise: 404 `CONTENT_VERSION_NOT_FOUND` (unknown id, another owner's, a Chapter version in the
Course slot), 409 `VERSION_INVALID`, 409 `CONTENT_NOT_AVAILABLE` (a side with neither a chosen nor a live version). A chosen version replaces the live one
for its side, whatever the Chapter state or Course status. The response's `contentPath` and `courseContentPath` are the pinned prefixes.

| status | code | web behaviour |
|---|---|---|
| 403 | `VERSION_PIN_FORBIDDEN` | localized stop screen (`Session.unavailable.version-forbidden`); the web never sends a pin for a non-Admin |
| 404 | `CONTENT_VERSION_NOT_FOUND` | localized stop screen (`version-not-found`) |
| 409 | `VERSION_INVALID` | localized stop screen (`version-invalid`) |
| 401/403 on a preview **read** | | fall back to the public Catalog read |

How the web uses it (ADR 0005, "Implementation notes (#55)"):

- **Which read.** `readsPreview(allowance)` is true only for `unlimited`. Then `/courses`, `/c/{slug}` and `/session/{slug}/{chapterId}` read the preview
  routes with `cache: "no-store"` and the forwarded cookie (`src/lib/auth/courses.ts`); everyone else reads the public cached routes, which carry no cookie
  and keep `revalidate: 300`. The two are separate functions and never share a request. Public schemas reject `draft`; the preview schemas accept it.
- **Draft label.** A Draft Course or Chapter is marked «مسوّدة» / Draft (`Preview.draft`). An Admin starts any Chapter that has a live path or a valid
  version, without an Enrollment. If the Chapter has no live version, the start link carries `?version=` of its newest version, and `?courseVersion=` of the
  Course's newest content version when none is live, so the token never answers `CONTENT_NOT_AVAILABLE` for a Chapter the Admin can see.
- **Version preview link** (the admin app links here):

  ```
  /session/{courseSlug}/{chapterId}?version={contentVersionId}&courseVersion={courseContentVersionId}
  ```

  Arabic is unprefixed; English is under `/en`. `version` is a Chapter `Version.id`, `courseVersion` a Course `Version.id` (the ids the Admin Catalog read
  returns). Both are optional. The page shows the lessons and slides of `version`'s `contentPath` before Start, sends the ids in the token request, and
  shows "Preview: version N" and "Course content: version M", each marked live or not live. An unknown id gives an error screen, not a token request.
  A non-Admin (or an Admin whose preview read fell back to the public one) has the params **ignored**: live content, no marker, no pin.

## 1. What changes, in one paragraph

The Catalog moves from a hard-coded file in the web (`src/lib/data/catalog.ts`) into Postgres,
filled by an idempotent seed exactly like Institutions and Majors. Students enroll in Courses and
un-enroll from them. Un-enrolling **ends** an Enrollment and never deletes it. The backend, not the
web, issues the LiveKit token, and it does so only for a published Chapter of a Course the student
is actively enrolled in. The web keeps no catalog data and no LiveKit secret.

## 2. Topology

- The browser talks to the web origin only. Today the web rewrites `/api/auth/*` to the
  backend. It now **also rewrites `/api/v1/*`** to `${BACKEND_URL}/api/v1/*`, so the browser
  calls enroll, un-enroll and the token endpoint same-origin, with the first-party session cookie.
- The web's server code also calls `/api/v1/*` directly (server-to-server) to render pages. For
  per-student calls it forwards the student's `cookie` **and `x-forwarded-for`**, so rate limits
  and logs see the student's IP and not the web server's.
- No CORS change: `CORS_ORIGIN` remains the single web origin.

## 3. Schema

New file `src/db/schema/catalog-schema.ts`, exported from the `src/db/schema/index.ts` barrel,
with its relations added to `db` in `src/db/index.ts`. Follow the existing conventions:
snake_case columns, `timestamp(...)` the same way the current tables use it, and explicit
`onDelete` on every FK.

### 3.1 `course`

> **Superseded by §0.** `id` is now a uuid and the slug moved to `slug`.

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | Stable slug, `^[a-z0-9][a-z0-9_-]{0,79}$`. **One id everywhere:** the URL segment (`/c/acct-101`), the Bunny folder (`courses/{id}/…`) and the agent's `course_id`. Never renamed; add a new row instead. |
| `code` | text, not null | The university's code in Latin script, e.g. `ACCT 101`. |
| `name_ar`, `name_en` | text, not null | |
| `institution_id` | text, not null, FK → `institution.id` **restrict** | A Course belongs to exactly one Institution. |
| `icon` | text, not null | One of `coins bars blocks torus flask atom donut cube bolt` (the web's `IconKey`). Check constraint or a pg enum. |
| `tone` | text, not null | One of `lilac base deep amber walnut olive oliveDark` (the web's `Tone`). Check constraint or a pg enum. |
| `sort_order` | integer, not null, default 0 | |
| `created_at` | timestamp, default now | |

Index: `course_institution_id_sort_idx` on `(institution_id, sort_order)`.

### 3.2 `chapter`

> **Superseded by §0.** Chapters have a uuid `id`, a `state` instead of `published`, and no `ch_{number}` convention.

| Column | Type | Notes |
|---|---|---|
| `course_id` | text, not null, FK → `course.id` **cascade** | |
| `number` | integer, not null, check `>= 1` | 1-based. The Bunny folder is `ch_{number}` by convention, so there is no content column. |
| `title_ar`, `title_en` | text, not null | |
| `minutes` | integer, not null, check `> 0` | Expected length shown on the chapter card. |
| `lesson_count` | integer, not null, check `>= 0` | Number of Lessons. Must match `number_of_lessons` in the Chapter's `lessons_list.json` once published. |
| `published` | boolean, not null, default `false` | `false` means "coming soon": listed, but no session can open. |
| `created_at` | timestamp, default now | |

Primary key: `(course_id, number)`.

The Chapter has no other content columns. Lesson names and plans stay in Bunny, and the session
page and the agent read them there.

### 3.3 `enrollment`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK, `defaultRandom()` | |
| `user_id` | text, not null, FK → `user.id` **cascade** | Deleting an Account erases its Enrollments. Un-enrolling does not (see `ended_at`). |
| `course_id` | text, not null, FK → `course.id` **restrict** | |
| `enrolled_at` | timestamp, not null, default now | |
| `ended_at` | timestamp, null | `null` means active. |
| `end_reason` | pg enum `enrollment_end_reason`, null | Values today: `unenrolled`. Later: `expired`, `plan_changed`, … |

Constraints and indexes:

- Check: `(ended_at IS NULL) = (end_reason IS NULL)`.
- **Partial unique index** `enrollment_active_user_course_uidx` on `(user_id, course_id) WHERE
  ended_at IS NULL`. The database guarantees one active Enrollment per Course per student, and
  the same index serves every "my active Enrollments" lookup (its leading column is `user_id`),
  so no second index is needed.

Rules:

- Enrolling always **inserts a new row**. Ending one sets `ended_at = now()` and `end_reason`.
  An ended row is never reactivated or deleted: every row is one window of time, and the later
  limit on active Enrollments and the expiry work will count these windows.
- A student may enroll in a Course of any Institution, not only their own.
- A Course with no published Chapters can still be enrolled in.

### 3.4 Migration

`pnpm db:generate` → review the SQL (check that the partial index has its `WHERE` and that the
check constraints are present) → `pnpm db:migrate`.

## 4. Seed

> **Superseded in part by §0.** The seed still creates the same Courses, now keyed by `slug`, and `becan-test` Chapter 1 is registered as Content version 1.

New `src/db/seed-data/catalog.ts` and a `seedCatalog()` in `src/db/seed.ts`, run after
`seedInstitutions()` in the same `pnpm db:seed` (and therefore in the Vitest global setup). It
upserts Courses by `id` and Chapters by `(course_id, number)`, and **never deletes** rows, because
Enrollments reference Courses. `sort_order` is the index in the file × 10, the same as Institutions.

Contents:

1. **`becan-test`**, the only Course whose content actually exists in Bunny today
   (`courses/becan-test/ch_1/` has `lessons_list.json`, `slides.pdf` and the lesson plans). It is a
   test course, Institution `ksu`, code `TEST 101`,
   name `{ ar: "مقرر تجريبي — فيزياء عامة", en: "Test Course — General Physics" }`, icon `atom`,
   tone `deep`. It has one Chapter: number 1,
   `{ ar: "الوحدات والأبعاد", en: "Units and Dimensions" }`, 20 minutes, `lesson_count` 2,
   **published**.
2. **The nine display Courses** currently in the web's `src/lib/data/catalog.ts` (`ACCT 101`, `ECON
   101`, `MGT 101`, `MATH 101`, `CHEM 101`, `PHYS 101`, `STAT 101`, `CS 101`, `EE 201`). Copy their
   names, icon, tone and chapter titles/minutes as they are. Use the id `code.toLowerCase()` with
   the space replaced by `-` (`acct-101`). The Institution comes from the web's `university` field
   (`ksu` or `kau`). Use the old per-chapter `topics` number as `lesson_count`. **Every one of their
   Chapters is unpublished**, because none of them has content in Bunny. The web's `college`
   field is dropped.

The seed is a stand-in for the real Catalog. When real content is uploaded, its Course gets a row
here named after its Bunny folder, and each Chapter is flipped to `published` as its folder
lands.

## 5. Endpoints

All of them live under `/api/v1` and use the existing error envelope `{ error: { message, code? } }`
through `AppError` and Zod, which `errorHandler` maps to 400. Names are returned as
`Localized = { ar, en }`, the same as Institutions, so the web renders them without mapping.
Layering is the usual `routes/` → `controllers/` → `services/` → `repositories/`.

Shared shapes (**superseded by §0**):

```ts
type CourseSummary = {
  id: string;
  code: string;
  name: Localized;
  institution: { id: string; name: Localized };
  icon: IconKey;
  tone: Tone;
  chapterCount: number;           // all Chapters
  publishedChapterCount: number;  // what the student can open today
};

type ChapterDto = {
  number: number;
  title: Localized;
  minutes: number;
  lessonCount: number;
  published: boolean;
};

type EnrollmentDto = {
  enrolledAt: string;   // ISO 8601
  course: CourseSummary;
};
```

### 5.1 `GET /courses?institution=<id>` (public)

- Lists Courses as `CourseSummary[]`. `institution` is optional: without it every Course is
  returned, and with an unknown id the result is `[]`, not 404.
- Order: Institution `sort_order`, then Course `sort_order`, then `code`.
- One query: join `institution` and aggregate the chapter counts with
  `count(*) / count(*) FILTER (WHERE published)` grouped by course. No N+1.
- Headers: `Cache-Control: public, max-age=60, s-maxage=300`.
- 400 if `institution` doesn't match the slug pattern.

### 5.2 `GET /courses/:courseId` (public)

- Returns `CourseSummary & { chapters: ChapterDto[] }`, with chapters ordered by `number`.
- 404 `COURSE_NOT_FOUND`.
- Headers: the same cacheable `Cache-Control` as 5.1.

### 5.3 `GET /me/enrollments` (`requireSession`)

- Returns the signed-in student's **active** Enrollments as `EnrollmentDto[]`, newest
  `enrolled_at` first.
- One query, served by the partial unique index.
- Headers: `Cache-Control: private, no-store`.
- The web uses this one call for the dashboard and to answer "am I enrolled?" on the course page
  and the session page.

### 5.4 `PUT /me/enrollments/:courseId` (`requireSession`)

- Enrolls the student. It's **idempotent**: 201 with the `EnrollmentDto` when it creates a row,
  and 200 with the existing active one when there already is one.
- 404 `COURSE_NOT_FOUND`.
- Insert with `ON CONFLICT (user_id, course_id) WHERE ended_at IS NULL DO NOTHING`, then read the
  active row back. Run it in a transaction, because the later limit on active Enrollments is a
  count inside this same transaction (§7).
- Headers: `Cache-Control: no-store`.

### 5.5 `DELETE /me/enrollments/:courseId` (`requireSession`)

- Ends the active Enrollment:
  `UPDATE … SET ended_at = now(), end_reason = 'unenrolled' WHERE user_id = $1 AND course_id = $2
  AND ended_at IS NULL`.
- It's **idempotent**: 204 whether or not a row was active, including for an unknown course id.

### 5.6 `POST /livekit/token` (`requireSession`)

> **Superseded by §0.** The request is `{ chapterId, language, experience }`; the response adds the pinned content paths; the attributes and error codes changed.

Body (Zod):

```ts
{
  courseId: string;              // slug pattern
  chapterNumber: number;         // int >= 1
  language: "Arabic" | "English";   // the Explanation language
  experience: "quick" | "relaxed";
}
```

Checks, in this order. Run them as one query that joins `chapter` and the active `enrollment`:

1. Chapter `(courseId, chapterNumber)` exists → else 404 `CHAPTER_NOT_FOUND`.
2. The student has an active Enrollment in `courseId` → else 403 `NOT_ENROLLED`.
3. The Chapter is published → else 409 `CHAPTER_NOT_PUBLISHED`.

Response: 200 `{ token: string, serverUrl: string }`, with `Cache-Control: no-store`.

The token, built with `livekit-server-sdk`'s `AccessToken` (a new dependency):

- `identity` = user id, `name` = the Account's `name`. `ttl` is 10 minutes. It only has to
  outlive the join, because a connected participant is refreshed by LiveKit itself.
- Grant `{ roomJoin: true, room }`, where `room = ss_{last 10 chars of user id}_{yyyymmdd}_{hhmm}`
  in **UTC**.
- **Participant attributes. This is the agent contract, and its names must not change:**

  | Attribute | Value |
  |---|---|
  | `course_id` | `course.id` (from the database, not the request) |
  | `chapter_id` | `` `ch_${chapter.number}` `` |
  | `language` | body `language` |
  | `experience` | body `experience` |
  | `user_id` | user id |
  | `user_name` | the Account's `name` |

Rate limit: its own `express-rate-limit` instance, mounted after `requireSession` and keyed by
**user id**, at 10 requests per minute. It returns 429 with code `RATE_LIMITED`.

Env (`src/config/env.ts` + `.env.example`): `LIVEKIT_URL` (the `wss://` URL that is returned as
`serverUrl`), `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`. All three are required in every
environment. `vitest.config.ts` `test.env` sets dummy values so tests can mint and decode tokens.

## 6. Rate limits and scale

- The global `apiRateLimiter` is 100 requests per 15 minutes **per IP**. At that level, a
  university network where many students share one NAT'd IP is blocked within minutes. Raise it to
  **1000 per 15 minutes per IP**. It stays the coarse abuse guard, and the per-account limits
  below do the real throttling.
- Enroll and un-enroll (`PUT`/`DELETE /me/enrollments/:courseId`) get a per-account limiter of 30
  per minute.
- Catalog reads are public and the same for every student. They carry `public` cache headers,
  and the web caches them server-side for 5 minutes, so as students grow the backend still sees
  roughly one catalog read per page type per 5 minutes per web instance.
- Per-student reads are one indexed query each. Nothing per-student is ever stored in a shared
  cache.

## 7. Hooks for later (not built now)

- **Limit on active Enrollments per subscription tier:** inside the enroll transaction (§5.4),
  `SELECT count(*) … WHERE user_id = $1 AND ended_at IS NULL FOR UPDATE` (or an advisory lock
  on the user id), then reject with 409 `ENROLLMENT_LIMIT`.
- **Time-bounded Enrollments:** add `expires_at`. Either a job ends expired rows
  (`end_reason = 'expired'`), or "active" becomes `ended_at IS NULL AND (expires_at IS NULL OR
  expires_at > now())`. The partial unique index stays on `ended_at` alone.
- **Abuse by enrolling and un-enrolling in turn:** the kept rows let a rule count Enrollments
  *started* per period.
- **Quota (minutes):** the token endpoint is the single choke point. It will need a `session`
  record (room, user, course, chapter, started/ended), filled from LiveKit room webhooks or an
  agent report. Name it something like `tutoring_session` so it isn't confused with Better Auth's
  `session` (the backend glossary's **Device session**).
- **Progress:** see [progress-feature.md](progress-feature.md).
- **Admin Catalog management:** these tables are already the source of truth, so admin CRUD is
  just new endpoints.

## 8. Tests (Supertest + the `_test` database)

- **Catalog:**
  - The list with and without `institution`, its order, and its counts (`becan-test` has 1/1,
    `acct-101` has 10/0).
  - Unknown institution returns `[]`.
  - A bad slug returns 400.
  - The detail endpoint returns chapters in order, and an unknown course returns 404.
  - Both return the cache header.
- **Enrollment:**
  - Every endpoint returns 401 without a session.
  - Enrolling returns 201, and enrolling again returns 200 with the same `enrolledAt`.
  - The list shows the Enrollment.
  - Un-enrolling returns 204, the list is empty, and the row still exists with
    `end_reason = 'unenrolled'`.
  - Re-enrolling returns 201 and creates a second row.
  - Un-enrolling when not enrolled returns 204.
  - Enrolling in an unknown course returns 404.
  - Two concurrent `PUT`s leave exactly one active row.
- **Token:**
  - Returns 401 without a session and 400 for a bad body.
  - An unknown chapter returns 404, not being enrolled returns 403, and an unpublished chapter
    returns 409.
  - For an enrolled student on `becan-test` chapter 1 it returns 200. Decode the JWT and assert
    the attributes table above, `identity`, and that the room has the `ss_` prefix.
- The truncation in tests must also clear `enrollment`. Catalog rows stay seeded.

## 9. Docs to update in the backend repo

- `GLOSSARY.md`: add **Catalog, Course, Chapter, Lesson, Enrollment** (the definitions are in the
  web glossary), and record that un-enrolling *ends* an Enrollment.
- `AGENTS.md`: catalog seed notes, the LiveKit env vars, and the per-account limiters.
