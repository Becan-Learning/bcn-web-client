/* إرسال نموذج «اطلب مقررًا» من المتصفح إلى مسار الويب نفسه، لا إلى Google. */

export type RequestPayload = {
  /** معرّف المؤسسة، أو `other` مع `universityOther`. */
  university: string;
  universityOther: string;
  course: string;
  contact: string;
  byEmail: boolean;
  locale: "ar" | "en";
  /** فخ الروبوتات: يبقى فارغًا عند الأشخاص. */
  website: string;
  /** لحظة عرض النموذج (ms). */
  startedAt: number;
};

export type RequestResult = "sent" | "rate-limited" | "failed";

export async function sendRequest(payload: RequestPayload): Promise<RequestResult> {
  try {
    const res = await fetch("/api/forms/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return "sent";
    return res.status === 429 ? "rate-limited" : "failed";
  } catch {
    return "failed";
  }
}
