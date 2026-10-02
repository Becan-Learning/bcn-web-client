import type { Localized } from "@/i18n/localized";
import type { IconKey } from "@/app/[locale]/courses/subject-icon";

/* كتالوج عرض. ACCT 101 وحدها من docs/design-brief.md — البقية بيانات
   عرض حتى يصل الكتالوج الحقيقي. */

export type College = "business" | "science" | "engineering";

/* ست لوحات: ثلاث باذنجانية (فاتحة · متوسطة · عميقة) واثنتان دافئتان
   وواحدة زيتية. البنفسجي في 6 بطاقات من 9 — يبقى المسيطر.
   «العميق» ‎#2B1730‎ أغمق ما في اللوحة، وهو الكحلي المقصود. */
export type Tone =
  "lilac" | "base" | "deep" | "amber" | "walnut" | "olive" | "oliveDark";

export const COLLEGES: { id: College; label: Localized }[] = [
  { id: "business", label: { ar: "إدارة الأعمال", en: "Business Administration" } },
  { id: "science", label: { ar: "العلوم", en: "Science" } },
  { id: "engineering", label: { ar: "الهندسة", en: "Engineering" } },
];

export const UNIVERSITIES: Localized[] = [
  { ar: "جامعة الملك سعود", en: "King Saud University" },
  { ar: "جامعة الملك عبدالعزيز", en: "King Abdulaziz University" },
  { ar: "جامعة الإمام محمد بن سعود الإسلامية", en: "Imam Mohammad Ibn Saud Islamic University" },
];

export type Course = {
  code: string;
  name: Localized;
  university: Localized;
  college: College;
  tone: Tone;
  icon: IconKey;
};

