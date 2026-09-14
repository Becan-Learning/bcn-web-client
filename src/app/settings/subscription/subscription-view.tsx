"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
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
            التجديد ملغى
          </h2>
          <p className="mt-2 max-w-measure leading-base text-ink-2">
            خطة {plan.name} تبقى مفعّلة لك حتى{" "}
            <span className="font-semibold text-ink">
              {SUBSCRIPTION.renewsOn}
            </span>
            ، وبعدها ترجع للخطة المجانية. ما راح ينخصم منك شيء.
          </p>

          <PrimaryButton
            onClick={() => setCanceled(false)}
            className="mt-5 w-full sm:w-fit"
          >
            استأنف الاشتراك
          </PrimaryButton>
        </section>
      ) : null}

      {/* ————— خطتك ————— */}
      <SettingsCard title="خطتك">
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-2xl font-bold text-ink">{plan.name}</p>
          <p className="text-ink-2">{plan.price} ريال / شهر</p>
        </div>

        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <Row
            term={canceled ? "تنتهي في" : "التجديد القادم"}
            value={SUBSCRIPTION.renewsOn}
          />
          <Row
            term="وسيلة الدفع"
            value={
              <>
                {method.latin ? (
                  <span dir="ltr">{method.latin}</span>
                ) : (
                  method.label
                )}{" "}
                · <span dir="ltr">•••• {SUBSCRIPTION.last4}</span>
              </>
            }
          />
        </dl>

        <p className="mt-4 text-sm text-ink-2">
          السعر شامل ضريبة القيمة المضافة، وتفصيلها في{" "}
          <Link
            href="/settings/invoices"
            className="font-semibold text-pressable underline underline-offset-4"
          >
            فواتيرك
          </Link>
          .
        </p>
      </SettingsCard>

      {/* ————— الدقائق — رقم واحد بارز: المتبقي ————— */}
      <SettingsCard title="دقائق هذا الشهر">
        <p className="mt-3 text-4xl font-bold text-ink md:text-5xl">
          {left}
          <span className="ms-2 text-base font-semibold text-ink-2">
            دقيقة باقية
          </span>
        </p>

        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`استهلكت ${SUBSCRIPTION.used} من ${plan.minutes} دقيقة`}
          className="mt-4 h-2 w-full overflow-hidden rounded-pill bg-ground"
        >
          <div
            className="h-full rounded-pill bg-aubergine-mid"
            style={{ inlineSize: `${pct}%` }}
          />
        </div>

        <p className="mt-3 text-sm text-ink-2">
          استهلكت {SUBSCRIPTION.used} من {plan.minutes} دقيقة · تتجدّد في{" "}
          {SUBSCRIPTION.renewsOn}
        </p>
      </SettingsCard>

      {/* ————— تغيير الخطة ————— */}
      <SettingsCard title="غيّر خطتك">
        <ul className="mt-4 flex flex-col gap-2">
          {others.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line p-4"
            >
              <span>
                <span className="block font-semibold text-ink">{p.name}</span>
                <span className="mt-1 block text-sm text-ink-2">
                  {p.price === 0 ? "بلا رسوم" : `${p.price} ريال / شهر`} ·{" "}
                  {p.minutes} دقيقة
                </span>
              </span>

              <ChangeAction plan={p} current={plan} />
            </li>
          ))}
        </ul>
      </SettingsCard>

      {/* ————— الإلغاء — ظاهر لا مخفيّ ————— */}
      {canceled ? null : (
        <SettingsCard title="إلغاء الاشتراك">
          {confirming ? (
            <div className="mt-4">
              <h3
                ref={focusConfirm}
                tabIndex={-1}
                className="text-base font-bold text-ink"
              >
                بالإلغاء ترجع للخطة المجانية
              </h3>

              {/* ما يفقده بالتحديد — رقمًا لا وعدًا، ومرّة واحدة */}
              <ul className="mt-3 flex list-disc flex-col gap-1 ps-5 leading-base text-ink-2">
                <li>
                  دقائقك ترجع من {lose.minutes.from} إلى {lose.minutes.to} دقيقة
                  في الشهر.
                </li>
                <li>
                  مقرراتك ترجع من «{lose.courses.from}» إلى «{lose.courses.to}».
                </li>
                <li>
                  خطة {plan.name} تبقى شغّالة حتى {SUBSCRIPTION.renewsOn}.
                </li>
              </ul>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <GhostButton onClick={() => setCanceled(true)}>
                  أكّد الإلغاء
                </GhostButton>

                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="inline-flex min-h-11 items-center px-2 font-semibold text-ink"
                >
                  خلّني على خطتي
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-2 max-w-measure leading-base text-ink-2">
                تقدر تلغي التجديد في أي وقت، وتبقى خطتك شغّالة حتى نهاية المدة
                المدفوعة.
              </p>

              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="mt-4 inline-flex min-h-11 items-center px-2 font-semibold text-ink underline underline-offset-4"
              >
                ألغِ التجديد
              </button>
            </>
          )}
        </SettingsCard>
      )}

      <div>
        <QuietLink href="/plans">قارن الخطط كاملة</QuietLink>
      </div>
    </div>
  );
}

/** ترقية أو تخفيض — الاسم يتبع اتجاه السعر لا يُكتب واحدًا للطرفين. */
function ChangeAction({ plan, current }: { plan: Plan; current: Plan }) {
  const up = plan.price > current.price;

  return (
    <Link
      href={`/checkout?plan=${plan.id}`}
      className={`inline-flex min-h-11 items-center rounded-pill border px-4 font-semibold ${
        up ? "border-aubergine-mid text-aubergine-base" : "border-line text-ink"
      }`}
    >
      {up ? `ارقِ لـ${plan.name}` : `نزّل لـ${plan.name}`}
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
