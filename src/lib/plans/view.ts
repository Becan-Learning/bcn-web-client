import type { Localized } from "@/i18n/localized";
import type { ApiPlan } from "./schema";

/* الباقات كما يعرضها الويب — مشتقّة من استجابة الخادم لا مكتوبة هنا.

   الأسعار **شاملة ضريبة القيمة المضافة 15٪**، فالصافي يُشتقّ منها لا العكس:
   الطالب يرى 149 ويدفع 149، والتفصيل وحده يفصل. والعبارات الظاهرة
   (ساعات، مقررات، حصص) تُبنى من هذه الأرقام في `messages/` لا هنا. */

export const VAT = 0.15;

export type PlanView = {
  id: string;
  name: Localized;
  /** سعر دورة واحدة بالريال شاملًا الضريبة؛ المجانية 0 */
  price: number;
  /** دقائق الدورة؛ null بلا حد */
  minutes: number | null;
  /** ترجمة الدقائق إلى ساعات تقريبية؛ null إن لم تُعرف أو قلّت عن نصف ساعة */
  hours: number | null;
  /** عدد المقررات المفتوحة معًا؛ null كل مقرراتك */
  courses: number | null;
  /** حصص الدورة؛ null بلا حد */
  sessions: number | null;
  /** تبرير لا زخرفة — يقول متى تنفع لا أنها الأفضل */
  badge: Localized | null;
  /** الباقة المميّزة بصريًّا */
  featured: boolean;
};

export function toPlanView(plan: ApiPlan): PlanView {
  const minutes = plan.limits.seconds === null ? null : plan.limits.seconds / 60;
  const hours = minutes === null ? null : Math.round(minutes / 60);
  return {
    id: plan.id,
    name: plan.name,
    price: plan.priceHalalas / 100,
    minutes,
    hours: hours === null || hours < 1 ? null : hours,
    courses: plan.limits.enrollments,
    sessions: plan.limits.sessions,
    badge: plan.badge,
    featured: plan.featured,
  };
}

export const planById = (plans: PlanView[], id: string) => plans.find((plan) => plan.id === id);

/** السعر للعرض بأرقام لاتينية: 149 أو 99.90 */
export const formatPrice = (price: number) => (Number.isInteger(price) ? String(price) : price.toFixed(2));

/** الصافي والضريبة مشتقّان من سعر شامل. */
export function breakdown(gross: number) {
  const net = gross / (1 + VAT);
  return {
    net: Math.round(net * 100) / 100,
    vat: Math.round((gross - net) * 100) / 100,
    gross,
  };
}

/* الباقة الحالية إن كانت مدفوعة (سعرها أكبر من صفر) وإلا null.
   السعر يُبحث عنه في قائمة الباقات بمعرّفها؛ وتعذّر القائمة (null) أو غياب
   الباقة منها يعني «لا مدفوعة» فلا يظهر شيء من الدفع بلا سند. */
export function currentPaidPlan(planId: string | null | undefined, plans: PlanView[] | null): PlanView | null {
  if (!planId || !plans) return null;
  const plan = planById(plans, planId);
  return plan && plan.price > 0 ? plan : null;
}
