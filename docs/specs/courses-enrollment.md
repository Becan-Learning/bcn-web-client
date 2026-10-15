# Web spec: real Catalog, Enrollment and the backend session token

Status: agreed 2026-10-12. **Updated 2026-10-15 (B1, web #54):** Courses and Chapters have UUID ids, session URLs use the Chapter id and
content paths come from the backend; the places below that still say `{id}`/`{n}`/`ch_{n}` are marked. The backend half, with every endpoint and response shape, is in
[../backend-courses-handoff.md](../backend-courses-handoff.md). The removed progress UI is recorded
in [../progress-feature.md](../progress-feature.md). Terms: **Catalog, Course, Chapter, Lesson,
Enrollment, Topic** in [GLOSSARY.md](../../GLOSSARY.md).

## Decisions

1. The Catalog comes from the backend (`GET /api/v1/courses`, `GET /api/v1/courses/:id`). The web
   keeps **no** catalog data. Only presentation stays in the web: the `TONES` class map and
   `SubjectIcon`, both keyed by the `tone`/`icon` the backend returns.
2. ~~A Course's id is one slug used everywhere.~~ **Superseded (B1):** a Course has a UUID `id` and a `slug`. The URL uses the slug
   (`/c/{slug}`, `/session/{slug}/{chapterId}`), Enrollment calls use the UUID, and the agent's `course_id` is the UUID. Bunny paths come
   from the backend's `contentPath`, never from the ids. The `slugOf(code)` and `courseBySlug` helpers still go away.
3. A Course belongs to one Institution. The `college` field and the college filter are removed.
4. Enrolling and un-enrolling are real. Un-enrolling **ends** an Enrollment (the backend keeps the
   row). Only a signed-in student with an active Enrollment can open a session.
5. All progress UI is removed. The live session's own Lesson/Topic tracking stays.
6. The `becan-test/ch_1` fallback, where every chapter played the same content, is removed. A
   Chapter opens only if the backend says it is published.
7. The backend issues the LiveKit token. The web's `/api/get-lk-token` route, its LiveKit keys,
   `NEXT_PUBLIC_LIVEKIT_URL` and the `livekit-server-sdk` dependency are removed.
8. Outside a session the product says **Lesson** (a Chapter has N Lessons), never "topic". Inside
   a session, "Topic" stays (it's the agent's sub-step of a Lesson).

## Plumbing

- `next.config.ts`: add a second rewrite, `/api/v1/:path*` → `${BACKEND_URL}/api/v1/:path*`,
  next to the `/api/auth` one.
- One server-only helper for backend calls (next to `src/lib/auth/backend.ts`):
  - It builds the URL from `backendUrl()`.
  - For per-student calls it forwards the incoming `cookie` and `x-forwarded-for` headers.
  - It validates every response with Zod.
  - It logs and returns a typed failure instead of throwing on network errors. This follows
    `lib/auth/catalog.ts`.
- Catalog reads use `next: { revalidate: 300 }`. Per-student reads (`/me/enrollments`) use
  `cache: "no-store"`.
- Browser calls (enroll, un-enroll, token) go to the same-origin `/api/v1/...` with `fetch`.
- `getInstitutions()` (`lib/auth/catalog.ts`) stays the source of Institutions everywhere,
  replacing `UNIVERSITIES`.

## Pages

### `/courses` (Finder)

- The server component fetches the Institutions and `GET /courses` (all Courses) and passes them
  to the client `Finder`.
- Filters: Institution (default: the signed-in Account's Institution; for guests, the first
  Institution) and the existing text search. Both filter on the client. The college select is
  removed.
- A course card shows the name, code, Institution and "N chapters ready"
  (`publishedChapterCount`). It has no progress. A Course with 0 published chapters still links
  to its page and shows "coming soon".

### `/c/[id]` (course page)

- `GET /courses/:id` (cached) and, for a signed-in student, `GET /me/enrollments` (no-store). 404 if
  the Course doesn't exist. `generateStaticParams` is removed.
- Three states, taken from real data (the `?state=` preview is removed):
  - **Guest:** the primary button **Enroll** leads to `/join?next=/c/{id}` (sign-up, then back
    here).
  - **Signed in, not enrolled:** the primary button **Enroll** sends `PUT /api/v1/me/enrollments/{id}`,
    then `router.refresh()`. Chapter cards are not links, and their action is the same Enroll.
  - **Enrolled:** no amber primary button. Each published Chapter card links to
    `/session/{id}/{n}`, and unpublished ones show "coming soon" and are not links. A
    secondary, outlined **Un-enroll** control opens a confirmation dialog (Radix, using the
    tokens). On confirm it sends `DELETE /api/v1/me/enrollments/{id}`, then `router.refresh()`.
- Removed: `MiniDashboard`, mastery, chapter status, resume, Continue, and the expected exam date.
- A chapter card shows the number, title, minutes and "N lessons" (`lessonCount`).

### `/home` (dashboard)

- `requireAccount`, then `GET /me/enrollments`. It shows one card per active Enrollment, newest
  first, linking to `/c/{id}`. A Course with 0 published Chapters shows "coming soon" (current
  behaviour) and is still a link, so the student can un-enroll from its page.
- **Empty state** (no Enrollments): one line plus a primary **Browse courses** button to `/courses`.
- The "add a course" ghost button stays when the list isn't empty.
- Removed: progress bars and the exam-date sort.

### `/session/[courseSlug]/[chapterId]`

- `requireAccount`, then `GET /courses/:id` and `GET /me/enrollments` in parallel.
  - The Chapter id is unknown, or the Chapter isn't `published` → `notFound()`. A stale slug → `redirect` to the Course's current slug.
  - The student isn't enrolled → `redirect` to `/c/{id}`.
- Content: lessons (`getLessons`) and slides come from the Chapter's `contentPath` (Catalog before Start, the token's pinned
  `contentPath` after), via `/api/fetch-bunny/{contentPath}{file}`. `src/lib/session/content.ts` now holds the path building.
