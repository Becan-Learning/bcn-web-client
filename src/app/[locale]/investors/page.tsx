import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { PageShell, Section, SiteHeader } from "@/components/becan/kit";
import { InvestorForm } from "./investor-form";

/* M6 — للمستثمرين.

   **هنا فقط تُعرض أرقام المستثمرين**، ولا تظهر في أي صفحة للطالب:
   كل جمهور وأرقامه. الطالب يقرأ «120 طالب» ضعفًا، والمستثمر يقرأها
   بداية — ونفس الرقم لا يخدم القراءتين في مكان واحد.

   الاستثناء الوحيد لنمط «رقم واحد بارز»: المستثمر يقارن مجموعة أرقام
   بعضها ببعض، ورقم واحد لا يقول له شيئًا.

   ⚠️ الأرقام كما وردت في البريف. أي رقم يتغيّر يُحدَّث هنا وفي
   نسخة الـDeck معًا. */

export async function generateMetadata({ params }: PageProps<"/[locale]/investors">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Investors" });
  return { title: t("metadataTitle"), description: t("metadataDescription"), robots: { index: false, follow: false } };
}

export default async function InvestorsPage(props: PageProps<"/[locale]/investors">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Investors");
  const metrics = [
    { id: "students", count: 120 },
    { id: "sessions", count: 307 },
    { id: "hours", count: 25.4 },
    { id: "return", count: 62 },
    { id: "rating", count: 4.12 },
  ] as const;

  return (
    <PageShell withFooter>
      <SiteHeader minimal />

      <main>
        <Section className="pt-12 pb-14 md:pt-16">
          <div className="max-w-measure">
            <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl xl:text-6xl">
              {t("title")}</h1>
            <p className="mt-5 text-lg leading-base text-ink-2">
              {t("intro")}</p>
          </div>

          {/* أرقام هذه الصفحة وحدها */}
          <dl className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map(({ id, count }) => (
              <div
                key={id}
                className="rounded-xl border border-line bg-surface p-6"
              >
                <dt className="text-sm font-semibold text-ink-2">{t(`Metrics.${id}.note`)}</dt>
                <dd className="mt-2 flex items-baseline gap-2">
                  {t.rich(`Metrics.${id}.amount`, {
                    count, countLabel: String(count),
                    value: (chunks) => <span className="font-display text-4xl leading-none font-bold text-ink md:text-5xl">{chunks}</span>,
                    unit: (chunks) => <span className="font-semibold text-ink-2">{chunks}</span>,
                  })}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 max-w-measure text-sm leading-base text-ink-2">
            {t("metricsNote")}</p>
        </Section>

        <Section className="pb-16">
          <div className="max-w-measure">
            <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">
              {t.rich("deckTitle", { latin: (chunks) => <span dir="ltr">{chunks}</span> })}
            </h2>
            <p className="mt-2 leading-base text-ink-2">
              {t("deckBody")}</p>

            <div className="mt-6">
              <InvestorForm />
            </div>
          </div>
        </Section>
      </main>
    </PageShell>
  );
}
