import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "./forgot-password-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/forgot-password">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "ForgotPassword" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function ForgotPasswordPage(props: PageProps<"/[locale]/forgot-password">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("ForgotPassword");
  const sp = await props.searchParams;
  return (
    <AuthCard title={t.markup("title", { word: (chunks) => `\0${chunks}\0` })}>
      <ForgotPasswordForm next={(Array.isArray(sp.next) ? sp.next[0] : sp.next) || ""} />
    </AuthCard>
  );
}
