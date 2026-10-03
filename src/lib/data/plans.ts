import type { Localized } from "@/i18n/localized";

/* الخطط — مصدر واحد لصفحة الخطط والدفع والاشتراك والفواتير.

   الأسعار **شاملة ضريبة القيمة المضافة 15٪** كما ينصّ البريف، فالصافي
   يُشتقّ منها لا العكس: الطالب يرى 90 ويدفع 90، والفاتورة وحدها تفصل.

   حصص الدقائق للمجاني واللايت بيانات عرض — البريف يسمّي 500 للبرو
   وحدها. مسجَّلة في docs/STATE.md كنقطة تنتظر قرارًا. */

export const VAT = 0.15;

export type Plan = {
  id: "free" | "lite" | "pro";
  name: Localized;
  /** السعر شاملًا الضريبة */
  price: number;
  minutes: number;
  /** ترجمة الدقيقة إلى لغة الطالب */
  hours: Localized;
  chapters: Localized;
  courses: Localized;
  /** تبرير لا زخرفة — يقول متى تنفع لا أنها الأفضل */
  badge?: Localized;
  /** الخطة المميّزة بصريًّا. واحدة لا أكثر. */
  featured?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: { ar: "مجاني", en: "Free" },
    price: 0,
    minutes: 60,
    hours: { ar: "≈ ساعة مذاكرة موجّهة", en: "≈ 1 hour of guided study" },
    chapters: { ar: "≈ فصلان", en: "≈ 2 chapters" },
    courses: { ar: "مقرر واحد", en: "One course" },
  },
  {
    id: "lite",
    name: { ar: "لايت", en: "Lite" },
    price: 90,
    minutes: 250,
    hours: { ar: "≈ 4 ساعات مذاكرة موجّهة", en: "≈ 4 hours of guided study" },
    chapters: { ar: "≈ 10 فصول", en: "≈ 10 chapters" },
    courses: { ar: "كل مقرراتك", en: "All your courses" },
    badge: { ar: "الأنسب للبداية", en: "Best for getting started" },
    featured: true,
  },
  {
    id: "pro",
    name: { ar: "برو", en: "Pro" },
    price: 149,
    minutes: 500,
    hours: { ar: "≈ 8 ساعات مذاكرة موجّهة", en: "≈ 8 hours of guided study" },
    chapters: { ar: "≈ 20 فصلًا", en: "≈ 20 chapters" },
    courses: { ar: "كل مقرراتك", en: "All your courses" },
    badge: { ar: "الأنسب قبل الاختبارات", en: "Best before exams" },
  },
];

export const planById = (id: string) => PLANS.find((p) => p.id === id);

/** الصافي والضريبة مشتقّان من سعر شامل. */
export function breakdown(gross: number) {
  const net = gross / (1 + VAT);
  return {
    net: Math.round(net * 100) / 100,
    vat: Math.round((gross - net) * 100) / 100,
    gross,
  };
}

/** خطة الطالب الحالية — بيانات عرض حتى يصل حساب حقيقي. */
export const CURRENT_PLAN: Plan["id"] = "free";
