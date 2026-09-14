import { breakdown, planById, PLANS, type Plan } from "./plans";

/* بيانات الفوترة — الاشتراك والفواتير ووسائل الدفع.

   السعر لا يُكتب هنا مرّة أخرى: كل رقم يُشتقّ من `plans.ts`،
   والصافي والضريبة من `breakdown` وحدها. الأسعار شاملة الضريبة،
   فالفاتورة تفصل ما دُفع لا تضيف عليه.

   ⚠️ متطلبات الفوترة الإلكترونية (ZATCA) — رقم ضريبي، رمز QR،
   صيغة الفاتورة المعتمدة — تحتاج تأكيد المحاسب لا اجتهاد التصميم.
   المعروض هنا تخطيط الجدول والتفصيل فقط. */

/* ————— وسائل الدفع —————
   مدى أولًا: كثير من الطلاب بلا بطاقة ائتمانية، وغيابها يقطع
   شريحة كبيرة من السوق. الترتيب في المصفوفة هو ترتيب العرض. */

export type MethodId = "mada" | "applepay" | "card";

export type Method = {
  id: MethodId;
  label: string;
  /** يُكتب بعد الاسم — ما يحتاجه الطالب ليقرّر، لا وصف تسويقي */
  note: string;
  /** الاسم اللاتيني يُلَفّ بـ dir="ltr" في الواجهة */
  latin?: string;
};

export const METHODS: Method[] = [
  { id: "mada", label: "مدى", note: "بطاقة بنكك المحلية" },
  {
    id: "applepay",
    label: "Apple Pay",
    latin: "Apple Pay",
    note: "من جوالك بلا كتابة أرقام",
  },
  { id: "card", label: "بطاقة ائتمانية", note: "فيزا أو ماستركارد" },
];

/* ————— الاشتراك الحالي —————
   بيانات عرض حتى يصل حساب حقيقي. التواريخ مخزَّنة لا محسوبة من
   `new Date()`: الحساب وقت الرسم يختلف بين الخادم والمتصفّح
   فينكسر الترطيب — مزلق مسجَّل في docs/STATE.md. */

export type Subscription = {
  planId: Plan["id"];
  /** تاريخ التجديد القادم، أو تاريخ الانتهاء بعد الإلغاء */
  renewsOn: string;
  /** الدقائق المستهلكة من حصّة الشهر */
  used: number;
  /** ألغى الطالب التجديد — يبقى مفعّلًا حتى `renewsOn` */
  canceled: boolean;
  method: MethodId;
  /** آخر أربعة أرقام — تُعرض إنجليزية و`dir="ltr"` */
  last4: string;
};

export const SUBSCRIPTION: Subscription = {
  planId: "pro",
  renewsOn: "14 يناير 2027",
  used: 312,
  canceled: false,
  method: "mada",
  last4: "4417",
};

/** ما يفقده الطالب بالإلغاء — بالتحديد لا بالتخويف.
    يُقارن خطته بالمجانية فيقرأ الفرق رقمًا لا وعدًا. */
export function whatYouLose(planId: Plan["id"]) {
  const free = planById("free")!;
  const now = planById(planId)!;
  return {
    minutes: { from: now.minutes, to: free.minutes },
    courses: { from: now.courses, to: free.courses },
  };
}

/* ————— الفواتير —————
   الإجمالي شامل الضريبة، والصافي والضريبة يُشتقّان منه في العرض. */

export type Invoice = {
  id: string;
  date: string;
  planId: Plan["id"];
  gross: number;
};

export const INVOICES: Invoice[] = [
  { id: "BCN-2026-0412", date: "14 ديسمبر 2026", planId: "pro", gross: 149 },
  { id: "BCN-2026-0311", date: "14 نوفمبر 2026", planId: "pro", gross: 149 },
  { id: "BCN-2026-0208", date: "14 أكتوبر 2026", planId: "lite", gross: 90 },
];

/** سطر فاتورة جاهز للعرض — الصافي والضريبة مفصولان. */
export function invoiceRow(inv: Invoice) {
  const plan = planById(inv.planId) ?? PLANS[0];
  return { ...inv, plan, ...breakdown(inv.gross) };
}
