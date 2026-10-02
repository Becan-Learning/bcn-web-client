import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { Finder } from "./finder";
import { PageShell, SiteHeader } from "@/components/becan/kit";

export async function generateMetadata({ params }: PageProps<"/[locale]/courses">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Courses" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function CoursesPage(props: PageProps<"/[locale]/courses">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <PageShell withFooter>
      <SiteHeader />
      <Finder />
    </PageShell>
  );
}
