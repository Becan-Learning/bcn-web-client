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
  { params }: PageProps<"/[locale]/cookies">,
): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Legal.Cookies" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

/* L4 — ملفات تعريف الارتباط.

   ⚠️ الجدول يصف ما نستعمله فعلًا اليوم. أي أداة تحليلات أو إعلانات
   تُضاف لاحقًا يجب أن تُضاف إلى هذه الصفحة في نفس الدفعة — صفحة
   ارتباطات لا تطابق ما يحمّله الموقع أسوأ من غيابها. */

export default async function CookiesPage(props: PageProps<"/[locale]/cookies">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [t, format] = await Promise.all([
    getTranslations("Legal.Cookies"),
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
    data: (chunks: ReactNode) => (
      <Link
        href="/settings/data"
        className="font-semibold text-pressable underline underline-offset-4"
      >
        {chunks}
      </Link>
    ),
    privacy: (chunks: ReactNode) => (
      <Link
        href="/privacy"
        className="font-semibold text-pressable underline underline-offset-4"
      >
        {chunks}
      </Link>
    ),
    strong: (chunks: ReactNode) => (
      <span className="font-semibold text-ink">{chunks}</span>
    ),
  };
  const content = [
    {
      key: "what",
      id: "what",
      body: (
        <P>{t.rich("sections.what.paragraph1", richValues)}</P>
      ),
    },
    {
      key: "kinds",
      id: "kinds",
      body: (
        <>
          <P>{t.rich("sections.kinds.paragraph1", richValues)}</P>
          <Points
            items={(["item1", "item2", "item3"] as const).map((item) =>
              t(`sections.kinds.points1.${item}`),
            )}
          />
          <P>{t.rich("sections.kinds.paragraph2", richValues)}</P>
        </>
      ),
    },
    {
      key: "control",
      id: "control",
      body: (
        <>
          <P>{t.rich("sections.control.paragraph1", richValues)}</P>
          <P>{t.rich("sections.control.paragraph2", richValues)}</P>
        </>
      ),
    },
    {
      key: "more",
      id: "more",
      body: (
        <P>{t.rich("sections.more.paragraph1", richValues)}</P>
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
