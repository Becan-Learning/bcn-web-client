"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("LanguageSwitcher");
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale = locale === "ar" ? "en" : "ar";

  function switchLanguage() {
    /* الكوكي لا يُكتب إلا هنا، قبل التنقّل، حتى تبقى العودة اختيارًا صريحًا. */
    document.cookie = `NEXT_LOCALE=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.replace(`${pathname}${window.location.search}${window.location.hash}`, {
      locale: nextLocale,
    });
  }

  return (
    <button
      type="button"
      onClick={switchLanguage}
      aria-label={t("ariaLabel")}
      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-pill border border-line px-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span lang={nextLocale} dir={nextLocale === "en" ? "ltr" : "rtl"}>
        {t("label")}
      </span>
    </button>
  );
}
