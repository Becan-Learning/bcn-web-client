import { localize } from "@/i18n/localized";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import {
  PageShell,
  PrimaryButton,
  QuietLink,
  Section,
  SiteHeader,
} from "@/components/becan/kit";
import { ContactForm } from "./contact-form";
import { HOURS, WHATSAPP_SHOWN, whatsappHref } from "@/lib/data/support";

/* H2 — تواصل معنا.

   **واتساب أولًا كزرّ أساسي**، والنموذج بديل احتياطي — لا العكس:
   الطالب السعودي يراسل على واتساب، وإجباره على نموذج بريد يعني
   ألّا يراسل.

   **أوقات الرد مذكورة صراحة** ولا وعد بـ«24/7»: الوعد الذي لا نفي
   به يكلّف ثقةً أكثر مما يكسبه الوعد نفسه.

   الرقم وأوقات الرد في `./support` — مصدر واحد يشاركه زرّ واتساب
   الطافي في كل صفحة. */

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Contact" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function ContactPage(props: PageProps<"/[locale]/contact">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Contact");

  return (
    <PageShell withFooter>
      <SiteHeader />

      <Section className="pt-10 pb-16 md:pt-14">
        <div className="max-w-measure">
          <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
            {t("title")}</h1>
          <p className="mt-3 leading-base text-ink-2">
            {t("intro")}</p>

          {/* الفعل الأول — الكهرماني الوحيد في الشاشة */}
          <PrimaryButton
            href={whatsappHref(t("whatsappContext"))}
            className="mt-7 w-full sm:w-fit"
          >
            {t("whatsapp")}</PrimaryButton>

          <p className="mt-3 text-sm text-ink-2">
            <span dir="ltr">{WHATSAPP_SHOWN}</span>
          </p>

          {/* أوقات الرد — صريحة لا وعدًا عامًّا */}
          <dl className="mt-8 flex flex-col gap-3">
            {HOURS.map((h) => (
              <div
                key={h.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line pt-3 first:border-0 first:pt-0"
              >
                <dt className="font-semibold text-ink">{localize(h.channel, locale)}</dt>
                <dd className="text-ink-2">
                  {t("replyHours", { when: localize(h.when, locale), reply: localize(h.reply, locale) })}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 leading-base text-ink-2">
            {t.rich("beforeContact", {
              faq: (chunks) => <Link href="/faq" className="font-semibold text-pressable underline underline-offset-4">{chunks}</Link>,
              status: (chunks) => <Link href="/status" className="font-semibold text-pressable underline underline-offset-4">{chunks}</Link>,
            })}
          </p>

          <div className="mt-12">
            <h2 className="text-xl font-bold text-ink md:text-2xl">
              {t("formTitle")}</h2>
            <p className="mt-2 leading-base text-ink-2">
              {t("formBody")}</p>

            <div className="mt-6">
              <ContactForm />
            </div>
          </div>

          <div className="mt-10">
            <QuietLink href="/faq">{t("faq")}</QuietLink>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
