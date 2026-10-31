import { useEffect, useState } from "react";

/* فقاعة «الدعم من هنا» تظهر عند فتح الصفحة ثم تختفي وحدها.

   المؤقّت يبدأ مع أول تركيب ولا يُعاد: الفقاعة تنبيه لمرة واحدة،
   لا حالة تتبع الجلسة. */
export const SUPPORT_HINT_MS = 3_000;

export function useSupportHint() {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShown(false), SUPPORT_HINT_MS);
    return () => clearTimeout(timer);
  }, []);
  return shown;
}
