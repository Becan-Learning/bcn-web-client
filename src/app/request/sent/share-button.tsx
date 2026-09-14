"use client";

import { useState } from "react";

/* «شارك بيكان مع زملائك» — الخيار الثانوي في شاشة التأكيد.
   محدّد الإطار لا كهرماني: الكهرماني محجوز للزر الأساسي الواحد.

   يستخدم مشاركة النظام حيث تتوفّر (الجوال غالبًا)، وينسخ الرابط
   حيث لا تتوفّر. لا يترك المستخدم بلا استجابة في الحالتين. */

export function ShareButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied">("idle");

  const share = async () => {
    const url = `${window.location.origin}/request`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "بيكان", text, url });
        return;
      } catch {
        /* أغلق المستخدم لوحة المشاركة — ننتقل للنسخ */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2500);
    } catch {
      /* المتصفّح منع الحافظة — لا شيء نفعله */
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={share}
        className="inline-flex h-14 w-full items-center justify-center rounded-pill border border-aubergine-mid px-8 text-lg font-semibold text-aubergine-base sm:w-auto"
      >
        شارك بيكان مع زملائك
      </button>
      <p role="status" className="mt-2 min-h-5 text-sm text-ink-2">
        {state === "copied" ? "نُسخ الرابط" : ""}
      </p>
    </div>
  );
}
