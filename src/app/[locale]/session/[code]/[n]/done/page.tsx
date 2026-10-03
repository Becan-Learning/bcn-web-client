import { localize } from "@/i18n/localized";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import {
  chaptersOf,
  courseBySlug,
  readyCount,
  slugOf,
} from "@/lib/data/catalog";
import {
  GhostButton,
  PageShell,
  PrimaryButton,
  Section,
} from "@/components/becan/kit";
import { ArrowForward } from "@/components/becan/icons";
import { FeedbackForm } from "./feedback-form";

/* الشاشة ٩ — ملخص الجلسة.

   **فاتحة** لا داكنة: الجلسة انتهت، والخروج منها إلى السطح الفاتح
   هو ما يجعل دخولها يُحسّ كدخول غرفة مذاكرة (النمط ٩).

   هدفها الوحيد: يشعر أنه أنجز شيئًا محسوسًا، ويعرف موقعه من
   الاختبار. والعدّاد يُعرض هنا لا يُكتشف في الداشبورد — الإلحاح
   يضرب في اللحظة الأقوى: نهاية جلسة ناجحة.

   الحالات الأربع تُعايَن بـ`?s=`. */

export async function generateMetadata(
  props: PageProps<"/[locale]/session/[code]/[n]/done">,
): Promise<Metadata> {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "SessionSummary" });
  return { title: t("metadata") };
}

const STATES = ["done", "clean", "cut", "last", "nodate"] as const;
type SummaryState = (typeof STATES)[number];

const isState = (v: unknown): v is SummaryState =>
  typeof v === "string" && (STATES as readonly string[]).includes(v);

/* بيانات عرض حتى يصل حساب حقيقي — الأيام والتعثّر والتغطية. */
const DAYS_LEFT = 9;
const COVERED = { topics: 4, of: 12 };
const STUMBLES = ["stumbleAsset", "stumbleControl"] as const;

