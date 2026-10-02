"use client";

import { useTranslations, useLocale } from "next-intl";

import { localize } from "@/i18n/localized";

import { useCallback, useState } from "react";
import { Link } from "@/i18n/navigation";
import { GhostButton, PrimaryButton, QuietLink } from "@/components/becan/kit";
import { PLANS, planById, type Plan } from "@/lib/data/plans";
import { METHODS, SUBSCRIPTION, whatYouLose } from "@/lib/data/billing";
import { SettingsCard } from "../_shell";

/* P4 — إدارة الاشتراك.

   **الإلغاء ظاهر غير مخفيّ**، وبخطوة تأكيد واحدة تذكر ما يفقده
   بالتحديد — لا محاولة إقناع متكرّرة ولا عروض متتالية. وبعد الإلغاء
   يبقى مفعّلًا حتى نهاية المدة المدفوعة، والتاريخ مذكور صراحة.

   لوحة التأكيد **داخل الصفحة لا نافذة منبثقة**: النافذة تحتاج حبس
   تركيز (وهي نقطة مفتوحة في شاشة الجلسة)، ولا تعطي هنا شيئًا لا
   تعطيه لوحة في مكانها. والتركيز يُنقل إليها كي يبلغها القارئ
   الصوتي فور فتحها. */

