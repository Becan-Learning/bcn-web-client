import { z } from "zod";
import { safeIcon, safeTone } from "./presentation";

const localizedSchema = z.object({ ar: z.string().min(1), en: z.string().min(1) });
const idSchema = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,79}$/);
const countSchema = z.number().int().nonnegative();

export const courseSummarySchema = z.object({
  id: idSchema,
  code: z.string().min(1),
  name: localizedSchema,
  institution: z.object({ id: idSchema, name: localizedSchema }),
  icon: z.string().transform(safeIcon),
  tone: z.string().transform(safeTone),
  chapterCount: countSchema,
  publishedChapterCount: countSchema,
});
export const chapterSchema = z.object({
  number: z.number().int().positive(),
  title: localizedSchema,
  minutes: z.number().int().positive(),
  lessonCount: countSchema,
  published: z.boolean(),
});
export const courseSchema = courseSummarySchema.extend({ chapters: z.array(chapterSchema) });
export const coursesSchema = z.array(courseSummarySchema);
export const enrollmentSchema = z.object({
  enrolledAt: z.string().datetime({ offset: true }),
  course: courseSummarySchema,
});
export const enrollmentsSchema = z.array(enrollmentSchema);
export const tokenSchema = z.object({ token: z.string().min(1), serverUrl: z.string().url() });
export const backendErrorSchema = z.object({
  error: z.object({ message: z.string(), code: z.string().optional() }),
});

export type CourseSummary = z.infer<typeof courseSummarySchema>;
export type Course = z.infer<typeof courseSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type Enrollment = z.infer<typeof enrollmentSchema>;
