import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { PageShell, Scribbled, Section, SiteHeader } from "@/components/becan/kit";
import { AmbassadorForm } from "./ambassador-form";

/* M5 — سفراء بيكان.

   خطة النمو موثّقة كـ community-led، والسفراء بلا صفحة يعني أن الخطة
   شعار. هذه الصفحة تحوّلها إلى باب يُطرق.

   **رقم واحد بارز: العمولة** — لا عدد السفراء الحاليين. العدد في
   بداية برنامج صغير رقمٌ يُضعف الدعوة لا يقوّيها، والعمولة هي ما
   يقرّر بها الطالب.

   ⚠️ الأرقام (20٪، مدة العمولة، شرط الشارة) قرار مؤسّس لا قرار
   تصميم — مسجَّلة في docs/STATE.md كنقطة تنتظر تثبيتًا.

   الخربشة مرّة واحدة في الشاشة، والزرّ الكهرماني واحد في النموذج. */

export async function generateMetadata({ params }: PageProps<"/[locale]/ambassadors">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Ambassadors" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function AmbassadorsPage(props: PageProps<"/[locale]/ambassadors">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Ambassadors");
  const GETS = [
    {
      title: t("getsProTitle"),
      body: t("getsProBody"),
    },
    {
      title: t("getsCommissionTitle"),
      body: t("getsCommissionBody"),
    },
    {
      title: t("getsBadgeTitle"),
      body: t("getsBadgeBody"),
    },
  ];
  const DOES = [
    t("doesShare"),
    t("doesTry"),
    t("doesRequest"),
  ];

  return (
    <PageShell withFooter>
      <SiteHeader />

      <main>
        <Section className="pt-12 pb-14 md:pt-16">
          <div className="max-w-measure">
            <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl xl:text-6xl">
              {t.rich("title", { word: (chunks) => <Scribbled>{chunks}</Scribbled> })}
            </h1>
            <p className="mt-5 text-lg leading-base text-ink-2">
              {t("intro")}</p>
          </div>

          {/* رقم واحد بارز — العمولة، وهي ما يقرّر بها */}
          <div className="mt-10 max-w-measure rounded-xl bg-tint-amber p-6 md:p-8">
            <p className="font-display text-6xl leading-none font-bold text-ink md:text-7xl">
              {t("commission")}</p>
            <p className="mt-3 text-lg font-semibold text-ink">
              {t("commissionBody")}</p>
            <p className="mt-2 leading-base text-ink-2">
              {t("commissionNote")}</p>
          </div>
        </Section>

        <Section className="pb-14">
          <div className="max-w-measure">
            <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">
              {t("doesTitle")}</h2>
            <ul className="mt-4 flex list-disc flex-col gap-2 ps-5 leading-base text-ink-2">
              {DOES.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>

          <h2 className="mt-12 font-display text-2xl font-bold text-ink md:text-3xl">
            {t("getsTitle")}</h2>

          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {GETS.map((g) => (
              <li
                key={g.title}
                className="rounded-xl border border-line bg-surface p-5"
              >
                <p className="font-bold text-ink">{g.title}</p>
                <p className="mt-2 leading-base text-ink-2">{g.body}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section className="pb-16">
          <div className="max-w-measure">
            <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">
              {t("applyTitle")}</h2>
            <p className="mt-2 leading-base text-ink-2">
              {t("applyBody")}</p>

            <div className="mt-6">
              <AmbassadorForm />
            </div>
          </div>
        </Section>
      </main>
    </PageShell>
  );
}
