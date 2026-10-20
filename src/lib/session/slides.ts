/* منطق الشرائح النقيّ: نسبة البطاقة، والشريحة الحالية، وعلامة كل بطاقة،
   وإزاحة التوسيط. المكوّن (`slides-pdf.tsx`) يرسم فقط. */

/* الشرائح المعتادة 4:3؛ تُستعمل إلى أن تُقرأ نسبة الملف الحقيقية */
export const DEFAULT_SLIDE_RATIO = 4 / 3;

/* نسبة العرض إلى الارتفاع من صفحة الملف، أو الافتراضية إن لم تصلح الأبعاد */
export function slideRatio(width: number, height: number): number {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
    ? width / height
    : DEFAULT_SLIDE_RATIO;
}

export type PickedSlide = { page: number; agentPage: number | null };

export type CurrentSlide = {
  /* الشريحة التي يُفتح عليها العمود الآن: اختيار الطالب أو شريحة المعلّم */
  page: number;
  /* شريحة المعلّم (من `scroll`)، أو null قبل أن يطلب شريحة */
  tutorPage: number | null;
  /* الطالب اختار شريحة وما زال اختياره قائمًا */
  pickedActive: boolean;
};

/* اختيار الطالب قائم ما دام المعلّم لم يطلب غير ما كان يطلبه لحظته */
export function currentSlide({
  picked,
  agentPage,
  numPages,
}: {
  picked: PickedSlide | null;
  agentPage: number | null;
  numPages: number;
}): CurrentSlide {
  const clamp = (p: number) => (numPages > 0 ? Math.min(Math.max(p, 1), numPages) : p);
  const pickedActive = picked !== null && picked.agentPage === agentPage;
  const tutorPage = agentPage === null ? null : clamp(agentPage);
  return {
    page: pickedActive ? clamp(picked.page) : (tutorPage ?? 1),
    tutorPage,
    pickedActive,
  };
}

/* علامة البطاقة:
   now    — الشريحة التي يشرحها المعلّم: إطار جوزي + وسم «الآن»
   picked — شريحة اختارها الطالب وليست شريحة المعلّم: إطار محايد بلا وسم
   start  — لم يطلب المعلّم شريحة بعد وشريحة 1 مفتوحة: إطار جوزي بلا وسم
   other  — غيرها: خافتة */
export type SlideMark = "now" | "picked" | "start" | "other";

export function slideMark(p: number, current: CurrentSlide): SlideMark {
  if (current.tutorPage !== null && p === current.tutorPage) return "now";
  if (current.pickedActive && p === current.page) return "picked";
  if (current.tutorPage === null && !current.pickedActive && p === current.page) return "start";
  return "other";
}

/* كم يُزاح التمرير ليقع منتصف العنصر في منتصف الحاوية على محورٍ واحد */
export function centerDelta(
  containerStart: number,
  containerSize: number,
  itemStart: number,
  itemSize: number,
): number {
  return itemStart + itemSize / 2 - (containerStart + containerSize / 2);
}

/* العنصر داخل الحاوية كاملًا على المحور */
export function isWithin(
  containerStart: number,
  containerSize: number,
  itemStart: number,
  itemSize: number,
): boolean {
  return itemStart >= containerStart && itemStart + itemSize <= containerStart + containerSize;
}
