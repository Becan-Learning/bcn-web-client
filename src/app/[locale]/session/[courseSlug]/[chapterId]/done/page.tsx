import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { findSessionTarget } from "@/lib/auth/courses";
import { courseAfterSessionHref, readLimitReached, readRateRoom } from "@/lib/session/rating";

/* لا صفحة ملخّص بعد الآن (ADR 0006): الحصة تنتهي في صفحة المقرر ببطاقة تقييم.
   يبقى هذا المسار تحويلًا فقط، فتصل الروابط القديمة الجارية (`?room=` و`?limit=1`) إلى التقييم نفسه.
   المقرر يُحلّ بمعرّف الفصل كما كانت الصفحة تفعل: لو غيّر المقرر رابطه (slug) أثناء الحصة وصلنا إلى الحالي.
   غير الموجود علنًا (مسوّدة مشرف) يبقى على الرابط الذي جاء به. الحساب والتسجيل والأرشفة تقرّرها صفحة المقرر. */

export default async function DonePage(
  props: PageProps<"/[locale]/session/[courseSlug]/[chapterId]/done">,
) {
  const { locale, courseSlug, chapterId } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const search = await props.searchParams;
  const target = await findSessionTarget(courseSlug, chapterId);
  const slug = target.kind === "found" ? target.course.slug : target.kind === "redirect" ? target.slug : courseSlug;
  return redirect({
    locale,
    href: courseAfterSessionHref(slug, { room: readRateRoom(search.room), limit: readLimitReached(search.limit) }),
  });
}
