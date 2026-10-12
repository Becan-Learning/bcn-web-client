import { COURSES, type Course } from "@/lib/data/catalog";

/* بيانات الداشبورد — المقررات المسجَّلة بيانات عرض حتى يصل ربط التسجيل.
   ترتيبها هو ترتيب القائمة المعلَن. */

export type Enrollment = {
  code: string;
};

const ENROLLED: Enrollment[] = [
  { code: "ACCT 101" },
  { code: "MATH 101" },
  { code: "CHEM 101" },
  /* بلا فصول جاهزة — الحالة ٧، تظهر بوسم «قريبًا» ولا تُخفى */
  { code: "EE 201" },
];

/* الحالة ٧ تُصنَع هنا لا في الكتالوج: EE 201 فصولها جاهزة فيه،
   وتعطيلها في الكتالوج يمسّ شاشات أخرى. */
const NOT_READY_YET = new Set(["EE 201"]);

export type EnrolledCourse = Enrollment & {
  course: Course;
  soon: boolean;
};

export function enrolledCourses(): EnrolledCourse[] {
  return ENROLLED.flatMap((e) => {
    const course = COURSES.find((c) => c.code === e.code);
    if (!course) return [];
    const soon = NOT_READY_YET.has(e.code);
    return [{ ...e, course, soon }];
  });
}
