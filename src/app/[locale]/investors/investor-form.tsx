"use client";

import { useTranslations } from "next-intl";

import { useState } from "react";
import { ErrorText, FieldLabel, PrimaryButton, TextField } from "@/components/becan/kit";

/* M6 — نموذج طلب الـ Deck.

   ثلاثة حقول: الاسم · الجهة · البريد. أي حقل رابع يطيل نموذجًا
   الغرض منه فتح محادثة لا تأهيل عميل. */

type Errors = Partial<Record<"name" | "org" | "email", string>>;

export function InvestorForm() {
  const t = useTranslations("Investors.Form");
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const e: Errors = {};

    if (!name.trim()) e.name = t("nameRequired");
    if (!org.trim()) e.org = t("orgRequired");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = t("emailInvalid");
    }

    setErrors(e);

    const first = (["name", "org", "email"] as const).find((k) => e[k]);
    if (first) {
      document.getElementById(`inv-${first}`)?.focus();
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl bg-tint-aubergine p-5 md:p-6"
      >
        <h3 className="text-lg font-bold text-ink md:text-xl">{t("sentTitle")}</h3>
        <p className="mt-2 max-w-measure leading-base text-ink-2">
          {t.rich("sentBody", { latin: (chunks) => <span dir="ltr">{chunks}</span> })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel htmlFor="inv-name">{t("name")}</FieldLabel>
          <TextField
            id="inv-name"
            dir="auto"
            name="name"
            autoComplete="name"
            value={name}
            invalid={!!errors.name}
            aria-describedby={errors.name ? "inv-err-name" : undefined}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((p) => ({ ...p, name: undefined }));
            }}
          />
          {errors.name ? (
            <ErrorText id="inv-err-name">{errors.name}</ErrorText>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor="inv-org">{t("organization")}</FieldLabel>
          <TextField
            id="inv-org"
            dir="auto"
            name="organization"
            autoComplete="organization"
            value={org}
            invalid={!!errors.org}
            aria-describedby={errors.org ? "inv-err-org" : undefined}
            onChange={(e) => {
              setOrg(e.target.value);
              setErrors((p) => ({ ...p, org: undefined }));
            }}
          />
          {errors.org ? (
            <ErrorText id="inv-err-org">{errors.org}</ErrorText>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor="inv-email">{t("email")}</FieldLabel>
          <TextField
            id="inv-email"
            name="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            invalid={!!errors.email}
            aria-describedby={errors.email ? "inv-err-email" : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((p) => ({ ...p, email: undefined }));
            }}
          />
          {errors.email ? (
            <ErrorText id="inv-err-email">{errors.email}</ErrorText>
          ) : null}
        </div>
      </div>

      {/* الفعل الوحيد في الصفحة */}
      <PrimaryButton type="submit" className="mt-6 w-full sm:w-fit">
        {t.rich("submit", { latin: (chunks) => <span dir="ltr">{chunks}</span> })}
      </PrimaryButton>
    </form>
  );
}
