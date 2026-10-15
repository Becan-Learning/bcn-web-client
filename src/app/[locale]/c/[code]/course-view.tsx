"use client";

import { useTranslations, useLocale, useFormatter } from "next-intl";
import { localize } from "@/i18n/localized";

import { useRef, useState, useTransition } from "react";
import { Dialog } from "radix-ui";
import { PrimaryButton } from "@/components/becan/kit";
import { QuotaBlock, type CourseSlotQuota } from "@/components/becan/quota";
import { mutateEnrollment } from "./enrollment-mutation";
import { Link, useRouter } from "@/i18n/navigation";
import { ArrowForward } from "@/components/becan/icons";
import { SubjectIcon } from "@/app/[locale]/courses/subject-icon";
import type { Chapter, Course } from "@/lib/courses/schema";
import { TONES } from "@/lib/courses/presentation";
import { chapterStartable, sessionHref } from "@/lib/session/resolve";
import { previewStartPins } from "@/lib/preview/rules";
import { DraftBadge } from "@/components/becan/preview-badges";

/* صفحة المقرر قابلة للتصفّح، وفتح الفصل يتطلّب تسجيلًا نشطًا في المقرر. */

const TABS = [
  { id: "chapters", label: "chapters", ready: true },
  { id: "checks", label: "checks", ready: false },
  { id: "sources", label: "sources", ready: false },
] as const;

/* "open": حساب غير محدود (مشرف) غير مسجَّل — يبدأ الفصول المنشورة مباشرة.
   "closed": مقرر مؤرشف وغير مسجَّل فيه — لا تسجيل ولا بدء، وشرح بدلهما. */
