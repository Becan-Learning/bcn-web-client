import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { localize } from "@/i18n/localized";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell, Section, SiteHeader } from "@/components/becan/kit";
import { getPlans } from "@/lib/plans/server";
import { coursesLabel, minutesLabel } from "@/lib/plans/labels";
import { planById } from "@/lib/plans/view";
import { RetryPlans } from "../plans/retry-plans";
import { CheckoutForm } from "./checkout-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/checkout">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Checkout" });
  return { title: t("metadataTitle") };
}

/* P2 — الدفع.

   عمود واحد ضيّق لا عمودان: البريف يشترط أن يسبق ملخص الطلب الزرَّ،
   وعمود جانبي على الديسكتوب يضع الملخص خارج مسار القراءة إلى الزر.

   والصافي والضريبة يُشتقّان من السعر الشامل (`breakdown`) — الطالب
   يرى 149 ويدفع 149، والتفصيل يشرح ما دفعه لا يضيف عليه.

   **الصفحة مفتوحة للزائر**، والدفع تجريبي: لا يُحصَّل شيء ولا يُرسَل
   شيء إلى الخادم. والباقة من الخادم (`getPlans`). */

export default async function CheckoutPage(props: PageProps<"/[locale]/checkout">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [t, facts, result] = await Promise.all([
    getTranslations("Checkout"),
    getTranslations("PlanFacts"),
    getPlans(),
  ]);

  /* تعذّر قراءة الباقات ليس «باقة غير موجودة»: يُعرض خطأ مع إعادة المحاولة. */
  if (!result.ok) {
    return (
      <PageShell withFooter>
        <SiteHeader minimal />

        <Section className="pt-10 pb-16 md:pt-14">
          <div className="mx-auto w-full max-w-[34rem]">
            <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
              {t("title")}
            </h1>
            <div className="mt-8 rounded-xl bg-tint-amber p-5 md:p-6">
              <h2 className="text-lg font-bold text-ink">{t("errorTitle")}</h2>
              <p className="mt-2 leading-base text-ink-2">{t("errorBody")}</p>
              <RetryPlans label={t("retry")} />
            </div>
          </div>
        </Section>
      </PageShell>
    );
  }

  const sp = await props.searchParams;
  const raw = Array.isArray(sp.plan) ? sp.plan[0] : sp.plan;
  const plan = planById(result.plans, raw ?? "");

  /* باقة غير معروفة أو غير معروضة أو مجانية لا تُستبدل بباقة افتراضية:
     الدفع بمبلغ لم يختره الطالب أسوأ من صفحة غير موجودة. */
  if (!plan || plan.price === 0) notFound();

  return (
    <PageShell withFooter>
      <SiteHeader minimal />

      <Section className="pt-10 pb-16 md:pt-14">
        <div className="mx-auto w-full max-w-[34rem]">
          <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-3 leading-base text-ink-2">
            {t("planSummary", { plan: localize(plan.name, locale), minutes: minutesLabel(facts, plan), courses: coursesLabel(facts, plan) })}
          </p>

          <CheckoutForm plan={plan} />
        </div>
      </Section>
    </PageShell>
  );
}
