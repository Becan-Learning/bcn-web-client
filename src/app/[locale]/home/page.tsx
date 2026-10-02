import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { HomeView } from "./home-view";

export const metadata: Metadata = {
  title: "مقرراتك — بيكان",
};

/* الشاشة ٨ — الداشبورد `/home`.
   مقصورة الآن على المقررات المسجَّلة والتقدّم فيها. */
export default async function HomePage(props: PageProps<"/[locale]/home">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <HomeView />;
}
