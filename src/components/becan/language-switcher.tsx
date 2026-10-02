"use client";

import { useLocale, useTranslations } from "next-intl";
import { useInterfaceLanguage } from "./use-interface-language";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("LanguageSwitcher");
  const switchLanguage = useInterfaceLanguage();
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() => switchLanguage(nextLocale)}
      aria-label={t("ariaLabel")}
      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-pill border border-line px-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span lang={nextLocale} dir={nextLocale === "en" ? "ltr" : "rtl"}>
        {t("label")}
      </span>
    </button>
  );
}
