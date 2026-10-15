# Session URLs use Chapter ids, and content paths come from the backend

Status: **implemented** in web issue #54 (2026-10-15), apart from the Admin preview below, which is W2.

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

- The session page resolves by `chapterId` through the Catalog (`findSessionTarget`, with the pure decision in
  `src/lib/session/resolve.ts`). A stale slug redirects to the current one; an unknown id is not found.
- Before the student presses Start there is no token, and the token opens a Session, so the page reads the lessons and shows the slides
  from the Catalog's `contentPath`. When the token arrives, the client adopts its **pinned** `contentPath` and, if it differs, re-reads
  both from it.
- The Bunny proxy `/api/fetch-bunny/[...filepath]` treats the path as opaque and still refuses `..`, `.`, empty segments and slashes.