export const COURSES: Course[] = [
  {
    code: "ACCT 101",
    name: { ar: "مبادئ المحاسبة 1", en: "Principles of Accounting 1" },
    university: { ar: "جامعة الملك سعود", en: "King Saud University" },
    college: "business",
    tone: "deep",
    icon: "coins",
  },
  {
    code: "ECON 101",
    name: { ar: "مبادئ الاقتصاد الجزئي", en: "Principles of Microeconomics" },
    university: { ar: "جامعة الملك سعود", en: "King Saud University" },
    college: "business",
    tone: "lilac",
    icon: "bars",
  },
  {
    code: "MGT 101",
    name: { ar: "مبادئ الإدارة", en: "Principles of Management" },
    university: { ar: "جامعة الملك سعود", en: "King Saud University" },
    college: "business",
    tone: "base",
    icon: "blocks",
  },
  {
    code: "MATH 101",
    name: { ar: "حساب التفاضل والتكامل 1", en: "Calculus 1" },
    university: { ar: "جامعة الملك سعود", en: "King Saud University" },
    college: "science",
    tone: "lilac",
    icon: "torus",
  },
  {
    code: "CHEM 101",
    name: { ar: "الكيمياء العامة 1", en: "General Chemistry 1" },
    university: { ar: "جامعة الملك سعود", en: "King Saud University" },
    college: "science",
    tone: "olive",
    icon: "flask",
  },
  {
    code: "PHYS 101",
    name: { ar: "فيزياء عامة 1", en: "General Physics 1" },
    university: { ar: "جامعة الملك عبدالعزيز", en: "King Abdulaziz University" },
    college: "science",
    tone: "deep",
    icon: "atom",
  },
  {
    code: "STAT 101",
    name: { ar: "مبادئ الإحصاء", en: "Principles of Statistics" },
    university: { ar: "جامعة الملك عبدالعزيز", en: "King Abdulaziz University" },
    college: "science",
    tone: "walnut",
    icon: "donut",
  },
  {
    code: "CS 101",
    name: { ar: "مقدمة في البرمجة", en: "Introduction to Programming" },
    university: { ar: "جامعة الملك سعود", en: "King Saud University" },
    college: "engineering",
    tone: "amber",
    icon: "cube",
  },
  {
    code: "EE 201",
    name: { ar: "الدوائر الكهربائية", en: "Electric Circuits" },
    university: { ar: "جامعة الملك عبدالعزيز", en: "King Abdulaziz University" },
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

/* ————— الفصول —————
   ACCT 101 · الفصل 3 «الأصول والخصوم» بمدّته ومواضيعه منقول من
   docs/design-brief.md. بقية الفصول بيانات عرض حتى يصل المحتوى.
   الصيغة: [العنوان, الدقائق, عدد المواضيع, جاهز؟] */

type Row = [Localized, number, number, boolean?];

export type Chapter = {
  n: number;
  title: Localized;
  minutes: number;
  topics: number;
  ready: boolean;
};

const ROWS: Record<string, Row[]> = {
  "ACCT 101": [
    [{ ar: "المعادلة المحاسبية", en: "The Accounting Equation" }, 20, 9],
    [{ ar: "الحسابات والقيود", en: "Accounts and Journal Entries" }, 25, 11],
    [{ ar: "الأصول والخصوم", en: "Assets and Liabilities" }, 25, 12],
    [{ ar: "دورة المحاسبة", en: "The Accounting Cycle" }, 30, 10],
    [{ ar: "التسويات الجردية", en: "Adjusting Entries" }, 28, 12],
    [{ ar: "القوائم المالية", en: "Financial Statements" }, 30, 13],
    [{ ar: "النقدية والبنوك", en: "Cash and Banks" }, 22, 8],
    [{ ar: "المدينون والمخزون", en: "Receivables and Inventory" }, 26, 10],
    [{ ar: "الأصول الثابتة والإهلاك", en: "Fixed Assets and Depreciation" }, 24, 9],
    [{ ar: "المحاسبة عن الشركات", en: "Accounting for Companies" }, 28, 11, false],
  ],
  "ECON 101": [
    [{ ar: "مبادئ الاقتصاد", en: "Principles of Economics" }, 18, 7],
    [{ ar: "العرض والطلب", en: "Supply and Demand" }, 26, 12],
    [{ ar: "مرونة الطلب", en: "Demand Elasticity" }, 22, 9],
    [{ ar: "سلوك المستهلك", en: "Consumer Behavior" }, 24, 10],
    [{ ar: "نظرية الإنتاج", en: "Production Theory" }, 26, 11],
    [{ ar: "التكاليف", en: "Costs" }, 24, 10],
    [{ ar: "المنافسة الكاملة", en: "Perfect Competition" }, 28, 12],
    [{ ar: "الاحتكار", en: "Monopoly" }, 25, 9, false],
  ],
  "MGT 101": [
    [{ ar: "مدخل إلى الإدارة", en: "Introduction to Management" }, 18, 8],
    [{ ar: "التخطيط", en: "Planning" }, 22, 9],
    [{ ar: "التنظيم", en: "Organizing" }, 24, 10],
    [{ ar: "التوظيف", en: "Staffing" }, 20, 8],
    [{ ar: "القيادة", en: "Leadership" }, 26, 11],
    [{ ar: "الرقابة", en: "Controlling" }, 22, 9],
    [{ ar: "اتخاذ القرار", en: "Decision-Making" }, 24, 10],
  ],
  "MATH 101": [
    [{ ar: "النهايات والاتصال", en: "Limits and Continuity" }, 28, 12],
    [{ ar: "المشتقة وقواعدها", en: "Derivatives and Differentiation Rules" }, 30, 14],
    [{ ar: "قاعدة السلسلة", en: "The Chain Rule" }, 22, 8],
    [{ ar: "تطبيقات المشتقة", en: "Applications of Derivatives" }, 32, 15],
    [{ ar: "التكامل غير المحدد", en: "Indefinite Integrals" }, 28, 12],
    [{ ar: "التكامل المحدد", en: "Definite Integrals" }, 30, 13],
    [{ ar: "تطبيقات التكامل", en: "Applications of Integration" }, 30, 12, false],
  ],
  "CHEM 101": [
    [{ ar: "بنية الذرة", en: "Atomic Structure" }, 24, 10],
    [{ ar: "الجدول الدوري", en: "The Periodic Table" }, 22, 9],
    [{ ar: "الروابط الكيميائية", en: "Chemical Bonds" }, 28, 12],
    [{ ar: "المعادلات والموازنة", en: "Equations and Balancing" }, 20, 8],
    [{ ar: "الحسابات الكيميائية", en: "Stoichiometry" }, 30, 13],
    [{ ar: "الغازات", en: "Gases" }, 26, 11],
    [{ ar: "المحاليل", en: "Solutions" }, 24, 10],
    [{ ar: "الحموض والقواعد", en: "Acids and Bases" }, 28, 12],
  ],
  "PHYS 101": [
    [{ ar: "القياس والوحدات", en: "Measurement and Units" }, 16, 6],
    [{ ar: "الحركة في بُعد واحد", en: "Motion in One Dimension" }, 26, 11],
    [{ ar: "الحركة في بُعدين", en: "Motion in Two Dimensions" }, 28, 12],
    [{ ar: "قوانين نيوتن", en: "Newton’s Laws" }, 30, 14],
    [{ ar: "الشغل والطاقة", en: "Work and Energy" }, 28, 12],
    [{ ar: "كمية الحركة", en: "Momentum" }, 24, 10],
    [{ ar: "الحركة الدورانية", en: "Rotational Motion" }, 30, 13],
    [{ ar: "الاتزان", en: "Equilibrium" }, 22, 9],
    [{ ar: "الجاذبية", en: "Gravity" }, 24, 10],
    [{ ar: "الموائع", en: "Fluids" }, 26, 11, false],
  ],
  "STAT 101": [
    [{ ar: "وصف البيانات", en: "Describing Data" }, 20, 8],
    [{ ar: "مقاييس النزعة المركزية", en: "Measures of Central Tendency" }, 24, 10],
    [{ ar: "مقاييس التشتت", en: "Measures of Dispersion" }, 22, 9],
    [{ ar: "الاحتمالات", en: "Probability" }, 28, 12],
    [{ ar: "التوزيعات الاحتمالية", en: "Probability Distributions" }, 30, 13],
    [{ ar: "العيّنات والتقدير", en: "Sampling and Estimation" }, 26, 11],
  ],
  "CS 101": [
    [{ ar: "مقدمة في البرمجة", en: "Introduction to Programming" }, 18, 7],
    [{ ar: "المتغيّرات والأنواع", en: "Variables and Types" }, 22, 9],
    [{ ar: "العمليات والتعابير", en: "Operators and Expressions" }, 20, 8],
    [{ ar: "الجمل الشرطية", en: "Conditional Statements" }, 24, 10],
    [{ ar: "الحلقات التكرارية", en: "Loops" }, 26, 11],
    [{ ar: "الدوال", en: "Functions" }, 28, 12],
    [{ ar: "المصفوفات", en: "Arrays" }, 26, 11],
    [{ ar: "السلاسل النصية", en: "Strings" }, 22, 9],
    [{ ar: "الملفات", en: "Files" }, 20, 8],
    [{ ar: "البرمجة الكائنية", en: "Object-Oriented Programming" }, 32, 14],
    [{ ar: "معالجة الأخطاء", en: "Error Handling" }, 20, 8, false],
  ],
  "EE 201": [
    [{ ar: "عناصر الدائرة", en: "Circuit Elements" }, 20, 8],
    [{ ar: "قانون أوم", en: "Ohm’s Law" }, 22, 9],
    [{ ar: "قوانين كيرشوف", en: "Kirchhoff’s Laws" }, 28, 12],
    [{ ar: "التوصيل التوالي والتوازي", en: "Series and Parallel Connections" }, 24, 10],
    [{ ar: "تحليل العقد", en: "Nodal Analysis" }, 30, 13],
    [{ ar: "تحليل الحلقات", en: "Mesh Analysis" }, 28, 12],
    [{ ar: "نظريات الدوائر", en: "Circuit Theorems" }, 30, 13],
    [{ ar: "المكثّفات والملفّات", en: "Capacitors and Inductors" }, 26, 11],
    [{ ar: "دوائر التيار المتردد", en: "AC Circuits" }, 32, 14],
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
