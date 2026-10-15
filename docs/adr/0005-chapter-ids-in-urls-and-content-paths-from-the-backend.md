# Session URLs use Chapter ids, and content paths come from the backend

Chapters now have stable UUID ids, and their number is an editable position (backend ADR-0005). So
session URLs become `/session/{courseSlug}/{chapterId}`. An id-based URL can't silently land on a
different Chapter after a renumber, including the `/done` page of a Session that was running when the
Chapter was renumbered. Pages still show "Chapter N". The web stops building `ch_{n}` Bunny paths: the
backend returns each Chapter's live `content_path`, and the web reads `lessons_list.json` and
`slides.pdf` from it. The token request sends `chapterId`.

For Admins, the web also shows Draft Courses and unpublished Chapters, marked as such, with a start
button that needs no Enrollment. That data comes from an uncached Admin-only backend path, never
from the publicly cached Catalog endpoints.
