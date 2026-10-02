import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { localize } from "@/i18n/localized";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { SettingsCard, SettingsShell } from "../_shell";
import { SUBSCRIPTION } from "@/lib/data/billing";
import { DeleteForm } from "./delete-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/settings/delete">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Settings.Delete" });
  return { title: t("metadataTitle") };
}

/* S4 — حذف الحساب، صفحة منفصلة كما يطلب البريف.

   تشرح **ماذا يُحذف وماذا يبقى ومدة التنفيذ** قبل أي زرّ، فالقرار
   مبنيّ على معرفة لا على تحذير عام.

   ⚠️ المدد هنا (30 يومًا للحذف، 7 أيام للتراجع، مدة حفظ الفواتير)
   تحتاج تثبيتها مع الفريق التقني ومراجعة المستشار القانوني وفق
   نظام حماية البيانات الشخصية. */

const DELETED = [
  "deletedAccount",
  "deletedSessions",
  "deletedProgress",
  "deletedPreferences",
  "deletedAudio",
] as const;

const KEPT = [
  "keptInvoices",
  "keptStats",
] as const;

export default async function DeletePage(props: PageProps<"/[locale]/settings/delete">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Settings.Delete");

  return (
    <SettingsShell
      active="data"
      title={t("title")}
      lede={t("lede")}
    >
      <div className="flex flex-col gap-4">
        <SettingsCard title={t("deletedTitle")}>
          <ul className="mt-3 flex list-disc flex-col gap-2 ps-5 leading-base text-ink-2">
            {DELETED.map((d) => (
              <li key={d}>{t(d)}</li>
            ))}
          </ul>
        </SettingsCard>

        <SettingsCard title={t("keptTitle")}>
          <ul className="mt-3 flex list-disc flex-col gap-2 ps-5 leading-base text-ink-2">
            {KEPT.map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        </SettingsCard>

        <SettingsCard title={t("whenTitle")}>
          <p className="mt-2 max-w-measure leading-base text-ink-2">
            {t("whenBody")}
          </p>
        </SettingsCard>

        <DeleteForm
          activeUntil={SUBSCRIPTION.canceled ? null : localize(SUBSCRIPTION.renewsOn, locale)}
        />
      </div>
    </SettingsShell>
  );
}
