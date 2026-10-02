import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { UNIVERSITIES } from "@/lib/data/catalog";
import { BecanFace } from "@/components/becan/becan-face";
import { ShareButton } from "./share-button";
import { TypedHeadline } from "@/components/becan/typed-headline";
import { PageShell, PrimaryButton, Section, SiteHeader } from "@/components/becan/kit";

/* عدد الطلاب الذين طلبوا نفس المقرر — بيانات عرض حتى يصل العدّاد الحقيقي. */
const PEERS = 8;

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

  const sp = await props.searchParams;
  const one = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v)?.trim() || "";

  const course = one(sp.course);
  const universityValue = one(sp.university);
  const universityT = await getTranslations("Universities");
  const universityKeys = ["kingSaud", "kingAbdulaziz", "imam"] as const;
  const universityKey = universityKeys[UNIVERSITIES.indexOf(universityValue)];
  const university = universityKey ? universityT(universityKey) : universityValue;
  const subject = [course, university].filter(Boolean).join(" — ");

  return (
    <PageShell withFooter>
      <SiteHeader />

      <Section className="pt-12 pb-16 md:pt-20">
        {/* 1 — الشارة: الطلب ليس وحيدًا، وهذا ما يبقي الطالب */}
        {subject ? (
          <p className="inline-flex flex-wrap items-center gap-2 rounded-pill bg-tint-amber px-4 py-2 text-sm font-semibold text-ink">
            <span>{t("peers", { count: PEERS, countLabel: String(PEERS) })}</span>
            <span dir="auto" className="text-ink-2">«{subject}»</span>
          </p>
        ) : null}

        {/* 2 — العنوان والجملة */}
        <div className="mt-5 flex items-center gap-4">
          <BecanFace className="w-24 shrink-0 md:w-32" />
          <TypedHeadline prefix={headlinePrefix.trimEnd()} word={headlineWord} suffix={headlineSuffix} className="mt-0" />
        </div>

        <p className="mt-6 max-w-measure text-lg leading-relaxed text-ink-2">
          {t.rich("body", { br: () => <br /> })}
        </p>

        {/* 3 — مخرجان، كلاهما يبقيه داخل بيكان.
            «جرّب مقررًا آخر» هو الافتراضي: يعيده إلى المنتج فورًا،
            والمشاركة تحته لأنها فعل مؤجَّل. */}
        <div className="mt-9 flex max-w-measure flex-col gap-4">
          <PrimaryButton href="/courses" className="w-full sm:w-fit">
            {t("tryAnother")}</PrimaryButton>
          <ShareButton
            text={
              subject
                ? t("shareSubject", { subject })
                : t("shareDefault")
            }
          />
        </div>
      </Section>
    </PageShell>
  );
}
