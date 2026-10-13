"use client";

import { useLocale, useTranslations } from "next-intl";

import { useEffect, useRef, useState } from "react";
import {
  ErrorText,
  FieldLabel,
  GhostButton,
  SelectField,
  TextField,
} from "@/components/becan/kit";
import { sendContact } from "@/lib/forms/contact-client";
import {
  CONTACT_TOPICS,
  isValidContact,
  isValidMessage,
  type ContactTopic,
} from "@/lib/forms/contact-validation";

/* H2 — نموذج البريد، وهو **البديل الاحتياطي** لا القناة الأولى.

   لهذا زرّه محدَّد الإطار لا كهرماني: الكهرماني الوحيد في الشاشة زرّ
   واتساب.

   يُرسل النموذج إلى `/api/forms/contact` لا إلى Google مباشرة. الفخّ
   `website` مخفيّ عن الشخص ويملؤه الروبوت وحده، و`startedAt` لحظة العرض. */

type Errors = Partial<Record<"contact" | "message", string>>;

export function ContactForm() {
  const t = useTranslations("Contact.Form");
  const locale = useLocale() === "en" ? "en" : "ar";
  const TOPIC_LABELS: Record<ContactTopic, string> = {
    course: t("topicCourse"),
    session: t("topicSession"),
    account: t("topicAccount"),
    other: t("topicOther"),
  };
  const [topic, setTopic] = useState<ContactTopic>(CONTACT_TOPICS[0]);
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [website, setWebsite] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sending) return;
    const e: Errors = {};
    const v = contact.trim();

    if (!v) e.contact = t("contactRequired");
    else if (!isValidContact(v)) e.contact = t("contactInvalid");

    if (!isValidMessage(message)) {
      e.message = t("messageRequired");
    }

    setErrors(e);

    const first = (["contact", "message"] as const).find((k) => e[k]);
    if (first) {
      document.getElementById(`ct-${first}`)?.focus();
      return;
    }

    setSendError(null);
    setSending(true);
    const result = await sendContact({
      topic,
      contact: v,
      message: message.trim(),
      locale,
      website,
      startedAt: startedAt.current,
    });
    setSending(false);

    /* عند الفشل يبقى كل ما كتبه الطالب كما هو ليعيد المحاولة */
    if (result === "sent") setSent(true);
    else setSendError(t(result === "rate-limited" ? "sendRateLimited" : "sendFailed"));
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
            onChange={(e) => setTopic(e.target.value as ContactTopic)}
          >
            {CONTACT_TOPICS.map((id) => (
              <option key={id} value={id}>
                {TOPIC_LABELS[id]}
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

        {/* فخّ الروبوتات: لا يراه الشخص ولا يصل إليه التركيز */}
        <div aria-hidden="true" className="sr-only">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
      </div>

      {sendError ? (
        <div role="alert" className="mt-4">
          <ErrorText id="ct-err-send">{sendError}</ErrorText>
        </div>
      ) : null}

      <GhostButton type="submit" disabled={sending} className="mt-6 w-full sm:w-fit">
        {sending ? t("sending") : t("submit")}</GhostButton>
    </form>
  );
}
