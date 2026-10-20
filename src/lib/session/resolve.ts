import { uuidSchema, type Chapter, type ChapterLookup, type Course } from "@/lib/courses/schema";
import { previewStartable, type CatalogSource } from "@/lib/preview/rules";

/* أين يقع رابط الحصة `/session/{slug}/{chapterId}`؟ القرار نقيّ ويُختبر وحده.
   المعرّف في الرابط هو المرجع: الخادم يجيب عن الفصل ومقرره بقراءة واحدة (`GET /chapters/:chapterId`)،
   فإن غيّر المقرر رابطه (slug) نحوّل إلى الحالي، وإن لم يجب الخادم (`lookup` فارغ) فالصفحة غير موجودة.
   المقرر المؤرشف يجيب كالمنشور؛ من يحقّ له البدء يقرّره `startDecision`.
   `source` يقول من أي قراءة جاء الجواب: العامة، أو معاينة المشرف (فيها المسوّدات والنسخ). */

export type SessionTarget =
  | { kind: "found"; course: Course; chapter: Chapter; source: CatalogSource }
  | { kind: "redirect"; slug: string }
  | { kind: "not-found" };

export function resolveSessionTarget({ slug, chapterId, lookup, source = "public" }: {
  slug: string;
  chapterId: string;
  lookup: ChapterLookup | null;
  source?: CatalogSource;
}): SessionTarget {
  if (!uuidSchema.safeParse(chapterId).success || lookup === null || lookup.chapter.id !== chapterId) return { kind: "not-found" };
  const { course, chapter } = lookup;
  return course.slug === slug ? { kind: "found", course, chapter, source } : { kind: "redirect", slug: course.slug };
}

/* الفصل يفتح حصةً فقط إن كان منشورًا وله مسار محتوى حيّ. */
export function chapterIsPublished(chapter: Chapter): boolean {
  return chapter.state === "published" && chapter.contentPath !== null;
}

/* هل يُفتح هذا الفصل بحصة؟ للعموم: منشور وله مسار حيّ. لمصدر المعاينة (مشرف): يكفي أن يوجد ما يُقرأ،
   أي مسار حيّ أو نسخة صالحة، في أي حالة (مسوّدة أو قريبًا). */
export function chapterStartable(chapter: Chapter, source: CatalogSource): boolean {
  return source === "preview" ? previewStartable(chapter) : chapterIsPublished(chapter);
}

/* رابط الحصة — المنشئ الوحيد له. `pins` لرابط معاينة النسخة وحده:
   `?version={contentVersionId}&courseVersion={courseContentVersionId}`، وكلاهما اختياري. */
export function sessionHref(courseSlug: string, chapterId: string, pins: { version?: string; courseVersion?: string } = {}): string {
  const query = new URLSearchParams();
  if (pins.version) query.set("version", pins.version);
  if (pins.courseVersion) query.set("courseVersion", pins.courseVersion);
  const qs = query.toString();
  return `/session/${encodeURIComponent(courseSlug)}/${encodeURIComponent(chapterId)}${qs ? `?${qs}` : ""}`;
}
