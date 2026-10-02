import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { SettingsShell } from "../_shell";
import { SubscriptionView } from "./subscription-view";

export const metadata: Metadata = {
  title: "الاشتراك — بيكان",
};

/* P4 — إدارة الاشتراك. حالة «ملغى» تُعايَن بـ`?s=canceled`. */

export default async function SubscriptionPage(
  props: PageProps<"/[locale]/settings/subscription">,
) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const sp = await props.searchParams;
  const raw = Array.isArray(sp.s) ? sp.s[0] : sp.s;

  return (
    <SettingsShell active="subscription" title="الاشتراك">
      <SubscriptionView startCanceled={raw === "canceled"} />
    </SettingsShell>
  );
}
