"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useSpring } from "motion/react";

/* وجه بيكان.

   القبّعة مرفوعة حاليًا — مكوّن Cap ما زال مصدَّرًا من هذا الملف
   فتعود بسطر واحد. أصلها من ملف الهوية (SVG/Asset 1.svg).

   العينان والابتسامة مرسومتان هنا لأنهما يتحرّكان: يرمش بالعينين
   معًا ثم يغمز بواحدة، ويميل رأسه ميلة خفيفة. */

const EYE = {
  transformBox: "fill-box" as const,
  transformOrigin: "center" as const,
};

export function Cap() {
  return (
    <g
      transform="translate(1.5 2) scale(2.16)"
      fill="none"
      stroke="currentColor"
      strokeMiterlimit={10}
    >
      {/* طرف الشرّابة */}
      <polygon
        points="39.27 12.28 39.58 12.83 39.89 13.38 39.27 13.38 38.66 13.38 38.97 12.83 39.27 12.28"
        strokeLinecap="round"
        strokeWidth={2}
      />
      {/* جسم القبّعة */}
      <path
        d="m21.48,10.44L1.74,6.46c-.33-.07-.32-.29.02-.37L21.13,1.52c.11-.03.24-.03.35-.01l21.59,3.42c.36.06.37.29.01.37l-21.23,5.13c-.12.03-.27.03-.39,0Z"
        fill="currentColor"
        strokeWidth={3}
      />
      {/* حبل الشرّابة — fill=none صراحةً: الأصل يتركه فيمتلئ أسود */}
      <path
        d="m39.27,5.43s1.18,4.3,0,6.84"
        strokeLinecap="round"
        strokeWidth={2}
      />
    </g>
  );
}

/* وجه بيكان مصغَّرًا — للأحجام الصغيرة كزرّ التشغيل.

   ليس BecanFace بمقاس أصغر: ذاك يشغّل زنبركين ودورتَي رمش وميلًا،
   وكلها تضيع تحت 24px وتبقى تكلفتها. هنا عينان وفم فقط.

   يرث اللون بـcurrentColor فيصلح فوق الكهرماني وفوق غيره، والفم
   يتحرّك بـCSS لا بـMotion لأن حركته دورية ثابتة لا مقودة بحدث. */
export function BecanGlyph({
  /* بنسبة الـviewBox المقصوص (68×52 ≈ 1.31:1). الصندوق المربّع
     يحشر الوجه في وسطه فيصغر — والنسبة الخاطئة كانت أول سبب
     لاختلافه عن الوجه الكبير. */
  className = "h-5 w-[26px]",
  speaking = false,
}: {
  className?: string;
  speaking?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      /* الأشكال منسوخة حرفيًا من BecanFace أدناه — نفس إحداثيات
         العينين ونفس قوس الابتسامة وسُمكه. أي تعديل على الوجه
         الكبير يُنقل إلى هنا وإلا افترق الوجهان.

         الـviewBox وحده مقصوص على حدود الوجه (16 6 68 52) بدل
         100×58: الأصل يترك هامشًا واسعًا حول الملامح، وعند 28px
         تصير العين 3.4×5.2 بكسل فتُقرأ نقطةً ويصير الوجه سمايلي
         عامًّا. القصّ يكبّر الملامح بلا أن يغيّر شكلها. */
      viewBox="16 6 68 52"
      className={`${speaking ? "" : "animate-face-tilt"} ${className}`}
      style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
      fill="currentColor"
    >
      {/* العينان ترمشان دائمًا، والغمزة قبل البدء وحدها: أثناء الشرح
          يكفي الفم، وغمزةٌ مع الكلام تشتّت عمّا يُقال. */}
      <rect
        x="30"
        y="10"
        width="12"
        height="19"
        rx="6"
        className="animate-blink"
        style={EYE}
      />
      <rect
        x="58"
        y="10"
        width="12"
        height="19"
        rx="6"
        className={speaking ? "animate-blink" : "animate-wink"}
        style={EYE}
      />

      {/* الفم هو قوس الابتسامة نفسه — أثناء الكلام يتمدّد ويرتدّ
          بإيقاع غير منتظم فيُقرأ نطقًا، ولا يُستبدل بشكل آخر كي لا
          يتغيّر الوجه بين حالتيه. */}
      <path
        d="M24 42c16 11 36 11 52 0"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
        className={speaking ? "animate-talk" : undefined}
        style={
          speaking
            ? { transformBox: "fill-box", transformOrigin: "center" }
            : undefined
        }
      />
    </svg>
  );
}

/** نقطة ينظر إليها الوجه، بإحداثيات الشاشة. null = ينظر أمامه. */
export type LookPoint = { x: number; y: number } | null;

export function BecanFace({
  className = "w-24",
  lookAt = null,
}: {
  className?: string;
  lookAt?: LookPoint;
}) {
  const reduce = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);

  /* إزاحة العينين نحو النقطة، بزنبرك كي تتبع بسلاسة لا بقفزات */
  const dx = useSpring(0, { stiffness: 220, damping: 20, mass: 0.4 });
  const dy = useSpring(0, { stiffness: 220, damping: 20, mass: 0.4 });

  useEffect(() => {
    if (!lookAt || reduce) {
      dx.set(0);
      dy.set(0);
      return;
    }
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return;
    // مركز خطّ العينين لا مركز الإطار
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height * 0.34;
    const vx = lookAt.x - cx;
    const vy = lookAt.y - cy;
    const len = Math.hypot(vx, vy) || 1;
    dx.set((vx / len) * 5);
    dy.set((vy / len) * 3.5);
  }, [lookAt, reduce, dx, dy]);

  /* دورة 5.2 ث: رمشة بالعينين عند البداية، ثم غمزة باليمنى في المنتصف. */
  const blink = reduce
    ? undefined
    : {
        scaleY: [1, 0.08, 1, 1, 1],
        transition: {
          duration: 5.2,
          times: [0, 0.03, 0.06, 0.6, 1],
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      };

  const wink = reduce
    ? undefined
    : {
        scaleY: [1, 0.08, 1, 1, 0.08, 1, 1],
        transition: {
          duration: 5.2,
          times: [0, 0.03, 0.06, 0.5, 0.53, 0.57, 1],
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      };

  const tilt = reduce
    ? undefined
    : {
        rotate: [0, -3, 0, 2, 0],
        transition: {
          duration: 7.5,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      };

  return (
    <motion.svg
      ref={svgRef}
      role="img"
      aria-label="بيكان"
      viewBox="0 0 100 58"
      className={className}
      animate={tilt}
      style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
    >
      <g className="text-warmth">
        <motion.g style={{ x: dx, y: dy }}>
          <motion.rect
            x="30"
            y="10"
            width="12"
            height="19"
            rx="6"
            fill="currentColor"
            style={EYE}
            animate={blink}
          />
          <motion.rect
            x="58"
            y="10"
            width="12"
            height="19"
            rx="6"
            fill="currentColor"
            style={EYE}
            animate={wink}
          />
        </motion.g>
        <path
          d="M24 42c16 11 36 11 52 0"
          stroke="currentColor"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </motion.svg>
  );
}
