import Link from "next/link";
import { ArrowForward, Chevron } from "./icons";
import { BecanLogo } from "./logo";
import { OfflineBar } from "./offline-bar";
import { SupportButton } from "./support-button";

/* عناصر التصميم المعتمد. كل شاشة جديدة تُبنى منها فلا تعيد اختراعها. */

/** موضع المسحة حول الكلمة — مشترك بين النسخة الساكنة والمرسومة.

    التجاوز الجانبي أضيق على الجوال: 28px تكفي على الشاشات الواسعة،
    لكن كلمة تبدأ عند حافّة الحاوية عند 390px تدفع المسحة خارج
    الشاشة — والفيضان يسارًا في RTL لا يظهر في scrollWidth. */
export const highlightBox =
  "absolute -inset-x-3 sm:-inset-x-7 -top-[0.04em] -bottom-[0.08em] z-0 block -rotate-3";

/** مسحة فرشاة كهرمانية خلف كلمة في العنوان. مرّة واحدة لكل شاشة. */
export function HighlightSvg() {
  return (
    <svg
      viewBox="0 0 240 74"
      preserveAspectRatio="none"
      className="h-full w-full text-highlight"
    >
      <defs>
        {/* ضوضاء تُزيح الحواف فتتهرّأ كأثر شعر الفرشاة */}
        <filter
          id="bcn-brush"
          x="-16%"
          y="-45%"
          width="132%"
          height="190%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.014 0.16"
            numOctaves="4"
            seed="9"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="16"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        {/* قناع يحفر خطوطًا أفقية جافة داخل المسحة */}
        <mask id="bcn-brush-mask">
          <rect x="-12" y="-12" width="264" height="98" fill="#fff" />
          <g stroke="#000" strokeLinecap="round" filter="url(#bcn-brush)">
            <path d="M2 22h236" strokeWidth="2.6" opacity="0.8" />
            <path d="M2 33h236" strokeWidth="1.5" opacity="0.5" />
            <path d="M2 44h236" strokeWidth="2.2" opacity="0.7" />
            <path d="M2 55h236" strokeWidth="1.3" opacity="0.45" />
          </g>
        </mask>
      </defs>
      <rect
        x="6"
        y="10"
        width="228"
        height="54"
        rx="2"
        fill="currentColor"
        filter="url(#bcn-brush)"
        mask="url(#bcn-brush-mask)"
      />
    </svg>
  );
}

export function Highlight() {
  return (
    <span aria-hidden="true" className={highlightBox}>
      <HighlightSvg />
    </span>
  );
}

/** الكلمة المظلَّلة داخل العنوان — تضمن رسم الحروف فوق المسحة. */
export function Marked({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative isolate inline-block">
      <Highlight />
      <span className="relative z-10">{children}</span>
    </span>
  );
}

/* ————— الخربشة —————
   خط يدوي تحت كلمة واحدة، بالجوزي وسُمك 4 — والسُّمك شرط: الجوزي
   تباينه 3.07:1 فلا يُستعمل رفيعًا. مرّة واحدة لكل شاشة كحدّ أقصى،
   وهي غير `Marked`: تلك مسحة فرشاة كهرمانية خلف الكلمة. */

export function Scribble() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className="absolute inset-x-0 -bottom-[0.12em] h-[0.28em] w-full text-warmth"
    >
      {/* تموّج خفيف لا خط مسطرة — أثر يد لا أداة */}
      <path
        d="M3 8.5c28-4.2 58-5.4 96-3.6 24 1.1 51 2.6 98 .4"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** الكلمة المخربَش تحتها. */
export function Scribbled({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      {children}
      <Scribble />
    </span>
  );
}

/* ————— النصّ ثنائي الاتجاه —————
   رمز لاتيني داخل نصّ عربي ينقلب ترتيبه ما لم يُلَفّ بـ`dir="ltr"`.
   في النصّ المكتوب في JSX يُلَفّ باليد، لكن نصوص البيانات (أجوبة
   الأسئلة الشائعة مثلًا) تصل سلاسلَ لا عناصر — فتُلَفّ هنا.

   الرَّكض اللاتيني يشمل الكلمات المتتالية: «Apple Pay» ركض واحد لا
   ركضان، وإلا انقلب ترتيب كلمتيه. */
const LATIN_RUN =
  /([A-Za-z][A-Za-z0-9.&/+'’-]*(?:\s+[A-Za-z][A-Za-z0-9.&/+'’-]*)*)/g;

