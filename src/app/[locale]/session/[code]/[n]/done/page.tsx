import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import {
  chaptersOf,
  courseBySlug,
  slugOf,
} from "@/lib/data/catalog";
import {
  PageShell,
  PrimaryButton,
  Section,
} from "@/components/becan/kit";
import { ArrowForward } from "@/components/becan/icons";
import { FeedbackForm } from "./feedback-form";
import { requireAccount } from "@/lib/auth/session";
import { accountReturnPath } from "@/lib/auth/next-path";

/* الشاشة ٩ — نهاية الجلسة على السطح الفاتح.
   تعرض الفصل والحدّ الزمني إن بلغته الجلسة، والتقييم عند وصول اسم الغرفة.
   الفعل الأساسي يعود إلى المقرر، والثانوي يفتح الفصل التالي إن كان جاهزًا. */

export async function generateMetadata(
  props: PageProps<"/[locale]/session/[code]/[n]/done">,
): Promise<Metadata> {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "SessionSummary" });
  return { title: t("metadata") };
}

export default async function SummaryPage(
  props: PageProps<"/[locale]/session/[code]/[n]/done">,
) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { code, n } = await props.params;
  await requireAccount(locale, accountReturnPath(`/session/${code}/${n}/done`, await props.searchParams));
  const [t, format] = await Promise.all([
    getTranslations("SessionSummary"),
    getFormatter(),
  ]);
  const number = (value: number) => format.number(value, { numberingSystem: "latn" });

  const sp = await props.searchParams;
  /* تصل من الجلسة الحقيقية: اسم غرفة LiveKit للتقييم، وبلوغ الحدّ الزمني */
  const roomRaw = Array.isArray(sp.room) ? sp.room[0] : sp.room;
  const room = typeof roomRaw === "string" && roomRaw ? roomRaw : null;
  const hitLimit = (Array.isArray(sp.limit) ? sp.limit[0] : sp.limit) === "1";
  const course = courseBySlug(code);
  if (!course) notFound();

  const chapter = chaptersOf(course.code).find((c) => String(c.n) === n);
  if (!chapter || !chapter.ready) notFound();

  const slug = slugOf(course.code);
  const nextChapter = chaptersOf(course.code).find((c) => c.n === chapter.n + 1);

  return (
    <PageShell>
      <Section className="flex flex-1 flex-col justify-center pt-10 pb-16 md:pt-14">
        <div className="w-full max-w-measure">
          <h1 className="mt-6 font-display text-4xl leading-tight font-bold tracking-tight text-ink md:text-5xl">
            {t("sessionEnded", { number: number(chapter.n) })}
          </h1>

          {/* الحدّ الزمني — كهرماني هادئ مع فعل ممكن، لا إنذار أحمر (النمط 7) */}
          {hitLimit ? (
            <p className="mt-6 rounded-lg bg-tint-amber px-4 py-3 leading-base text-ink">
              {t("limit")}
            </p>
          ) : null}

          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <PrimaryButton href={`/c/${slug}`} className="w-full sm:w-fit">
              {t("backToCourse")}
            </PrimaryButton>

            {nextChapter?.ready ? (
              <Link
                href={`/session/${slug}/${nextChapter.n}`}
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
