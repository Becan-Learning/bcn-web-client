"use client";

import { useTranslations, useLocale } from "next-intl";
import { localize } from "@/i18n/localized";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { Link } from "@/i18n/navigation";
import { SubjectIcon } from "./subject-icon";
import { ArrowForward, Chevron, SearchIcon } from "@/components/becan/icons";
import { BecanFace, type LookPoint } from "@/components/becan/becan-face";
import { TypedHeadline } from "@/components/becan/typed-headline";
import {
  COLLEGES,
  COURSES,
  TONES,
  UNIVERSITIES,
  type College,
  type Course,
} from "@/lib/data/catalog";

const MotionLink = motion.create(Link);

const spring = {
  transition: { type: "spring" as const, stiffness: 300, damping: 16 },
};

function Select({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink-2">
        {label}
      </label>
      <div className="relative mt-2">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 w-full appearance-none rounded-xl border border-aubergine-deep bg-surface ps-4 pe-14 text-ink shadow-soft"
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-pill bg-aubergine-tint text-aubergine-base">
            <Chevron />
          </span>
        </span>
      </div>
    </div>
  );
}

/* موضع مؤشّر الكتابة بإحداثيات الشاشة: نقيس عرض النص المكتوب حتى
   المؤشّر ثم نزيحه عن حافة البداية بحسب اتجاه الحقل. */
let measureCtx: CanvasRenderingContext2D | null = null;

function caretPoint(input: HTMLInputElement): LookPoint {
  const box = input.getBoundingClientRect();
  const cs = getComputedStyle(input);
  const y = box.top + box.height / 2;
  const rtl = cs.direction === "rtl";

  measureCtx ??= document.createElement("canvas").getContext("2d");
  if (!measureCtx) return { x: rtl ? box.right - 56 : box.left + 56, y };

  measureCtx.font = [cs.fontWeight, cs.fontSize, cs.fontFamily].join(" ");
  const upToCaret = input.value.slice(
    0,
    input.selectionStart ?? input.value.length,
  );
  const padStart = parseFloat(cs.paddingInlineStart || "0");
  const offset = padStart + measureCtx.measureText(upToCaret).width;
  const x = rtl ? box.right - offset : box.left + offset;

  return { x: Math.max(box.left, Math.min(box.right, x)), y };
}

/** مراقب تقاطع مباشر — أوثق من useInView مع motion.a الحامل لـ layout. */
function useInViewport(ref: React.RefObject<Element | null>, threshold = 0.6) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return inView;
}

/** الأجهزة اللمسية بلا hover — تُشغَّل الحركة عند دخول البطاقة الشاشة. */
function useTouch() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(hover: none)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(hover: none)").matches,
    () => false,
  );
}

