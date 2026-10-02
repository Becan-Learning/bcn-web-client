import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { SettingsShell } from "../_shell";
import { AccountView } from "./account-view";

export async function generateMetadata({ params }: PageProps<"/[locale]/settings/account">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Settings.Account" });
  return { title: t("metadataTitle") };
}

export default async function AccountPage(props: PageProps<"/[locale]/settings/account">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Settings.Account");

  return (
    <SettingsShell
      active="account"
      title={t("title")}
      lede={t("lede")}
    >
      <AccountView />
    </SettingsShell>
  );
}
