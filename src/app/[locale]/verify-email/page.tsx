import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { AuthCard } from "@/components/auth/auth-card";
import { VerifyEmailForm } from "./verify-email-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/verify-email">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "VerifyEmail" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function VerifyEmailPage(props: PageProps<"/[locale]/verify-email">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("VerifyEmail");
  const sp = await props.searchParams;
  return (
    <AuthCard title={t.markup("title", { word: (chunks) => `\0${chunks}\0` })}>
      <VerifyEmailForm next={(Array.isArray(sp.next) ? sp.next[0] : sp.next) || ""}
        email={(Array.isArray(sp.email) ? sp.email[0] : sp.email) || ""}
        queryError={(Array.isArray(sp.error) ? sp.error[0] : sp.error) || ""} />
    </AuthCard>
  );
}
