/* الخطط — مصدر واحد لصفحة الخطط والدفع والاشتراك والفواتير.

   الأسعار **شاملة ضريبة القيمة المضافة 15٪** كما ينصّ البريف، فالصافي
   يُشتقّ منها لا العكس: الطالب يرى 90 ويدفع 90، والفاتورة وحدها تفصل.

   حصص الدقائق للمجاني واللايت بيانات عرض — البريف يسمّي 500 للبرو
   وحدها. مسجَّلة في docs/STATE.md كنقطة تنتظر قرارًا. */

export const VAT = 0.15;

export type Plan = {
  id: "free" | "lite" | "pro";
  name: string;
  /** السعر شاملًا الضريبة */
  price: number;
  minutes: number;
  /** ترجمة الدقيقة إلى لغة الطالب */
  hours: string;
  chapters: string;
  courses: string;
  /** تبرير لا زخرفة — يقول متى تنفع لا أنها الأفضل */
  badge?: string;
  /** الخطة المميّزة بصريًّا. واحدة لا أكثر. */
  featured?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "مجاني",
    price: 0,
    minutes: 60,
    hours: "≈ ساعة مذاكرة موجّهة",
    chapters: "≈ فصلان",
    courses: "مقرر واحد",
  },
  {
    id: "lite",
    name: "لايت",
    price: 90,
    minutes: 250,
    hours: "≈ 4 ساعات مذاكرة موجّهة",
    chapters: "≈ 10 فصول",
    courses: "كل مقرراتك",
    badge: "الأنسب للبداية",
    featured: true,
  },
  {
    id: "pro",
    name: "برو",
    price: 149,
    minutes: 500,
    hours: "≈ 8 ساعات مذاكرة موجّهة",
    chapters: "≈ 20 فصلًا",
    courses: "كل مقرراتك",
    badge: "الأنسب قبل الاختبارات",
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
