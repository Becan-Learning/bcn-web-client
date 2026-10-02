import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { RequestForm } from "./request-form";
import { BecanFace } from "@/components/becan/becan-face";
import { TypedHeadline } from "@/components/becan/typed-headline";
import { Eyebrow, PageShell, Section, SiteHeader } from "@/components/becan/kit";

export const metadata: Metadata = {
  title: "اطلب مقررك — بيكان",
  description:
    "نجهّز المقررات حسب الطلب. كل طلب يرفع أولوية المقرر في قائمة الإنتاج.",
};

export default async function RequestPage(props: PageProps<"/[locale]/request">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <PageShell withFooter>
      <SiteHeader />

      <Section className="pt-12 pb-16 md:pt-20">
        <Eyebrow>طلب مقرر</Eyebrow>

        <div className="mt-3 flex items-center gap-4">
          <BecanFace className="w-24 shrink-0 md:w-32" />
          <TypedHeadline prefix="اطلب" word="مقررك" className="mt-0" />
        </div>

        <p className="mt-5 max-w-measure text-lg text-ink-2">
          نجهّز المقررات حسب الطلب. كل طلب يرفع أولوية المقرر في قائمة الإنتاج.
        </p>

        <RequestForm />
      </Section>
    </PageShell>
  );
}
