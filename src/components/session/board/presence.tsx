import type { ReactNode } from "react";
import { AnimatePresence } from "motion/react";

/* يبقى المغادر حتى يكتمل تلاشيه، ويصل الجديد دون انتظار.
   تعطيل الحركة يزيله مباشرة؛ وتمرير الخروج يحفظ ذلك عند مسح الحاوية كلها. */
export function BoardPresence({ children, reduce }: { children: ReactNode; reduce: boolean }) {
  return reduce ? children : <AnimatePresence propagate>{children}</AnimatePresence>;
}