- Token: `TokenSource.custom` sends `POST /api/v1/livekit/token` with
  `{ chapterId, language, experience }` and uses `serverUrl`, `token` and `contentPath` from the
  response. 409 `CONTENT_NOT_AVAILABLE` / `CHAPTER_NOT_PUBLISHED` show a localized message; any other non-OK response goes down
  the existing connection-error path.

### `/session/[courseSlug]/[chapterId]/done`

It becomes a plain end screen:

- The heading is "Session ended: chapter N", and the time-limit notice is shown when `?limit=1`.
- The feedback form is shown when `?room=`.
- The secondary link **Next chapter** appears only if the Chapter numbered N+1 exists and is published.
- The primary button goes **back to the course** (`/c/{id}`).
- The `?s=` preview states, days-to-exam, progress bar, struggles and penalty are removed.
- The same gating as the session page applies: unknown → 404, not enrolled → redirect.

### `/checkout/result`

The "resume" target (`resumePoint`) is removed, and the success and pending buttons go to `/home`.

### `/request`, `/request/sent`

Institutions come from `getInstitutions()`. The `/request` course list comes from `GET /courses`.

### `/settings/delete`

The "your progress and saved exam dates" line (`deletedProgress`) is removed. It has to name the
Enrollments instead.

## Files that go away

- `src/lib/data/home.ts`.
- ~~`src/lib/session/content.ts`~~ (re-created in #54 for content path building).
- `src/app/api/get-lk-token/`.
- From `src/lib/data/catalog.ts`: `COLLEGES`, `UNIVERSITIES`, `COURSES`, `ROWS`, `chaptersOf`,
  `slugOf`, `courseBySlug` and `readyCount`. What remains (the `Tone` → class map) moves to a
  presentation module.

## Messages

- Remove every key that is used only by the removed UI, in both `ar.json` and `en.json` with the same tree.
- "topics" on chapter cards becomes "lessons".
- New strings: enroll, un-enroll, the un-enroll confirmation, the empty dashboard, and "coming soon"
  where it's missing.
- No hard-coded visible text.

## Out of scope

- Quota, subscriptions, payment and progress.
- Gating `/api/fetch-bunny` by Enrollment. The Bunny pull zone is publicly readable today, so a
  proxy check would not protect the content. That is its own task.
