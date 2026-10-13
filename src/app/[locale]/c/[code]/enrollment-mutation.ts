import { enrollmentSchema, backendErrorSchema } from "@/lib/courses/schema";

export async function mutateEnrollment(courseId: string, method: "PUT" | "DELETE", refresh: () => void) {
  const response = await fetch(`/api/v1/me/enrollments/${encodeURIComponent(courseId)}`, { method, cache: "no-store" });
  if (!response.ok) {
    const parsed = backendErrorSchema.safeParse(await response.json());
    /* قد يُحجز آخر مقرر بعد قراءة الصفحة؛ نعيد قراءة الحدود والتسجيلات. */
    if (method === "PUT" && response.status === 409 && parsed.success && parsed.data.error.code === "ENROLLMENT_LIMIT_REACHED") {
      refresh();
      return;
    }
    console.error("Enrollment request failed", { status: response.status, code: parsed.success ? parsed.data.error.code : undefined });
    throw new Error("Enrollment request failed");
  }
  if (method === "PUT") {
    if (response.status !== 200 && response.status !== 201) throw new Error("Invalid enroll response");
    const enrollment = enrollmentSchema.parse(await response.json());
    if (enrollment.course.id !== courseId) throw new Error("Invalid enrollment course");
  } else if (response.status !== 204) {
    throw new Error("Invalid un-enroll response");
  }
  refresh();
}
