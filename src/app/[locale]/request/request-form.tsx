"use client";

import { useLocale, useTranslations } from "next-intl";

import { localize } from "@/i18n/localized";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { UNIVERSITIES, COURSES } from "@/lib/data/catalog";
import { UploadIcon } from "@/components/becan/icons";
import {
  ErrorText,
  FieldLabel,
  PrimaryButton,
  SelectField,
  TextField,
} from "@/components/becan/kit";

/* بريف الشاشة 2: الهدف إرسال الطلب في أقل من 30 ثانية.
   ثلاثة حقول إلزامية، ثم حقل ملفّات اختياري لا يمنع الإرسال أبدًا.

   `noValidate` على النموذج مقصود: يعطّل رسائل المتصفّح الافتراضية
   لأنها بلغة النظام لا بالعربية، ونعرض رسائلنا بدلًا منها. */

type Errors = Partial<
  Record<"university" | "otherName" | "course" | "contact", string>
>;

export function RequestForm() {
  const t = useTranslations("Request.Form");
  const router = useRouter();
  const locale = useLocale();
  const [university, setUniversity] = useState("");
  const [otherName, setOtherName] = useState("");
  const [course, setCourse] = useState("");
  const [contact, setContact] = useState("");
  const [byEmail, setByEmail] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});

  const otherUniversity = university === "other";

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
    } else if (byEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        e.contact = t("emailInvalid");
      }
    } else if (!/^0\d{9}$/.test(value.replace(/[\s-]/g, ""))) {
      e.contact = t("phoneInvalid");
    }
    return e;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
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

    const params = new URLSearchParams();
    params.set("course", course.trim());
    params.set("university", otherUniversity ? otherName.trim() : university);
    router.push("/request/sent?" + params.toString());
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
          {UNIVERSITIES.map((u) => (
            <option key={u.ar} value={u.ar}>
              {localize(u, locale)}
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
        {/* اقتراح تلقائي من الطلبات السابقة */}
        <datalist id="req-course-suggestions">
          {COURSES.map((c) => (
            <option dir="auto" key={c.code} value={`${localize(c.name, locale)} — ${c.code}`} />
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

      {/* اختياري — بلا نجمة، بلا تحذير، ولا يعطّل الإرسال */}
      <div className="mt-8 rounded-xl border border-line bg-surface p-4 shadow-soft">
        <FieldLabel htmlFor="req-files" hint={t("optional")}>
          {t("files")}
        </FieldLabel>
        <label
          htmlFor="req-files"
          className="mt-3 flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-aubergine-mid bg-tint-aubergine p-4 text-center"
        >
          <UploadIcon className="h-7 w-7 text-aubergine-base" />
          <span className="text-sm font-semibold text-aubergine-base">
            {t("chooseFiles")}
          </span>
        </label>
        <input
          id="req-files"
          name="files"
          type="file"
          multiple
          className="sr-only"
          onChange={(e) =>
            setFiles(Array.from(e.target.files ?? []).map((f) => f.name))
          }
        />
        {files.length ? (
          <ul className="mt-3 flex flex-col gap-1">
            {files.map((f) => (
              <li key={f} dir="auto" className="text-sm text-ink-2">
                {f}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <p role="alert" className="mt-6 min-h-6 text-sm font-semibold text-error">
        {hasErrors ? t("errors") : ""}
      </p>

      <PrimaryButton type="submit" className="w-full md:w-auto">
        {t("submit")}
      </PrimaryButton>
    </form>
  );
}
