import "server-only";
import type { GoogleFormConfig } from "./google-forms";

/* نموذج «اطلب مقررًا» في Google Forms.
   **تغيير النموذج في Google يعني تحديث هذه المعرّفات هنا.** كل الحقول مطلوبة
   في النموذج، وحقلا نوع التواصل ولغة الواجهة اختيار من متعدد: قيمتاهما حرفيًا
   كما في `CONTACT_KIND` و`INTERFACE_LANGUAGE` وإلا رفضتهما Google
   (لاحظ الحرف الكبير في "Phone"). */

export type RequestField =
  | "university"
  | "course"
  | "contact"
  | "contactKind"
  | "language";

export const REQUEST_FORM: GoogleFormConfig<RequestField> = {
  name: "request",
  url: "https://docs.google.com/forms/d/e/1FAIpQLSeMGSFAoW63TmvUilYfsX7V6jF5D8SLUOEXor-QdqVwOEBYoQ/formResponse",
  entries: {
    university: "entry.132584660",
    course: "entry.2026721195",
    contact: "entry.739430397",
    contactKind: "entry.1510059797",
    language: "entry.1256442018",
  },
};

/** قناة التواصل ← خيار النموذج (`byEmail` يعني البريد). */
export const CONTACT_KIND = { email: "email", phone: "Phone" } as const;