export type ViewState = "guest" | "new" | "enrolled" | "open" | "closed";

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
  state,
  joinHref,
  pending,
  disabled,
  onEnroll,
  quotaReached,
  preview,
}: {
  chapter: Chapter;
  course: Course;
  state: ViewState;
  joinHref: string;
  pending: boolean;
  disabled: boolean;
  onEnroll: () => void;
  quotaReached: boolean;
  /* قراءة معاينة المشرف: الفصل المسوّدة موسوم ويبدأ بنسخته، وكل فصل فيه ما يُقرأ يُفتح. */
  preview: boolean;
}) {
  const t = useTranslations("Course");
  const locale = useLocale();
  const format = useFormatter();
  const number = (value: number) => format.number(value, { numberingSystem: "latn" });
  const skin = skinOf(course.tone);
  const fill = skin.fills[(chapter.number - 1) % skin.fills.length];
  const published = chapterStartable(chapter, preview ? "preview" : "public");

  return (
    <li
      id={`ch-${chapter.number}`}
      data-theme="dark"
      className={`group relative flex scroll-mt-6 flex-col overflow-hidden rounded-xl p-4 shadow-soft transition-transform duration-200 ${fill} ${
        published
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
        {number(chapter.number)}
      </span>

      <div className="relative z-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="font-display text-lg font-semibold text-on-dominant">
            {localize(chapter.title, locale)}
          </h3>
          {chapter.state === "draft" ? <DraftBadge colors={skin.arrow} /> : null}
        </div>

        <p className={`mt-1 text-sm ${skin.meta}`}>
          {t("minutes", { count: chapter.minutes, countLabel: number(chapter.minutes) })}
          {" · "}
          {t("lessons", { count: chapter.lessonCount, countLabel: number(chapter.lessonCount) })}
        </p>
      </div>

      <div className="relative z-10 mt-auto flex justify-end pt-4">
        {!published ? (
          <span className={`rounded-pill border px-4 py-2 text-xs font-semibold ${skin.arrow}`}>{t("soon")}</span>
        ) : state === "enrolled" || state === "open" ? (
          <Link href={sessionHref(course.slug, chapter.id, false, preview ? previewStartPins(course, chapter) : {})}
            className={`inline-flex min-h-11 items-center gap-2 rounded-pill border px-5 font-semibold transition-colors hover:bg-pressable hover:text-on-pressable ${skin.arrow}`}>
            {t("start")}<ArrowForward />
          </Link>
        ) : state === "closed" ? null : state === "guest" ? (
          <Link href={joinHref} className={`inline-flex min-h-11 items-center gap-2 rounded-pill border px-5 font-semibold ${skin.arrow}`}>{t("enroll")}</Link>
        ) : quotaReached ? (
          <Link href="#quota" className={`inline-flex min-h-11 items-center rounded-pill border px-5 font-semibold ${skin.arrow}`}>
            {t("slotsFullHint")}
          </Link>
        ) : (
          <button type="button" disabled={pending || disabled} onClick={onEnroll}
            className={`inline-flex min-h-11 items-center rounded-pill border px-5 font-semibold disabled:opacity-60 ${skin.arrow}`}>
            {t(pending ? "enrolling" : "enroll")}
          </button>
        )}
      </div>
    </li>
  );
}

export function CourseView({
  course,
  chapters,
  enrollmentError,
  state,
  slotQuota,
  preview = false,
}: {
  course: Course;
  chapters: Chapter[];
  enrollmentError: boolean;
  state: ViewState;
  slotQuota: CourseSlotQuota | null;
  /* المصدر معاينة المشرف (فيه المسوّدات والنسخ)، لا الكتالوج العام. */
  preview?: boolean;
}) {
  const t = useTranslations("Course");
  const locale = useLocale();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("chapters");
  const tone = TONES[course.tone];
  const format = useFormatter();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<"enrollError" | "unenrollError" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const archived = course.status === "archived";
  const joinHref = `/join?course=${encodeURIComponent(localize(course.name, locale))}&next=${encodeURIComponent(`/c/${course.slug}`)}`;

  const mutate = (method: "PUT" | "DELETE") => {
    if (pending || enrollmentError) return;
    setError(null);
    startTransition(async () => {
      try {
        await mutateEnrollment(course.id, method, () => router.refresh());
        setConfirmOpen(false);
      } catch {
        setError(method === "PUT" ? "enrollError" : "unenrollError");
      }
    });
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
            className={`h-9 w-9 md:h-11 md:w-11 ${course.tone === "deep" ? "text-aubergine-tint" : tone.icon}`}
          />
        </span>

        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-tight font-bold text-ink md:text-5xl">
            {localize(course.name, locale)} ·{" "}
            <span dir="ltr" className="text-ink-2">
              {course.code}
            </span>
          </h1>
          {archived ? (
            <span className="mt-3 inline-flex rounded-pill border border-line px-3 py-0.5 text-sm font-semibold text-ink-2">{t("archived")}</span>
          ) : course.status === "draft" ? (
            <DraftBadge className="mt-3" />
          ) : null}
          <p className="mt-2 text-ink-2">
            {t("courseSummary", { university: localize(course.institution.name, locale), count: course.publishedChapterCount, countLabel: format.number(course.publishedChapterCount, { numberingSystem: "latn" }) })}
          </p>
        </div>
      </div>

      {archived ? (
        <p id="archived-note" className="mt-6 max-w-measure rounded-lg bg-tint-aubergine px-4 py-3 leading-base text-ink">
          {t(state === "enrolled" ? "archivedEnrolled" : "archivedClosed")}
        </p>
      ) : null}

      <div className="mt-6">
        {state === "guest" ? (
          <PrimaryButton href={joinHref}>{t("enroll")}</PrimaryButton>
        ) : state === "open" || state === "closed" ? null : state === "new" ? slotQuota !== null ? (
          <QuotaBlock id="quota" kind="slots-full" {...slotQuota} />
        ) : (
          <PrimaryButton type="button" disabled={pending || enrollmentError} onClick={() => mutate("PUT")}>
            {t(pending ? "enrolling" : "enroll")}
          </PrimaryButton>
        ) : (
          <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
            <Dialog.Trigger asChild>
              <button type="button" disabled={pending} className="inline-flex min-h-11 items-center rounded-pill border border-line px-5 font-semibold text-ink disabled:opacity-60">{t("unenroll")}</button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-ground/80" />
              <Dialog.Content dir={locale === "ar" ? "rtl" : "ltr"} data-theme="light"
                onOpenAutoFocus={(event) => { event.preventDefault(); cancelRef.current?.focus(); }}
                className="fixed top-1/2 start-1/2 z-50 w-[calc(100%_-_2rem)] max-w-md -translate-y-1/2 rounded-xl border border-line bg-surface p-6 ltr:-translate-x-1/2 rtl:translate-x-1/2">
                <Dialog.Title className="font-display text-2xl font-bold text-ink">{t("unenrollTitle")}</Dialog.Title>
                <Dialog.Description className="mt-3 leading-base text-ink-2">{t(archived ? "unenrollBodyArchived" : "unenrollBody", { course: localize(course.name, locale) })}</Dialog.Description>
                {error ? <p role="alert" className="mt-4 text-error">{t(error)}</p> : null}
                <div className="mt-6 flex flex-wrap gap-3">
                  <PrimaryButton type="button" disabled={pending} onClick={() => mutate("DELETE")}>{t(pending ? "unenrolling" : "unenrollConfirm")}</PrimaryButton>
                  <Dialog.Close asChild>
                    <button type="button" ref={cancelRef} className="inline-flex min-h-11 items-center rounded-pill border border-line px-5 font-semibold text-ink">{t("unenrollCancel")}</button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
        {enrollmentError ? <p role="alert" className="mt-3 text-error">{t("enrollmentLoadError")}</p> : error && !confirmOpen ? <p role="alert" className="mt-3 text-error">{t(error)}</p> : null}
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
              key={ch.id}
              chapter={ch}
              course={course}
              state={state}
              joinHref={joinHref}
              pending={pending}
              disabled={enrollmentError}
              quotaReached={slotQuota !== null}
              preview={preview}
              onEnroll={() => mutate("PUT")}
            />
          ))}
        </ul>
      </div>
    </>
  );
}
