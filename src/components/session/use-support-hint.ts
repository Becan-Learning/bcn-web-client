import { useEffect, useState } from "react";

/* فقاعة «الدعم من هنا» تظهر مرة واحدة ثم تختفي وحدها.

   العدّ يبدأ أول مرة يصير فيها `enabled` صحيحًا (حين لا يغطّيها شيء) ولا
   يتوقف ولا يُعاد بعدها: الفقاعة تنبيه لمرة واحدة لا حالة تتبع الجلسة.
   `began` يُضبط أثناء الرسم لا في تأثير (قاعدة react-hooks/set-state-in-effect)،
   وهذا آمن لأن `enabled` يخرج false في الخادم وأثناء الترطيب. */
export const SUPPORT_HINT_MS = 3_000;

export function useSupportHint(enabled: boolean) {
  const [began, setBegan] = useState(false);
  const [expired, setExpired] = useState(false);
  if (enabled && !began) setBegan(true);

  useEffect(() => {
    if (!began) return;
    const timer = setTimeout(() => setExpired(true), SUPPORT_HINT_MS);
    return () => clearTimeout(timer);
  }, [began]);

  return began && !expired;
}
