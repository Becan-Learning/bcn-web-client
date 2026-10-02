"use client";

import { useTranslations, useLocale } from "next-intl";

import { localize } from "@/i18n/localized";

import { useId, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { ErrorText, FieldLabel, PrimaryButton, TextField } from "@/components/becan/kit";
import { breakdown, planById, VAT } from "@/lib/data/plans";
import { METHODS, type MethodId } from "@/lib/data/billing";

/* P2 — نموذج الدفع.

   مدى أولًا في الترتيب، ثم Apple Pay، ثم البطاقة الائتمانية — ترتيب
   البريف حرفيًا، ومصدره `METHODS` فلا يفترق عن بقية الشاشات.

   حقول البطاقة إنجليزية الأرقام بـ`dir="ltr"` و`inputmode="numeric"`
   و`autocomplete` صحيح، كي يملأها مدير كلمات المرور بلا كتابة.

   `noValidate` مقصود: رسائل المتصفّح بلغة النظام لا بالعربية. */

type Errors = Partial<Record<"number" | "expiry" | "cvc" | "name", string>>;

const digits = (v: string) => v.replace(/\D/g, "");

/** تجميع أرقام البطاقة أرباعًا — يقرأها الطالب ويصحّحها أسرع */
const groupCard = (v: string) =>
  digits(v)
    .slice(0, 16)
    .replace(/(.{4})(?=.)/g, "$1 ");

/** الانتهاء بصيغة MM/YY — الفاصل يُكتب تلقائيًا */
const groupExpiry = (v: string) => {
  const d = digits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function CheckoutForm({ planId }: { planId: string }) {
  const t = useTranslations("Checkout");
  const locale = useLocale();
  const router = useRouter();
  const uid = useId();
  const [method, setMethod] = useState<MethodId>("mada");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const plan = planById(planId);
  const sums = breakdown(plan?.price ?? 0);
  const needsCard = method !== "applepay";

  const clear = (key: keyof Errors) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const validate = (): Errors => {
    const e: Errors = {};
    if (!needsCard) return e;

    if (digits(number).length < 16) e.number = t("numberInvalid");

    const d = digits(expiry);
    const month = Number(d.slice(0, 2));
    if (d.length < 4) e.expiry = t("expiryInvalid");
    else if (month < 1 || month > 12) e.expiry = t("monthInvalid");

    if (digits(cvc).length < 3) e.cvc = t("cvcInvalid");
    if (!name.trim()) e.name = t("nameRequired");
    return e;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);

    /* أول حقل ناقص يستقبل التركيز — فلا يبحث الطالب عن الخطأ بنفسه */
    const first = (["number", "expiry", "cvc", "name"] as const).find(
      (k) => found[k],
    );
    if (first) {
      document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }

    router.push(`/checkout/result?s=success&plan=${planId}`);
  };

  if (!plan) return null;

  return (
    <form className="mt-9" onSubmit={submit} noValidate>
      {/* ————— وسيلة الدفع ————— */}
      <fieldset>
        <legend className="text-sm font-semibold text-ink-2">
          {t("method")}
        </legend>

        <div className="mt-3 flex flex-col gap-2">
          {METHODS.map((m) => {
            const on = method === m.id;
            /* الصنف يُبنى شرطيًا لا بتكديس صنفَي لون-حدّ: المتساويان
               في الأولوية يحسمهما ترتيب Tailwind لا ترتيب السمة. */
            return (
              <label
                key={m.id}
                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring ${
                  on
                    ? "border-aubergine-mid bg-tint-aubergine"
                    : "border-line bg-surface"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value={m.id}
                  checked={on}
                  onChange={() => setMethod(m.id)}
                  className="sr-only"
                />

                {/* القرص مرسوم لا افتراضي — الافتراضي لا يقبل التوكنات */}
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border-2 ${
                    on ? "border-aubergine-base" : "border-line"
                  }`}
                >
                  {on ? (
                    <span className="h-2.5 w-2.5 rounded-pill bg-aubergine-base" />
                  ) : null}
                </span>

                <span className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-semibold text-ink">
                    {m.latin ? <span dir="ltr">{localize(m.latin, locale)}</span> : localize(m.label, locale)}
                  </span>
                  <span className="text-sm text-ink-2">{localize(m.note, locale)}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* ————— حقول البطاقة ————— */}
      {needsCard ? (
        <div className="mt-7">
          <FieldLabel htmlFor={`${uid}-number`}>{t("number")}</FieldLabel>
          <TextField
            id={`${uid}-number`}
            name="cardnumber"
            dir="ltr"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder={t("numberPlaceholder")}
            value={number}
            invalid={!!errors.number}
            aria-describedby={errors.number ? `${uid}-err-number` : undefined}
            onChange={(e) => {
              setNumber(groupCard(e.target.value));
              clear("number");
            }}
          />
          {errors.number ? (
            <ErrorText id={`${uid}-err-number`}>{errors.number}</ErrorText>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor={`${uid}-expiry`}>{t("expiry")}</FieldLabel>
              <TextField
                id={`${uid}-expiry`}
                name="cc-exp"
                dir="ltr"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder={t("expiryPlaceholder")}
                value={expiry}
                invalid={!!errors.expiry}
                aria-describedby={
                  errors.expiry ? `${uid}-err-expiry` : undefined
                }
                onChange={(e) => {
                  setExpiry(groupExpiry(e.target.value));
                  clear("expiry");
                }}
              />
              {errors.expiry ? (
                <ErrorText id={`${uid}-err-expiry`}>{errors.expiry}</ErrorText>
              ) : null}
            </div>

            <div>
              <FieldLabel htmlFor={`${uid}-cvc`}>{t("cvc")}</FieldLabel>
              <TextField
                id={`${uid}-cvc`}
                name="cvc"
                dir="ltr"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder={t("cvcPlaceholder")}
                value={cvc}
                invalid={!!errors.cvc}
                aria-describedby={errors.cvc ? `${uid}-err-cvc` : undefined}
                onChange={(e) => {
                  setCvc(digits(e.target.value).slice(0, 4));
                  clear("cvc");
                }}
              />
              {errors.cvc ? (
                <ErrorText id={`${uid}-err-cvc`}>{errors.cvc}</ErrorText>
              ) : null}
            </div>
          </div>

          <div className="mt-4">
            <FieldLabel htmlFor={`${uid}-name`}>{t("name")}</FieldLabel>
            <TextField
              id={`${uid}-name`}
              name="ccname"
              dir="ltr"
              autoComplete="cc-name"
              value={name}
              invalid={!!errors.name}
              aria-describedby={errors.name ? `${uid}-err-name` : undefined}
              onChange={(e) => {
                setName(e.target.value);
                clear("name");
              }}
            />
            {errors.name ? (
              <ErrorText id={`${uid}-err-name`}>{errors.name}</ErrorText>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-7 rounded-xl border border-line bg-surface p-4 leading-base text-ink-2">
          {t("phonePayment")}
        </p>
      )}

      {/* ————— ملخص الطلب — قبل الزر لا في عمود جانبي ————— */}
      <section className="mt-8 rounded-xl bg-tint-walnut p-5">
        <h2 className="text-sm font-semibold text-ink-2">{t("summary")}</h2>

        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <SumRow
            term={t("planMonth", { plan: localize(plan.name, locale) })}
            value={t("amount", { amount: String(sums.gross) })}
          />
          <SumRow term={t("net")} value={t("amount", { amount: String(sums.net.toFixed(2)) })} />
          <SumRow
            term={t("vatRate", { rate: String(VAT * 100) })}
            value={t("amount", { amount: String(sums.vat.toFixed(2)) })}
          />
        </dl>

        <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-3">
          <span className="font-semibold text-ink">{t("total")}</span>
          <span className="text-xl font-bold text-ink">{t("amount", { amount: String(sums.gross) })}</span>
        </div>
      </section>

      {/* المبلغ في الزر لا «تأكيد» — يعرف كم يدفع قبل أن يضغط */}
      <PrimaryButton type="submit" className="mt-6 w-full">
        {t("pay", { amount: String(plan.price) })}
      </PrimaryButton>

      {/* شارة أمان نصّية — لا أقفال ذهبية */}
      <p className="mt-4 text-sm text-ink-2">
        {t("security")}
      </p>
    </form>
  );
}

function SumRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-2">{term}</dt>
      <dd className="text-end font-semibold text-ink">{value}</dd>
    </div>
  );
}
