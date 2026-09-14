/* من فصل الكتالوج إلى محتواه في تخزين Bunny.

   الكتالوج ما زال بيانات عرض (`src/lib/data/catalog.ts`)، والمحتوى
   الحقيقي الوحيد اليوم هو `becan-test / ch_1`. فكل فصل جاهز يُفتح على
   ذلك المحتوى حتى يصل الكتالوج الحقيقي.
   TODO: يُستبدل بجدول chapters في Supabase (course slug + order_index + pdf_url). */

export type ChapterContent = {
  /** `course_id` في سمات الوكيل ومجلد المقرر في التخزين */
  courseId: string;
  /** `chapter_id` في سمات الوكيل ومجلد الفصل في التخزين */
  chapterId: string;
};

const MAP: Record<string, ChapterContent> = {
  // "ACCT 101#3": { courseId: "acct-101", chapterId: "ch_3" },
};

const FALLBACK: ChapterContent = { courseId: "becan-test", chapterId: "ch_1" };

export function contentFor(courseCode: string, chapterNo: number): ChapterContent {
  return MAP[`${courseCode}#${chapterNo}`] ?? FALLBACK;
}

/** الشرائح عبر وسيط التخزين — من الأصل نفسه، بلا CORS ولا مفتاح في المتصفّح */
export const slidesUrl = (c: ChapterContent) =>
  `/api/fetch-bunny/courses/${c.courseId}/${c.chapterId}/slides.pdf`;
