import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { SettingsCard, SettingsShell } from "../_shell";
import { requireAccount } from "@/lib/auth/session";
import { accountReturnPath } from "@/lib/auth/next-path";

export async function generateMetadata({ params }: PageProps<"/[locale]/settings/invoices">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Settings.Invoices" });
  return { title: t("metadataTitle") };
}

/* P5 — الفواتير.

   لا فواتير بعد: الدفع تجريبي حتى تتوفّر بوابة، ولا يُحصَّل شيء. فالصفحة
   حالة فارغة صادقة، ولا بيانات عرض تُوهم بمدفوعات لم تحدث. وحين
   تتوفّر البوابة تُبنى القائمة والفاتورة الواحدة من الخادم
   (الصافي والضريبة من `breakdown` في `src/lib/plans/view.ts`).

   ⚠️ متطلبات الفوترة الإلكترونية (ZATCA) — الرقم الضريبي، رمز QR،
   صيغة الفاتورة المعتمدة — تحتاج تأكيد المحاسب لا اجتهاد التصميم. */

export default async function InvoicesPage(props: PageProps<"/[locale]/settings/invoices">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireAccount(locale, accountReturnPath("/settings/invoices", await props.searchParams));
  const t = await getTranslations("Settings.Invoices");

  return (
    <SettingsShell active="invoices" title={t("title")} lede={t("lede")}>
      <SettingsCard title={t("emptyTitle")}>
        <p className="mt-2 max-w-measure leading-base text-ink-2">
          {t("emptyBody")}
        </p>
      </SettingsCard>
    </SettingsShell>
  );
}
