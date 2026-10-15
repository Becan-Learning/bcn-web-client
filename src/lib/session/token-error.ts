import { backendErrorSchema } from "@/lib/courses/schema";

/* لماذا رُفض رمز الحصة؟
   - `used-up`: بلغ الطالب حدّ الحصص أو الدقائق (403) — ترجع الصفحة لقراءة الحدود.
   - `content-unavailable`: لا نسخة محتوى حيّة للفصل أو مقرره (409 CONTENT_NOT_AVAILABLE).
   - `not-published`: الفصل أو مقرره لم يعد منشورًا (409 CHAPTER_NOT_PUBLISHED).
   - غير ذلك: فشل اتصال عام. */
export type TokenOutcome = "used-up" | "content-unavailable" | "not-published" | "connection-failed";

export function tokenErrorOutcome(status: number, body: unknown): TokenOutcome {
  const parsed = backendErrorSchema.safeParse(body);
  const code = parsed.success ? parsed.data.error.code : undefined;
  if (status === 403 && (code === "SESSIONS_USED_UP" || code === "MINUTES_USED_UP")) return "used-up";
  if (status === 409 && code === "CONTENT_NOT_AVAILABLE") return "content-unavailable";
  if (status === 409 && code === "CHAPTER_NOT_PUBLISHED") return "not-published";
  return "connection-failed";
}

export class AllowanceUsedUpError extends Error {}

/* الفصل لا يفتح حصةً الآن؛ إعادة المحاولة لا تفيد. */
export class ChapterUnavailableError extends Error {
  constructor(readonly reason: "content-unavailable" | "not-published") {
    super(reason);
  }
}
