/* أيقونات الواجهة المشتركة. كلها stroke بـ currentColor فترث لون الأب (عدا علامة واتساب: تعبئة). */

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

/** سهم إلى نهاية السطر: يسارًا في RTL ويمينًا في LTR. */
export function ArrowForward({ className = "h-4 w-4" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={`ltr:-scale-x-100 ${className}`}>
      <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
    </svg>
  );
}

/** سهم الرجوع إلى بداية السطر، بعكس سهم التقدّم. */
export function ArrowBack({ className = "h-4 w-4" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={`ltr:-scale-x-100 ${className}`}>
      <path d="M5 12h14m0 0-6-6m6 6-6 6" />
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

export function MicIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
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

export function MenuIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
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

/** باب وسهم إلى الخارج — يتبع اتجاه القراءة. */
export function LeaveIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={`rtl:-scale-x-100 ${className}`}>
      <path d="M10 4H4v16h6M9 12h12m-4-4 4 4-4 4" />
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

/* ————— أيقونات السبورة —————
   واحدة لكل نوع نداء (callout) وواحدة لحالة التنبيه، فلا يعتمد
   التمييز على اللون وحده. كلها 24×24 بنفس الحدّ. */

/** «يضيّع درجات» — أعلى بند قيمةً على السبورة */
export function LosesMarksIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="M10.3 3.9 2.6 17.2a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4.5" />
      <path d="M12 17.2h.01" />
    </svg>
  );
}

/** تنبيه — وزن استراتيجيّ في الاختبار، لا خطأ */
export function WarningIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V13" />
      <path d="M12 16.4h.01" />
    </svg>
  );
}

/** غلط شائع */
export function MistakeIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6m0-6-6 6" />
    </svg>
  );
}

/** حيلة للحفظ */
export function MnemonicIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .9 1.6l.1.6h5.2l.1-.6c.1-.6.4-1.2.9-1.6A6 6 0 0 0 12 3Z" />
    </svg>
  );
}

/** تعريف */
export function BookIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v14H6.5A2.5 2.5 0 0 0 4 19.5Z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19v4H6.5A2.5 2.5 0 0 1 4 19.5Z" />
    </svg>
  );
}

/** مثال محلول — أسطرٌ متمركزة فلا تفترض اتجاه نصّ */
export function ExampleIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="M5 5h14M5 10h14M7.5 15h9" />
      <path d="m8.5 19.5 2.5 2.5 4.5-5" />
    </svg>
  );
}

/** يجي في الاختبار */
export function ExamIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} viewBox="0 0 24 24" className={className}>
      <path d="M9 3h6v2.5a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1Z" />
      <path d="M15 4.2h2.5a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V6.2a2 2 0 0 1 2-2H9" />
      {/* متمركزة فلا تفترض اتجاه نصّ */}
      <path d="M7.5 12h9M9 16h6" />
    </svg>
  );
}

/** علامة واتساب — سمّاعة داخل فقاعة. لا تنعكس مع الاتجاه: شعار. */
export function WhatsappIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Z" />
      <path d="M16.56 14.22c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.14.17-.25.25-.41.09-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.49-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.23.24-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.65 4.2 3.72.59.25 1.05.4 1.4.52.59.18 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29Z" />
    </svg>
  );
}
