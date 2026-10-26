import { localize } from "@/i18n/localized";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { PageShell, QuietLink, Section, SiteHeader } from "@/components/becan/kit";
import { CheckIcon } from "@/components/becan/icons";
import { getPlans, getViewer } from "@/lib/plans/server";
import { coursesLabel, hoursLabel, minutesLabel, sessionsLabel } from "@/lib/plans/labels";
import { breakdown, formatPrice, VAT, type PlanView } from "@/lib/plans/view";
import { PlanCard } from "./plan-card";
import { RetryPlans } from "./retry-plans";

/* P1 — الخطط.

   **الفارق بين الخطط كمّيّ لا وظيفيّ.** بيكان واحد في الثلاث: نفس
   الشرح ونفس السبورة ونفس الأسئلة ونفس الملخّص. وهذه أصدق ورقة في
   الصفحة وأقواها — فتُقال صراحةً في أعلاها، ولا تُبنى قائمةُ «مزايا»
   بعلامات صحّ تُوحي بفوارق لا وجود لها.

   ولهذا الجدول أسفلها **جدول حجمٍ لا جدول مزايا**: أربعة صفوف كلّها
   كمّيّة، وصفٌّ خامس يقول إن كل ما عداها مشترك.

   والبطاقة مشتركة مع قسم الأسعار في اللاندينج (`./plan-card`) فلا
   يفترق شكل التسعير بين موضعين. **زرّ كهرماني واحد** في الصفحة
   كلّها، على الخطة المميّزة. والخطة الحالية موسومة ومعطّلة الزرّ.

   والتفصيل الضريبيّ مشتقّ من `breakdown` لا مكتوب: الطالب يرى 149
   ويدفع 149، والصافي يُشتقّ منه لا يُضاف إليه.

   **الباقات من الخادم** (`getPlans`)، وباقة الطالب الحالية من
   `/me/allowance`. لا تقدير لعدد الفصول: الدقائق لا تُترجَم إلى فصول.
   الدفع تجريبي حتى تتوفّر بوابة: لا يُحصَّل شيء ولا تتغيّر باقة أحد. */

/* صفوف المقارنة — كلّها كمّيّة، فالجدول يقول الحجم لا الوظيفة. */

export async function generateMetadata({ params }: PageProps<"/[locale]/plans">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Plans" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function PlansPage(props: PageProps<"/[locale]/plans">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [t, facts, result, viewer] = await Promise.all([
    getTranslations("Plans"),
    getTranslations("PlanFacts"),
    getPlans(),
    getViewer(),
  ]);

  if (!result.ok) {
    return (
      <PageShell withFooter>
        <SiteHeader />

        <Section className="pt-12 pb-16 md:pt-16">
          <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
            {t("title")}</h1>
          <div className="mt-8 max-w-measure rounded-xl bg-tint-amber p-5 md:p-6">
            <h2 className="text-lg font-bold text-ink">{t("errorTitle")}</h2>
            <p className="mt-2 leading-base text-ink-2">{t("errorBody")}</p>
            <RetryPlans label={t("retry")} />
          </div>
        </Section>
      </PageShell>
    );
  }

  const plans = result.plans;
  const ROWS: { label: string; of: (p: PlanView) => string }[] = [
    { label: t("minutes"), of: (p) => minutesLabel(facts, p) },
    { label: t("hours"), of: (p) => hoursLabel(facts, p) ?? "—" },
    { label: t("sessions"), of: (p) => sessionsLabel(facts, p) },
    { label: t("courses"), of: (p) => coursesLabel(facts, p) },
  ];

  return (
    <PageShell withFooter>
      <SiteHeader />

      <Section className="pt-12 pb-16 md:pt-16">
        <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
          {t("title")}</h1>

        {/* الورقة الأصدق في الصفحة، في أعلاها */}
        <p className="mt-4 max-w-measure text-lg leading-base text-ink-2">
          {t.rich("intro", { strong: (chunks) => <span className="font-semibold text-ink">{chunks}</span> })}
        </p>

        <ul className="mt-10 grid items-start gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <li key={plan.id}>
              <PlanCard
                plan={plan}
                href={plan.price === 0 ? (viewer.signedIn ? "/home" : "/join") : `/checkout?plan=${plan.id}`}
                current={viewer.planId === plan.id}
                freeAction={viewer.signedIn ? "home" : "start"}
              />
            </li>
          ))}
        </ul>

        {/* ————— جدول الحجم — الديسكتوب ————— */}
        <div className="mt-12 hidden overflow-hidden rounded-xl border border-line bg-surface md:block">
          <table className="w-full text-start">
            <caption className="sr-only">{t("comparisonCaption")}</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="px-5 py-4 text-start text-ink-2">
                  <span className="text-sm font-semibold">{t("comparison")}</span>
                </th>
                {plans.map((p) => (
                  <th
                    key={p.id}
                    scope="col"
                    className="px-5 py-4 text-start font-bold text-ink"
                  >
                    {localize(p.name, locale)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-line">
                  <th
                    scope="row"
                    className="px-5 py-4 text-start text-sm font-semibold text-ink-2"
                  >
                    {row.label}
                  </th>
                  {plans.map((p) => (
                    <td key={p.id} className="px-5 py-4 text-ink">
                      {row.of(p)}
                    </td>
                  ))}
                </tr>
              ))}

              {/* الصفّ الذي يقول إن ما عدا ما فوق مشترك */}
              <tr>
                <th
                  scope="row"
                  className="px-5 py-4 text-start text-sm font-semibold text-ink-2"
                >
                  {t("sharedFeatures")}</th>
                {plans.map((p) => (
                  <td key={p.id} className="px-5 py-4">
                    <span className="flex items-center gap-2 text-ink">
                      <CheckIcon className="h-4 w-4 text-success" />
                      {t("included")}</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* ————— الطمأنة والتفصيل الضريبي ————— */}
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-tint-walnut p-5 md:p-6">
            <h2 className="font-bold text-ink">{t("beforePaying")}</h2>
            <ul className="mt-3 flex flex-col gap-2 leading-base text-ink-2">
              <li>{t("tryFree")}</li>
              <li>{t("cancel")}</li>
              <li>{t.rich("paymentMethods", { latin: (chunks) => <span dir="ltr">{chunks}</span> })}</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-x-6">
              <QuietLink href="/refunds">{t("refunds")}</QuietLink>
              <QuietLink href="/faq">{t("pricingFaq")}</QuietLink>
            </div>
          </div>

          <div className="rounded-xl border border-line p-5 md:p-6">
            <h2 className="font-bold text-ink">{t("vatTitle")}</h2>
            <p className="mt-2 leading-base text-ink-2">
              {t("vatBody")}</p>

            <dl className="mt-4 flex flex-col gap-2 text-sm">
              {plans.filter((p) => p.price > 0).map((p) => {
                const b = breakdown(p.price);
                return (
                  <div
                    key={p.id}
                    className="flex items-baseline justify-between gap-3 border-t border-line pt-2 first:border-0 first:pt-0"
                  >
                    <dt className="text-ink-2">{localize(p.name, locale)}</dt>
                    <dd className="text-end text-ink">
                      {t.rich("taxBreakdown", { net: b.net.toFixed(2), vat: b.vat.toFixed(2), gross: formatPrice(b.gross), strong: (chunks) => <span className="font-semibold">{chunks}</span> })}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <p className="mt-3 text-sm text-ink-2">
              {t("vatRate", { rate: String(VAT * 100) })}
            </p>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
