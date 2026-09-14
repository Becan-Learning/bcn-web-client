"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowForward, StatusIcon } from "@/components/becan/icons";
import { PrimaryButton } from "@/components/becan/kit";
import { SubjectIcon } from "@/app/courses/subject-icon";
import type { Chapter, Course } from "@/lib/data/catalog";
import { TONES } from "@/lib/data/catalog";

/* بريف الشاشة 5.
   قاعدة حاسمة: الصفحة قابلة للتصفّح بلا تسجيل — كل شيء ظاهر،
   وجدار التسجيل عند الضغط على فصل فقط. */

const TABS = [
  { id: "chapters", label: "الفصول", ready: true },
  { id: "checks", label: "اختبارات التحقق", ready: false },
  { id: "sources", label: "مصادر أخرى", ready: false },
] as const;

export type ViewState = "guest" | "new" | "progress";

/* بطاقات الفصول داكنة. اللوحة لا تملك كهرمانيًا أو جوزيًا داكنًا
   يصلح تعبئةً تحمل نصًا، فالعائلتان المتاحتان: الباذنجاني والزيتي.
   لونان متناوبان داخل كل عائلة يعطيان إيقاعًا بلا خروج عنها. */
const SKINS = {
  purple: {
    fills: ["bg-aubergine-base", "bg-aubergine-deep"],
    meta: "text-aubergine-tint",
    bar: "bg-aubergine-tint",
    arrow: "border-aubergine-soft text-on-dominant",
  },
  olive: {
    fills: ["bg-olive-dark", "bg-olive-deep"],
    meta: "text-olive-soft",
    bar: "bg-olive-soft",
    arrow: "border-olive-soft text-on-dominant",
  },
} as const;

type Status = "none" | "next" | "almost" | "done";

const STATUS_LABEL: Record<Status, string> = {
  none: "ما بدأت",
  next: "الخطوة الجاية",
  almost: "باقي له شوي",
  done: "أنجزته",
};

const skinOf = (tone: Course["tone"]) =>
  tone === "olive" || tone === "oliveDark" ? SKINS.olive : SKINS.purple;

/** شريط الإتقان — يظهر للمسجّل فقط، وفارغ قبل أن يبدأ. */
function MasteryBar({
  percent,
  skin,
}: {
  percent: number;
  skin: { meta: string; bar: string };
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="h-1.5 flex-1 overflow-hidden rounded-pill bg-on-dominant/20"
      >
        <span
          className={`block h-full rounded-pill ${skin.bar}`}
          style={{ inlineSize: `${percent}%` }}
        />
      </span>
      <span className={`shrink-0 text-xs ${skin.meta}`}>
        {percent > 0 ? `${percent}% إتقان` : "لم تبدأ"}
      </span>
    </div>
  );
}

/* لوحة مصغّرة. رقم واحد يهيمن وشريط يترجمه بصريًا — نمط 1 في
   CLAUDE.md يمنع لوحة إحصائيات متساوية الأوزان. */
