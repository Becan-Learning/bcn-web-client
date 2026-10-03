"use client";

import { Direction } from "radix-ui";
import { useLocale } from "next-intl";

/* اتجاه Radix — النوافذ والقوائم تتبع لغة الواجهة بلا تمرير dir لكل مكوّن.
   مكوّن عميل لأن المزوّد سياق React، والتخطيط الجذري مكوّن خادم. */
export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  return (
    <Direction.Provider dir={locale === "ar" ? "rtl" : "ltr"}>
      {children}
    </Direction.Provider>
  );
}
