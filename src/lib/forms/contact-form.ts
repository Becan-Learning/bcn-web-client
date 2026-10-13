import "server-only";
import type { GoogleFormConfig } from "./google-forms";

/* نموذج «تواصل معنا» في Google Forms.
   **تغيير النموذج في Google يعني تحديث هذه المعرّفات هنا.** كل الحقول مطلوبة
   في النموذج، وحقل اللغة اختيار من متعدد: قيمته "Arabic" أو "English" حرفيًا
   وإلا رفضته Google. */

export type ContactField = "topic" | "contact" | "message" | "language";

export const CONTACT_FORM: GoogleFormConfig<ContactField> = {
  name: "contact",
  url: "https://docs.google.com/forms/d/e/1FAIpQLSfhXJdbMIef3r6LzlzSXe9ZuE__nLCA4_5fA-Amk6zVHv5_3Q/formResponse",
  entries: {
    topic: "entry.941142573",
    contact: "entry.2035918014",
    message: "entry.1876293115",
    language: "entry.1748937113",
  },
};

/** لغة الواجهة ← خيار النموذج. */
export const INTERFACE_LANGUAGE = { ar: "Arabic", en: "English" } as const;
