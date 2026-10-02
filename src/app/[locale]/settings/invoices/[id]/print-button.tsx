"use client";

import { GhostButton } from "@/components/becan/kit";

/** طباعة الفاتورة — ومن نافذة الطباعة يحفظها الطالب PDF.
    عميل لأن `window.print` لا وجود له على الخادم. */
export function PrintButton() {
  return (
    <GhostButton onClick={() => window.print()} className="w-full sm:w-fit">
      احفظ الفاتورة
    </GhostButton>
  );
}