function MiniDashboard({
  percent,
  done,
  total,
  examDate,
  action,
}: {
  percent: number;
  done: number;
  total: number;
  examDate: string;
  action: { href: string; label: string; next: string };
}) {
  return (
    <div className="mt-8 rounded-xl border border-line bg-surface p-5 shadow-soft md:p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-2">تقدّمك في المقرر</p>

          {/* الرقم البارز الوحيد */}
          <p className="mt-1 font-display text-5xl leading-none font-bold text-ink md:text-6xl">
            {percent}%
          </p>

          {/* الشريط يترجم الرقم بصريًا */}
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="تقدّمك في المقرر"
            className="mt-4 h-2.5 max-w-measure overflow-hidden rounded-pill bg-line"
          >
            <span
              className="block h-full rounded-pill bg-aubergine-base"
              style={{ inlineSize: `${percent}%` }}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-ink-2">
              أنجزت {done} من {total} فصول
            </p>
            <span className="inline-flex items-center gap-2 rounded-pill border border-aubergine-mid bg-tint-aubergine px-3 py-1 text-sm text-ink">
              اختبارك المتوقّع
              <span className="font-semibold">{examDate}</span>
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <PrimaryButton href={action.href} className="w-full md:w-auto">
            {action.label}
          </PrimaryButton>
          {/* الخطوة التالية صراحةً — يعرف إلى أين يأخذه الزر قبل ضغطه.
              مسحة كهرمانية خفيفة تميّزها بلا أن تنافس الرقم البارز. */}
          <p className="mt-3 md:text-end">
            {/* الحافة أخضر سولد، والخلفية نفس الأخضر بشفافية خفيفة.
                النص عائد إلى ink: على الخليط الفاتح يعطي 12.5:1. */}
            <span className="inline-block rounded-md border-s-4 border-s-success bg-success/15 px-3 py-1.5 text-sm font-semibold text-ink">
              الخطوة التالية: {action.next}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function ChapterCard({
  chapter,
  course,
  state,
  mastery,
  href,
  resume,
  status,
}: {
  chapter: Chapter;
  course: Course;
  state: ViewState;
  mastery: number;
  href: string;
  resume: boolean;
  status: Status;
}) {
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
        {chapter.n}
      </span>

      <div className="relative z-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="font-display text-lg font-semibold text-on-dominant">
            {chapter.title}
          </h3>
          {chapter.ready ? (
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold ${
                status === "next"
                  ? "bg-on-dominant/15 text-on-dominant"
                  : skin.meta
              }`}
            >
              <StatusIcon kind={status} />
              {STATUS_LABEL[status]}
            </span>
          ) : null}
        </div>

        <p className={`mt-1 text-sm ${skin.meta}`}>{chapter.topics} موضوع</p>

        {chapter.ready && state !== "guest" ? (
          <div className="mt-3">
            <MasteryBar percent={mastery} skin={skin} />
          </div>
        ) : null}
      </div>

      <div className="relative z-10 mt-auto flex justify-end pt-4">
        {chapter.ready ? (
          <Link
            href={href}
            className={`inline-flex h-11 items-center gap-2 rounded-pill border px-5 font-semibold transition-colors hover:bg-pressable hover:text-on-pressable ${skin.arrow}`}
          >
            {resume ? "أكمل" : "ابدأ الشرح"}
            <ArrowForward />
          </Link>
        ) : (
          <span
            className={`rounded-pill border px-4 py-2 text-xs font-semibold ${skin.arrow}`}
          >
            قريبًا
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
  examDate,
}: {
  course: Course;
  chapters: Chapter[];
  readyCount: number;
  state: ViewState;
  examDate: string;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("chapters");
  const tone = TONES[course.tone];
  const slug = course.code.replace(" ", "-").toLowerCase();

  /* حالة «في التقدّم»: الفصلان الأولان مُتقنان والثالث جارٍ */
  const masteryOf = (n: number) => {
    if (state !== "progress") return 0;
    if (n <= 2) return 100;
    if (n === 3) return 40;
    if (n === 4) return 80;
    return 0;
  };

  const ready = chapters.filter((c) => c.ready);
  const done = ready.filter((c) => masteryOf(c.n) === 100).length;
  const percent = Math.round(
    ready.reduce((sum, c) => sum + masteryOf(c.n), 0) / ready.length,
  );

  /* نقطة الوقوف: أول فصل بدأه ولم يُتقنه، وإلا أول فصل لم يبدأه */
  const resumeCh =
    ready.find((c) => masteryOf(c.n) > 0 && masteryOf(c.n) < 100) ??
    ready.find((c) => masteryOf(c.n) === 0) ??
    ready[0];

  /* الزائر يُساق إلى التسجيل حاملًا مادته وفصله، والمسجَّل يدخل
     الجلسة مباشرةً. */
  const linkFor = (n: number) =>
    state === "guest"
      ? `/join?course=${encodeURIComponent(course.name)}&chapter=${n}&next=${encodeURIComponent(`/c/${slug}`)}`
      : `/session/${slug}/${n}`;

  const statusOf = (n: number): Status => {
    const m = masteryOf(n);
    if (m === 100) return "done";
    if (n === resumeCh.n) return "next";
    if (m > 0) return "almost";
    return "none";
  };

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
            {course.name} ·{" "}
            <span dir="ltr" className="text-ink-2">
              {course.code}
            </span>
          </h1>
          <p className="mt-2 text-ink-2">
            {course.university} · {readyCount} فصول
          </p>
        </div>
      </div>

      <MiniDashboard
        percent={percent}
        done={done}
        total={readyCount}
        examDate={examDate}
        action={{
          href: linkFor(resumeCh.n),
          label: "كمّل مذاكرة",
          next: `الفصل ${resumeCh.n} · ${resumeCh.title}`,
        }}
      />

      {/* ————— التبويبات ————— */}
      <div
        role="tablist"
        aria-label="محتوى المقرر"
        className="mt-9 flex gap-1 overflow-x-auto border-b border-line"
      >
        {TABS.map((t) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              disabled={!t.ready}
              onClick={() => t.ready && setTab(t.id)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 font-semibold whitespace-nowrap ${
                selected
                  ? "border-pressable text-ink"
                  : "border-transparent text-ink-2"
              } ${t.ready ? "" : "opacity-60"}`}
            >
              {t.label}
              {t.ready ? null : (
                <span className="rounded-pill border border-ink-3 px-2 py-0.5 text-[11px] font-semibold">
                  قريبًا
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
              state={state}
              mastery={masteryOf(ch.n)}
              href={linkFor(ch.n)}
              resume={ch.n === resumeCh.n && masteryOf(ch.n) > 0}
              status={statusOf(ch.n)}
            />
          ))}
        </ul>
      </div>
    </>
  );
}