export function Copy({ children }: { children: string }) {
  const parts = children.split(LATIN_RUN);
  return (
    <>
      {parts.map((part, i) =>
        /* الأجزاء الفردية هي المُلتقَطة من التعبير — أي اللاتينية */
        i % 2 === 1 ? (
          <span key={i} dir="ltr">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** بقية كلمات العنوان — مموضَعة كي لا تقع تحت المسحة. */
export function Plain({ children }: { children: React.ReactNode }) {
  return <span className="relative z-10">{children}</span>;
}

/* شريط الانقطاع يسكن هنا لا في التخطيط الجذري: `PageShell` هي قشرة
   الشاشات الفاتحة وحدها، والجلسة لا تستعملها — ولها حالة انقطاعها
   الخاصة داخلها، فلا يجتمع شريطان على شاشة واحدة. */
const FOOTER_LINKS = [
  { href: "/#how", label: "كيف يعمل" },
  { href: "/#pricing", label: "الأسعار" },
  { href: "/faq", label: "الأسئلة الشائعة" },
  { href: "/contact", label: "تواصل معنا" },
  { href: "/status", label: "حالة النظام" },
  { href: "/ambassadors", label: "السفراء" },
  { href: "/join", label: "دخول" },
];

const LEGAL_LINKS = [
  { href: "/terms", label: "الشروط والأحكام" },
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/refunds", label: "الاسترجاع والإلغاء" },
  { href: "/cookies", label: "ملفات تعريف الارتباط" },
];

export function PageShell({
  children,
  withFooter = false,
}: {
  children: React.ReactNode;
  withFooter?: boolean;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <OfflineBar />
      {children}
      {withFooter ? <SiteFooter /> : null}
      <SupportButton />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer data-theme="dark" className="bg-aubergine-deep">
      <div className="mx-auto w-full max-w-page px-4 py-12 md:px-8 xl:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <BecanLogo height={56} onDark className="h-14 w-auto self-start" />

          <div className="grid gap-8 sm:grid-cols-2 md:min-w-[34rem] md:grid-cols-[1fr_auto]">
            <address className="not-italic text-sm leading-base text-ink-2">
              <p className="font-semibold text-ink">معلومات التواصل</p>
              <dl className="mt-3 flex flex-col gap-2">
                <div>
                  <dt className="inline">البريد الإلكتروني: </dt>
                  <dd className="inline" dir="ltr">
                    <a
                      href="mailto:support@chapter14.net"
                      className="underline underline-offset-4"
                    >
                      support@chapter14.net
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="inline">هاتف: </dt>
                  <dd className="inline" dir="ltr">
                    <a
                      href="tel:+966508337658"
                      className="underline underline-offset-4"
                    >
                      +966508337658
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="inline">العنوان: </dt>
                  <dd className="inline">
                    الخرج، حي النهضة، عبد الرحمن الناصر 16439
                  </dd>
                </div>
                <div>
                  <dt className="inline">رقم المنشأة الموحد: </dt>
                  <dd className="inline" dir="ltr">
                    7051848427
                  </dd>
                </div>
              </dl>
            </address>

            <nav
              aria-label="روابط الموقع"
              className="flex flex-wrap content-start gap-x-2 gap-y-1"
            >
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-11 items-center px-2 text-ink-2"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <nav
          aria-label="السياسات"
          className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-4"
        >
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center px-2 text-sm text-ink-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

/** minimal: بلا رابط «دخول» — لا معنى له داخل شاشة الدخول نفسها.
    nav: روابط أقسام الصفحة — للاندينج وحدها.
    loginAsButton: «دخول» محدّد الإطار كما يطلبه بريف اللاندينج.
      بقية الشاشات تُبقيه رابطًا نصّيًا كما اعتُمدت. */
export function SiteHeader({
  minimal = false,
  nav,
  loginAsButton = false,
}: {
  minimal?: boolean;
  nav?: readonly { href: string; label: string }[];
  loginAsButton?: boolean;
}) {
  return (
    <header className="border-b border-line">
      {/* الحشو الرأسي خفّ مع تكبير الشعار: الشعار تركيبة سطرين
          (كلمة وشعار نصّي) فيحتاج ارتفاعًا ليُقرأ، وحشوُ 20px فوقه
          كان يدفع الشريط إلى 104px. */}
      <div className="mx-auto flex w-full max-w-page items-center justify-between gap-2 px-4 py-3 md:gap-3 md:px-8 md:py-4 xl:px-10">
        {/* الشعار كما هو في ملفّ الهوية. أصغر قليلًا على الجوال كي
            يبقى للتنقّل مكانه، والنسبة واحدة في المقاسين.
            `priority` لأنه في أعلى الصفحة الأولى دائمًا. */}
        <Link href="/" className="inline-flex min-h-11 min-w-11 items-center">
          <BecanLogo height={64} priority className="h-13 w-auto md:h-16" />
        </Link>

        <div className="flex items-center gap-1">
          {/* الروابط ظاهرة على الجوال أيضًا: المشروع mobile-first عند
              390px، وطيّها خلف نقطة توقّف يترك الهيدر بلا محتواه */}
          {nav?.length ? (
            <nav className="flex items-center">
              {nav.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-ink-2 md:px-3 md:text-base"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          ) : null}

          {minimal ? null : (
            <Link
              href="/join"
              className={
                loginAsButton
                  ? "inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill border border-line px-4 text-sm font-semibold text-ink md:text-base"
                  : "inline-flex min-h-11 min-w-11 items-center justify-center px-2 font-semibold text-ink-2"
              }
            >
              دخول
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`mx-auto w-full max-w-page px-4 md:px-8 xl:px-10 ${className}`}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-ink-2">{children}</p>;
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="mt-3 font-display text-5xl leading-tight font-bold text-ink md:text-6xl xl:text-7xl">
      {children}
    </h1>
  );
}

/** الزر الكهرماني الأساسي — واحد لكل شاشة. */
export function PrimaryButton({
  href,
  type,
  onClick,
  children,
  className = "",
}: {
  href?: string;
  type?: "submit" | "button";
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const cls = `group inline-flex h-14 items-center justify-center gap-3 rounded-pill bg-pressable px-8 text-lg font-semibold text-on-pressable transition-transform duration-200 hover:-translate-y-1 hover:shadow-lift ${className}`;
  return href ? (
    <Link href={href} className={cls}>
      {children}
      <ArrowForward className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1" />
    </Link>
  ) : (
    <button type={type ?? "button"} onClick={onClick} className={cls}>
      {children}
      <ArrowForward className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1" />
    </button>
  );
}

/** رابط هادئ بسهم — الفعل الثانوي، لا يزاحم الكهرماني الوحيد. */
export function QuietLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex min-h-11 items-center gap-2 font-semibold text-ink ${className}`}
    >
      {children}
      <ArrowForward className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
    </Link>
  );
}

/** زر ثانوي محدّد الإطار. */
export function GhostButton({
  href,
  type,
  onClick,
  children,
  className = "",
}: {
  href?: string;
  type?: "submit" | "button";
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const cls = `inline-flex h-14 items-center justify-center rounded-pill border border-aubergine-mid px-8 text-lg font-semibold text-aubergine-base ${className}`;
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <button type={type ?? "button"} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="text-sm font-semibold text-ink-2">{children}</span>
      {hint ? (
        <span className="mt-1 block text-xs text-ink-2">{hint}</span>
      ) : null}
    </label>
  );
}

const controlCls =
  "mt-2 h-14 w-full rounded-xl bg-surface px-4 text-ink shadow-soft placeholder:text-ink-2 border";

/* لون الحدّ يُبنى شرطيًا لا بإضافة صنف فوق آخر: صنفا لون-حدّ
   متساويا الأولوية، فالفائز يحدّده ترتيب Tailwind لا ترتيب السمة. */
const borderCls = (invalid?: boolean) =>
  invalid ? "border-error" : "border-aubergine-deep";

export function TextField({
  invalid,
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  invalid?: boolean;
}) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={`${controlCls} ${borderCls(invalid)} ${className}`}
    />
  );
}

/** رسالة خطأ تحت الحقل — نصّ لا لون وحده. */
export function ErrorText({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="mt-2 text-sm font-semibold text-error">
      {children}
    </p>
  );
}

/** قائمة منسدلة بشيفرون مخصّص داخل قرص باذنجاني. */
export function SelectField({
  children,
  invalid,
  className = "",
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <select
        {...rest}
        aria-invalid={invalid || undefined}
        className={`${controlCls} ${borderCls(invalid)} appearance-none pe-14 ${className}`}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center pt-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-pill bg-aubergine-tint text-aubergine-base">
          <Chevron />
        </span>
      </span>
    </div>
  );
}

/** شريط الالتقاط الباذنجاني — data-theme يقلب التوكنات لنسخها الداكنة. */
export function CaptureBand({
  title,
  body,
  cta,
  href,
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <section data-theme="dark" className="bg-aubergine-deep">
      <div className="mx-auto flex w-full max-w-page flex-col gap-7 px-4 py-14 md:flex-row md:items-center md:justify-between md:px-8 xl:px-10">
        <div>
          <h2 className="font-display text-3xl leading-snug font-bold text-ink md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 max-w-measure text-ink-2">{body}</p>
        </div>
        <PrimaryButton href={href} className="shrink-0">
          {cta}
        </PrimaryButton>
      </div>
    </section>
  );
}
