"use client";

import { useLocale, useTranslations } from "next-intl";
import { localize } from "@/i18n/localized";

import { useState } from "react";
import { COLLEGES, UNIVERSITIES } from "@/lib/data/catalog";
import {
  ErrorText,
  FieldLabel,
  GhostButton,
  SelectField,
  TextField,
} from "@/components/becan/kit";
import { SaveNotice, useSaveNotice } from "../_controls";
import { SettingsCard } from "../_shell";
import { LanguageSwitcher } from "@/components/becan/language-switcher";

/* S1 — الحساب.

   **الحفظ تلقائي** عند مغادرة الحقل، بإشعار خفيف — لا زرّ «حفظ» في
   الأسفل. الزرّ يجعل الطالب مسؤولًا عن تذكّره، ويعاقبه بضياع تعديله.

   **كلمة المرور وحدها تُستثنى**: حفظها بمجرّد مغادرة الحقل يعني
   تغييرها بحرف مطبوع سهوًا، وقفل الحساب على صاحبه. فلها خطوة صريحة.

   بيانات عرض حتى يصل حساب حقيقي. */

const START = {
  university: UNIVERSITIES[0].ar,
  major: COLLEGES[0].id as string,
};

export function AccountView() {
  const t = useTranslations("Settings.Account");
  const locale = useLocale();
  const { saved, ping } = useSaveNotice();

  const [name, setName] = useState(() => t("exampleName"));
  const [contact, setContact] = useState(() => t("exampleContact"));
  const [university, setUniversity] = useState(START.university);
  const [major, setMajor] = useState(START.major);

  const [changing, setChanging] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* الإشعار فوق البطاقات: يخصّ الصفحة كلها لا حقلًا بعينه */}
      <SaveNotice saved={saved} />

      <SettingsCard title={t("interfaceLanguage")}>
        <div className="mt-4">
          <LanguageSwitcher />
        </div>
      </SettingsCard>

      <SettingsCard title={t("data")}>
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="acc-name">{t("name")}</FieldLabel>
            <TextField
              id="acc-name"
              dir="auto"
              name="name"
              autoComplete="given-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={ping}
            />
          </div>

          <div>
            <FieldLabel
              htmlFor="acc-contact"
              hint={t("contactHint")}
            >
              {t("contact")}
            </FieldLabel>
            <TextField
              id="acc-contact"
              name="username"
              dir="ltr"
              autoComplete="username"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              onBlur={ping}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title={t("universityAndMajor")}>
        <p className="mt-2 max-w-measure text-sm leading-base text-ink-2">
          {t("universityEffect")}
        </p>

        <div className="mt-4 flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="acc-university">{t("university")}</FieldLabel>
            <SelectField
              id="acc-university"
              name="university"
              value={university}
              onChange={(e) => {
                setUniversity(e.target.value);
                ping();
              }}
            >
              {UNIVERSITIES.map((u) => (
                <option key={u.ar} value={u.ar}>
                  {localize(u, locale)}
                </option>
              ))}
            </SelectField>
          </div>

          <div>
            <FieldLabel htmlFor="acc-major">{t("major")}</FieldLabel>
            <SelectField
              id="acc-major"
              name="major"
              value={major}
              onChange={(e) => {
                setMajor(e.target.value);
                ping();
              }}
            >
              {COLLEGES.map((c) => (
                <option key={c.id} value={c.id}>
                  {localize(c.label, locale)}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title={t("password")}>
        {changing ? (
          <PasswordForm
            onDone={() => {
              setChanging(false);
              ping();
            }}
            onCancel={() => setChanging(false)}
          />
        ) : (
          <>
            <p className="mt-2 max-w-measure text-sm leading-base text-ink-2">
              {t("passwordEffect")}
            </p>
            <button
              type="button"
              onClick={() => setChanging(true)}
              className="mt-4 inline-flex min-h-11 items-center px-2 font-semibold text-ink underline underline-offset-4"
            >
              {t("changePassword")}
            </button>
          </>
        )}
      </SettingsCard>
    </div>
  );
}

function PasswordForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("Settings.Account");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!current) {
      setError(t("currentRequired"));
      document.getElementById("acc-pass-current")?.focus();
      return;
    }
    if (next.length < 8) {
      setError(t("newInvalid"));
      document.getElementById("acc-pass-next")?.focus();
      return;
    }
    onDone();
  };

  return (
    <form className="mt-4" onSubmit={submit} noValidate>
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel htmlFor="acc-pass-current">
            {t("currentPassword")}
          </FieldLabel>
          <TextField
            id="acc-pass-current"
            name="current-password"
            type="password"
            autoComplete="current-password"
            value={current}
            invalid={!!error && !current}
            onChange={(e) => {
              setCurrent(e.target.value);
              setError("");
            }}
          />
        </div>

        <div>
          <FieldLabel htmlFor="acc-pass-next" hint={t("passwordHint")}>
            {t("newPassword")}
          </FieldLabel>
          <TextField
            id="acc-pass-next"
            name="new-password"
            type="password"
            autoComplete="new-password"
            value={next}
            invalid={!!error && !!current}
            aria-describedby={error ? "acc-pass-err" : undefined}
            onChange={(e) => {
              setNext(e.target.value);
              setError("");
            }}
          />
        </div>
      </div>

      {error ? <ErrorText id="acc-pass-err">{error}</ErrorText> : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <GhostButton type="submit">{t("savePassword")}</GhostButton>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-11 items-center px-2 font-semibold text-ink"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
