import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { QuietLink, PrimaryButton } from "@/components/becan/kit";
import { SettingsCard, SettingsShell } from "../_shell";
import { localize } from "@/i18n/localized";
import { getAllowance } from "@/lib/allowance/server";
import { formatRenewalDate } from "@/lib/allowance/format";
import { minutesLeft, usedUp } from "@/lib/allowance/rules";
import { requireAccount } from "@/lib/auth/session";
import { accountReturnPath } from "@/lib/auth/next-path";
import { getPlans } from "@/lib/plans/server";
import { currentPaidPlan, formatPrice } from "@/lib/plans/view";
import { PaidPlanPanel } from "./paid-plan-panel";
import { RetryAllowance } from "./retry-allowance";

export async function generateMetadata({ params }: PageProps<"/[locale]/settings/subscription">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Settings.Subscription" });
  return { title: t("metadataTitle") };
}

export default async function SubscriptionPage(
  props: PageProps<"/[locale]/settings/subscription">,
) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireAccount(locale, accountReturnPath("/settings/subscription", await props.searchParams));
  const [t, format, result, plans] = await Promise.all([
    getTranslations("Settings.Subscription"),
    getFormatter({ locale }),
    getAllowance(),
    getPlans(),
  ]);

  if (!result.ok) {
    return (
      <SettingsShell active="subscription" title={t("title")} lede={t("lede")}>
        <SettingsCard title={t("errorTitle")}>
          <p className="mt-2 max-w-measure leading-base text-ink-2">
            {t("errorBody")}
          </p>
          <RetryAllowance label={t("retry")} />
        </SettingsCard>
      </SettingsShell>
    );
  }

  const allowance = result.data;
  const remaining = minutesLeft(allowance);
  const number = (value: number) => format.number(value, { numberingSystem: "latn" });
  const usage = (used: number, limit: number | null) => limit === null
    ? number(used)
    : t("usage", { used: number(used), limit: number(limit) });
  const rows = [
    { label: t("sessions"), value: usage(allowance.usage.sessions, allowance.limits.sessions) },
    { label: t("minutesUsed"), value: usage(Math.ceil(allowance.usage.seconds / 60), allowance.limits.seconds === null ? null : Math.floor(allowance.limits.seconds / 60)) },
    { label: t("courses"), value: usage(allowance.usage.enrollments, allowance.limits.enrollments) },
  ];
  const renewal = formatRenewalDate(format, new Date(allowance.period.end));
  /* الدفع والتجديد والإلغاء لمن باقته الحالية بسعر أكبر من صفر وحدهم؛ السعر من
     `GET /plans` بمعرّف الباقة، وتعذّر القراءة يعني أن لا شيء من ذلك يظهر. */
  const paid = currentPaidPlan(allowance.plan.id, plans.ok ? plans.plans : null);

  return (
    <SettingsShell active="subscription" title={t("title")} lede={t("lede")}>
      <SettingsCard>
        <p className="text-sm leading-base text-ink-2">{t("minutesLeft")}</p>
        <p className="mt-3 text-4xl leading-none font-bold tracking-tight text-ink tabular-nums">
          {remaining === null ? t("unlimited") : number(remaining)}
        </p>
        {usedUp(allowance) ? (
          <p className="mt-3 text-sm leading-base text-ink-2">{t("usedUp", { date: renewal })}</p>
        ) : null}

        <dl className="mt-8 divide-y divide-line">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
              <dt className="text-ink-2">{row.label}</dt>
              <dd className="text-end font-semibold text-ink tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 border-t border-line pt-5">
          <p className="font-semibold text-ink">{localize(allowance.plan.name, locale)}</p>
          <p className="mt-1 text-sm leading-base text-ink-2">{t("renewal", { date: renewal })}</p>
        </div>
      </SettingsCard>

      {paid ? (
        <PaidPlanPanel plan={{ name: paid.name, priceLabel: formatPrice(paid.price) }} renewsOn={renewal} />
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        {paid ? null : <PrimaryButton href="/plans">{t("upgrade")}</PrimaryButton>}
        <QuietLink href="/plans">{t("compare")}</QuietLink>
      </div>
    </SettingsShell>
  );
}
