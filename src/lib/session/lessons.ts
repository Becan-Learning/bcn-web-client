import type { ChapterContent } from "./content";
import type { Lesson } from "./session-reducer";

/* قائمة دروس الفصل — تُجلب على الخادم من تخزين Bunny، فتصل الصفحة
   جاهزةً بلا تأثير جلب في المتصفّح ولا مفتاح مكشوف.
   الشكل المتوقّع: `{ lessons: [{ name, brief, slug }] }`. */

function isLessonLike(v: unknown): v is { name: string; slug: string; brief?: unknown } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { name?: unknown }).name === "string" &&
    typeof (v as { slug?: unknown }).slug === "string"
  );
}

export async function getLessons(content: ChapterContent): Promise<Lesson[]> {
  const base = process.env.BUNNY_STORAGE_PULL_ZONE_URL;
  const key = process.env.BUNNY_STORAGE_API_KEY;
  if (!base || !key) return [];

  try {
    const res = await fetch(
      `${base.replace(/\/+$/, "")}/courses/${content.courseId}/${content.chapterId}/lessons_list.json`,
      { headers: { AccessKey: key }, cache: "no-store" },
    );
    if (!res.ok) return [];

    const data: unknown = await res.json();
    const list =
      typeof data === "object" && data !== null && Array.isArray((data as { lessons?: unknown }).lessons)
        ? (data as { lessons: unknown[] }).lessons
        : [];

    return list.filter(isLessonLike).map((l) => ({
      name: l.name,
      slug: l.slug,
      brief: typeof l.brief === "string" ? l.brief : "",
    }));
  } catch (error) {
    console.error("Failed to load lessons list:", error);
    return [];
  }
}
