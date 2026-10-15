import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link, redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { findSessionTarget, getEnrollments } from "@/lib/auth/courses";
import { chapterIsPublished, sessionHref } from "@/lib/session/resolve";
import {
  PageShell,
  PrimaryButton,
  Section,
} from "@/components/becan/kit";
import { ArrowForward } from "@/components/becan/icons";
import { FeedbackForm } from "./feedback-form";
import { requireAccount } from "@/lib/auth/session";
import { accountReturnPath } from "@/lib/auth/next-path";
import { getAllowance } from "@/lib/allowance/server";
import { startDecision } from "@/lib/allowance/rules";
import { usedUpQuota } from "@/lib/allowance/presentation";
import { QuotaBlock } from "@/components/becan/quota";

/* الشاشة ٩ — نهاية الجلسة على السطح الفاتح.
   تعرض الفصل والحدّ الزمني إن بلغته الجلسة، والتقييم عند وصول اسم الغرفة.
   الفعل الأساسي يعود إلى المقرر، والثانوي يفتح الفصل التالي إن كان جاهزًا. */

export async function generateMetadata(
  props: PageProps<"/[locale]/session/[courseSlug]/[chapterId]/done">,
): Promise<Metadata> {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "SessionSummary" });
  return { title: t("metadata") };
}

export default async function SummaryPage(
  props: PageProps<"/[locale]/session/[courseSlug]/[chapterId]/done">,
) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { courseSlug, chapterId } = await props.params;
  const sp = await props.searchParams;
  await requireAccount(locale, accountReturnPath(sessionHref(courseSlug, chapterId, true), sp));
  /* اسم الغرفة يصل من الحصة الحقيقية، لا من معاينة الملخّص. */
  const roomRaw = Array.isArray(sp.room) ? sp.room[0] : sp.room;
  const room = typeof roomRaw === "string" && roomRaw ? roomRaw : null;
  const [t, format, target, enrollments, allowance] = await Promise.all([
    getTranslations("SessionSummary"),
    getFormatter(),
    findSessionTarget(courseSlug, chapterId),
    getEnrollments(),
    room ? getAllowance() : null,
  ]);
  const number = (value: number) => format.number(value, { numberingSystem: "latn" });

  /* تصل من الجلسة الحقيقية: اسم غرفة LiveKit للتقييم، وبلوغ الحدّ الزمني */
  const hitLimit = (Array.isArray(sp.limit) ? sp.limit[0] : sp.limit) === "1";
  if (target.kind === "not-found") notFound();
  /* الملخّص يخصّ الفصل بمعرّفه: لو غُيّر رقمه أو رابط مقرره أثناء الحصة بقي هو نفسه. */
  if (target.kind === "redirect") return redirect({ locale, href: accountReturnPath(sessionHref(target.slug, chapterId, true), sp) });
  const { course, chapter } = target;
  const enrolled = enrollments.ok && enrollments.data.some((e) => e.course.id === course.id);
  /* غير المسجَّل يحتاج الحدود ليُعرف أهو حساب غير محدود (مشرف) أم يعود إلى المقرر. */
  const allowanceResult = allowance ?? (enrolled ? null : await getAllowance());
  const allowanceData = allowanceResult?.ok ? allowanceResult.data : null;
  const decision = startDecision({ allowance: allowanceData, enrolled, published: chapterIsPublished(chapter) });
  if (!decision.ok && decision.reason === "unpublished") notFound();
  if (!decision.ok && decision.reason === "not-enrolled") return redirect({ locale, href: `/c/${course.slug}` });
  const quota = usedUpQuota(allowanceData);
  const nextChapter = course.chapters.find((c) => c.number === chapter.number + 1);

  return (
    <PageShell>
      <Section className="flex flex-1 flex-col justify-center pt-10 pb-16 md:pt-14">
        <div className="w-full max-w-measure">
          <h1 className="mt-6 font-display text-4xl leading-tight font-bold tracking-tight text-ink md:text-5xl">
            {t("sessionEnded", { number: number(chapter.number) })}
          </h1>

          {/* الحدّ الزمني — كهرماني هادئ مع فعل ممكن، لا إنذار أحمر (النمط 7) */}
          {quota ? (
            <div className="mt-6"><QuotaBlock {...quota} /></div>
          ) : hitLimit ? (
            <p className="mt-6 rounded-lg bg-tint-amber px-4 py-3 leading-base text-ink">
              {t("limit")}
            </p>
          ) : null}

          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <PrimaryButton href={`/c/${course.slug}`} className="w-full sm:w-fit">
              {t("backToCourse")}
            </PrimaryButton>

            {nextChapter && chapterIsPublished(nextChapter) ? (
              <Link
                href={sessionHref(course.slug, nextChapter.id)}
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
