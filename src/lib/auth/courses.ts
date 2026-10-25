import "server-only";

import { headers } from "next/headers";
import { studentHeaders } from "./forwarded-headers";
import { readBackend } from "./read-backend";
import { courseSchema, coursesSchema, enrollmentsSchema } from "@/lib/courses/schema";

export function getCourses() {
  return readBackend("/courses", coursesSchema, { next: { revalidate: 300 } });
}

export function getCourse(id: string) {
  return readBackend(`/courses/${encodeURIComponent(id)}`, courseSchema, { next: { revalidate: 300 } });
}

export async function getEnrollments() {
  /* قراءة الطلب خارج التقاط أخطاء الشبكة كي تبقى إشارات الرسم الديناميكي سليمة. */
  const forwarded = studentHeaders(await headers());
  return readBackend("/me/enrollments", enrollmentsSchema, { headers: forwarded, cache: "no-store" });
}
