import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { SettingsShell } from "../_shell";
import { StudyView } from "./study-view";

export async function generateMetadata({ params }: PageProps<"/[locale]/settings/study">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Settings.Study" });
  return { title: t("metadataTitle") };
}

export default async function StudyPage(props: PageProps<"/[locale]/settings/study">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Settings.Study");

  return (
    <SettingsShell
      active="study"
      title={t("title")}
      lede={t("lede")}
    >
      <StudyView />
    </SettingsShell>
  );
}
