"use client";

import { useTranslations, useLocale, useFormatter } from "next-intl";
import { localize } from "@/i18n/localized";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowForward } from "@/components/becan/icons";
import { SubjectIcon } from "@/app/[locale]/courses/subject-icon";
import type { Chapter, Course } from "@/lib/data/catalog";
import { TONES } from "@/lib/data/catalog";

/* بريف الشاشة 5.
   قاعدة حاسمة: الصفحة قابلة للتصفّح بلا تسجيل — كل شيء ظاهر،
   وجدار التسجيل عند الضغط على فصل فقط. */

const TABS = [
  { id: "chapters", label: "chapters", ready: true },
  { id: "checks", label: "checks", ready: false },
  { id: "sources", label: "sources", ready: false },
] as const;

export type ViewState = "guest" | "new";

/* بطاقات الفصول داكنة. اللوحة لا تملك كهرمانيًا أو جوزيًا داكنًا
   يصلح تعبئةً تحمل نصًا، فالعائلتان المتاحتان: الباذنجاني والزيتي.
   لونان متناوبان داخل كل عائلة يعطيان إيقاعًا بلا خروج عنها. */
const SKINS = {
  purple: {
    fills: ["bg-aubergine-base", "bg-aubergine-deep"],
    meta: "text-aubergine-tint",
    arrow: "border-aubergine-soft text-on-dominant",
  },
  olive: {
    fills: ["bg-olive-dark", "bg-olive-deep"],
    meta: "text-olive-soft",
    arrow: "border-olive-soft text-on-dominant",
  },
} as const;

const skinOf = (tone: Course["tone"]) =>
  tone === "olive" || tone === "oliveDark" ? SKINS.olive : SKINS.purple;

function ChapterCard({
  chapter,
  course,
  href,
}: {
  chapter: Chapter;
  course: Course;
  href: string;
}) {
  const t = useTranslations("Course");
  const locale = useLocale();
  const format = useFormatter();
  const number = (value: number) => format.number(value, { numberingSystem: "latn" });
  const skin = skinOf(course.tone);
  const fill = skin.fills[(chapter.n - 1) % skin.fills.length];

  return (
    <li
      id={`ch-${chapter.n}`}
      data-theme="dark"
      className={`group relative flex scroll-mt-6 flex-col overflow-hidden rounded-xl p-4 shadow-soft transition-transform duration-200 ${fill} ${
        chapter.ready
          ? "hover:-translate-y-1.5 hover:shadow-lift"
          : "opacity-45"
      }`}
    >
      {/* رقم الفصل ختمًا يملأ البطاقة — خلف المحتوى بشفافية خفيفة
          فلا ينافس النص رغم حجمه */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-5 start-3 z-0 font-display text-[8rem] leading-none font-bold text-on-dominant opacity-[0.14] transition-opacity duration-200 select-none group-hover:opacity-25"
      >
        {number(chapter.n)}
      </span>

      <div className="relative z-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="font-display text-lg font-semibold text-on-dominant">
            {localize(chapter.title, locale)}
          </h3>
        </div>

        <p className={`mt-1 text-sm ${skin.meta}`}>
          {t("minutes", { count: chapter.minutes, countLabel: number(chapter.minutes) })}
          {" · "}
          {t("topics", { count: chapter.topics, countLabel: number(chapter.topics) })}
        </p>
      </div>

      <div className="relative z-10 mt-auto flex justify-end pt-4">
        {chapter.ready ? (
          <Link
            href={href}
            className={`inline-flex h-11 items-center gap-2 rounded-pill border px-5 font-semibold transition-colors hover:bg-pressable hover:text-on-pressable ${skin.arrow}`}
          >
            {t("start")}
            <ArrowForward />
          </Link>
        ) : (
          <span
            className={`rounded-pill border px-4 py-2 text-xs font-semibold ${skin.arrow}`}
          >
            {t("soon")}
          </span>
        )}
      </div>
    </li>
  );
}

export function CourseView({
  course,
  chapters,
  readyCount,
  state,
}: {
  course: Course;
  chapters: Chapter[];
  readyCount: number;
  state: ViewState;
}) {
  const t = useTranslations("Course");
  const locale = useLocale();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("chapters");
  const tone = TONES[course.tone];
  const slug = course.code.replace(" ", "-").toLowerCase();

  /* الزائر يُساق إلى التسجيل حاملًا مادته وفصله، والمسجَّل يدخل
     الجلسة مباشرةً. */
  const linkFor = (n: number) =>
    state === "guest"
      ? `/join?course=${encodeURIComponent(localize(course.name, locale))}&chapter=${n}&next=${encodeURIComponent(`/c/${slug}`)}`
      : `/session/${slug}/${n}`;

  return (
    <>
      {/* ————— الترويسة ————— */}
      <div className="flex items-start gap-4">
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl md:h-20 md:w-20 ${tone.card}`}
        >
          <SubjectIcon
            icon={course.icon}
            className={`h-9 w-9 md:h-11 md:w-11 ${tone.icon}`}
          />
        </span>

        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-tight font-bold text-ink md:text-5xl">
            {localize(course.name, locale)} ·{" "}
            <span dir="ltr" className="text-ink-2">
              {course.code}
            </span>
          </h1>
          <p className="mt-2 text-ink-2">
            {t("courseSummary", { university: localize(course.university, locale), count: readyCount, countLabel: String(readyCount) })}
          </p>
        </div>
      </div>

      {/* ————— التبويبات ————— */}
      <div
        role="tablist"
        aria-label={t("content")}
        className="mt-9 flex gap-1 overflow-x-auto border-b border-line"
      >
        {TABS.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              role="tab"
              type="button"
              id={`tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`panel-${item.id}`}
              disabled={!item.ready}
              onClick={() => item.ready && setTab(item.id)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 font-semibold whitespace-nowrap ${
                selected
                  ? "border-pressable text-ink"
                  : "border-transparent text-ink-2"
              } ${item.ready ? "" : "opacity-60"}`}
            >
              {t(item.label)}
              {item.ready ? null : (
                <span className="rounded-pill border border-ink-3 px-2 py-0.5 text-[11px] font-semibold">
                  {t("soon")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="panel-chapters"
        aria-labelledby="tab-chapters"
        className="mt-6"
      >
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {chapters.map((ch) => (
            <ChapterCard
              key={ch.n}
              chapter={ch}
              course={course}
              href={linkFor(ch.n)}
            />
          ))}
        </ul>
      </div>
    </>
  );
}
