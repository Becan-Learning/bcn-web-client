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
  { params }: PageProps<"/[locale]/refunds">,
): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Legal.Refunds" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

/* L3 — الاسترجاع والإلغاء.

   **ليست اختيارية**: بوابات الدفع السعودية تشترط نشر هذه السياسة قبل
   تفعيل الحساب التجاري. غيابها يعطّل الإيراد لا التصميم — ولهذا هي
   أول ما يُبنى من صفحات السياسات.

   ⚠️ الأرقام هنا قرار مؤسّس لا قرار تصميم: مدة الاسترجاع (7 أيام)
   وسقف الاستهلاك (20٪ من الحصة) مقترحان معقولان، ويحتاجان تثبيتًا
   من المؤسّس ومراجعة المستشار القانوني قبل النشر. مسجَّل في
   docs/STATE.md. */

export default async function RefundsPage(props: PageProps<"/[locale]/refunds">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [t, format] = await Promise.all([
    getTranslations("Legal.Refunds"),
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
    subscription: (chunks: ReactNode) => (
      <Link
        href="/settings/subscription"
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
    invoices: (chunks: ReactNode) => (
      <Link
        href="/settings/invoices"
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
      key: "cancel",
      id: "cancel",
      body: (
        <>
          <P>{t.rich("sections.cancel.paragraph1", richValues)}</P>
          <P>{t.rich("sections.cancel.paragraph2", richValues)}</P>
        </>
      ),
    },
    {
      key: "refund",
      id: "refund",
      body: (
        <>
          <P>{t.rich("sections.refund.paragraph1", richValues)}</P>
          <P>{t.rich("sections.refund.paragraph2", richValues)}</P>
          <Points
            items={(["item1", "item2", "item3"] as const).map((item) =>
              t(`sections.refund.points1.${item}`),
            )}
          />
        </>
      ),
    },
    {
      key: "noRefund",
      id: "no-refund",
      body: (
        <>
          <Points
            items={(["item1", "item2", "item3"] as const).map((item) =>
              t(`sections.noRefund.points1.${item}`),
            )}
          />
        </>
      ),
    },
    {
      key: "how",
      id: "how",
      body: (
        <>
          <P>{t.rich("sections.how.paragraph1", richValues)}</P>
          <P>{t.rich("sections.how.paragraph2", richValues)}</P>
        </>
      ),
    },
    {
      key: "when",
      id: "when",
      body: (
        <>
          <P>{t.rich("sections.when.paragraph1", richValues)}</P>
          <P>{t.rich("sections.when.paragraph2", richValues)}</P>
          <P>{t.rich("sections.when.paragraph3", richValues)}</P>
        </>
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
