"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { localize } from "@/i18n/localized";
import { GhostButton, PrimaryButton } from "@/components/becan/kit";
import { METHODS, type MethodId } from "@/lib/data/billing";

/* P4 — إدارة الاشتراك المدفوع.

   **لا يظهر إلا لمن باقته الحالية بسعر أكبر من صفر** (يقرّر ذلك `page.tsx`
   بسعر الباقة من `GET /plans`). والدفع تجريبي حتى تتوفّر بوابة، فلا أحد
   على باقة مدفوعة اليوم؛ الشيفرة باقية لتُوصَل بالبوابة والخادم حينها.
   وكل ما يُعرض هنا يأتي بالخاصيّات لا من بيانات عرض مكتوبة: السعر من
   الخادم، وموعد التجديد نهاية دورة الاستخدام. ووسيلة الدفع وآخر أربعة
   أرقام تُعرضان إن مُرّرتا (`payment`) ولا مصدر لهما قبل البوابة.

   **الإلغاء ظاهر غير مخفيّ**، وبخطوة تأكيد واحدة تذكر ما يبقى له — لا
   محاولة إقناع متكرّرة ولا عروض متتالية. وبعد الإلغاء تبقى باقته مفعّلة
   حتى نهاية المدة المدفوعة، والتاريخ مذكور صراحة. (حالة الإلغاء هنا في
   الواجهة فقط حتى يوجد استدعاء في الخادم.)

   لوحة التأكيد **داخل الصفحة لا نافذة منبثقة**: النافذة تحتاج حبس تركيز،
   ولا تعطي هنا شيئًا لا تعطيه لوحة في مكانها. والتركيز يُنقل إليها كي يبلغها
   القارئ الصوتي فور فتحها. */

export type PaidPlanPanelProps = {
  plan: { name: { ar: string; en: string }; priceLabel: string };
  /** نهاية دورة الاستخدام الحالية، منسّقة */
  renewsOn: string;
  payment?: { method: MethodId; last4: string } | null;
};

export function PaidPlanPanel({ plan, renewsOn, payment = null }: PaidPlanPanelProps) {
  const t = useTranslations("Settings.Subscription");
  const locale = useLocale();
  const [canceled, setCanceled] = useState(false);
  const [confirming, setConfirming] = useState(false);

  /* التركيز ينتقل إلى عنوان اللوحة بمرجع نداء لا بـ`requestAnimationFrame`:
     النداء يقع لحظة تركيب العنصر، بينما rAF لا يتقدّم في لوح غير معروض. */
  const focusConfirm = useCallback((node: HTMLHeadingElement | null) => {
    node?.focus();
  }, []);

  const name = localize(plan.name, locale);
  const method = payment ? METHODS.find((m) => m.id === payment.method) : undefined;

  return (
    <div className="mt-4 flex flex-col gap-4">
      {canceled ? (
        <section className="rounded-xl bg-tint-amber p-5 md:p-6">
          <h2 className="text-lg font-bold text-ink md:text-xl">{t("canceledTitle")}</h2>
          <p className="mt-2 max-w-measure leading-base text-ink-2">
            {t.rich("canceledBody", { plan: name, date: renewsOn, strong: (chunks) => <span className="font-semibold text-ink">{chunks}</span> })}
          </p>
          <PrimaryButton onClick={() => setCanceled(false)} className="mt-5 w-full sm:w-fit">
            {t("resume")}
          </PrimaryButton>
        </section>
      ) : null}

      <Card title={t("paidTitle")}>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-2xl font-bold text-ink">{name}</p>
          <p className="text-ink-2">{t("paidPrice", { price: plan.priceLabel })}</p>
        </div>

        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <Row term={canceled ? t("endsOn") : t("renewsOn")} value={renewsOn} />
          {method && payment ? (
            <Row
              term={t("method")}
              value={
                <>
                  {method.latin ? <span dir="ltr">{localize(method.latin, locale)}</span> : localize(method.label, locale)}{" "}
                  · <span dir="ltr">•••• {payment.last4}</span>
                </>
              }
            />
          ) : null}
        </dl>

        <p className="mt-4 text-sm text-ink-2">{t("vatNote")}</p>
      </Card>

      {canceled ? null : (
        <Card title={t("cancelTitle")}>
          {confirming ? (
            <div className="mt-4">
              <h3 ref={focusConfirm} tabIndex={-1} className="text-base font-bold text-ink">
                {t("confirmTitle")}
              </h3>
              <p className="mt-3 leading-base text-ink-2">{t("activeUntil", { plan: name, date: renewsOn })}</p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <GhostButton onClick={() => setCanceled(true)}>{t("confirm")}</GhostButton>
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
              <p className="mt-2 max-w-measure leading-base text-ink-2">{t("cancelBody")}</p>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="mt-4 inline-flex min-h-11 items-center px-2 font-semibold text-ink underline underline-offset-4"
              >
                {t("cancel")}
              </button>
            </>
          )}
        </Card>
      )}
    </div>
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

/* بطاقة الإعدادات نفسها (`SettingsCard`) — منسوخة هنا لأن `_shell` مكوّن خادم
   ولا يُستورد من مكوّن عميل. */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5 md:p-6">
      <h2 className="text-lg font-bold text-ink md:text-xl">{title}</h2>
      {children}
    </section>
  );
}
