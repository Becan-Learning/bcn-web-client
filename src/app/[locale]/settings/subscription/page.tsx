import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { SettingsShell } from "../_shell";
import { SubscriptionView } from "./subscription-view";
import { requireAccount } from "@/lib/auth/session";
import { accountReturnPath } from "@/lib/auth/next-path";

export async function generateMetadata({ params }: PageProps<"/[locale]/settings/subscription">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Settings.Subscription" });
  return { title: t("metadataTitle") };
}

/* P4 — إدارة الاشتراك. حالة «ملغى» تُعايَن بـ`?s=canceled`. */

export default async function SubscriptionPage(
  props: PageProps<"/[locale]/settings/subscription">,
) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireAccount(locale, accountReturnPath("/settings/subscription", await props.searchParams));
  const t = await getTranslations("Settings.Subscription");

  const sp = await props.searchParams;
  const raw = Array.isArray(sp.s) ? sp.s[0] : sp.s;

  return (
    <SettingsShell active="subscription" title={t("title")}>
      <SubscriptionView startCanceled={raw === "canceled"} />
    </SettingsShell>
  );
}
