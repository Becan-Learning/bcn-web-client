import { useCallback, useSyncExternalStore } from "react";

/* بديل useReducedMotion من motion داخل الجلسة.

   هو يقرأ تفضيل النظام في أوّل رسم على العميل، فيرى الترطيب true بينما
   رسم الخادم false. و`reduce` يغيّر شكل الشجرة (BoardPresence يضيف
   AnimatePresence أو يحذفه)، فيتبدّل معرّف useId في LanguageChoice وينكسر
   الترطيب عند من فعّل «تقليل الحركة».

   لقطة الخادم false وتُستعمل أثناء الترطيب نفسه، ثم يصحّح React القيمة
   برسمٍ ثانٍ — النمط نفسه في use-is-mobile. */
const REDUCE_MQ = "(prefers-reduced-motion: reduce)";

export function useReducedMotion() {
  const subscribe = useCallback((notify: () => void) => {
    const mq = window.matchMedia(REDUCE_MQ);
    mq.addEventListener("change", notify);
    return () => mq.removeEventListener("change", notify);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCE_MQ).matches,
    () => false,
  );
}
