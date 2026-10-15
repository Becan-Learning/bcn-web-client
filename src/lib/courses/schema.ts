import { z } from "zod";
import { safeIcon, safeTone } from "./presentation";

const localizedSchema = z.object({ ar: z.string().min(1), en: z.string().min(1) });
const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,79}$/);
/* معرّف الفصل والمقرر uuid من الخادم؛ لا نفترض نسخة بعينها. */
export const uuidSchema = z.string().uuid();
const countSchema = z.number().int().nonnegative();

export const courseSummarySchema = z.object({
  id: uuidSchema,
  slug: slugSchema,
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
export const coursesSchema = z.array(courseSummarySchema);
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

export type CourseSummary = z.infer<typeof courseSummarySchema>;
export type Course = z.infer<typeof courseSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type ChapterState = z.infer<typeof chapterStateSchema>;
export type Enrollment = z.infer<typeof enrollmentSchema>;
