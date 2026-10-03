"use client";

import { useLocale, useTranslations } from "next-intl";

import { localize } from "@/i18n/localized";

import { useState } from "react";
import { UNIVERSITIES } from "@/lib/data/catalog";
import {
  ErrorText,
  FieldLabel,
  PrimaryButton,
  SelectField,
  TextField,
} from "@/components/becan/kit";

/* M5 — نموذج تسجيل السفير.

   **قصير**: أربعة حقول، ثلاثة منها إلزامية. كل حقل زائد يقلّل من
   يكمله، والباقي نسأله بعد القبول لا قبله. */

type Errors = Partial<Record<"name" | "university" | "contact", string>>;

export function AmbassadorForm() {
  const t = useTranslations("Ambassadors.Form");
  const [name, setName] = useState("");
  const locale = useLocale();
  const [university, setUniversity] = useState("");
  const [otherName, setOtherName] = useState("");
  const [contact, setContact] = useState("");
  const [reach, setReach] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const other = university === "other";

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const e: Errors = {};
    const v = contact.trim();

    if (!name.trim()) e.name = t("nameRequired");
    if (!university || (other && !otherName.trim())) {
      e.university = t("universityRequired");
    }
    if (!v) e.contact = t("contactRequired");
    else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) &&
      !/^0\d{9}$/.test(v.replace(/[\s-]/g, ""))
    ) {
      e.contact = t("contactInvalid");
    }

    setErrors(e);

    const first = (["name", "university", "contact"] as const).find(
      (k) => e[k],
    );
    if (first) {
      document.getElementById(`amb-${first}`)?.focus();
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl bg-tint-amber p-5 md:p-6"
      >
        <h3 className="text-lg font-bold text-ink md:text-xl">{t("sentTitle")}</h3>
        <p className="mt-2 max-w-measure leading-base text-ink-2">
          {t("sentBody")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel htmlFor="amb-name">{t("name")}</FieldLabel>
          <TextField
            id="amb-name"
            dir="auto"
            name="name"
            autoComplete="name"
            value={name}
            invalid={!!errors.name}
            aria-describedby={errors.name ? "amb-err-name" : undefined}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((p) => ({ ...p, name: undefined }));
            }}
          />
          {errors.name ? (
            <ErrorText id="amb-err-name">{errors.name}</ErrorText>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor="amb-university">{t("university")}</FieldLabel>
          <SelectField
            id="amb-university"
            name="university"
            value={university}
            invalid={!!errors.university}
            aria-describedby={errors.university ? "amb-err-uni" : undefined}
            onChange={(e) => {
              setUniversity(e.target.value);
              setErrors((p) => ({ ...p, university: undefined }));
            }}
          >
            <option value="">{t("chooseUniversity")}</option>
            {UNIVERSITIES.map((u) => (
              <option key={u.ar} value={u.ar}>
                {localize(u, locale)}
              </option>
            ))}
            <option value="other">{t("other")}</option>
          </SelectField>
          {errors.university ? (
            <ErrorText id="amb-err-uni">{errors.university}</ErrorText>
          ) : null}

          {other ? (
            <div className="mt-3">
              <FieldLabel htmlFor="amb-university-other">{t("universityName")}</FieldLabel>
              <TextField
                id="amb-university-other"
                dir="auto"
                name="universityOther"
                value={otherName}
                onChange={(e) => {
                  setOtherName(e.target.value);
                  setErrors((p) => ({ ...p, university: undefined }));
                }}
              />
            </div>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor="amb-contact">{t("contact")}</FieldLabel>
          <TextField
            id="amb-contact"
            name="contact"
            dir="ltr"
            autoComplete="tel"
            placeholder={t("phonePlaceholder")}
            value={contact}
            invalid={!!errors.contact}
            aria-describedby={errors.contact ? "amb-err-contact" : undefined}
            onChange={(e) => {
              setContact(e.target.value);
              setErrors((p) => ({ ...p, contact: undefined }));
            }}
          />
          {errors.contact ? (
            <ErrorText id="amb-err-contact">{errors.contact}</ErrorText>
          ) : null}
        </div>

        <div>
          <FieldLabel
            htmlFor="amb-reach"
            hint={t("reachHint")}
          >
            {t("reach")}
          </FieldLabel>
          <TextField
            id="amb-reach"
            dir="auto"
            name="reach"
            placeholder={t("reachPlaceholder")}
            value={reach}
            onChange={(e) => setReach(e.target.value)}
          />
        </div>
      </div>

      {/* الفعل الوحيد في الصفحة */}
      <PrimaryButton type="submit" className="mt-6 w-full sm:w-fit">
        {t("submit")}
      </PrimaryButton>
    </form>
  );
}
