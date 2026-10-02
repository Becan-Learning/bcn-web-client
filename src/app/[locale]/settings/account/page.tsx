import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { SettingsShell } from "../_shell";
import { AccountView } from "./account-view";

export const metadata: Metadata = {
  title: "الحساب — بيكان",
};

export default async function AccountPage(props: PageProps<"/[locale]/settings/account">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <SettingsShell
      active="account"
      title="الحساب"
      lede="التعديل ينحفظ تلقائيًا أول ما تخرج من الحقل."
    >
      <AccountView />
    </SettingsShell>
  );
}
