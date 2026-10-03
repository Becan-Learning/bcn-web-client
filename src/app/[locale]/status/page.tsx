import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getTranslations, getFormatter, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { PageShell, QuietLink, Section, SiteHeader } from "@/components/becan/kit";

export async function generateMetadata({ params }: PageProps<"/[locale]/status">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Status" });
  return { title: t("metadataTitle") };
}

/* H3 — حالة النظام.

   منتج صوتي حيّ يعطب، وصفحة الحالة تمنع فيضان الدعم وقت العطل — وهي
   أرخص ما في القائمة بناءً.

   **ثلاث حالات لا أكثر**: يعمل · متأثر جزئيًا · متوقف. والتدرّج
   الأدقّ يوهم بدقّة لا نملكها.

   **الأخضر هنا في دوره**: `--live` معناه «يحدث الآن»، وهذا بالضبط ما
   تقوله الحالة الخضراء. والمتأثر جزئيًا كهرماني — إلحاح هادئ. أما
   المتوقّف فـ`--error`: عطل، وهي الحالة الوحيدة التي تستحقّ الأحمر
   في المنتج كله.

   الحالة واللقطات ثابتة هنا؛ في الإنتاج تأتي من المراقبة. والتواريخ
   مخزَّنة لا محسوبة من `new Date()` — الحساب وقت الرسم يكسر الترطيب. */

type Level = "ok" | "partial" | "down";

const LEVELS: Record<Level, { dot: string }> = {
  ok: { dot: "bg-live" },
  partial: { dot: "bg-pressable" },
  down: { dot: "bg-error" },
};

/* أجزاء الخدمة — المعرّف ثابت والاسم من رسائل الواجهة. */
const PARTS = [
  { id: "voice", level: "ok" },
  { id: "board", level: "ok" },
  { id: "auth", level: "ok" },
  { id: "billing", level: "ok" },
] as const satisfies readonly { id: string; level: Level }[];

const OVERALL: Level = "ok";

/* سجل الأعطال — تفاصيله من الرسائل، ومدته رقم لا نصّ. */
const HISTORY = [
  { id: "voice", minutes: 47 },
  { id: "slides", minutes: 26 },
  { id: "maintenance", minutes: 90 },
] as const;

export default async function StatusPage(props: PageProps<"/[locale]/status">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Status");
  const format = await getFormatter();

  const overall = LEVELS[OVERALL];

  return (
    <PageShell withFooter>
      <SiteHeader />

      <Section className="pt-10 pb-16 md:pt-14">
        <div className="max-w-measure">
          <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
            {t("title")}
          </h1>

          {/* الحالة العامة — رقم واحد بارز بلغة هذه الشاشة */}
          <div className="mt-6 rounded-xl border border-line bg-surface p-5 md:p-6">
            <p className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`h-3 w-3 shrink-0 rounded-pill ${overall.dot}`}
              />
              <span className="font-display text-2xl font-bold text-ink md:text-3xl">
                {t(`levels.${OVERALL}.label`)}
              </span>
            </p>
            <p className="mt-2 leading-base text-ink-2">{t(`levels.${OVERALL}.note`)}</p>
            <p className="mt-3 text-sm text-ink-2">
              {t("checked")}
            </p>
          </div>

          {/* أجزاء الخدمة */}
          <h2 className="mt-10 text-xl font-bold text-ink md:text-2xl">
            {t("partsTitle")}
          </h2>

          <ul className="mt-3 overflow-hidden rounded-xl border border-line bg-surface">
            {PARTS.map((p) => {
              const l = LEVELS[p.level];
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 last:border-0"
                >
                  <span className="font-semibold text-ink">{t(`parts.${p.id}`)}</span>

                  {/* الحالة نصّ ولون لا لونًا وحده */}
                  <span className="flex items-center gap-2 text-sm text-ink-2">
                    <span
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 shrink-0 rounded-pill ${l.dot}`}
                    />
                    {t(`levels.${p.level}.label`)}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* سجل الأعطال */}
          <h2 className="mt-10 text-xl font-bold text-ink md:text-2xl">
            {t("historyTitle")}
          </h2>
          <p className="mt-2 leading-base text-ink-2">
            {t("historyBody")}
          </p>

          <ol className="mt-5 flex flex-col gap-5">
            {HISTORY.map((h) => (
              <li key={h.id} className="border-t border-line pt-5">
                <p className="text-sm font-semibold text-ink-2">{t(`history.${h.id}.date`)}</p>
                <p className="mt-1 font-bold text-ink">
                  {t("incident", {
                    title: t(`history.${h.id}.title`),
                    minutes: h.minutes,
                    minutesLabel: format.number(h.minutes, { numberingSystem: "latn" }),
                  })}
                </p>
                <p className="mt-2 leading-base text-ink-2">{t(`history.${h.id}.what`)}</p>
              </li>
            ))}
          </ol>

          <p className="mt-8 leading-base text-ink-2">
            {t.rich("report", {
              contact: (chunks) => (
                <Link
                  href="/contact"
                  className="font-semibold text-pressable underline underline-offset-4"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>

          <div className="mt-8">
            <QuietLink href="/faq">{t("faq")}</QuietLink>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
