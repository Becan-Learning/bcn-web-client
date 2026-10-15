import "server-only";

import { headers } from "next/headers";
import type { z } from "zod";
import { studentHeaders } from "./forwarded-headers";
import { readBackend } from "./read-backend";
import {
  chapterLookupSchema, courseSchema, coursesSchema, enrollmentsSchema, previewChapterLookupSchema, previewCourseSchema, previewCoursesSchema, uuidSchema,
} from "@/lib/courses/schema";
import { resolveSessionTarget, type SessionTarget } from "@/lib/session/resolve";
import { fallsBackToPublic } from "@/lib/preview/rules";

export function getCourses() {
  return readBackend("/courses", coursesSchema, { next: { revalidate: 300 } });
}

export function getCourse(slug: string) {
  return readBackend(`/courses/${encodeURIComponent(slug)}`, courseSchema, { next: { revalidate: 300 } });
}

export async function getEnrollments() {
  /* قراءة الطلب خارج التقاط أخطاء الشبكة كي تبقى إشارات الرسم الديناميكي سليمة. */
  const forwarded = studentHeaders(await headers());
  return readBackend("/me/enrollments", enrollmentsSchema, { headers: forwarded, cache: "no-store" });
}

export function getChapterLookup(chapterId: string) {
  return readBackend(`/chapters/${encodeURIComponent(chapterId)}`, chapterLookupSchema, { next: { revalidate: 300 } });
}

/* ————— قراءات معاينة المشرف (ADR 0005) —————
   `GET /api/v1/admin/preview/*`: بلا تخزين مؤقت أبدًا (`cache: "no-store"`، لا `next.revalidate`) وبكوكي الحساب،
   والخادم يردّ `Cache-Control: private, no-store`. ردّ المعاينة يخصّ مشرفًا واحدًا، فلا يدخل ذاكرة مشتركة.
   هذه الدوال الوحيدة التي تقرأ هذه المسارات؛ المسار العام أعلاه لا يرسل كوكي ولا يتجاوز الذاكرة المشتركة. */
async function readPreview<T>(path: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>) {
  /* قراءة الطلب خارج التقاط أخطاء الشبكة كي تبقى إشارات الرسم الديناميكي سليمة. */
  const forwarded = studentHeaders(await headers());
  return readBackend(`/admin/preview${path}`, schema, { headers: forwarded, cache: "no-store" });
}

export function getPreviewCourses() {
  return readPreview("/courses", previewCoursesSchema);
}

export function getPreviewCourse(slug: string) {
  return readPreview(`/courses/${encodeURIComponent(slug)}`, previewCourseSchema);
}

export function getPreviewChapterLookup(chapterId: string) {
  return readPreview(`/chapters/${encodeURIComponent(chapterId)}`, previewChapterLookupSchema);
}

/* الكتالوج للمشاهد: المشرف (حساب غير محدود) يقرأ المعاينة، وغيره المسار العام المخزَّن.
   فشل المعاينة بـ401/403 يعود إلى العام؛ وأي فشل آخر يبقى فشلًا كالقراءة العامة. */
export async function getCoursesFor(preview: boolean) {
  if (preview) {
    const result = await getPreviewCourses();
    if (!fallsBackToPublic(result)) return { source: "preview" as const, result };
  }
  return { source: "public" as const, result: await getCourses() };
}

export async function getCourseFor(slug: string, preview: boolean) {
  if (preview) {
    const result = await getPreviewCourse(slug);
    if (!fallsBackToPublic(result)) return { source: "preview" as const, result };
  }
  return { source: "public" as const, result: await getCourse(slug) };
}

/* يجد فصل الحصة بمعرّفه بقراءة واحدة: الخادم يعيد الفصل ومقرره (منشورًا أو مؤرشفًا). المعرّف المشوَّه لا يصل الخادم أصلًا.
   فشل الخادم أو الشبكة يُعامَل كفصل غير موجود، كما كان قبل البحث بالمعرّف.
   `preview` (حساب غير محدود): قراءة معاينة المشرف، فيظهر الفصل المسوّدة وفيه نسخه؛ 401/403 يعود إلى العام. */
export async function findSessionTarget(slug: string, chapterId: string, { preview = false }: { preview?: boolean } = {}): Promise<SessionTarget> {
  if (!uuidSchema.safeParse(chapterId).success) return { kind: "not-found" };
  if (preview) {
    const result = await getPreviewChapterLookup(chapterId);
    if (!fallsBackToPublic(result)) return resolveSessionTarget({ slug, chapterId, lookup: result.ok ? result.data : null, source: "preview" });
  }
  const result = await getChapterLookup(chapterId);
  return resolveSessionTarget({ slug, chapterId, lookup: result.ok ? result.data : null, source: "public" });
}
