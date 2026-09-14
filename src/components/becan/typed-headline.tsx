"use client";

import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { HighlightSvg, highlightBox } from "./kit";

/* العنوان يُكتب كأنه رسالة، ثم تُرسم مسحة الفرشاة تحت الكلمة.

   الكشف بالقصّ لا بإظهار الحروف واحدًا واحدًا: الخط العربي متّصل،
   وإخفاء حرف يكسر وصلته بجاره. القصّ من اليمين لليسار يوافق اتجاه
   القراءة ويُبقي الوصلات سليمة.

   كل شيء مقود بقيمتَي حركة لا بحالة React — فلا إعادة رسم أثناء
   التشغيل ولا تحديث حالة داخل التأثير. */

/* المقاس خيار لا صنف يُكدَّس فوق الأصناف الأساسية: تمرير
   `text-4xl` في className لا يغلب `xl:text-7xl` المكتوب هنا —
   الفائز ترتيب Tailwind لا ترتيب السلسلة، فيخرج العنوان بحجمه
   الأكبر ويفيض عن حاويته. (مزلق 8 في STATE.) */
const HEADLINE_SIZE = {
  page: "text-5xl md:text-6xl xl:text-7xl",
  card: "text-3xl md:text-4xl",
} as const;

export function TypedHeadline({
  prefix,
  word,
  suffix,
  className = "",
  size = "page",
}: {
  prefix: string;
  word: string;
  suffix?: string;
  className?: string;
  size?: keyof typeof HEADLINE_SIZE;
}) {
  const reduce = useReducedMotion();

  const typing = useMotionValue(0);
  const drawing = useMotionValue(0);

  /* عند 1 يُرفع القصّ تمامًا، وإلا قصّ المسحة المتجاوزة لحدّ الكلمة */
  const clipPath = useTransform(typing, (p) =>
    p >= 1 ? "none" : `inset(0 0 0 ${(1 - p) * 100}%)`,
  );
  const caretStart = useTransform(typing, (p) => `${p * 100}%`);
  const caretOpacity = useTransform(typing, (p) => (p >= 1 ? 0 : 1));

  const chars = prefix.length + word.length + (suffix?.length ?? 0);
  const duration = Math.max(0.7, chars * 0.11);

  useEffect(() => {
    if (reduce) {
      typing.set(1);
      drawing.set(1);
      return;
    }
    const type = animate(typing, 1, { duration, ease: "linear" });
    const draw = animate(drawing, 1, {
      duration: 0.45,
      delay: duration,
      ease: [0.2, 0.7, 0.3, 1],
    });
    return () => {
      type.stop();
      draw.stop();
    };
  }, [reduce, typing, drawing, duration]);

  return (
    <h1
      className={`font-display leading-tight font-bold text-ink ${HEADLINE_SIZE[size]} ${className}`}
    >
      <motion.span className="relative inline-block" style={{ clipPath }}>
        <span className="relative z-10">{prefix}</span>{" "}
        <span className="relative isolate inline-block">
          <motion.span
            aria-hidden="true"
            className={`${highlightBox} origin-right`}
            style={{ scaleX: drawing, opacity: drawing }}
          >
            <HighlightSvg />
          </motion.span>
          <span className="relative z-10">{word}</span>
        </span>
        {suffix ? <span className="relative z-10">{suffix}</span> : null}
        {/* مؤشّر الكتابة — يسير مع حدّ القصّ ثم يختفي */}
        <motion.span
          aria-hidden="true"
          className="absolute top-[0.18em] bottom-[0.12em] z-20 w-[3px] rounded-pill bg-ink"
          style={{ insetInlineStart: caretStart, opacity: caretOpacity }}
        />
      </motion.span>
    </h1>
  );
}
