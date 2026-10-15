# Session URLs use Chapter ids, and content paths come from the backend

Status: **implemented** in web issue #54 (2026-10-15) and, for the Admin preview below, in web issue #55 (W2, 2026-10-15). See
[Implementation notes (#55)](#implementation-notes-55).

Chapters now have stable UUID ids, and their number is an editable position (backend ADR-0005). So
session URLs become `/session/{courseSlug}/{chapterId}`. An id-based URL can't silently land on a
different Chapter after a renumber, including the `/done` page of a Session that was running when the
Chapter was renumbered. Pages still show "Chapter N". The web stops building `ch_{n}` Bunny paths: the
backend returns each Chapter's live `content_path`, and the web reads `lessons_list.json` and
`slides.pdf` from it. The token request sends `chapterId`.

For Admins, the web also shows Draft Courses and unpublished Chapters, marked as such, with a start
button that needs no Enrollment. That data comes from an uncached Admin-only backend path, never
from the publicly cached Catalog endpoints.

## Implementation notes (#54)

- The session page resolves by `chapterId` (`findSessionTarget`, with the pure decision in `src/lib/session/resolve.ts`). A stale slug redirects
  to the current one; an unknown id is not found. W1 first scanned the Catalog for this; since W3 (#57) it is one read of the backend's
  `GET /chapters/:chapterId`, which also answers for Archived Courses.
- Before the student presses Start there is no token, and the token opens a Session, so the page reads the lessons and shows the slides
  from the Catalog's `contentPath`. When the token arrives, the client adopts its **pinned** `contentPath` and, if it differs, re-reads
  both from it.
- The Bunny proxy `/api/fetch-bunny/[...filepath]` treats the path as opaque and still refuses `..`, `.`, empty segments and slashes.

## Implementation notes (#55)

The Admin preview is implemented on the backend's B4 contract (`bcn-backend-main#47`), spelled out in
[backend-courses-handoff.md](../backend-courses-handoff.md) §0 "Admin preview".

- **Who.** The viewer is "unlimited" when `/me/allowance.unlimited` is true (an Admin with two-factor). The pages read the allowance first
  (`readsPreview`, `src/lib/preview/rules.ts`) and pick the read. A guest, a Student, or a failed allowance read takes the public path.
- **Two read paths that never mix.** The public reads stay `GET /courses`, `/courses/:slug` and `/chapters/:chapterId` with
  `next: { revalidate: 300 }` and no student headers. The preview reads are `GET /admin/preview/courses`, `…/courses/:slug` and `…/chapters/:chapterId`,
  made only by `getPreviewCourses`, `getPreviewCourse` and `getPreviewChapterLookup` in `src/lib/auth/courses.ts`: `cache: "no-store"`,
  the forwarded cookie, never `next.revalidate`. A preview answer is `private, no-store` and belongs to one Admin, so it cannot reach a shared cache.
  Public schemas still reject `draft`, so a leak into the public path would fail to parse rather than render.
- **Fallback.** A preview read that answers 401 or 403 (two-factor turned off after the allowance was read) falls back to the public read
  (`fallsBackToPublic`). Any other failure stays a failure, as it is on the public path.
- **Pages.** `/courses`, `/c/{slug}`, `/session/{slug}/{chapterId}` and its `/done` page use the preview source for an unlimited viewer.
  A Draft Course shows a dashed «مسوّدة» / Draft label in the catalog card and on the Course page; a Draft Chapter shows it on its card.
  An Admin starts any Chapter with something to read (a live path or a valid version) without an Enrollment (`startDecision` allows it as before).
  A Chapter with no live version opens on its newest version, and a Course with no live content version on its newest, through the preview link.
- **The `/done` page** reads the public Catalog first, as before, and asks the allowance only if the Chapter is not found there; an unlimited
  Account then reads the preview. So a Student's `/done` path is unchanged.
- **Version preview link.** `/session/{courseSlug}/{chapterId}?version={contentVersionId}&courseVersion={courseContentVersionId}`, both optional.
  With the preview source, `version` must be one of the Chapter's `versions` and `courseVersion` one of the Course's `versions`; the page then reads the
  lessons and slides from that version's `contentPath`, sends `contentVersionId` and `courseContentVersionId` in the token request, and shows
  "Preview: version N" (and "Course content: version M"), each saying whether it is the live version. An unknown or malformed id, a Chapter version id in
  the Course slot, or a Chapter with nothing to read, shows a clear error screen (`Preview.error.*`) with a way back, never a crash and never a token request.
- **A non-Admin opening such a link: the params are ignored.** The page behaves as it does without them: the live content, no marker, no error,
  and no pin is ever sent (the page passes none to the client). We chose this over not-found so the link does not reveal whether preview exists, and
  because the backend refuses the pin anyway (403 `VERSION_PIN_FORBIDDEN`, which also has a localized message in case it does arrive).
- **Token errors.** 403 `VERSION_PIN_FORBIDDEN`, 404 `CONTENT_VERSION_NOT_FOUND` and 409 `VERSION_INVALID` show the same localized stop screen as
  `CONTENT_NOT_AVAILABLE` (`Session.unavailable.*`), not "connection lost". The client adopts the pinned `contentPath` from the response as before.

