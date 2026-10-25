import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { courseAfterSessionHref, readLimitReached, readRateRoom } from "@/lib/session/rating";

/* لا صفحة ملخّص بعد الآن (ADR 0006): الحصة تنتهي في صفحة المقرر ببطاقة تقييم.
   يبقى هذا المسار تحويلًا فقط، فتصل الروابط القديمة الجارية (`?room=` و`?limit=1`) إلى التقييم نفسه.
   الحساب والتسجيل تقرّرهما صفحة المقرر. */

export default async function DonePage(
  props: PageProps<"/[locale]/session/[code]/[n]/done">,
) {
  const { locale, code } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const search = await props.searchParams;
  return redirect({
    locale,
    href: courseAfterSessionHref(code, { room: readRateRoom(search.room), limit: readLimitReached(search.limit) }),
  });
}