export function SubscriptionView({
  startCanceled,
}: {
  startCanceled: boolean;
}) {
  const t = useTranslations("Settings.Subscription");
  const locale = useLocale();
  const [canceled, setCanceled] = useState(startCanceled);
  const [confirming, setConfirming] = useState(false);

  /* التركيز ينتقل إلى عنوان اللوحة بمرجع نداء لا بـ`requestAnimationFrame`:
     النداء يقع لحظة تركيب العنصر، بينما rAF لا يتقدّم في لوح غير معروض
     — وهو مزلق مسجَّل في docs/STATE.md. */
  const focusConfirm = useCallback((node: HTMLHeadingElement | null) => {
    node?.focus();
  }, []);

  const plan = planById(SUBSCRIPTION.planId)!;
  const method = METHODS.find((m) => m.id === SUBSCRIPTION.method)!;
  const lose = whatYouLose(plan.id);

  const left = Math.max(plan.minutes - SUBSCRIPTION.used, 0);
  const pct = Math.round((SUBSCRIPTION.used / plan.minutes) * 100);

  /* المجانية ليست خطة يُنتقل إليها بالدفع — النزول إليها هو الإلغاء
     نفسه، وإظهارها هنا يعطي بابين لفعل واحد. */
  const others = PLANS.filter((p) => p.id !== plan.id && p.price > 0);

  return (
    <div className="flex flex-col gap-4">
      {/* ————— حالة الإلغاء ————— */}
      {canceled ? (
        <section className="rounded-xl bg-tint-amber p-5 md:p-6">
          <h2 className="text-lg font-bold text-ink md:text-xl">
            {t("canceledTitle")}
          </h2>
          <p className="mt-2 max-w-measure leading-base text-ink-2">
            {t.rich("canceledBody", { plan: localize(plan.name, locale), date: localize(SUBSCRIPTION.renewsOn, locale), strong: (chunks) => <span className="font-semibold text-ink">{chunks}</span> })}
          </p>

          <PrimaryButton
            onClick={() => setCanceled(false)}
            className="mt-5 w-full sm:w-fit"
          >
            {t("resume")}
          </PrimaryButton>
        </section>
      ) : null}

      {/* ————— خطتك ————— */}
      <SettingsCard title={t("plan")}>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-2xl font-bold text-ink">{localize(plan.name, locale)}</p>
          <p className="text-ink-2">{t("monthlyPrice", { price: String(plan.price) })}</p>
        </div>

        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <Row
            term={canceled ? t("endsOn") : t("renewsOn")}
            value={localize(SUBSCRIPTION.renewsOn, locale)}
          />
          <Row
            term={t("method")}
            value={
              <>
                {method.latin ? (
                  <span dir="ltr">{localize(method.latin, locale)}</span>
                ) : (
                  localize(method.label, locale)
                )}{" "}
                · <span dir="ltr">•••• {SUBSCRIPTION.last4}</span>
              </>
            }
          />
        </dl>

        <p className="mt-4 text-sm text-ink-2">
          {t.rich("vatNote", { invoices: (chunks) => <Link href="/settings/invoices" className="font-semibold text-pressable underline underline-offset-4">{chunks}</Link> })}
        </p>
      </SettingsCard>

      {/* ————— الدقائق — رقم واحد بارز: المتبقي ————— */}
      <SettingsCard title={t("minutes")}>
        <p className="mt-3 text-4xl font-bold text-ink md:text-5xl">
          {left}
          <span className="ms-2 text-base font-semibold text-ink-2">
            {t("remaining", { count: left })}
          </span>
        </p>

        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("used", { usedLabel: String(SUBSCRIPTION.used), total: plan.minutes, totalLabel: String(plan.minutes) })}
          className="mt-4 h-2 w-full overflow-hidden rounded-pill bg-ground"
        >
          <div
            className="h-full rounded-pill bg-aubergine-mid"
            style={{ inlineSize: `${pct}%` }}
          />
        </div>

        <p className="mt-3 text-sm text-ink-2">
          {t("usedRenewal", { usedLabel: String(SUBSCRIPTION.used), total: plan.minutes, totalLabel: String(plan.minutes), date: localize(SUBSCRIPTION.renewsOn, locale) })}
        </p>
      </SettingsCard>

      {/* ————— تغيير الخطة ————— */}
      <SettingsCard title={t("change")}>
        <ul className="mt-4 flex flex-col gap-2">
          {others.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line p-4"
            >
              <span>
                <span className="block font-semibold text-ink">{localize(p.name, locale)}</span>
                <span className="mt-1 block text-sm text-ink-2">
                  {t("otherPlan", { price: p.price === 0 ? t("free") : t("monthlyPrice", { price: String(p.price) }), count: p.minutes, countLabel: String(p.minutes) })}
                </span>
              </span>

              <ChangeAction plan={p} current={plan} />
            </li>
          ))}
        </ul>
      </SettingsCard>

      {/* ————— الإلغاء — ظاهر لا مخفيّ ————— */}
      {canceled ? null : (
        <SettingsCard title={t("cancelTitle")}>
          {confirming ? (
            <div className="mt-4">
              <h3
                ref={focusConfirm}
                tabIndex={-1}
                className="text-base font-bold text-ink"
              >
                {t("confirmTitle")}
              </h3>

              {/* ما يفقده بالتحديد — رقمًا لا وعدًا، ومرّة واحدة */}
              <ul className="mt-3 flex list-disc flex-col gap-1 ps-5 leading-base text-ink-2">
                <li>
                  {t("loseMinutes", { fromLabel: String(lose.minutes.from), to: lose.minutes.to, toLabel: String(lose.minutes.to) })}
                </li>
                <li>
                  {t("loseCourses", { from: localize(lose.courses.from, locale), to: localize(lose.courses.to, locale) })}
                </li>
                <li>
                  {t("activeUntil", { plan: localize(plan.name, locale), date: localize(SUBSCRIPTION.renewsOn, locale) })}
                </li>
              </ul>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <GhostButton onClick={() => setCanceled(true)}>
                  {t("confirm")}
                </GhostButton>

                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="inline-flex min-h-11 items-center px-2 font-semibold text-ink"
                >
                  {t("keep")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-2 max-w-measure leading-base text-ink-2">
                {t("cancelBody")}
              </p>

              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="mt-4 inline-flex min-h-11 items-center px-2 font-semibold text-ink underline underline-offset-4"
              >
                {t("cancel")}
              </button>
            </>
          )}
        </SettingsCard>
      )}

      <div>
        <QuietLink href="/plans">{t("compare")}</QuietLink>
      </div>
    </div>
  );
}

/** ترقية أو تخفيض — الاسم يتبع اتجاه السعر لا يُكتب واحدًا للطرفين. */
function ChangeAction({ plan, current }: { plan: Plan; current: Plan }) {
  const t = useTranslations("Settings.Subscription");
  const locale = useLocale();
  const up = plan.price > current.price;

  return (
    <Link
      href={`/checkout?plan=${plan.id}`}
      className={`inline-flex min-h-11 items-center rounded-pill border px-4 font-semibold ${
        up ? "border-aubergine-mid text-aubergine-base" : "border-line text-ink"
      }`}
    >
      {up ? t("upgrade", { plan: localize(plan.name, locale) }) : t("downgrade", { plan: localize(plan.name, locale) })}
    </Link>
  );
}

function Row({ term, value }: { term: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-ink-2">{term}</dt>
      <dd className="text-end font-semibold text-ink">{value}</dd>
    </div>
  );
}
