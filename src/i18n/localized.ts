import type { Locale } from "next-intl";

/** نصّ سجلّ بيانات بحسب لغة الواجهة، دون تغيير المعرّف أو الرمز. */
export type Localized = Record<Locale, string>;

export function localize(value: Localized, locale: Locale): string {
  return value[locale];
}
