import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "./reset-password-form";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reset-password">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "ResetPassword" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function ResetPasswordPage(
  props: PageProps<"/[locale]/reset-password">,
) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("ResetPassword");
  const sp = await props.searchParams;
  return (
    <AuthCard title={t.markup("title", { word: (chunks) => `\0${chunks}\0` })}>
      <ResetPasswordForm
        next={(Array.isArray(sp.next) ? sp.next[0] : sp.next) || ""}
        token={(Array.isArray(sp.token) ? sp.token[0] : sp.token) || ""}
        queryError={(Array.isArray(sp.error) ? sp.error[0] : sp.error) || ""}
      />
    </AuthCard>
  );
}
