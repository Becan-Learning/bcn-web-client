import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/* يتبع رسالة «تم إيقاف حسابك»: الرسالة نفسها نصّ عادي في `Auth.Errors`
   كي تصلح أينما عُرض خطأ مصادقة، والرابط هنا إلى صفحة التواصل القائمة
   (واتساب أولًا ثم النموذج). */
export function BannedSupportLink() {
  const t = useTranslations("Auth.Banned");
  return (
    <Link
      href="/contact"
      className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
    >
      {t("contact")}
    </Link>
  );
}
