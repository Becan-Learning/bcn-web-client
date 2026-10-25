import "server-only";

/* حواجز البريد المزعج للنماذج — كلها على الخادم.
   المصيدة التي تُفعَّل تُجاب كالنجاح بالضبط ولا يُرسل شيء، حتى لا نُنبّه الروبوت. */

export const MIN_FILL_MS = 3_000;
export const RATE_LIMIT = 5;
export const RATE_WINDOW_MS = 10 * 60 * 1000;

/** حقل الفخ يملؤه الروبوت وحده؛ الشخص لا يراه. */
export function isHoneypotTripped(value: unknown): boolean {
  return typeof value === "string" ? value.trim() !== "" : value != null;
}

/** أسرع من 3 ثوانٍ، أو بلا وقت صالح، أو وقت من المستقبل = روبوت. */
export function isTooFast(startedAt: unknown, now: number = Date.now()): boolean {
  if (typeof startedAt !== "number" || !Number.isFinite(startedAt)) return true;
  const elapsed = now - startedAt;
  return elapsed < MIN_FILL_MS;
}

/** أول عنوان في `x-forwarded-for`. */
export function clientIp(headers: Headers): string {
  const first = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return first || "unknown";
}

/** محدِّد معدّل بنافذة منزلقة في الذاكرة.
    **لكل نسخة من الخادم**: لا يُشارَك بين النسخ ويُصفَّر عند إعادة التشغيل،
    فهو حاجز بأفضل جهد لا ضمان. */
export function createRateLimiter({
  limit = RATE_LIMIT,
  windowMs = RATE_WINDOW_MS,
}: { limit?: number; windowMs?: number } = {}) {
  const hits = new Map<string, number[]>();

  return {
    /** يسجّل محاولة؛ `false` إن تجاوز المفتاح الحدّ داخل النافذة. */
    take(key: string, now: number = Date.now()): boolean {
      for (const [k, stamps] of hits) {
        if (stamps.every((t) => now - t >= windowMs)) hits.delete(k);
      }
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      return true;
    },
  };
}
