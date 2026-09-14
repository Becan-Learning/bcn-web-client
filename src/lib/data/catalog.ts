import type { IconKey } from "@/app/courses/subject-icon";

/* كتالوج عرض. ACCT 101 وحدها من docs/design-brief.md — البقية بيانات
   عرض حتى يصل الكتالوج الحقيقي. */

export type College = "business" | "science" | "engineering";

/* ست لوحات: ثلاث باذنجانية (فاتحة · متوسطة · عميقة) واثنتان دافئتان
   وواحدة زيتية. البنفسجي في 6 بطاقات من 9 — يبقى المسيطر.
   «العميق» ‎#2B1730‎ أغمق ما في اللوحة، وهو الكحلي المقصود. */
export type Tone =
  "lilac" | "base" | "deep" | "amber" | "walnut" | "olive" | "oliveDark";

export const COLLEGES: { id: College; label: string }[] = [
  { id: "business", label: "إدارة الأعمال" },
  { id: "science", label: "العلوم" },
  { id: "engineering", label: "الهندسة" },
];

export const UNIVERSITIES = [
  "جامعة الملك سعود",
  "جامعة الملك عبدالعزيز",
  "جامعة الإمام محمد بن سعود الإسلامية",
];

export type Course = {
  code: string;
  name: string;
  university: string;
  college: College;
  tone: Tone;
  icon: IconKey;
};

export const COURSES: Course[] = [
  {
    code: "ACCT 101",
    name: "مبادئ المحاسبة 1",
    university: "جامعة الملك سعود",
    college: "business",
    tone: "deep",
    icon: "coins",
  },
  {
    code: "ECON 101",
    name: "مبادئ الاقتصاد الجزئي",
    university: "جامعة الملك سعود",
    college: "business",
    tone: "lilac",
    icon: "bars",
  },
  {
    code: "MGT 101",
    name: "مبادئ الإدارة",
    university: "جامعة الملك سعود",
    college: "business",
    tone: "base",
    icon: "blocks",
  },
  {
    code: "MATH 101",
    name: "حساب التفاضل والتكامل 1",
    university: "جامعة الملك سعود",
    college: "science",
    tone: "lilac",
    icon: "torus",
  },
  {
    code: "CHEM 101",
    name: "الكيمياء العامة 1",
    university: "جامعة الملك سعود",
    college: "science",
    tone: "olive",
    icon: "flask",
  },
  {
    code: "PHYS 101",
    name: "فيزياء عامة 1",
    university: "جامعة الملك عبدالعزيز",
    college: "science",
    tone: "deep",
    icon: "atom",
  },
  {
    code: "STAT 101",
    name: "مبادئ الإحصاء",
    university: "جامعة الملك عبدالعزيز",
    college: "science",
    tone: "walnut",
    icon: "donut",
  },
  {
    code: "CS 101",
    name: "مقدمة في البرمجة",
    university: "جامعة الملك سعود",
    college: "engineering",
    tone: "amber",
    icon: "cube",
  },
  {
    code: "EE 201",
    name: "الدوائر الكهربائية",
    university: "جامعة الملك عبدالعزيز",
    college: "engineering",
    tone: "oliveDark",
    icon: "bolt",
  },
];

/* بطاقة سادة بتعبئة واحدة. الأيقونة تظهر مرّتين:
   ختمًا كبيرًا يشكّل نسيج البطاقة، ورمزًا صغيرًا ملتصقًا باسم المقرر
   فيقرأ الاثنان كوحدة واحدة. البنفسجي في 5 بطاقات من 9. */
export const TONES: Record<
  Tone,
  {
    card: string;
    chapter: string;
    title: string;
    meta: string;
    icon: string;
    chip: string;
    arrow: string;
    /* شريط التقدّم داخل البطاقة — من ألوان البطاقة نفسها.
       لا أخضر: الأخضر حالة لا سطح. */
    track: string;
    fill: string;
  }
