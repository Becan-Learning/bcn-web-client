"use client";

import { useTranslations } from "next-intl";

import { GhostButton } from "@/components/becan/kit";

/** طباعة الفاتورة — ومن نافذة الطباعة يحفظها الطالب PDF.
    عميل لأن `window.print` لا وجود له على الخادم. */
export function PrintButton() {
  const t = useTranslations("Settings.Invoice");
  return (
    <GhostButton onClick={() => window.print()} className="w-full sm:w-fit">
      {t("print")}
    </GhostButton>
  );
}
