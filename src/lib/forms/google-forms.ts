import "server-only";

/* إرسال نماذج الموقع إلى Google Forms من الخادم وحده.
   المسار يرسل إلى نقطة `formResponse` العامة؛ العميل لا يكلّم Google أبدًا.
   معرّفات النموذج ليست أسرارًا لكنها تبقى هنا خارج حزمة العميل. */

export const SUBMIT_TIMEOUT_MS = 8_000;

export type GoogleFormConfig<Field extends string> = {
  /** اسم يظهر في السجلات فقط. */
  name: string;
  /** عنوان `…/formResponse` للنموذج. */
  url: string;
  /** حقل الإدخال في الكود ← معرّف الإدخال في Google (`entry.NNN`). */
  entries: Record<Field, string>;
};

/** يرسل القيم؛ `true` فقط عند استجابة 2xx. لا يسجّل أي قيمة من الطالب. */
export async function submitToGoogleForm<Field extends string>(
  form: GoogleFormConfig<Field>,
  values: Record<Field, string>,
): Promise<boolean> {
  const body = new URLSearchParams();
  for (const field of Object.keys(form.entries) as Field[]) {
    body.set(form.entries[field], values[field]);
  }

  try {
    const res = await fetch(form.url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
    });
    if (res.ok) return true;
    console.error("[forms] Google rejected the submission", {
      form: form.name,
      status: res.status,
    });
    return false;
  } catch (error) {
    console.error("[forms] Google submission failed", {
      form: form.name,
      reason: error instanceof Error ? error.name : "unknown",
    });
    return false;
  }
}
