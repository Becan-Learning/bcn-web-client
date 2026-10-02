import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "as-needed",
  alternateLinks: true,
  /* الاختيار الصريح وحده يُحفظ — المبدّل يكتب الكوكي وفق ADR 0002. */
  localeCookie: false,
  localeDetection: false,
});
