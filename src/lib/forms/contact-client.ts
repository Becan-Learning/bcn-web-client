import type { ContactTopic } from "./contact-validation";

/* إرسال نموذج التواصل من المتصفح إلى مسار الويب نفسه، لا إلى Google. */

export type ContactPayload = {
  topic: ContactTopic;
  contact: string;
  message: string;
  locale: "ar" | "en";
  /** فخ الروبوتات: يبقى فارغًا عند الأشخاص. */
  website: string;
  /** لحظة عرض النموذج (ms). */
  startedAt: number;
};

export type ContactResult = "sent" | "rate-limited" | "failed";

export async function sendContact(payload: ContactPayload): Promise<ContactResult> {
  try {
    const res = await fetch("/api/forms/contact", {
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
