import { useCallback, useSyncExternalStore } from "react";

/* هل يطابق شرط تنبيه قلب الشاشة (RotateNotice)؟ نفس شرط CSS:
   `portrait:flex md:portrait:hidden` — رأسي ودون md (48rem).

   لقطة الخادم true لا false: الترطيب يرى «مغطّى»، فلا يبدأ عدّ فقاعة
   الدعم قبل أن يُعرف الاتجاه الحقيقي على العميل. */
const PORTRAIT_PHONE_MQ = "(orientation: portrait) and (max-width: 47.9375rem)";

export function usePortraitPhone() {
  const subscribe = useCallback((notify: () => void) => {
    const mq = window.matchMedia(PORTRAIT_PHONE_MQ);
    mq.addEventListener("change", notify);
    return () => mq.removeEventListener("change", notify);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PORTRAIT_PHONE_MQ).matches,
    () => true,
  );
}