function CourseCard({
  course,
  reduce,
  touch,
}: {
  course: Course;
  reduce: boolean;
  touch: boolean;
}) {
  const locale = useLocale();
  const tone = TONES[course.tone];
  const ref = useRef<HTMLAnchorElement>(null);
  const inView = useInViewport(ref, 0.6);
  const playOnScroll = touch && inView && !reduce;

  const card: Variants = reduce
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1 },
        play: { opacity: 1 },
        hover: {},
      }
    : {
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0 },
        play: { opacity: 1, y: 0 },
        hover: {
          y: -10,
          transition: { type: "spring" as const, stiffness: 320, damping: 18 },
        },
      };

  return (
    <MotionLink
      layout
      href={`/c/${course.code.replace(" ", "-").toLowerCase()}`}
      ref={ref}
      variants={card}
      initial="hidden"
      animate={playOnScroll ? "play" : "show"}
      exit="hidden"
      whileHover={touch || reduce ? undefined : "hover"}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className={`group relative flex min-h-36 flex-col justify-between overflow-hidden rounded-lg border p-3 shadow-soft hover:shadow-lift ${tone.card}`}
    >
      {/* الختم — نفس الأيقونة بحجم كبير، تنزف من الزاوية وتصنع نسيج
          البطاقة. شفافية منخفضة فلا تنافس النص. */}
      <motion.span
        aria-hidden="true"
        variants={
          reduce
            ? undefined
            : {
                hover: { scale: 1.12, rotate: -8, ...spring },
                play: { scale: 1.12, rotate: -8, ...spring },
              }
        }
        className={`pointer-events-none absolute -bottom-5 -end-5 block h-28 w-28 opacity-15 ${tone.icon}`}
      >
        <SubjectIcon icon={course.icon} className="h-full w-full" />
      </motion.span>

      <div className="relative flex items-start justify-between gap-2">
        <span
          dir="ltr"
          className={`rounded-pill border px-2 py-0.5 text-[11px] font-semibold ${tone.chip}`}
        >
          {course.code}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border transition-colors group-hover:bg-pressable group-hover:text-on-pressable ${tone.arrow}`}
        >
          <ArrowForward className="h-3.5 w-3.5" />
        </span>
      </div>

      {/* قفل الاسم — الرمز الصغير ملتصق بالاسم فيقرآن وحدةً واحدة */}
      <div className="relative mt-3">
        <div className="flex items-start gap-2">
          <SubjectIcon
            icon={course.icon}
            className={`mt-0.5 h-5 w-5 shrink-0 ${tone.icon}`}
          />
          <h3
            className={`line-clamp-2 font-display text-[15px] leading-snug font-semibold ${tone.title}`}
          >
            {localize(course.name, locale)}
          </h3>
        </div>
        <p className={`mt-1.5 text-[11px] ${tone.meta}`}>{localize(course.university, locale)}</p>
      </div>
    </MotionLink>
  );
}

export function Finder() {
  const t = useTranslations("Courses");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [college, setCollege] = useState<College | "all">("all");
  const [university, setUniversity] = useState("all");
  const reduce = useReducedMotion() ?? false;
  const touch = useTouch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [look, setLook] = useState<LookPoint>(null);

  /* الوجه يتابع مؤشّر الكتابة، ويعود للنظر أمامه عند مغادرة الحقل */
  const trackCaret = () => {
    const el = inputRef.current;
    if (el) setLook(caretPoint(el));
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COURSES.filter((c) => {
      const byCollege = college === "all" || c.college === college;
      const byUniversity = university === "all" || c.university.ar === university;
      const byQuery =
        !q ||
        localize(c.name, locale).toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.code.replace(" ", "").toLowerCase().includes(q.replace(" ", ""));
      return byCollege && byUniversity && byQuery;
    });
  }, [query, college, university, locale]);

  const empty = results.length === 0;
  const [headlinePrefix, headlineWord, headlineSuffix] = t.markup("title", {
    word: (chunks) => `\0${chunks}\0`,
  }).split("\0");

  return (
    <>
      <section className="mx-auto w-full max-w-page px-4 pt-12 pb-8 md:px-8 md:pt-20 xl:px-10">
        <p className="text-sm font-semibold text-ink-2">{t("eyebrow")}</p>

        {/* الأفتار بجانب العنوان — يرمش ويغمز ويميل */}
        <div className="mt-3 flex items-center gap-4">
          <BecanFace className="w-24 shrink-0 md:w-32 xl:w-36" lookAt={look} />
          <TypedHeadline prefix={headlinePrefix.trimEnd()} word={headlineWord} suffix={headlineSuffix} className="mt-0" />
        </div>

        <div className="relative mt-9 max-w-measure">
          <label htmlFor="finder" className="sr-only">
            {t("search")}
          </label>
          <span className="pointer-events-none absolute inset-y-0 start-5 flex items-center text-ink-2">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            id="finder"
            dir="auto"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              trackCaret();
            }}
            onFocus={trackCaret}
            onSelect={trackCaret}
            onKeyUp={trackCaret}
            onBlur={() => setLook(null)}
            placeholder={t("searchPlaceholder")}
            className="h-16 w-full rounded-xl border border-aubergine-deep bg-surface ps-14 pe-5 text-lg text-ink shadow-soft placeholder:text-ink-2"
          />
        </div>

        <div className="mt-4 grid max-w-measure grid-cols-2 gap-3">
          <Select
            id="f-university"
            label={t("university")}
            value={university}
            onChange={setUniversity}
          >
            <option value="all">{t("allUniversities")}</option>
            {UNIVERSITIES.map((u) => (
              <option key={u.ar} value={u.ar}>
                {localize(u, locale)}
              </option>
            ))}
          </Select>

          <Select
            id="f-college"
            label={t("college")}
            value={college}
            onChange={(v) => setCollege(v as College | "all")}
          >
            <option value="all">{t("allColleges")}</option>
            {COLLEGES.map((c) => (
              <option key={c.id} value={c.id}>
                {localize(c.label, locale)}
              </option>
            ))}
          </Select>
        </div>
      </section>

      <section className="mx-auto w-full max-w-page px-4 pb-16 md:px-8 xl:px-10">
        <p aria-live="polite" className="text-sm text-ink-2">
          {empty ? t("noResults") : t("count", { count: results.length, countLabel: String(results.length) })}
        </p>

        {empty ? (
          <div className="mt-4 max-w-measure rounded-xl border border-aubergine-deep bg-surface p-8 shadow-soft">
            <p className="font-display text-3xl leading-snug font-bold text-ink">
              {t.rich("emptyTitle", { search: query.trim(), query: (chunks) => <span dir="auto" className="text-warmth">{chunks}</span> })}
            </p>
            <p className="mt-3 text-ink-2">
              {t("requestBody")}
            </p>
            <Link
              href="/request"
              className="mt-7 inline-flex h-12 items-center gap-3 rounded-pill bg-pressable px-6 text-lg font-semibold text-on-pressable"
            >
              {t("requestThis")}<ArrowForward />
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {results.map((c) => (
                <CourseCard
                  key={c.code}
                  course={c}
                  reduce={reduce}
                  touch={touch}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {!empty && (
        <section data-theme="dark" className="bg-aubergine-deep">
          <div className="mx-auto flex w-full max-w-page flex-col gap-7 px-4 py-14 md:flex-row md:items-center md:justify-between md:px-8 xl:px-10">
            <div>
              <h2 className="font-display text-3xl leading-snug font-bold text-ink md:text-4xl">
                {t("notFound")}
              </h2>
              <p className="mt-3 max-w-measure text-ink-2">
                {t("requestBody")}
              </p>
            </div>
            <Link
              href="/request"
              className="inline-flex h-14 shrink-0 items-center gap-3 rounded-pill bg-pressable px-8 text-lg font-semibold text-on-pressable"
            >
              {t("request")}<ArrowForward className="h-5 w-5" />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
