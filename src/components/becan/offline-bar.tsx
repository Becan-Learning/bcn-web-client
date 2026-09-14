"use client";

import { useSyncExternalStore } from "react";

/* E3 — انقطاع الاتصال خارج الجلسة.

   **شريط علوي لا يحجب الصفحة**، ويختفي تلقائيًا عند العودة. الجلسة
   لها حالة انقطاعها الخاصة داخلها، ولهذا يسكن هذا الشريط في
   `PageShell` — والجلسة لا تستعملها، فلا يظهر لها شريطان.

   `useSyncExternalStore` لا `useState` في تأثير: القاعدة مفعّلة في
   eslint، ولقطة الخادم `true` فلا يظهر الشريط في HTML الأول ولا
   ينكسر الترطيب.

   ثلاثة أجزاء في سطر واحد: ما حدث ولماذا معًا (ما في اتصال) · وماذا
   الآن (تكمّل الصفحة اللي قدامك، ويرجع الباقي تلقائيًا). والسطر
   قصير عمدًا: شريط يزيح المحتوى 80px على الجوال يعاقب القارئ مرّتين. */

const subscribe = (onChange: () => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

const getSnapshot = () => navigator.onLine;
const getServerSnapshot = () => true;

export function OfflineBar() {
  const online = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (online) return null;

  return (
    /* sticky لا fixed: يزيح المحتوى بدل أن يجلس فوقه، فلا يحجب شيئًا */
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-40 bg-tint-amber"
    >
      <div className="mx-auto flex w-full max-w-page flex-wrap items-baseline gap-x-2 px-4 py-2.5 text-sm md:px-8 xl:px-10">
        <span className="font-semibold text-ink">ما في اتصال</span>
        <span className="text-ink-2">
          الصفحة اللي قدامك تشتغل، ونرجّع الباقي أول ما يرجع.
        </span>
      </div>
    </div>
  );
}
