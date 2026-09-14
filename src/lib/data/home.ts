import {
  chaptersOf,
  COURSES,
  readyCount,
  slugOf,
  type Course,
} from "@/lib/data/catalog";

/* بيانات الداشبورد — الشاشة ٨ في docs/design-brief-dashboard.md.

   الفصول الجاهزة تُشتقّ من الكتالوج (`readyCount`) فلا تنحرف عمّا
   يراه الطالب في صفحة المقرر. أما التسجيل والتقدّم ومواعيد الاختبار
   فبيانات عرض حتى يصل حساب حقيقي.

   `daysLeft` مخزَّن لا محسوب من `new Date()`: الحساب وقت الرسم يختلف
   بين الخادم والمتصفّح فينكسر الترطيب، وهو مزلق مسجَّل في STATE. */

export type Enrollment = {
  code: string;
  /** الفصول التي أنجزها الطالب */
  done: number;
  /** تاريخ أقرب حدث، أو null إن لم يُحدَّد بعد */
  examLabel: string | null;
  daysLeft: number | null;
};

const ENROLLED: Enrollment[] = [
  { code: "ACCT 101", done: 3, examLabel: "12 ديسمبر", daysLeft: 9 },
  { code: "MATH 101", done: 5, examLabel: "18 ديسمبر", daysLeft: 15 },
  { code: "CHEM 101", done: 1, examLabel: null, daysLeft: null },
  /* بلا فصول جاهزة — الحالة ٧، تظهر بوسم «قريبًا» ولا تُخفى */
  { code: "EE 201", done: 0, examLabel: "20 ديسمبر", daysLeft: 17 },
];

/* الحالة ٧ تُصنَع هنا لا في الكتالوج: EE 201 فصولها جاهزة فيه،
   وتعطيلها في الكتالوج يمسّ شاشات أخرى. */
const NOT_READY_YET = new Set(["EE 201"]);

export type EnrolledCourse = Enrollment & {
  course: Course;
  /** عدد الفصول الجاهزة — مقام شريط التقدّم */
  ready: number;
  soon: boolean;
};

/** الأقرب اختبارًا أولًا — لا أبجديًا ولا بترتيب التسجيل.
    وما لا تاريخ له يقع في الآخر: لا إلحاح فيه. */
export function enrolledCourses(): EnrolledCourse[] {
  return ENROLLED.flatMap((e) => {
    const course = COURSES.find((c) => c.code === e.code);
    if (!course) return [];
    const soon = NOT_READY_YET.has(e.code);
    return [{ ...e, course, ready: soon ? 0 : readyCount(e.code), soon }];
  }).sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity));
}

/** أين كان الطالب — الفصل التالي في المقرر الأقرب اختبارًا.

    تستعمله شاشة نتيجة الدفع كي يعود الزرّ إلى ما كان يفعله لا إلى
    الصفحة الرئيسية. مشتقّ من التسجيل لا مكتوب مرّة أخرى، فلا يفترق
    عمّا يراه في الداشبورد. */
export function resumePoint() {
  const next = enrolledCourses().find((c) => !c.soon && c.done < c.ready);
  if (!next) return null;

  const chapter = chaptersOf(next.code).filter((c) => c.ready)[next.done];
  if (!chapter) return null;

  return {
    courseName: next.course.name,
    slug: slugOf(next.code),
    chapterNo: chapter.n,
    chapterTitle: chapter.title,
  };
}
