import "server-only";

import { headers } from "next/headers";
import { studentHeaders } from "./forwarded-headers";
import { readBackend } from "./read-backend";
import { chapterLookupSchema, courseSchema, coursesSchema, enrollmentsSchema, uuidSchema } from "@/lib/courses/schema";
import { resolveSessionTarget, type SessionTarget } from "@/lib/session/resolve";

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

/* يجد فصل الحصة بمعرّفه بقراءة واحدة: الخادم يعيد الفصل ومقرره (منشورًا أو مؤرشفًا). المعرّف المشوَّه لا يصل الخادم أصلًا.
   فشل الخادم أو الشبكة يُعامَل كفصل غير موجود، كما كان قبل البحث بالمعرّف. */
export async function findSessionTarget(slug: string, chapterId: string): Promise<SessionTarget> {
  if (!uuidSchema.safeParse(chapterId).success) return { kind: "not-found" };
  const result = await getChapterLookup(chapterId);
  return resolveSessionTarget({ slug, chapterId, lookup: result.ok ? result.data : null });
}
