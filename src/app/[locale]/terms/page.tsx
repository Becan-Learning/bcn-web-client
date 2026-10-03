import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { DocPage, P, Points, type DocSection } from "@/components/becan/doc-page";
import { ArabicVersionLink } from "@/components/becan/arabic-version-link";

export async function generateMetadata(
  { params }: PageProps<"/[locale]/terms">,
): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Legal.Terms" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

/* L1 — الشروط والأحكام.

   ⚠️ نصّ مبدئي بلغة بسيطة، مكتوب ليُراجَع لا ليُنشَر كما هو:
   الصياغة النهائية تحتاج المستشار القانوني. البنود التي تحتاج قرار
   المؤسّس (السنّ، حدود الاستعمال) معلَّمة في docs/STATE.md. */

export default async function TermsPage(props: PageProps<"/[locale]/terms">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [t, format] = await Promise.all([
    getTranslations("Legal.Terms"),
    getFormatter({ locale }),
  ]);
  const updated = format.dateTime(new Date(t("updated")), {
    day: "numeric",
    month: "long",
    year: "numeric",
    calendar: "gregory",
    numberingSystem: "latn",
    timeZone: "UTC",
  });
  const richValues = {
    plans: (chunks: ReactNode) => (
      <Link
        href="/plans"
        className="font-semibold text-pressable underline underline-offset-4"
      >
        {chunks}
      </Link>
    ),
    refunds: (chunks: ReactNode) => (
      <Link
        href="/refunds"
        className="font-semibold text-pressable underline underline-offset-4"
      >
        {chunks}
      </Link>
    ),
    status: (chunks: ReactNode) => (
      <Link
        href="/status"
        className="font-semibold text-pressable underline underline-offset-4"
      >
        {chunks}
      </Link>
    ),
    data: (chunks: ReactNode) => (
      <Link
        href="/settings/data"
        className="font-semibold text-pressable underline underline-offset-4"
      >
        {chunks}
      </Link>
    ),
    contact: (chunks: ReactNode) => (
      <Link
        href="/contact"
        className="font-semibold text-pressable underline underline-offset-4"
      >
        {chunks}
      </Link>
    ),
  };
  const content = [
    {
      key: "who",
      id: "who",
      body: (
        <>
          <P>{t.rich("sections.who.paragraph1", richValues)}</P>
          <P>{t.rich("sections.who.paragraph2", richValues)}</P>
        </>
      ),
    },
    {
      key: "account",
      id: "account",
      body: (
        <>
          <P>{t.rich("sections.account.paragraph1", richValues)}</P>
          <P>{t.rich("sections.account.paragraph2", richValues)}</P>
        </>
      ),
    },
    {
      key: "use",
      id: "use",
      body: (
        <>
          <P>{t.rich("sections.use.paragraph1", richValues)}</P>
          <Points
            items={(["item1", "item2", "item3", "item4"] as const).map((item) =>
              t(`sections.use.points1.${item}`),
            )}
          />
          <P>{t.rich("sections.use.paragraph2", richValues)}</P>
        </>
      ),
    },
    {
      key: "content",
      id: "content",
      body: (
        <>
          <P>{t.rich("sections.content.paragraph1", richValues)}</P>
          <P>{t.rich("sections.content.paragraph2", richValues)}</P>
        </>
      ),
    },
    {
      key: "money",
      id: "money",
      body: (
        <>
          <P>{t.rich("sections.money.paragraph1", richValues)}</P>
          <P>{t.rich("sections.money.paragraph2", richValues)}</P>
          <P>{t.rich("sections.money.paragraph3", richValues)}</P>
        </>
      ),
    },
    {
      key: "availability",
      id: "availability",
      body: (
        <>
          <P>{t.rich("sections.availability.paragraph1", richValues)}</P>
          <P>{t.rich("sections.availability.paragraph2", richValues)}</P>
        </>
      ),
    },
    {
      key: "end",
      id: "end",
      body: (
        <P>{t.rich("sections.end.paragraph1", richValues)}</P>
      ),
    },
    {
      key: "law",
      id: "law",
      body: (
        <P>{t.rich("sections.law.paragraph1", richValues)}</P>
      ),
    },
    {
      key: "contact",
      id: "contact",
      body: (
        <P>{t.rich("sections.contact.paragraph1", richValues)}</P>
      ),
    },
  ] as const;
  const sections: DocSection[] = content.map((section) => ({
    id: section.id,
    title: t(`sections.${section.key}.title`),
    body: section.body,
  }));

  return (
    <DocPage
      title={t("title")}
      updated={updated}
      lede={t("lede")}
      notice={
        locale === "en" ? (
          <P>
            {t.rich("translationNotice", {
              arabic: (chunks) => <ArabicVersionLink>{chunks}</ArabicVersionLink>,
            })}
          </P>
        ) : undefined
      }
      sections={sections}
    />
  );
}
