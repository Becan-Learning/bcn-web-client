"use client";

import { useLocale, useTranslations } from "next-intl";

import { localize } from "@/i18n/localized";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import type { Institution } from "@/lib/auth/catalog";
import type { CourseSummary } from "@/lib/courses/schema";
import {
  ErrorText,
  FieldLabel,
  PrimaryButton,
  SelectField,
  TextField,
} from "@/components/becan/kit";
import { sendRequest } from "@/lib/forms/request-client";
import {
  isValidRequestContact,
  OTHER_UNIVERSITY,
} from "@/lib/forms/request-validation";

/* بريف الشاشة 2: الهدف إرسال الطلب في أقل من 30 ثانية.
   ثلاثة حقول إلزامية، لا غير.

   يُرسل النموذج إلى `/api/forms/request` لا إلى Google مباشرة. الفخّ
   `website` مخفيّ عن الشخص ويملؤه الروبوت وحده، و`startedAt` لحظة العرض.

   `noValidate` على النموذج مقصود: يعطّل رسائل المتصفّح الافتراضية
   لأنها بلغة النظام لا بالعربية، ونعرض رسائلنا بدلًا منها. */

type Errors = Partial<
  Record<"university" | "otherName" | "course" | "contact", string>
>;

export function RequestForm({ institutions, courses }: { institutions: Institution[]; courses: CourseSummary[]; }) {
  const t = useTranslations("Request.Form");
  const router = useRouter();
  const locale = useLocale();
  const interfaceLocale = locale === "en" ? "en" : "ar";
  const [university, setUniversity] = useState("");
  const [otherName, setOtherName] = useState("");
  const [course, setCourse] = useState("");
  const [contact, setContact] = useState("");
  const [byEmail, setByEmail] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const otherUniversity = university === OTHER_UNIVERSITY;

  const clear = (key: keyof Errors) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const validate = (): Errors => {
    const e: Errors = {};
    const value = contact.trim();

    if (!university) e.university = t("universityRequired");
    if (otherUniversity && !otherName.trim()) e.otherName = t("universityNameRequired");
    if (!course.trim()) e.course = t("courseRequired");

    if (!value) {
      e.contact = byEmail ? t("emailRequired") : t("phoneRequired");
    } else if (!isValidRequestContact(value, byEmail)) {
      e.contact = byEmail ? t("emailInvalid") : t("phoneInvalid");
    }
    return e;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sending) return;
    const found = validate();
    setErrors(found);

    /* أول حقل ناقص يستقبل التركيز — فلا يبحث الطالب عن الخطأ بنفسه */
    const firstKey = (
      ["university", "otherName", "course", "contact"] as const
    ).find((k) => found[k]);
    if (firstKey) {
      const id =
        firstKey === "otherName" ? "req-university-other" : `req-${firstKey}`;
      document.getElementById(id)?.focus();
      return;
    }

    setSendError(null);
    setSending(true);
    const result = await sendRequest({
      university,
      universityOther: otherName.trim(),
      course: course.trim(),
      contact: contact.trim(),
      byEmail,
      locale: interfaceLocale,
      website,
      startedAt: startedAt.current,
    });

    /* عند الفشل يبقى كل ما كتبه الطالب كما هو ليعيد المحاولة */
    if (result === "sent") {
      router.push("/request/sent");
      return;
    }
    setSending(false);
    setSendError(t(result === "rate-limited" ? "sendRateLimited" : "sendFailed"));
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form className="mt-9 max-w-measure" onSubmit={submit} noValidate>
      {/* 1 — الجامعة */}
      <div>
        <FieldLabel htmlFor="req-university">{t("university")}</FieldLabel>
        <SelectField
          id="req-university"
          name="university"
          value={university}
          invalid={!!errors.university}
          aria-describedby={errors.university ? "err-university" : undefined}
          onChange={(e) => {
            setUniversity(e.target.value);
            clear("university");
          }}
        >
          <option value="">{t("chooseUniversity")}</option>
          {institutions.map((u) => (
            <option key={u.id} value={u.id}>
              {localize(u.name, locale)}
            </option>
          ))}
          <option value="other">{t("other")}</option>
        </SelectField>
        {errors.university ? (
          <ErrorText id="err-university">{errors.university}</ErrorText>
        ) : null}

        {otherUniversity ? (
          <div className="mt-3">
            <FieldLabel htmlFor="req-university-other">{t("universityName")}</FieldLabel>
            <TextField
              id="req-university-other"
              dir="auto"
              name="universityOther"
              autoFocus
              value={otherName}
              invalid={!!errors.otherName}
              aria-describedby={errors.otherName ? "err-other" : undefined}
              onChange={(e) => {
                setOtherName(e.target.value);
                clear("otherName");
              }}
              placeholder={t("universityPlaceholder")}
            />
            {errors.otherName ? (
              <ErrorText id="err-other">{errors.otherName}</ErrorText>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* 2 — اسم المقرر أو رمزه */}
      <div className="mt-6">
        <FieldLabel htmlFor="req-course">{t("course")}</FieldLabel>
        <TextField
          id="req-course"
          dir="auto"
          name="course"
          list="req-course-suggestions"
          autoComplete="off"
          value={course}
          invalid={!!errors.course}
          aria-describedby={errors.course ? "err-course" : undefined}
          onChange={(e) => {
            setCourse(e.target.value);
            clear("course");
          }}
          placeholder={t("coursePlaceholder")}
        />
        {/* اقتراح تلقائي من الكتالوج */}
        <datalist id="req-course-suggestions">
          {courses.map((c) => (
            <option dir="auto" key={c.id} value={`${localize(c.name, locale)} — ${c.code}`} />
          ))}
        </datalist>
        {errors.course ? (
          <ErrorText id="err-course">{errors.course}</ErrorText>
        ) : null}
      </div>

      {/* 3 — قناة التبليغ */}
      <div className="mt-6">
        <FieldLabel htmlFor="req-contact">{t("contact")}</FieldLabel>
        <TextField
          key={byEmail ? "email" : "phone"}
          id="req-contact"
          name={byEmail ? "email" : "phone"}
          type={byEmail ? "email" : "tel"}
          inputMode={byEmail ? "email" : "tel"}
          dir="ltr"
          value={contact}
          invalid={!!errors.contact}
          aria-describedby={errors.contact ? "err-contact" : undefined}
          onChange={(e) => {
            setContact(e.target.value);
            clear("contact");
          }}
          placeholder={byEmail ? t("emailPlaceholder") : t("phonePlaceholder")}
        />
        {errors.contact ? (
          <ErrorText id="err-contact">{errors.contact}</ErrorText>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setByEmail((v) => !v);
            setContact("");
            clear("contact");
          }}
          className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-pressable underline underline-offset-4"
        >
          {byEmail ? t("preferPhone") : t("preferEmail")}
        </button>
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

      <p role="alert" className="mt-6 min-h-6 text-sm font-semibold text-error">
        {hasErrors ? t("errors") : ""}
      </p>

      {sendError ? (
        <div role="alert" className="mb-4">
          <ErrorText id="err-send">{sendError}</ErrorText>
        </div>
      ) : null}

      <PrimaryButton type="submit" disabled={sending} className="w-full md:w-auto">
        {sending ? t("sending") : t("submit")}
      </PrimaryButton>
    </form>
  );
}
