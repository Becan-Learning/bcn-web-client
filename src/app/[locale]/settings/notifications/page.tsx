import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { SettingsShell } from "../_shell";
import { NotificationsView } from "./notifications-view";

export const metadata: Metadata = {
  title: "الإشعارات — بيكان",
};

export default async function NotificationsPage(props: PageProps<"/[locale]/settings/notifications">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <SettingsShell
      active="notifications"
      title="الإشعارات"
      lede="كل نوع بمفتاحه — ما فيه مفتاح واحد يطفّي كل شيء."
    >
      <NotificationsView />
    </SettingsShell>
  );
}