export default async function SummaryPage(
  props: PageProps<"/[locale]/session/[code]/[n]/done">,
) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [t, format] = await Promise.all([
    getTranslations("SessionSummary"),
    getFormatter(),
  ]);
  const number = (value: number) => format.number(value, { numberingSystem: "latn" });

  const { code, n } = await props.params;
  const sp = await props.searchParams;
  const raw = Array.isArray(sp.s) ? sp.s[0] : sp.s;
  const state: SummaryState = isState(raw) ? raw : "done";
  /* تصل من الجلسة الحقيقية: اسم غرفة LiveKit للتقييم، وبلوغ الحدّ الزمني */
  const roomRaw = Array.isArray(sp.room) ? sp.room[0] : sp.room;
  const room = typeof roomRaw === "string" && roomRaw ? roomRaw : null;
  const hitLimit = (Array.isArray(sp.limit) ? sp.limit[0] : sp.limit) === "1";
  /* بعد جلسة حقيقية لا تُعرض أرقام العرض كأنها بيانات الطالب (النمط 4):
     لا عدّاد ولا تقدّم ولا تعثّر حتى يرسل الوكيل ملخّصًا. معاينة ?s= باقية. */
  const real = room !== null;

  const course = courseBySlug(code);
  if (!course) notFound();

  const chapter = chaptersOf(course.code).find((c) => String(c.n) === n);
  if (!chapter || !chapter.ready) notFound();

  const total = readyCount(course.code);
  const done = Math.min(chapter.n, total);
  const slug = slugOf(course.code);

  const cut = state === "cut";
  const last = state === "last";
  const noDate = state === "nodate";
  /* جلسة نظيفة: يُحذف قسم التعثّر ولا يُستبدل بمدح */
  const stumbles = real || state === "clean" || cut ? [] : STUMBLES;

  return (
    <PageShell>
      <Section className="flex flex-1 flex-col justify-center pt-10 pb-16 md:pt-14">
        <div className="w-full max-w-measure">
          {/* العدّاد — يُعرض هنا لا يُكتشف في الداشبورد.
              وبلا تاريخ محدَّد يصير سطرًا قابلًا للضغط لا كتلة. */}
          {real ? null : noDate ? (
            <Link
              href="/home"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-tint-amber px-4 py-2.5 font-semibold text-ink"
            >
              {t("setExamDate")}
              <ArrowForward className="h-4 w-4" />
            </Link>
          ) : (
            <p className="inline-flex items-center rounded-lg bg-tint-amber px-4 py-2.5 font-semibold text-ink">
              {t("daysLeft", { count: DAYS_LEFT, countLabel: number(DAYS_LEFT), course: localize(course.name, locale) })}
            </p>
          )}

          {/* الرقم الواحد البارز — ما أنجزه للتوّ */}
          <h1 className="mt-6 font-display text-4xl leading-tight font-bold tracking-tight text-ink md:text-5xl">
            {real
              ? t("sessionEnded", { number: number(chapter.n) })
              : cut
              ? t("covered", { covered: number(COVERED.topics), total: COVERED.of, totalLabel: number(COVERED.of) })
              : last
                ? t("courseFinished", { course: localize(course.name, locale) })
                : t("chapterFinished", { number: number(chapter.n) })}
          </h1>

          {real ? null : <Progress done={done} total={total} label={t("progress", { doneLabel: number(done), total, totalLabel: number(total) })} />}

          {/* الحدّ الزمني — كهرماني هادئ مع فعل ممكن، لا إنذار أحمر (النمط 7) */}
          {hitLimit ? (
            <p className="mt-6 rounded-lg bg-tint-amber px-4 py-3 leading-base text-ink">
              {t("limit")}
            </p>
          ) : null}

          {stumbles.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-ink-2">{t("struggled")}</h2>
              <ul className="mt-2 flex flex-col gap-1">
                {stumbles.map((s) => (
                  <li key={s} className="flex items-baseline gap-2 text-ink">
                    <span aria-hidden="true" className="text-ink-2">
                      ·
                    </span>
                    {t(s)}
                  </li>
                ))}
              </ul>

              {/* ما يفقد الدرجة — الجوزيّ حدًّا لا نصًّا */}
              <p className="mt-4 rounded-md border-s-4 border-s-warmth bg-tint-walnut px-4 py-3 text-ink">
                {t.rich("penalty", { strong: (chunks) => <span className="font-semibold">{chunks}</span> })}
              </p>
            </section>
          ) : null}

          {/* الأساسي يتبع الحالة: الجلسة المقطوعة تُكمَّل، وغيرها
              يذهب إلى الخطة (قرار المؤسس)، و«الفصل التالي» يبقى
              ثانويًا ظاهرًا ليكون تبديل الأولوية اختبارًا بضغطة. */}
          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {cut ? (
              <PrimaryButton
                href={`/session/${slug}/${chapter.n}`}
                className="w-full sm:w-fit"
              >
                {t("continueChapter")}
              </PrimaryButton>
            ) : (
              <PrimaryButton href="/home" className="w-full sm:w-fit">
                {t("plan")}
              </PrimaryButton>
            )}

            {last ? (
              <GhostButton href={`/c/${slug}`}>
                {t("reviewStumbles")}
              </GhostButton>
            ) : chapter.n < total ? (
              <Link
                href={`/session/${slug}/${chapter.n + 1}`}
                className="group inline-flex min-h-11 items-center gap-2 px-2 font-semibold text-ink"
              >
                {t("nextChapter")}
                <ArrowForward className="h-4 w-4 transition-transform duration-200 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
              </Link>
            ) : null}
          </div>

          {room ? <FeedbackForm room={room} /> : null}
        </div>
      </Section>
    </PageShell>
  );
}

function Progress({ done, total, label }: { done: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="mt-4">
      <p className="text-ink-2">
        {label}
      </p>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-line"
      >
        <div
          className="h-full rounded-pill bg-aubergine-mid"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
