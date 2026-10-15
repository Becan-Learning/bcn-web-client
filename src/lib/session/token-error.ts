import { backendErrorSchema } from "@/lib/courses/schema";

/* لماذا رُفض رمز الحصة؟
   - `used-up`: بلغ الطالب حدّ الحصص أو الدقائق (403) — ترجع الصفحة لقراءة الحدود.
   - `content-unavailable`: لا نسخة محتوى حيّة للفصل أو مقرره (409 CONTENT_NOT_AVAILABLE).
   - `not-published`: الفصل أو مقرره لم يعد منشورًا (409 CHAPTER_NOT_PUBLISHED).
   - `version-forbidden`: ثبّت الطلب نسخة وليس الحساب مشرفًا بتحقق بخطوتين (403 VERSION_PIN_FORBIDDEN).
   - `version-not-found`: النسخة المثبَّتة ليست لهذا الفصل أو مقرره (404 CONTENT_VERSION_NOT_FOUND).
   - `version-invalid`: النسخة المثبَّتة غير صالحة (409 VERSION_INVALID).
   - غير ذلك: فشل اتصال عام. */
export type TokenOutcome =
  | "used-up" | "content-unavailable" | "not-published" | "version-forbidden" | "version-not-found" | "version-invalid" | "connection-failed";

export function tokenErrorOutcome(status: number, body: unknown): TokenOutcome {
  const parsed = backendErrorSchema.safeParse(body);
  const code = parsed.success ? parsed.data.error.code : undefined;
  if (status === 403 && (code === "SESSIONS_USED_UP" || code === "MINUTES_USED_UP")) return "used-up";
  if (status === 409 && code === "CONTENT_NOT_AVAILABLE") return "content-unavailable";
  if (status === 409 && code === "CHAPTER_NOT_PUBLISHED") return "not-published";
  if (status === 403 && code === "VERSION_PIN_FORBIDDEN") return "version-forbidden";
  if (status === 404 && code === "CONTENT_VERSION_NOT_FOUND") return "version-not-found";
  if (status === 409 && code === "VERSION_INVALID") return "version-invalid";
  return "connection-failed";
}

export class AllowanceUsedUpError extends Error {}

export type ChapterUnavailableReason = Exclude<TokenOutcome, "used-up" | "connection-failed">;

/* الفصل لا يفتح حصةً الآن؛ إعادة المحاولة لا تفيد. */
export class ChapterUnavailableError extends Error {
  constructor(readonly reason: ChapterUnavailableReason) {
    super(reason);
  }
}
