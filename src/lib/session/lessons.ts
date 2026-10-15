import { LESSONS_FILE, contentStorageUrl, parseLessons } from "./content";
import type { Lesson } from "./session-reducer";

/* قائمة دروس الفصل — تُجلب على الخادم من تخزين Bunny، فتصل الصفحة
   جاهزةً بلا تأثير جلب في المتصفّح ولا مفتاح مكشوف.
   `contentPath` من الكتالوج (نسخة المحتوى الحيّة)؛ وتُعاد القراءة من المسار
   المثبَّت في الرمز إن اختلف عنه (انظر `useSessionContent`). */

export async function getLessons(contentPath: string): Promise<Lesson[]> {
  const base = process.env.BUNNY_STORAGE_PULL_ZONE_URL;
  const key = process.env.BUNNY_STORAGE_API_KEY;
  if (!base || !key) return [];

  try {
    const res = await fetch(contentStorageUrl(base, contentPath, LESSONS_FILE), {
      headers: { AccessKey: key },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return parseLessons(await res.json());
  } catch (error) {
    console.error("Failed to load lessons list:", error);
    return [];
  }
}