> = {
  lilac: {
    card: "bg-tint-aubergine border-aubergine-mid",
    chapter: "bg-tint-aubergine border-aubergine-mid",
    title: "text-ink",
    meta: "text-ink-2",
    icon: "text-aubergine-base",
    chip: "border-aubergine-mid text-aubergine-base",
    arrow: "border-aubergine-mid text-aubergine-base",
    track: "bg-aubergine-mid/25",
    fill: "bg-aubergine-base",
  },
  amber: {
    card: "bg-tint-amber border-warmth",
    chapter: "bg-tint-amber border-warmth",
    title: "text-ink",
    meta: "text-ink-2",
    icon: "text-aubergine-base",
    chip: "border-warmth text-ink",
    arrow: "border-warmth text-ink",
    track: "bg-warmth/25",
    fill: "bg-warmth",
  },
  walnut: {
    card: "bg-tint-walnut border-warmth",
    chapter: "bg-tint-walnut border-warmth",
    title: "text-ink",
    meta: "text-ink-2",
    icon: "text-aubergine-base",
    chip: "border-warmth text-ink",
    arrow: "border-warmth text-ink",
    track: "bg-warmth/25",
    fill: "bg-warmth",
  },
  olive: {
    card: "bg-olive-tint border-olive",
    chapter: "bg-olive-tint border-olive",
    title: "text-ink",
    meta: "text-ink-2",
    icon: "text-olive-deep",
    chip: "border-olive text-olive-deep",
    arrow: "border-olive text-olive-deep",
    track: "bg-olive/25",
    fill: "bg-olive-deep",
  },
  base: {
    card: "bg-aubergine-base border-aubergine-soft",
    chapter: "bg-tint-aubergine border-aubergine-mid",
    title: "text-on-dominant",
    meta: "text-aubergine-tint",
    icon: "text-aubergine-tint",
    chip: "border-aubergine-soft text-aubergine-tint",
    arrow: "border-aubergine-soft text-on-dominant",
    track: "bg-aubergine-soft/30",
    fill: "bg-aubergine-tint",
  },
  deep: {
    card: "bg-aubergine-deep border-aubergine-mid",
    chapter: "bg-tint-aubergine border-aubergine-mid",
    title: "text-on-dominant",
    meta: "text-aubergine-tint",
    icon: "text-amber-bright",
    chip: "border-aubergine-soft text-aubergine-tint",
    arrow: "border-aubergine-soft text-on-dominant",
    track: "bg-aubergine-soft/30",
    fill: "bg-aubergine-tint",
  },
  oliveDark: {
    card: "bg-olive-dark border-olive-soft",
    chapter: "bg-olive-tint border-olive",
    title: "text-on-dominant",
    meta: "text-olive-soft",
    icon: "text-olive-soft",
    chip: "border-olive-soft text-olive-soft",
    arrow: "border-olive-soft text-on-dominant",
    track: "bg-olive-soft/30",
    fill: "bg-olive-soft",
  },
};

/* عدّ عربي سليم بدل «3 مقرر». */
export function countLabel(n: number) {
  if (n === 1) return "مقرر واحد";
  if (n === 2) return "مقرران";
  if (n <= 10) return `${n} مقررات`;
  return `${n} مقررًا`;
}

/* عدّ الطلاب — «8 طلاب» لا «8 طالب». */
export function studentsLabel(n: number) {
  if (n === 1) return "طالب واحد طلب";
  if (n === 2) return "طالبان طلبا";
  if (n <= 10) return `${n} طلاب طلبوا`;
  return `${n} طالبًا طلبوا`;
}

/* ————— الفصول —————
   ACCT 101 · الفصل 3 «الأصول والخصوم» بمدّته ومواضيعه منقول من
   docs/design-brief.md. بقية الفصول بيانات عرض حتى يصل المحتوى.
   الصيغة: [العنوان, الدقائق, عدد المواضيع, جاهز؟] */

type Row = [string, number, number, boolean?];

export type Chapter = {
  n: number;
  title: string;
  minutes: number;
  topics: number;
  ready: boolean;
};

