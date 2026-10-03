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
  { params }: PageProps<"/[locale]/privacy">,
): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Legal.Privacy" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

/* L2 — سياسة الخصوصية.

   **تغطية الصوت شرط لا تفصيل**: بيكان منتج صوتي، وسياسة خصوصية لا
   تقول ماذا يحصل لصوت الطالب — هل يُحفظ، وكم، ومن يسمعه — سياسة
   ناقصة. لهذا الصوت قسم مستقلّ قبل بقية البيانات لا بندًا داخلها.

   ⚠️ نظام حماية البيانات الشخصية السعودي (PDPL) يمنح المستخدم حقوقًا
   محدّدة — الصياغة النهائية تحتاج المستشار القانوني، ومدد الحفظ
   المذكورة هنا تحتاج تثبيتها مع الفريق التقني. */

export default async function PrivacyPage(props: PageProps<"/[locale]/privacy">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [t, format] = await Promise.all([
    getTranslations("Legal.Privacy"),
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
    study: (chunks: ReactNode) => (
      <Link
        href="/settings/study"
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
    cookies: (chunks: ReactNode) => (
      <Link
        href="/cookies"
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
    strong: (chunks: ReactNode) => (
      <span className="font-semibold text-ink">{chunks}</span>
    ),
  };
  const content = [
    {
      key: "summary",
      id: "summary",
      body: (
        <>
          <Points
            items={(["item1", "item2", "item3"] as const).map((item) =>
              t(`sections.summary.points1.${item}`),
            )}
          />
        </>
      ),
    },
    {
      key: "voice",
      id: "voice",
      body: (
        <>
          <P>{t.rich("sections.voice.paragraph1", richValues)}</P>
          <Points
            items={(["item1", "item2", "item3", "item4", "item5"] as const).map((item) =>
              t(`sections.voice.points1.${item}`),
            )}
          />
          <P>{t.rich("sections.voice.paragraph2", richValues)}</P>
        </>
      ),
    },
    {
      key: "what",
      id: "what",
      body: (
        <>
          <Points
            items={(["item1", "item2", "item3", "item4"] as const).map((item) =>
              t(`sections.what.points1.${item}`),
            )}
          />
        </>
      ),
    },
    {
      key: "why",
      id: "why",
      body: (
        <>
          <Points
            items={(["item1", "item2", "item3", "item4"] as const).map((item) =>
              t(`sections.why.points1.${item}`),
            )}
          />
        </>
      ),
    },
    {
      key: "share",
      id: "share",
      body: (
        <>
          <P>{t.rich("sections.share.paragraph1", richValues)}</P>
          <Points
            items={(["item1", "item2", "item3", "item4"] as const).map((item) =>
              t(`sections.share.points1.${item}`),
            )}
          />
          <P>{t.rich("sections.share.paragraph2", richValues)}</P>
        </>
      ),
    },
    {
      key: "rights",
      id: "rights",
      body: (
        <>
          <P>{t.rich("sections.rights.paragraph1", richValues)}</P>
          <Points
            items={(["item1", "item2", "item3", "item4", "item5"] as const).map((item) =>
              t(`sections.rights.points1.${item}`),
            )}
          />
          <P>{t.rich("sections.rights.paragraph2", richValues)}</P>
        </>
      ),
    },
    {
      key: "keep",
      id: "keep",
      body: (
        <>
          <Points
            items={(["item1", "item2", "item3", "item4"] as const).map((item) =>
              t(`sections.keep.points1.${item}`),
            )}
          />
        </>
      ),
    },
    {
      key: "kids",
      id: "kids",
      body: (
        <P>{t.rich("sections.kids.paragraph1", richValues)}</P>
      ),
    },
    {
      key: "cookies",
      id: "cookies",
      body: (
        <P>{t.rich("sections.cookies.paragraph1", richValues)}</P>
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
