import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { BecanFace } from "@/components/becan/becan-face";
import { ShareButton } from "./share-button";
import { TypedHeadline } from "@/components/becan/typed-headline";
import { PageShell, PrimaryButton, Section, SiteHeader } from "@/components/becan/kit";

export async function generateMetadata({ params }: PageProps<"/[locale]/request/sent">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Request.Sent" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function RequestSentPage(
  props: PageProps<"/[locale]/request/sent">,
) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Request.Sent");
  const [headlinePrefix, headlineWord, headlineSuffix] = t.markup("title", {
    word: (chunks) => `\0${chunks}\0`,
  }).split("\0");

  return (
    <PageShell withFooter>
      <SiteHeader />

      <Section className="pt-12 pb-16 md:pt-20">
        {/* 1 — العنوان والجملة */}
        <div className="flex items-center gap-4">
          <BecanFace className="w-24 shrink-0 md:w-32" />
          <TypedHeadline prefix={headlinePrefix.trimEnd()} word={headlineWord} suffix={headlineSuffix} className="mt-0" />
        </div>

        <p className="mt-6 max-w-measure text-lg leading-relaxed text-ink-2">
          {t("body")}
        </p>

        {/* 2 — مخرجان، كلاهما يبقيه داخل بيكان.
            «جرّب مقررًا آخر» هو الافتراضي: يعيده إلى المنتج فورًا،
            والمشاركة تحته لأنها فعل مؤجَّل. */}
        <div className="mt-9 flex max-w-measure flex-col gap-4">
          <PrimaryButton href="/courses" className="w-full sm:w-fit">
            {t("tryAnother")}
          </PrimaryButton>
          <ShareButton text={t("shareDefault")} />
        </div>
      </Section>
    </PageShell>
  );
}
