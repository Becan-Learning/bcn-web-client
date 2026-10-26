import type { Localized } from "@/i18n/localized";

/* وسائل الدفع المعروضة في الدفع التجريبي — لا أكثر.

   لا اشتراك ولا فواتير هنا: ما يراه الطالب من باقته يأتي من الخادم
   (`/me/allowance` و`/plans`)، وحتى تتوفّر بوابة دفع لا يُحصَّل شيء ولا
   توجد فواتير. السعر لا يُكتب في هذا الملف، والصافي والضريبة من
   `breakdown` في `src/lib/plans/view.ts` وحدها.

   مدى أولًا: كثير من الطلاب بلا بطاقة ائتمانية، وغيابها يقطع شريحة
   كبيرة من السوق. الترتيب في المصفوفة هو ترتيب العرض. */

export type MethodId = "mada" | "applepay" | "card";

export type Method = {
  id: MethodId;
  label: Localized;
  /** يُكتب بعد الاسم — ما يحتاجه الطالب ليقرّر، لا وصف تسويقي */
  note: Localized;
  /** الاسم اللاتيني يُلَفّ بـ dir="ltr" في الواجهة */
  latin?: Localized;
};

export const METHODS: Method[] = [
  { id: "mada", label: { ar: "مدى", en: "mada" }, note: { ar: "بطاقة بنكك المحلية", en: "Your local bank card" } },
  {
    id: "applepay",
    label: { ar: "Apple Pay", en: "Apple Pay" },
    latin: { ar: "Apple Pay", en: "Apple Pay" },
    note: { ar: "من جوالك بلا كتابة أرقام", en: "Pay from your phone without entering numbers" },
  },
  { id: "card", label: { ar: "بطاقة ائتمانية", en: "Credit card" }, note: { ar: "فيزا أو ماستركارد", en: "Visa or Mastercard" } },
];
