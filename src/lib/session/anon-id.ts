/* معرّف مجهول ثابت لكل متصفّح — بديل مؤقّت عن معرّف الحساب حتى يُركَّب
   Clerk. بدونه كان كل الطلاب «demo-user» فتتصادم غرفهم في الدقيقة نفسها. */

const KEY = "becan:uid";

export function getAnonId(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    /* تخزين محجوب (نافذة خاصة): معرّف لهذه الجلسة وحدها */
    return crypto.randomUUID();
  }
}
