import { uuidSchema, type Chapter, type ChapterLookup, type Course } from "@/lib/courses/schema";

/* أين يقع رابط الحصة `/session/{slug}/{chapterId}`؟ القرار نقيّ ويُختبر وحده.
   المعرّف في الرابط هو المرجع: الخادم يجيب عن الفصل ومقرره بقراءة واحدة (`GET /chapters/:chapterId`)،
   فإن غيّر المقرر رابطه (slug) نحوّل إلى الحالي، وإن لم يجب الخادم (`lookup` فارغ) فالصفحة غير موجودة.
   المقرر المؤرشف يجيب كالمنشور؛ من يحقّ له البدء يقرّره `startDecision`. */

export type SessionTarget =
  | { kind: "found"; course: Course; chapter: Chapter }
  | { kind: "redirect"; slug: string }
  | { kind: "not-found" };

export function resolveSessionTarget({ slug, chapterId, lookup }: {
  slug: string;
  chapterId: string;
  lookup: ChapterLookup | null;
}): SessionTarget {
  if (!uuidSchema.safeParse(chapterId).success || lookup === null || lookup.chapter.id !== chapterId) return { kind: "not-found" };
  const { course, chapter } = lookup;
  return course.slug === slug ? { kind: "found", course, chapter } : { kind: "redirect", slug: course.slug };
}

/* الفصل يفتح حصةً فقط إن كان منشورًا وله مسار محتوى حيّ. */
export function chapterIsPublished(chapter: Chapter): boolean {
  return chapter.state === "published" && chapter.contentPath !== null;
}

/* رابط الحصة وملخّصها — المنشئ الوحيد لهما. */
export function sessionHref(courseSlug: string, chapterId: string, done = false): string {
  return `/session/${encodeURIComponent(courseSlug)}/${encodeURIComponent(chapterId)}${done ? "/done" : ""}`;
}
