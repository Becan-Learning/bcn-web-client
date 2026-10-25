import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { getEnrollments } from "@/lib/auth/courses";
import { HomeView } from "./home-view";
import { requireAccount } from "@/lib/auth/session";
import { accountReturnPath } from "@/lib/auth/next-path";
import { getAllowance } from "@/lib/allowance/server";
import { usedUpQuota } from "@/lib/allowance/presentation";

export async function generateMetadata({ params }: PageProps<"/[locale]/home">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Home" });
  return { title: t("metadataTitle") };
}

/* الشاشة ٨ — الداشبورد `/home`.
   مقصورة الآن على المقررات المسجَّلة. */
export default async function HomePage(props: PageProps<"/[locale]/home">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { user: account } = await requireAccount(locale, accountReturnPath("/home", await props.searchParams));

  const [enrollments, allowance] = await Promise.all([getEnrollments(), getAllowance()]);
  return <HomeView name={account.name} enrollments={enrollments.ok ? enrollments.data : null}
    quota={usedUpQuota(allowance.ok ? allowance.data : null)} />;
}
