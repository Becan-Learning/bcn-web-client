import type { Localized } from "@/i18n/localized";

/* بيانات الدعم — مصدر واحد لصفحة التواصل ولزرّ واتساب الطافي.

   ⚠️ **رقم عرض** — يُستبدل بالرقم الحقيقي قبل الإطلاق، وإلا فتح
   الزرّ محادثة مع مجهول. وهو الآن في **كل صفحة** لا في صفحة التواصل
   وحدها، فأثر الخطأ صار أوسع. مسجَّل في docs/STATE.md. */

export const WHATSAPP = "966500000000";
export const WHATSAPP_SHOWN = "+966 50 000 0000";

/** رابط المحادثة — ورسالة أولى تختصر على الدعم سؤال «من أين تكتب؟» */
export const whatsappHref = (context?: string) =>
  `https://wa.me/${WHATSAPP}` +
  (context ? `?text=${encodeURIComponent(context)}` : "");

/* أوقات الرد — صريحة ولا وعد بـ«24/7»: الوعد الذي لا نفي به يكلّف
   ثقةً أكثر مما يكسبه. */
export const HOURS: {
  id: string;
  channel: Localized;
  when: Localized;
  reply: Localized;
}[] = [
  {
    id: "whatsapp",
    channel: { ar: "واتساب", en: "WhatsApp" },
    when: {
      ar: "كل يوم 10 صباحًا – 10 مساءً",
      en: "Every day, 10 AM – 10 PM",
    },
    reply: { ar: "خلال ساعتين", en: "Within two hours" },
  },
  {
    id: "email",
    channel: { ar: "البريد والنموذج", en: "Email and contact form" },
    when: { ar: "أيام العمل", en: "Business days" },
    reply: { ar: "خلال يوم عمل واحد", en: "Within one business day" },
  },
];
