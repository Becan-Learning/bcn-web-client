import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { RequestForm } from "./request-form";
import { BecanFace } from "@/components/becan/becan-face";
import { TypedHeadline } from "@/components/becan/typed-headline";
import { Eyebrow, PageShell, Section, SiteHeader } from "@/components/becan/kit";

export async function generateMetadata({ params }: PageProps<"/[locale]/request">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Request" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function RequestPage(props: PageProps<"/[locale]/request">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Request");
  const [headlinePrefix, headlineWord, headlineSuffix] = t.markup("title", {
    word: (chunks) => `\0${chunks}\0`,
  }).split("\0");

  return (
    <PageShell withFooter>
      <SiteHeader />

      <Section className="pt-12 pb-16 md:pt-20">
        <Eyebrow>{t("eyebrow")}</Eyebrow>

        <div className="mt-3 flex items-center gap-4">
          <BecanFace className="w-24 shrink-0 md:w-32" />
          <TypedHeadline prefix={headlinePrefix.trimEnd()} word={headlineWord} suffix={headlineSuffix} className="mt-0" />
        </div>

        <p className="mt-5 max-w-measure text-lg text-ink-2">
          {t("intro")}</p>

        <RequestForm />
      </Section>
    </PageShell>
  );
}
