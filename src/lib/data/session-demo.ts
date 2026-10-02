import type { Localized } from "@/i18n/localized";

/* محتوى الجلسة — منقول من docs/design-brief-session.md (الشاشة 7).

   الأرقام لاتينية لا هندية: البريف يكتبها ١٢٣ لكن CLAUDE.md يمنع
   الأرقام الهندية في الواجهة صراحةً، و design-reviewer يعدّها مخالفة.
   الشكل محفوظ والمضمون واحد.

   هذا محتوى ACCT 101 · الفصل 3، وهو الفصل الوحيد الذي يسمّيه
   البريف. يُستبدل هذا الملف بمصدر حقيقي حين يجهز خطّ المحتوى. */

export type Block =
  | { kind: "head"; text: Localized }
  | { kind: "item"; n: number; term: Localized; gloss: Localized; mark?: boolean }
  | { kind: "example"; text: Localized }
  | { kind: "penalty"; text: Localized };

/** السبورة — كل كتلة تظهر متزامنة مع نطقها. */
export const BOARD: Block[] = [
  { kind: "head", text: { ar: "الأصل: مورد تسيطر عليه المنشأة", en: "An asset: a resource controlled by the entity" } },
  { kind: "item", n: 1, term: { ar: "مورد", en: "Resource" }, gloss: { ar: "شيء له قيمة", en: "Something of value" } },
  {
    kind: "item",
    n: 2,
    term: { ar: "تسيطر عليه", en: "Controlled" },
    gloss: { ar: "ليس شرطًا أن تملكه", en: "You don’t have to own it" },
    mark: true,
  },
  { kind: "item", n: 3, term: { ar: "المنشأة", en: "Entity" }, gloss: { ar: "الشركة لا المالك", en: "The company, not its owner" } },
  { kind: "example", text: { ar: "مثال: سيارة مستأجرة تشغيليًا", en: "Example: a car under an operating lease" } },
  {
    kind: "penalty",
    text: { ar: "تكتب «تملكه» بدل «تسيطر عليه»", en: "Writing “owned” instead of “controlled”" },
  },
];

/* كل موضوع يحمل عدد كتل السبورة المرتبطة به. الأصفار مواضيع لم
   يجهز محتواها بعد، وتُعرض معطّلة بوسم صريح لا تُخفى ولا يُوعَد بها. */
export const TOPICS_META: { title: Localized; blocks: number }[] = [
  { title: { ar: "تعريف الأصل", en: "Defining an asset" }, blocks: 2 },
  { title: { ar: "الفرق بين السيطرة والملكية", en: "Control versus ownership" }, blocks: 4 },
  { title: { ar: "تصنيف الأصول", en: "Classifying assets" }, blocks: 0 },
  { title: { ar: "الأصول المتداولة", en: "Current assets" }, blocks: 0 },
  { title: { ar: "الأصول الثابتة", en: "Fixed assets" }, blocks: 0 },
  { title: { ar: "تعريف الخصم", en: "Defining a liability" }, blocks: 0 },
  { title: { ar: "الخصوم قصيرة الأجل", en: "Current liabilities" }, blocks: 0 },
  { title: { ar: "الخصوم طويلة الأجل", en: "Long-term liabilities" }, blocks: 0 },
  { title: { ar: "معادلة الميزانية", en: "The accounting equation" }, blocks: 0 },
  { title: { ar: "أثر العمليات على المعادلة", en: "How transactions affect the equation" }, blocks: 0 },
  { title: { ar: "أمثلة محلولة", en: "Worked examples" }, blocks: 0 },
  { title: { ar: "أخطاء الاختبار الشائعة", en: "Common exam mistakes" }, blocks: 0 },
];

/** الشريحة المطابقة لكل موضوع — تزامن حقيقي لا رقم ثابت. */
export const SLIDE_OF_TOPIC = [7, 8, 6, 6, 6, 5, 5, 5, 5, 9, 9, 9];

/* ملخّص نهاية الفصل — يذكر التعثّر لا المدح. */
export const SUMMARY = {
  weak: { ar: "التفريق بين السيطرة والملكية", en: "Distinguishing control from ownership" },
  hint: { ar: "المعيار من ينتفع ويمنع غيره، لا من يحمل الصكّ.", en: "The test is who benefits and can exclude others, not who holds the title." },
};

export const TOPICS = [
  { ar: "تعريف الأصل", en: "Defining an asset" },
  { ar: "الفرق بين السيطرة والملكية", en: "Control versus ownership" },
  { ar: "تصنيف الأصول", en: "Classifying assets" },
  { ar: "الأصول المتداولة", en: "Current assets" },
  { ar: "الأصول الثابتة", en: "Fixed assets" },
  { ar: "تعريف الخصم", en: "Defining a liability" },
  { ar: "الخصوم قصيرة الأجل", en: "Current liabilities" },
  { ar: "الخصوم طويلة الأجل", en: "Long-term liabilities" },
  { ar: "معادلة الميزانية", en: "The accounting equation" },
  { ar: "أثر العمليات على المعادلة", en: "How transactions affect the equation" },
  { ar: "أمثلة محلولة", en: "Worked examples" },
  { ar: "أخطاء الاختبار الشائعة", en: "Common exam mistakes" },
];

