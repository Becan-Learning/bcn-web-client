import { uuidSchema, type Chapter, type Course } from "@/lib/courses/schema";

/* أين يقع رابط الحصة `/session/{slug}/{chapterId}`؟ القرار نقيّ ويُختبر وحده.
   المعرّف في الرابط هو المرجع: إن غيّر المقرر رابطه (slug) نحوّل إلى الحالي،
   وإن لم يوجد فصل بهذا المعرّف في الكتالوج فالصفحة غير موجودة. */

export type SessionTarget =
  | { kind: "found"; course: Course; chapter: Chapter }
  | { kind: "redirect"; slug: string }
  | { kind: "not-found" };

export function resolveSessionTarget({ slug, chapterId, courses }: {
  slug: string;
  chapterId: string;
  courses: readonly Course[];
}): SessionTarget {
  if (!uuidSchema.safeParse(chapterId).success) return { kind: "not-found" };
  for (const course of courses) {
    const chapter = course.chapters.find((c) => c.id === chapterId);
    if (!chapter) continue;
    return course.slug === slug ? { kind: "found", course, chapter } : { kind: "redirect", slug: course.slug };
  }
  return { kind: "not-found" };
}

/* الفصل يفتح حصةً فقط إن كان منشورًا وله مسار محتوى حيّ. */
export function chapterIsPublished(chapter: Chapter): boolean {
  return chapter.state === "published" && chapter.contentPath !== null;
}

/* رابط الحصة وملخّصها — المنشئ الوحيد لهما. */
export function sessionHref(courseSlug: string, chapterId: string, done = false): string {
  return `/session/${encodeURIComponent(courseSlug)}/${encodeURIComponent(chapterId)}${done ? "/done" : ""}`;
}
