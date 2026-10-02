import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { PageShell, QuietLink, Section, SiteHeader } from "@/components/becan/kit";
import { FaqView } from "./faq-view";

export async function generateMetadata({ params }: PageProps<"/[locale]/faq">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Faq" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function FaqPage(props: PageProps<"/[locale]/faq">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Faq");

  return (
    <PageShell withFooter>
      <SiteHeader />

      <Section className="pt-10 pb-16 md:pt-14">
        <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
          {t("title")}</h1>
        <p className="mt-3 max-w-measure leading-base text-ink-2">
          {t("intro")}</p>

        <div className="mt-8">
          <FaqView />
        </div>

        <div className="mt-12">
          <QuietLink href="/contact">{t("contact")}</QuietLink>
        </div>
      </Section>
    </PageShell>
  );
}
