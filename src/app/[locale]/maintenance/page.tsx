import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { PageShell, QuietLink, Section, SiteHeader } from "@/components/becan/kit";

export async function generateMetadata({ params }: PageProps<"/[locale]/maintenance">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Maintenance" });
  return { title: t("metadataTitle") };
}

/* E4 — الصيانة.

   **الوقت المتوقع للعودة بالساعة، لا «قريبًا»**: الطالب الذي يذاكر
   ليلة اختبار يحتاج أن يقرّر — ينتظر أم يذاكر بطريقة ثانية. و«قريبًا»
   لا تُتيح له القرار.

   الساعة ثابتة لا محسوبة من `new Date()`: الحساب وقت الرسم يختلف بين
   الخادم والمتصفّح فينكسر الترطيب (مزلق مسجَّل في STATE). في الإنتاج
   تأتي من لوحة الصيانة نفسها. */

export default async function MaintenancePage(props: PageProps<"/[locale]/maintenance">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Maintenance");

  return (
    <PageShell withFooter>
      <SiteHeader minimal />

      <Section className="pt-12 pb-16 md:pt-16">
        <div className="max-w-measure">
          {/* ماذا حدث */}
          <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
            {t("title")}
          </h1>

          {/* لماذا */}
          <p className="mt-4 leading-base text-ink-2">
            {t("body")}
          </p>

          {/* رقم واحد بارز: متى يرجع — بالساعة لا «قريبًا» */}
          <p className="mt-8 text-sm font-semibold text-ink-2">{t("backLabel")}</p>
          <p className="font-display text-5xl leading-tight font-bold text-ink md:text-6xl">
            {t("backAt")}
          </p>
          <p className="mt-2 text-ink-2">{t("backIn")}</p>

          {/* ماذا تفعل الآن */}
          <div className="mt-8 flex flex-col items-start">
            <QuietLink href="/status">{t("status")}</QuietLink>
            <QuietLink href="/contact">{t("contact")}</QuietLink>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
