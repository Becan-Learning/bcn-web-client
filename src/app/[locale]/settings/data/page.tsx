import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { SettingsShell } from "../_shell";
import { DataView } from "./data-view";

export async function generateMetadata({ params }: PageProps<"/[locale]/settings/data">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Settings.Data" });
  return { title: t("metadataTitle") };
}

/* S4 — بياناتك.

   ⚠️ نظام حماية البيانات الشخصية السعودي (PDPL) يمنح المستخدم حقوقًا
   محدَّدة في الوصول والتصحيح والحذف ومدد التنفيذ — الصياغة والمدد هنا
   تحتاج مراجعة المستشار القانوني قبل النشر. */

export default async function DataPage(props: PageProps<"/[locale]/settings/data">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Settings.Data");

  return (
    <SettingsShell
      active="data"
      title={t("title")}
      lede={t("lede")}
    >
      <DataView />
    </SettingsShell>
  );
}
