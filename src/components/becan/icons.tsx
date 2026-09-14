/* أيقونات الواجهة المشتركة. كلها stroke بـ currentColor فترث لون الأب. */

type P = { className?: string };

const base = {
  "aria-hidden": true as const,
  focusable: "false" as const,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SearchIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function Chevron({ className = "h-4 w-4" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className} strokeWidth={2.5}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** سهم يشير إلى نهاية السطر — في RTL يتّجه يسارًا. */
export function ArrowForward({ className = "h-4 w-4" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
    </svg>
  );
}

export function UploadIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="M12 16V4m0 0L7 9m5-5 5 5" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export function CheckIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className} strokeWidth={2.5}>
      <path d="m4 12.5 5.5 5.5L20 7" />
    </svg>
  );
}

/** حالة الفصل — دائرة تمتلئ بقدر ما أنجزه الطالب. */
export function StatusIcon({
  kind,
  className = "h-4 w-4",
}: {
  kind: "none" | "next" | "almost" | "done";
  className?: string;
}) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="8.5" />
      {kind === "next" ? (
        <path d="M10.5 9 15 12l-4.5 3z" fill="currentColor" stroke="none" />
      ) : null}
      {kind === "almost" ? (
        <path
          d="M12 3.5a8.5 8.5 0 0 1 0 17z"
          fill="currentColor"
          stroke="none"
        />
      ) : null}
      {kind === "done" ? <path d="m8.5 12 2.5 2.5 4.5-5" /> : null}
    </svg>
  );
}

/* ——— أيقونات أقسام اللاندينج ———
   كلها بنفس سُمك الحدّ (2) ونفس الـviewBox ونفس نهايات الخط، فتُقرأ
   عائلة واحدة لا رموزًا مجمّعة. */

/** فقاعة حوار مبتسمة — «يفهمك»: حوار يفهم لا إلقاء.
    الابتسامة تحمل الشعور، والفقاعة تحمل المعنى. */
export function SmileChatIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="M20.5 13.5a4 4 0 0 1-4 4H9l-4.5 3v-13a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4z" />
      <path d="M9 9.5v.6M15 9.5v.6" strokeWidth={2.6} />
      <path d="M9.3 13.2a3.6 3.6 0 0 0 5.4 0" />
    </svg>
  );
}

/** وسام بعلامة صحّ — «ما يخرف»: مصدر موثوق لا تخمين. */
export function BadgeCheckIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="m12 2.7 2.4 1.8 3-.2.9 2.9 2.5 1.7-1.2 2.8 1.2 2.8-2.5 1.7-.9 2.9-3-.2L12 21.3l-2.4-1.8-3 .2-.9-2.9-2.5-1.7L4.4 12 3.2 9.2l2.5-1.7.9-2.9 3 .2z" />
      <path d="m8.8 12.2 2.2 2.2 4.2-4.6" strokeWidth={2.4} />
    </svg>
  );
}

/** شرارة — «سهل جدًا»: ضغطة واحدة يتبعها ضوء، لا مجهود. */
export function SparkIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="M12 3c.5 3.6 1.9 5 5.5 5.5-3.6.5-5 1.9-5.5 5.5-.5-3.6-1.9-5-5.5-5.5C10.1 8 11.5 6.6 12 3Z" />
      <path d="M18.5 15c.3 1.8.9 2.4 2.7 2.7-1.8.3-2.4.9-2.7 2.7-.3-1.8-.9-2.4-2.7-2.7 1.8-.3 2.4-.9 2.7-2.7Z" />
      <path d="M6.5 15.5c.2 1.3.7 1.8 2 2-1.3.2-1.8.7-2 2-.2-1.3-.7-1.8-2-2 1.3-.2 1.8-.7 2-2Z" />
    </svg>
  );
}

/** طبقات — «اختر الفصل»: الفصول مرتّبة فوق بعضها. */
export function LayersIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="m12 3 8.5 4.5L12 12 3.5 7.5z" />
      <path d="m4 12 8 4.3 8-4.3M4 16.5 12 21l8-4.5" />
    </svg>
  );
}

export function GearIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </svg>
  );
}

/** تقويم — لأحداث المقرر. لا ينعكس مع الاتجاه. */
export function CalendarIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function PlusIcon({ className = "h-4 w-4" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className} strokeWidth={2.5}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/* ——— أيقونات الجلسة ——— */

export function PlayIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg
      {...base}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      stroke="none"
    >
      <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

export function PauseIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg
      {...base}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      stroke="none"
    >
      <rect x="6" y="5" width="4" height="14" rx="1.5" />
      <rect x="14" y="5" width="4" height="14" rx="1.5" />
    </svg>
  );
}

