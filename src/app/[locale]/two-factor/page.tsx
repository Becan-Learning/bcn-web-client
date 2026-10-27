import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { AuthCard } from "@/components/auth/auth-card";
import { TwoFactorForm } from "./two-factor-form";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/two-factor">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "TwoFactor" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function TwoFactorPage(props: PageProps<"/[locale]/two-factor">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("TwoFactor");
  const sp = await props.searchParams;
  return (
    <AuthCard title={t.markup("title", { word: (chunks) => `\0${chunks}\0` })}>
      <TwoFactorForm next={(Array.isArray(sp.next) ? sp.next[0] : sp.next) || ""} />
    </AuthCard>
  );
}
