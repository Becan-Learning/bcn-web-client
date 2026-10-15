import type { Allowance } from "@/lib/allowance/schema";
import { uuidSchema, type Chapter, type ContentVersion, type Course } from "@/lib/courses/schema";

/* معاينة المشرف (ADR 0005) — القرارات النقيّة وحدها، تُختبر بلا شبكة.

   «المصدر» هو أي قراءة تغذّي الصفحة:
   - "public": قراءات الكتالوج العامة المخزَّنة مؤقتًا (5 دقائق)، لكل الناس.
   - "preview": قراءات المشرف `GET /api/v1/admin/preview/*`: بلا تخزين، بكوكي الحساب، فيها المسوّدات والنسخ.
   لا يختلط المصدران: ردّ المعاينة لا يدخل ذاكرة مشتركة أبدًا (انظر `courses.ts`). */

export type CatalogSource = "public" | "preview";

/* من يقرأ المعاينة؟ الحساب غير المحدود وحده (`/me/allowance.unlimited`: مشرف بتحقق بخطوتين).
   غياب الحدود (فشل القراءة أو ضيف) = المسار العام. الخادم يرفض غير المشرف على كل حال (401/403). */
export function readsPreview(allowance: Pick<Allowance, "unlimited"> | null): boolean {
  return allowance?.unlimited === true;
}

/* فشل قراءة المعاينة بـ401/403 (مثلًا أُطفئ التحقق بخطوتين بعد قراءة الحدود) يعود إلى المسار العام.
   أي فشل آخر (شبكة، 404، 429، 5xx) لا يعود: يُعامَل كفشل القراءة العامة. */
export function fallsBackToPublic(result: { ok: boolean; kind?: string; status?: number }): boolean {
  return !result.ok && result.kind === "http" && (result.status === 401 || result.status === 403);
}

/* يبدأ المشرف الفصل إن وُجد ما يُقرأ: مسار حيّ، أو نسخة صالحة تُثبَّت.
   (الفصل المنشور للعموم يبقى بـ`chapterIsPublished`.) */
export function previewStartable(chapter: Pick<Chapter, "contentPath" | "versions">): boolean {
  return chapter.contentPath !== null || (chapter.versions?.length ?? 0) > 0;
}

export type VersionPins = { contentVersionId?: string; courseContentVersionId?: string };

/* ما يحمله رابط «ابدأ» للمشرف من الكتالوج: الفصل الذي لا نسخة حيّة له يُفتح على أحدث نسخة،
   وكذلك محتوى المقرر إن لم يكن له حيّ، كي لا يرفض الخادم البدء بـCONTENT_NOT_AVAILABLE. */
export function previewStartPins(course: Pick<Course, "versions">, chapter: Pick<Chapter, "contentPath" | "versions">): { version?: string; courseVersion?: string } {
  const version = chapter.contentPath === null ? chapter.versions?.[0]?.id : undefined;
  const courseVersions = course.versions ?? [];
  const courseVersion = courseVersions.length > 0 && !courseVersions.some((v) => v.live) ? courseVersions[0].id : undefined;
  return { ...(version ? { version } : {}), ...(courseVersion ? { courseVersion } : {}) };
}

export type VersionMarker = { number: number; live: boolean };
export type PreviewNotice = {
  /* الفصل أو مقرره مسوّدة. */
  draft: boolean;
  chapterVersion: VersionMarker | null;
  courseVersion: VersionMarker | null;
};

export type SessionContent =
  | { kind: "ready"; contentPath: string; pins: VersionPins; notice: PreviewNotice | null }
  | { kind: "error"; reason: "unknown-version" | "unknown-course-version" | "no-content" };

const first = (value: string | string[] | undefined): string | null => {
  const text = Array.isArray(value) ? value[0] : value;
  return typeof text === "string" && text !== "" ? text : null;
};

/* معاملا رابط المعاينة `?version=&courseVersion=`. الغائب أو الفارغ = لا تثبيت. */
export function versionParams(search: Record<string, string | string[] | undefined>): { version: string | null; courseVersion: string | null } {
  return { version: first(search.version), courseVersion: first(search.courseVersion) };
}

const markerOf = (version: ContentVersion | null): VersionMarker | null => version ? { number: version.version, live: version.live } : null;

/* ماذا تعرض صفحة الحصة قبل «ابدأ»، وماذا يرسل الرمز؟
   - المصدر العام: المعاملان يُتجاهلان كليًا (لا تثبيت لغير المشرف أبدًا) والمسار هو الحيّ.
   - مصدر المعاينة: `version` يجب أن يكون من `versions` الفصل، و`courseVersion` من `versions` المقرر،
     وإلا حالة خطأ واضحة. الدروس والشرائح من `contentPath` النسخة المختارة، وإلا من الحيّ. */
export function resolveSessionContent({ source, course, chapter, version, courseVersion }: {
  source: CatalogSource;
  course: Course;
  chapter: Chapter;
  version: string | null;
  courseVersion: string | null;
}): SessionContent {
  if (source === "public") {
    return chapter.contentPath === null
      ? { kind: "error", reason: "no-content" }
      : { kind: "ready", contentPath: chapter.contentPath, pins: {}, notice: null };
  }

  const chosen = version === null ? null : (uuidSchema.safeParse(version).success ? chapter.versions?.find((v) => v.id === version) ?? null : null);
  if (version !== null && chosen === null) return { kind: "error", reason: "unknown-version" };
  const chosenCourse = courseVersion === null ? null : (uuidSchema.safeParse(courseVersion).success ? course.versions?.find((v) => v.id === courseVersion) ?? null : null);
  if (courseVersion !== null && chosenCourse === null) return { kind: "error", reason: "unknown-course-version" };

  const contentPath = chosen?.contentPath ?? chapter.contentPath;
  if (contentPath === null) return { kind: "error", reason: "no-content" };

  const draft = chapter.state === "draft" || course.status === "draft";
  const pins: VersionPins = {
    ...(chosen ? { contentVersionId: chosen.id } : {}),
    ...(chosenCourse ? { courseContentVersionId: chosenCourse.id } : {}),
  };
  return {
    kind: "ready",
    contentPath,
    pins,
    notice: draft || chosen || chosenCourse ? { draft, chapterVersion: markerOf(chosen), courseVersion: markerOf(chosenCourse) } : null,
  };
}
