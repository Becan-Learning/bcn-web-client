/* تقييم الحصة — الرابط الذي تنتهي إليه الحصة، وقراءة معاملاته. القرار نقيّ ويُختبر وحده.
   بعد الحصة يعود الطالب إلى صفحة المقرر `/c/{slug}` وفيها:
   - `rate={room}`: اسم غرفة LiveKit للحصة المنتهية، فتظهر بطاقة التقييم (مرة واحدة).
   - `limit=1`: انتهت الحصة ببلوغ الوقت المسموح لها.
   كلاهما يُحذف من الرابط عند إغلاق البطاقة أو إرسال التقييم. */

export const RATE_PARAM = "rate";
export const LIMIT_PARAM = "limit";

export function courseAfterSessionHref(courseSlug: string, { room, limit }: { room: string | null; limit: boolean }): string {
  const query = new URLSearchParams();
  if (room) query.set(RATE_PARAM, room);
  if (limit) query.set(LIMIT_PARAM, "1");
  const qs = query.toString();
  return `/c/${encodeURIComponent(courseSlug)}${qs ? `?${qs}` : ""}`;
}

type Param = string | string[] | undefined;

/* القيمة الأولى إن تكرر المعامل؛ الفارغ كالغائب. */
export function readRateRoom(value: Param): string | null {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" && first.trim() ? first : null;
}

export function readLimitReached(value: Param): boolean {
  return (Array.isArray(value) ? value[0] : value) === "1";
}