export function ReplayIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="M4 10a8 8 0 1 1 .9 5" />
      <path d="M4 4v6h6" />
    </svg>
  );
}

export function ConfusedIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="M9.2 9a3 3 0 1 1 4 2.8c-.8.3-1.2 1-1.2 1.8v.4" />
      <path d="M12 17.5v.5" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export function MicIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

export function MicOffIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="M9 9V6a3 3 0 0 1 5.6-1.5M15 11.5V12a3 3 0 0 1-4.3 2.7" />
      <path d="M5 11a7 7 0 0 0 10.9 5.8M19 11a7 7 0 0 1-.4 2.3M12 18v3" />
      <path d="m4 3 16 18" />
    </svg>
  );
}

export function ChatIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="M20 15a3 3 0 0 1-3 3H9l-5 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3z" />
    </svg>
  );
}

export function SlidesIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8" />
    </svg>
  );
}

export function ListIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </svg>
  );
}

export function CloseIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function SkipIcon({ className = "h-4 w-4" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="M7 12h10" />
    </svg>
  );
}

/** موجة صوت — أعمدة تتنفّس بتأخير متدرّج أثناء الكلام. */
export function Waveform({
  className = "h-5",
  bars = 7,
}: {
  className?: string;
  bars?: number;
}) {
  const heights = [0.45, 0.8, 1, 0.65, 1, 0.75, 0.5];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center gap-[3px] ${className}`}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="block w-[3px] rounded-pill bg-current animate-wave"
          style={{
            height: `${heights[i % heights.length] * 100}%`,
            animationDelay: `${(i % heights.length) * 110}ms`,
          }}
        />
      ))}
    </span>
  );
}

/** جهاز وسهم يدور حوله — «اقلب الشاشة». لا ينعكس مع الاتجاه:
    دوران الجهاز فيزيائي لا قرائي.
    spinning: الجهاز ينقلب فعلًا إلى الأفقي ويعود، فالحركة تشرح
    المطلوب أبلغ من رسم ساكن. */
export function RotateIcon({
  className = "h-5 w-5",
  spinning = false,
}: P & { spinning?: boolean }) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <rect
        x="9"
        y="2"
        width="6"
        height="11"
        rx="1.5"
        className={spinning ? "animate-flip" : undefined}
        style={
          spinning
            ? { transformBox: "fill-box", transformOrigin: "center" }
            : undefined
        }
      />
      <path d="M20 11.5a8.5 8.5 0 0 1-8.5 8.5H8.5" />
      <path d="m10.8 17.6-2.6 2.4 2.6 2.4" />
    </svg>
  );
}

export function ExpandIcon({ className = "h-4 w-4" }: P) {
  return (
    <svg
      {...base}
      viewBox="0 0 24 24"
      className={`rtl:-scale-x-100 ${className}`}
    >
      <path d="M9 4H4v5M4 4l6 6M15 20h5v-5M20 20l-6-6" />
    </svg>
  );
}

export function ShrinkIcon({ className = "h-4 w-4" }: P) {
  return (
    <svg
      {...base}
      viewBox="0 0 24 24"
      className={`rtl:-scale-x-100 ${className}`}
    >
      <path d="M4 9h5V4M4 4l5 5M20 15h-5v5M20 20l-5-5" />
    </svg>
  );
}

/** إنهاء الجلسة — مربّع إيقاف، كي لا يُخلط بـ× الخروج في الشريط العلوي. */
export function StopIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <rect x="6" y="6" width="12" height="12" rx="2.5" />
    </svg>
  );
}

/** نجمة ممتلئة — للتقييم. رسم لا نصّ، فالجوزيّ في دوره.
    ولا تنعكس مع الاتجاه: شكل متماثل.
    `outline` يرسمها حدًّا بلا تعبئة — للنجوم غير المختارة في مُدخل التقييم. */
export function StarIcon({
  className = "h-5 w-5",
  outline = false,
}: P & { outline?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.44 6.19 20.5l1.11-6.47-4.7-4.58 6.5-.95z"
        fill={outline ? "none" : "currentColor"}
        stroke={outline ? "currentColor" : undefined}
        strokeWidth={outline ? 1.5 : undefined}
        strokeLinejoin="round"
      />
    </svg>
  );
}
