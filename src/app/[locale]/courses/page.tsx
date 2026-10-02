import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Finder } from "./finder";
import { PageShell, SiteHeader } from "@/components/becan/kit";

export const metadata: Metadata = {
  title: "وش مقررك؟ — بيكان",
  description: "ابحث عن مقررك باسمه أو رمزه وابدأ الشرح من أول فصل.",
};

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
