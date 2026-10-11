import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "./sign-in-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/sign-in">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "SignIn" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function SignInPage(props: PageProps<"/[locale]/sign-in">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("SignIn");
  const sp = await props.searchParams;
  const next = (Array.isArray(sp.next) ? sp.next[0] : sp.next) || "";
  return (
    <AuthCard title={t.markup("title", { word: (chunks) => `\0${chunks}\0` })}>
      <SignInForm next={next} resetSuccess={sp.reset === "success"} />
    </AuthCard>
  );
}
