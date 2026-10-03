import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { SettingsShell } from "../_shell";
import { NotificationsView } from "./notifications-view";

export async function generateMetadata({ params }: PageProps<"/[locale]/settings/notifications">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Settings.Notifications" });
  return { title: t("metadataTitle") };
}

export default async function NotificationsPage(props: PageProps<"/[locale]/settings/notifications">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Settings.Notifications");

  return (
    <SettingsShell
      active="notifications"
      title={t("title")}
      lede={t("lede")}
    >
      <NotificationsView />
    </SettingsShell>
  );
}
