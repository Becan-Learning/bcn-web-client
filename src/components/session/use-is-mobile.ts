import { useCallback, useSyncExternalStore } from "react";

/* دون md (48rem) لا عمودَي جانب، فزرّا الشرائح والمواضيع يفتحان
   ورقةً سفلية بدل أن يبدّلا عمودًا لا وجود له.

   useSyncExternalStore لا useState داخل تأثير: قاعدة
   react-hooks/set-state-in-effect مفعّلة، ولقطة الخادم false
   فيُرسَم الديسكتوب أولًا ثم يصحّح الترطيب. */
const MOBILE_MQ = "(max-width: 47.9375rem)";

export function useIsMobile() {
  const subscribe = useCallback((notify: () => void) => {
    const mq = window.matchMedia(MOBILE_MQ);
    mq.addEventListener("change", notify);
    return () => mq.removeEventListener("change", notify);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_MQ).matches,
    () => false,
  );
}