export const QUESTION = {
  prompt: { ar: "وش الفرق بين «تسيطر عليه» و«تملكه»؟", en: "What’s the difference between “controlled” and “owned”?" },
  options: [
    { ar: "السيطرة تعني الملكية القانونية", en: "Control means legal ownership" },
    { ar: "السيطرة تعني القدرة على الاستفادة بلا ملكية", en: "Control means being able to benefit without ownership" },
    { ar: "لا فرق بينهما محاسبيًا", en: "There’s no accounting difference" },
  ],
  correct: 1,
  /** تعليل قصير لا مدح — البريف يمنع «ممتاز» وحدها */
  why: { ar: "السيطرة تُقاس بمن ينتفع ويمنع غيره، لا بمن يحمل الصكّ. ولهذا تُدرَج السيارة المستأجرة تشغيليًا عند من يستخدمها.", en: "Control depends on who benefits and can exclude others, not who holds the title. In this example, the car under an operating lease is recorded by its user." },
};

/* سلّم العلاج — أربع رُتب، واحدة في كل مرة.
   بين الرتبة والتي تليها يُعاد سؤال الطالب. */
export const REMEDY = [
  {
    rank: 1,
    label: { ar: "تلميح موجَّه", en: "Targeted hint" },
    text: { ar: "السيارة المستأجرة تشغيليًا: هل تملكها المنشأة؟ وهل تستفيد منها وتمنع غيرها منها؟", en: "For a car under an operating lease: does the entity own it? Does it benefit from it and exclude others?" },
  },
  {
    rank: 2,
    label: { ar: "إعادة بأسلوب مختلف", en: "Another explanation" },
    text: { ar: "شركة استأجرت مستودعًا خمس سنين. الصكّ باسم المؤجّر، لكن الشركة وحدها تدخله وتخزّن فيه وتمنع غيرها. هذي سيطرة بلا ملكية.", en: "A company leases a warehouse for five years. The landlord holds the title, but only the company enters, stores goods and excludes others. That’s control without ownership." },
  },
  {
    rank: 3,
    label: { ar: "مثال محلول", en: "Worked example" },
    text: { ar: "رافعة بالإيجار التشغيلي: 1) هل للمنشأة منفعة منها؟ نعم. 2) هل تمنع غيرها من استخدامها؟ نعم. 3) هل تملك صكّها؟ لا. النتيجة: أصل عند المستأجر رغم غياب الملكية.", en: "A crane under an operating lease: 1) Does the entity benefit? Yes. 2) Can it exclude others? Yes. 3) Does it hold the title? No. In this example, the lessee records an asset without owning it." },
  },
  {
    rank: 4,
    label: { ar: "استعادة السؤال", en: "Try the question again" },
    text: { ar: "منشأة تستأجر رافعة وتستخدمها وحدها في مشاريعها. تُدرَج كأصل عندها أم لا؟", en: "An entity leases a crane and uses it exclusively in its projects. Does it record an asset?" },
  },
] as const;

/* الشرائح — تُعرض نصًّا لا رسمًا (البريف يمنع الرسوم التوضيحية).
   تُمرَّر رأسيًا كملف PDF، والشريحة المطابقة لما على السبورة مُعلَّمة. */
export const SLIDES = [
  {
    no: 5,
    title: { ar: "الفصل 3 — نظرة عامة", en: "Chapter 3 — overview" },
    lines: [{ ar: "الأصول والخصوم", en: "Assets and liabilities" }, { ar: "معادلة الميزانية", en: "The accounting equation" }, { ar: "أمثلة تطبيقية", en: "Practical examples" }],
    highlight: -1,
  },
  {
    no: 6,
    title: { ar: "لماذا نصنّف الأصول؟", en: "Why classify assets?" },
    lines: [
      { ar: "التصنيف يحدّد قراءة الميزانية", en: "Classification shapes how you read the balance sheet" },
      { ar: "المتداول مقابل الثابت", en: "Current versus fixed" },
      { ar: "المعيار الزمني: سنة واحدة", en: "Time threshold: one year" },
    ],
    highlight: -1,
  },
  {
    no: 7,
    title: { ar: "تعريف الأصل", en: "Defining an asset" },
    lines: [
      { ar: "تعريف الأصل وفق المعايير:", en: "Definition of an asset under accounting standards:" },
      { ar: "مورد تسيطر عليه المنشأة نتيجة أحداث سابقة", en: "A resource controlled by the entity as a result of past events" },
      { ar: "ويُتوقّع أن تتدفّق منه منافع اقتصادية مستقبلية", en: "Expected to produce future economic benefits" },
      { ar: "الملكية القانونية ليست شرطًا للاعتراف بالأصل", en: "Legal ownership is not required to recognize an asset" },
    ],
    highlight: 3,
  },
  {
    no: 8,
    title: { ar: "السيطرة مقابل الملكية", en: "Control versus ownership" },
    lines: [
      { ar: "السيطرة: القدرة على الانتفاع ومنع الغير", en: "Control: the ability to benefit and exclude others" },
      { ar: "الملكية: حيازة الصكّ القانوني", en: "Ownership: holding the legal title" },
      { ar: "الإيجار التشغيلي مثال على السيطرة بلا ملكية", en: "An operating lease illustrates control without ownership" },
    ],
    highlight: -1,
  },
  {
    no: 9,
    title: { ar: "أخطاء الاختبار", en: "Exam mistakes" },
    lines: [
      { ar: "الخلط بين «تملكه» و«تسيطر عليه»", en: "Confusing “owned” with “controlled”" },
      { ar: "عدّ المصروف المدفوع مقدّمًا خصمًا", en: "Treating a prepaid expense as a liability" },
    ],
    highlight: -1,
  },
];

export const SPEEDS = [
  { id: "slow", label: { ar: "بطيء", en: "Slow" }, factor: 1.45 },
  { id: "normal", label: { ar: "طبيعي", en: "Normal" }, factor: 1 },
  { id: "fast", label: { ar: "سريع", en: "Fast" }, factor: 0.68 },
] as const;

export type SpeedId = (typeof SPEEDS)[number]["id"];
