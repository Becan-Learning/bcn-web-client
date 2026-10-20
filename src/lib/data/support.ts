import type { Localized } from "@/i18n/localized";

/* بيانات الدعم — مصدر واحد لصفحة التواصل ولزرّ واتساب الطافي
   ولزرّ الدعم في شريط الجلسة. */

export const WHATSAPP = "966501473370";
export const WHATSAPP_SHOWN = "+966 50 147 3370";

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
