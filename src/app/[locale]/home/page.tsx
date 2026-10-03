import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { HomeView } from "./home-view";

export async function generateMetadata({ params }: PageProps<"/[locale]/home">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Home" });
  return { title: t("metadataTitle") };
}

/* الشاشة ٨ — الداشبورد `/home`.
   مقصورة الآن على المقررات المسجَّلة والتقدّم فيها. */
export default async function HomePage(props: PageProps<"/[locale]/home">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <HomeView />;
}
