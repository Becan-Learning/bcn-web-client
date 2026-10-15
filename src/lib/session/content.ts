import type { Lesson } from "./session-reducer";

/* مسارات محتوى الفصل — كلها من الخادم، لا يُبنى منها شيء من رقم الفصل.
   `contentPath` بادئة داخل تخزين Bunny تنتهي بـ«/» (مثل `courses/becan-test/ch_1/`)،
   والويب يعاملها نصًّا معتمًا ويضيف إليها اسم الملف فقط. */

export const LESSONS_FILE = "lessons_list.json";
export const SLIDES_FILE = "slides.pdf";

/* مقاطع المسار الكاملة لملف تحت البادئة. ترفض الفارغ و«.» و«..» وكل شرطة مائلة عكسية. */
export function contentSegments(prefix: string, file: string): string[] {
  const parts = [...(prefix.endsWith("/") ? prefix.slice(0, -1) : prefix).split("/"), file];
  if (parts.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("\\"))) {
    throw new Error("Invalid content path");
  }
  return parts;
}

/* رابط ملف المحتوى عبر وسيط Bunny على الأصل نفسه. */
export function contentProxyUrl(prefix: string, file: string): string {
  return `/api/fetch-bunny/${contentSegments(prefix, file).map(encodeURIComponent).join("/")}`;
}

/* رابط ملف المحتوى في تخزين Bunny مباشرةً — للخادم وحده. */
export function contentStorageUrl(base: string, prefix: string, file: string): string {
  return `${base.replace(/\/+$/, "")}/${contentSegments(prefix, file).map(encodeURIComponent).join("/")}`;
}

/* بعد وصول الرمز: المسار المثبَّت فيه هو المرجع، وإلا مسار الكتالوج. */
export function activeContentPath(catalogPath: string, pinnedPath: string | null): string {
  return pinnedPath ?? catalogPath;
}

/* الدروس التي جلبها الخادم كانت من مسار الكتالوج؛ تُعاد قراءتها فقط إن ثُبّتت الحصة على مسار آخر. */
export function lessonsNeedRefetch(catalogPath: string, pinnedPath: string | null): pinnedPath is string {
  return pinnedPath !== null && pinnedPath !== catalogPath;
}

function isLessonLike(v: unknown): v is { name: string; slug: string; brief?: unknown } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { name?: unknown }).name === "string" &&
    typeof (v as { slug?: unknown }).slug === "string"
  );
}

/* الشكل المتوقّع: `{ lessons: [{ name, brief, slug }] }`. */
export function parseLessons(data: unknown): Lesson[] {
  const list =
    typeof data === "object" && data !== null && Array.isArray((data as { lessons?: unknown }).lessons)
      ? (data as { lessons: unknown[] }).lessons
      : [];
  return list.filter(isLessonLike).map((l) => ({
    name: l.name,
    slug: l.slug,
    brief: typeof l.brief === "string" ? l.brief : "",
  }));
}
