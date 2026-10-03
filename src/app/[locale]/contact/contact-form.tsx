"use client";

import { useTranslations } from "next-intl";

import { useState } from "react";
import {
  ErrorText,
  FieldLabel,
  GhostButton,
  SelectField,
  TextField,
} from "@/components/becan/kit";

/* H2 — نموذج البريد، وهو **البديل الاحتياطي** لا القناة الأولى.

   لهذا زرّه محدَّد الإطار لا كهرماني: الكهرماني الوحيد في الشاشة زرّ
   واتساب. */

type Errors = Partial<Record<"contact" | "message", string>>;

export function ContactForm() {
  const t = useTranslations("Contact.Form");
  const TOPICS = [
    { id: "course", label: t("topicCourse") },
    { id: "session", label: t("topicSession") },
    { id: "billing", label: t("topicBilling") },
    { id: "account", label: t("topicAccount") },
    { id: "other", label: t("topicOther") },
  ];
  const [topic, setTopic] = useState(TOPICS[0].id);
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const e: Errors = {};
    const v = contact.trim();

    if (!v) e.contact = t("contactRequired");
    else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) &&
      !/^0\d{9}$/.test(v.replace(/[\s-]/g, ""))
    ) {
      e.contact = t("contactInvalid");
    }

    if (message.trim().length < 10) {
      e.message = t("messageRequired");
    }

    setErrors(e);

    const first = (["contact", "message"] as const).find((k) => e[k]);
    if (first) {
      document.getElementById(`ct-${first}`)?.focus();
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
        <h3 className="text-lg font-bold text-ink">{t("sentTitle")}</h3>
        <p className="mt-2 max-w-measure leading-base text-ink-2">
          {t("sentBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel htmlFor="ct-topic">{t("topic")}</FieldLabel>
          <SelectField
            id="ct-topic"
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </SelectField>
        </div>

        <div>
          <FieldLabel htmlFor="ct-contact">{t("contact")}</FieldLabel>
          <TextField
            id="ct-contact"
            name="contact"
            dir="ltr"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            value={contact}
            invalid={!!errors.contact}
            aria-describedby={errors.contact ? "ct-err-contact" : undefined}
            onChange={(e) => {
              setContact(e.target.value);
              setErrors((p) => ({ ...p, contact: undefined }));
            }}
          />
          {errors.contact ? (
            <ErrorText id="ct-err-contact">{errors.contact}</ErrorText>
          ) : null}
        </div>

        <div>
          <FieldLabel
            htmlFor="ct-message"
            hint={t("messageHint")}
          >
            {t("message")}</FieldLabel>
          <textarea
            dir="auto" id="ct-message"
            name="message"
            rows={5}
            value={message}
            aria-invalid={!!errors.message || undefined}
            aria-describedby={errors.message ? "ct-err-message" : undefined}
            onChange={(e) => {
              setMessage(e.target.value);
              setErrors((p) => ({ ...p, message: undefined }));
            }}
            /* لون الحدّ يُبنى شرطيًا لا بتكديس صنفين متساويي الأولوية */
            className={`mt-2 w-full rounded-xl border bg-surface p-4 leading-base text-ink shadow-soft placeholder:text-ink-2 ${errors.message ? "border-error" : "border-aubergine-deep"
              }`}
          />
          {errors.message ? (
            <ErrorText id="ct-err-message">{errors.message}</ErrorText>
          ) : null}
        </div>
      </div>

      <GhostButton type="submit" className="mt-6 w-full sm:w-fit">
        {t("submit")}</GhostButton>
    </form>
  );
}