const ROWS: Record<string, Row[]> = {
  "ACCT 101": [
    ["المعادلة المحاسبية", 20, 9],
    ["الحسابات والقيود", 25, 11],
    ["الأصول والخصوم", 25, 12],
    ["دورة المحاسبة", 30, 10],
    ["التسويات الجردية", 28, 12],
    ["القوائم المالية", 30, 13],
    ["النقدية والبنوك", 22, 8],
    ["المدينون والمخزون", 26, 10],
    ["الأصول الثابتة والإهلاك", 24, 9],
    ["المحاسبة عن الشركات", 28, 11, false],
  ],
  "ECON 101": [
    ["مبادئ الاقتصاد", 18, 7],
    ["العرض والطلب", 26, 12],
    ["مرونة الطلب", 22, 9],
    ["سلوك المستهلك", 24, 10],
    ["نظرية الإنتاج", 26, 11],
    ["التكاليف", 24, 10],
    ["المنافسة الكاملة", 28, 12],
    ["الاحتكار", 25, 9, false],
  ],
  "MGT 101": [
    ["مدخل إلى الإدارة", 18, 8],
    ["التخطيط", 22, 9],
    ["التنظيم", 24, 10],
    ["التوظيف", 20, 8],
    ["القيادة", 26, 11],
    ["الرقابة", 22, 9],
    ["اتخاذ القرار", 24, 10],
  ],
  "MATH 101": [
    ["النهايات والاتصال", 28, 12],
    ["المشتقة وقواعدها", 30, 14],
    ["قاعدة السلسلة", 22, 8],
    ["تطبيقات المشتقة", 32, 15],
    ["التكامل غير المحدد", 28, 12],
    ["التكامل المحدد", 30, 13],
    ["تطبيقات التكامل", 30, 12, false],
  ],
  "CHEM 101": [
    ["بنية الذرة", 24, 10],
    ["الجدول الدوري", 22, 9],
    ["الروابط الكيميائية", 28, 12],
    ["المعادلات والموازنة", 20, 8],
    ["الحسابات الكيميائية", 30, 13],
    ["الغازات", 26, 11],
    ["المحاليل", 24, 10],
    ["الحموض والقواعد", 28, 12],
  ],
  "PHYS 101": [
    ["القياس والوحدات", 16, 6],
    ["الحركة في بُعد واحد", 26, 11],
    ["الحركة في بُعدين", 28, 12],
    ["قوانين نيوتن", 30, 14],
    ["الشغل والطاقة", 28, 12],
    ["كمية الحركة", 24, 10],
    ["الحركة الدورانية", 30, 13],
    ["الاتزان", 22, 9],
    ["الجاذبية", 24, 10],
    ["الموائع", 26, 11, false],
  ],
  "STAT 101": [
    ["وصف البيانات", 20, 8],
    ["مقاييس النزعة المركزية", 24, 10],
    ["مقاييس التشتت", 22, 9],
    ["الاحتمالات", 28, 12],
    ["التوزيعات الاحتمالية", 30, 13],
    ["العيّنات والتقدير", 26, 11],
  ],
  "CS 101": [
    ["مقدمة في البرمجة", 18, 7],
    ["المتغيّرات والأنواع", 22, 9],
    ["العمليات والتعابير", 20, 8],
    ["الجمل الشرطية", 24, 10],
    ["الحلقات التكرارية", 26, 11],
    ["الدوال", 28, 12],
    ["المصفوفات", 26, 11],
    ["السلاسل النصية", 22, 9],
    ["الملفات", 20, 8],
    ["البرمجة الكائنية", 32, 14],
    ["معالجة الأخطاء", 20, 8, false],
  ],
  "EE 201": [
    ["عناصر الدائرة", 20, 8],
    ["قانون أوم", 22, 9],
    ["قوانين كيرشوف", 28, 12],
    ["التوصيل التوالي والتوازي", 24, 10],
    ["تحليل العقد", 30, 13],
    ["تحليل الحلقات", 28, 12],
    ["نظريات الدوائر", 30, 13],
    ["المكثّفات والملفّات", 26, 11],
    ["دوائر التيار المتردد", 32, 14],
  ],
};

export const chaptersOf = (code: string): Chapter[] =>
  (ROWS[code] ?? []).map(([title, minutes, topics, ready], i) => ({
    n: i + 1,
    title,
    minutes,
    topics,
    ready: ready !== false,
  }));

/** رمز المقرر في الرابط: "ACCT 101" ← "acct-101" */
export const slugOf = (code: string) => code.replace(" ", "-").toLowerCase();

export const courseBySlug = (slug: string) =>
  COURSES.find((c) => slugOf(c.code) === slug.toLowerCase());

/** عدد الفصول الجاهزة — ما يُعرض للطالب. */
export const readyCount = (code: string) =>
  chaptersOf(code).filter((c) => c.ready).length;
