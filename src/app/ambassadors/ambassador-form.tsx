"use client";

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
  const [name, setName] = useState("");
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

    if (!name.trim()) e.name = "اكتب اسمك";
    if (!university || (other && !otherName.trim())) {
      e.university = "اختر جامعتك من القائمة";
    }
    if (!v) e.contact = "اكتب رقم جوالك أو بريدك";
    else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) &&
      !/^0\d{9}$/.test(v.replace(/[\s-]/g, ""))
    ) {
      e.contact = "تأكد من البريد، أو من أن الرقم 10 أرقام يبدأ بـ 05";
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
        <h3 className="text-lg font-bold text-ink md:text-xl">وصلنا طلبك</h3>
        <p className="mt-2 max-w-measure leading-base text-ink-2">
          نراجع الطلبات مرة كل أسبوع، ونرد عليك خلال خمسة أيام. لو انقبلت، يوصلك
          رابطك ولوحة متابعة تشوف فيها من سجّل منك.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel htmlFor="amb-name">اسمك</FieldLabel>
          <TextField
            id="amb-name"
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
          <FieldLabel htmlFor="amb-university">جامعتك</FieldLabel>
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
            <option value="">اختر جامعتك</option>
            {UNIVERSITIES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
            <option value="other">أخرى</option>
          </SelectField>
          {errors.university ? (
            <ErrorText id="amb-err-uni">{errors.university}</ErrorText>
          ) : null}

          {other ? (
            <div className="mt-3">
              <FieldLabel htmlFor="amb-university-other">اسم جامعتك</FieldLabel>
              <TextField
                id="amb-university-other"
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
          <FieldLabel htmlFor="amb-contact">رقم جوالك أو بريدك</FieldLabel>
          <TextField
            id="amb-contact"
            name="contact"
            dir="ltr"
            autoComplete="tel"
            placeholder="05xxxxxxxx"
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
            hint="اختياري — يساعدنا نرتّب الطلبات"
          >
            وين توصل لزملائك؟
          </FieldLabel>
          <TextField
            id="amb-reach"
            name="reach"
            placeholder="قروب الدفعة، حساب في تويتر، نادي الكلية…"
            value={reach}
            onChange={(e) => setReach(e.target.value)}
          />
        </div>
      </div>

      {/* الفعل الوحيد في الصفحة */}
      <PrimaryButton type="submit" className="mt-6 w-full sm:w-fit">
        سجّل كسفير
      </PrimaryButton>
    </form>
  );
}
