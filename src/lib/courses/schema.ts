import { z } from "zod";
import { safeIcon, safeTone } from "./presentation";

const localizedSchema = z.object({ ar: z.string().min(1), en: z.string().min(1) });
const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,79}$/);
/* معرّف الفصل والمقرر uuid من الخادم؛ لا نفترض نسخة بعينها. */
export const uuidSchema = z.string().uuid();
const countSchema = z.number().int().nonnegative();
/* المقرر المؤرشف يبقى لمن سجّل فيه؛ الكتالوج والتسجيل الجديد لا يعرضانه. القراءة العامة لا تعيد المسوّدة أبدًا. */
export const courseStatusSchema = z.enum(["published", "archived"]);
/* قراءة معاينة المشرف وحدها قد تعيد المسوّدة (ADR 0005). */
export const previewCourseStatusSchema = z.enum(["draft", "published", "archived"]);

export const courseSummarySchema = z.object({
  id: uuidSchema,
  slug: slugSchema,
  status: courseStatusSchema,
  code: z.string().min(1),
  name: localizedSchema,
  institution: z.object({ id: slugSchema, name: localizedSchema }),
  icon: z.string().transform(safeIcon),
  tone: z.string().transform(safeTone),
  chapterCount: countSchema,
  publishedChapterCount: countSchema,
});
/* مسار المحتوى بادئة داخل تخزين Bunny تنتهي بـ«/»؛ لا مقاطع فارغة ولا «..». */
export const contentPathSchema = z.string().regex(/^(?:[^/\\]+\/)+$/).refine(
  (path) => path.split("/").every((segment) => segment !== "." && segment !== ".."),
);
export const chapterStateSchema = z.enum(["coming_soon", "published"]);
export const previewChapterStateSchema = z.enum(["draft", "coming_soon", "published"]);
export const chapterSchema = z.object({
  id: uuidSchema,
  number: z.number().int().positive(),
  title: localizedSchema,
  minutes: z.number().int().positive(),
  lessonCount: countSchema,
  state: chapterStateSchema,
  contentPath: contentPathSchema.nullable(),
});
export const courseSchema = courseSummarySchema.extend({ chapters: z.array(chapterSchema) });
/* `GET /chapters/:chapterId`: الفصل ومقرره كاملًا (جسم `GET /courses/:slug` نفسه). */
export const chapterLookupSchema = z.object({ chapter: chapterSchema, course: courseSchema });
export const coursesSchema = z.array(courseSummarySchema);

/* ————— قراءة معاينة المشرف: `GET /api/v1/admin/preview/*` (بلا تخزين مؤقت، للمشرفين وحدهم) —————
   أشكال الكتالوج العامة نفسها، مع مسوّدة المقرر والفصل، و`contentPath` الحيّ في أي حالة،
   و`versions`: نسخ المحتوى الصالحة (الأحدث أولًا). `id` النسخة هو ما يأخذه طلب الرمز. */
export const contentVersionSchema = z.object({
  id: uuidSchema,
  version: z.number().int().positive(),
  live: z.boolean(),
  previewed: z.boolean(),
  contentPath: contentPathSchema,
});
export const previewCourseSummarySchema = courseSummarySchema.extend({ status: previewCourseStatusSchema });
export const previewCoursesSchema = z.array(previewCourseSummarySchema);
export const previewChapterSchema = chapterSchema.extend({
  state: previewChapterStateSchema,
  versions: z.array(contentVersionSchema),
});
export const previewCourseSchema = previewCourseSummarySchema.extend({
  chapters: z.array(previewChapterSchema),
  versions: z.array(contentVersionSchema),
});
export const previewChapterLookupSchema = z.object({ chapter: previewChapterSchema, course: previewCourseSchema });
export const enrollmentSchema = z.object({
  enrolledAt: z.string().datetime({ offset: true }),
  course: courseSummarySchema,
});
export const enrollmentsSchema = z.array(enrollmentSchema);
export const tokenSchema = z.object({
  token: z.string().min(1),
  serverUrl: z.string().url(),
  /* البادئتان المثبَّتتان لهذه الحصة، لا ما صار حيًا بعدها. */
  contentPath: contentPathSchema,
  courseContentPath: contentPathSchema,
});
export const backendErrorSchema = z.object({
  error: z.object({ message: z.string(), code: z.string().optional() }),
});

/* الأنواع تتسع للمسوّدة والنسخ: القراءة العامة تنتج مجموعة جزئية منها (لا مسوّدة ولا `versions`)،
   وقراءة المعاينة تنتجها كاملة. */
export type CourseStatus = z.infer<typeof previewCourseStatusSchema>;
export type ChapterState = z.infer<typeof previewChapterStateSchema>;
export type ContentVersion = z.infer<typeof contentVersionSchema>;
export type CourseSummary = Omit<z.infer<typeof courseSummarySchema>, "status"> & { status: CourseStatus };
export type Chapter = Omit<z.infer<typeof chapterSchema>, "state"> & { state: ChapterState; versions?: ContentVersion[] };
export type Course = CourseSummary & { chapters: Chapter[]; versions?: ContentVersion[] };
export type ChapterLookup = { chapter: Chapter; course: Course };
export type Enrollment = z.infer<typeof enrollmentSchema>;
