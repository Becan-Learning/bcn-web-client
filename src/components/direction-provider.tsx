"use client";

import { Direction } from "radix-ui";

/* اتجاه Radix — النوافذ والقوائم تقرأ RTL بلا تمرير dir لكل مكوّن.
   مكوّن عميل لأن المزوّد سياق React، والتخطيط الجذري مكوّن خادم. */
export function DirectionProvider({ children }: { children: React.ReactNode }) {
  return <Direction.Provider dir="rtl">{children}</Direction.Provider>;
}
