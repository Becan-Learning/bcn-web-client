import "server-only";

import { headers } from "next/headers";
import { studentHeaders } from "./forwarded-headers";
import { readBackend } from "./read-backend";
import { courseSchema, coursesSchema, enrollmentsSchema, uuidSchema, type Course } from "@/lib/courses/schema";
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

/* يجد فصل الحصة بمعرّفه. لا مسار في الخادم يبحث بمعرّف الفصل، فنقرأ مقرر الرابط أولًا (الحالة العادية: طلب واحد)،
   وإن لم يحمل الفصل أو لم يعد موجودًا بهذا الـ slug نقرأ بقية الكتالوج (مخزَّن خمس دقائق) لنجده ونحوّل إلى الرابط الحالي. */
export async function findSessionTarget(slug: string, chapterId: string): Promise<SessionTarget> {
  if (!uuidSchema.safeParse(chapterId).success) return { kind: "not-found" };
  const direct = await getCourse(slug);
  const known: Course[] = direct.ok ? [direct.data] : [];
  const first = resolveSessionTarget({ slug, chapterId, courses: known });
  if (first.kind !== "not-found" || (!direct.ok && !(direct.kind === "http" && direct.status === 404))) return first;

  const list = await getCourses();
  if (!list.ok) return first;
  const others = await Promise.all(list.data.filter((c) => c.slug !== slug).map((c) => getCourse(c.slug)));
  return resolveSessionTarget({
    slug,
    chapterId,
    courses: [...known, ...others.flatMap((r) => (r.ok ? [r.data] : []))],
  });
}
