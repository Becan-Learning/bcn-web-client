import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { SettingsShell } from "../_shell";
import { StudyView } from "./study-view";

export const metadata: Metadata = {
  title: "تفضيلات المذاكرة — بيكان",
};

export default async function StudyPage(props: PageProps<"/[locale]/settings/study">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <SettingsShell
      active="study"
      title="تفضيلات المذاكرة"
      lede="قيم البداية لكل جلسة جديدة — وكلها تتغيّر أثناء الشرح نفسه."
    >
      <StudyView />
    </SettingsShell>
  );
}
