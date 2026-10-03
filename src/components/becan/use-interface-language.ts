"use client";

import type { Locale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function useInterfaceLanguage() {
  const pathname = usePathname();
  const router = useRouter();

  return function switchLanguage(locale: Locale) {
    /* نحفظ الاختيار الصريح قبل التنقّل كي لا يعيد الوسيط الطالب للغة السابقة. */
    document.cookie = `NEXT_LOCALE=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.replace(`${pathname}${window.location.search}${window.location.hash}`, {
      locale,
    });
  };
}
