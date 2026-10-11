"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { localize } from "@/i18n/localized";
import {
  ErrorText,
  FieldLabel,
  GhostButton,
  PrimaryButton,
  SelectField,
  TextField,
} from "@/components/becan/kit";
import { PasswordField } from "@/components/auth/password-field";
import {
  useAuthReturn,
  useSignedInRedirect,
} from "@/components/auth/use-auth-return";
import { authClient } from "@/lib/auth/client";
import type { Institution } from "@/lib/auth/catalog";
import { authErrorKey, type AuthErrorKey } from "@/lib/auth/errors";
import { toE164Saudi } from "@/lib/auth/phone";
import {
  validateJoinStepOne,
  validateJoinStepTwo,
} from "@/lib/auth/join-validation";

type Field =
  | "name"
  | "email"
  | "password"
  | "phoneNumber"
  | "institutionId"
  | "majorId";
type Issue = { field: Field | "form"; key: AuthErrorKey | "nameRequired" };

export function JoinForm({
  next,
  institutions,
}: {
  next: string;
  institutions: Institution[];
}) {
  const t = useTranslations("Join.Form");
  const errors = useTranslations("Auth.Errors");
  const locale = useLocale();
  const router = useRouter();
  const { destination, verifyCallbackURL, clearReturn } = useAuthReturn(next);
  useSignedInRedirect(destination, clearReturn);
  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    institutionId: "",
    majorId: "",
  });
  const [issue, setIssue] = useState<Issue | null>(null);
  const [pending, setPending] = useState(false);
  const [retrying, startRetry] = useTransition();
  const majors = institutions.find(
    (item) => item.id === values.institutionId,
  )?.majors ?? [];

  useEffect(() => {
    if (issue) document.getElementById(`join-${issue.field}`)?.focus();
  }, [issue, step]);

  const message = (field: Field | "form") => issue?.field === field
    ? issue.key === "nameRequired" ? t(issue.key) : errors(issue.key)
    : undefined;
  const change = (field: Field, value: string) => {
    setValues((current) => ({
      ...current,
      [field]: value,
      ...(field === "institutionId" ? { majorId: "" } : {}),
    }));
    setIssue(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    const firstIssue = validateJoinStepOne(values);
    if (firstIssue) {
      setStep(1);
      setIssue(firstIssue);
      return;
    }
    if (step === 1) {
      setIssue(null);
      setStep(2);
      requestAnimationFrame(
        () => document.getElementById("join-phoneNumber")?.focus(),
      );
      return;
    }
    const secondIssue = validateJoinStepTwo(values, institutions);
    if (secondIssue) {
      setIssue(secondIssue);
      return;
    }
    setIssue(null);
    setPending(true);
    try {
      const { error } = await authClient.signUp.email({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        phoneNumber: toE164Saudi(values.phoneNumber)!,
        institutionId: values.institutionId,
        majorId: values.majorId,
        callbackURL: verifyCallbackURL,
      });
      if (error) {
        const key = authErrorKey(error);
        const field: Field | "form" = key === "emailTaken" || key === "invalidEmail" ? "email"
          : key === "passwordTooShort" || key === "passwordTooLong" || key === "invalidPassword" ? "password"
          : key === "invalidPhoneNumber" || key === "phoneNumberTaken" ? "phoneNumber"
          : key === "invalidInstitution" ? "institutionId" : key === "invalidMajor" ? "majorId" : "form";
        setStep(field === "email" || field === "password" ? 1 : 2);
        setIssue({ field, key });
        return;
      }
      /* رابط البريد ومعامل next يحملان الوجهة؛ لا نترك نسخة قديمة لدخول لاحق. */
      clearReturn();
      router.push(
        `/verify-email?${new URLSearchParams({ email: values.email.trim(), next: destination })}`,
      );
    } catch {
      setIssue({ field: "form", key: "generic" });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-6 w-full">
      {/* الدخول بحساب Google غير مفعّل في الخادم.
      <PrimaryButton onClick={() => authClient.signIn.social({ provider: "google", callbackURL: verifyCallbackURL })} className="w-full">
        {t("google")}
      </PrimaryButton>
      <div className="my-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="text-sm font-semibold text-ink-2">{t("or")}</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      */}
      {/* الدخول برقم الجوال غير مفعّل؛ الرقم هنا من بيانات الحساب فقط.
      <GhostButton onClick={() => setStep(2)}>{t("phoneSignIn")}</GhostButton>
      */}

      <p
        className="mb-5 text-sm leading-base font-semibold text-ink-2"
        aria-live="polite"
      >
        {t(step === 1 ? "stepOne" : "stepTwo")}
      </p>
      <form onSubmit={submit} noValidate aria-busy={pending}>
        <fieldset disabled={pending} className="space-y-4">
          <div hidden={step !== 1} className="space-y-4">
            <div>
              <FieldLabel htmlFor="join-name">{t("name")}</FieldLabel>
              <TextField
                id="join-name"
                name="name"
                autoComplete="name"
                value={values.name}
                required
                onChange={(event) => change("name", event.target.value)}
                invalid={!!message("name")}
                aria-describedby={message("name") ? "join-name-error" : undefined}
              />
              {message("name") ? (
                <ErrorText id="join-name-error">{message("name")!}</ErrorText>
              ) : null}
            </div>
            <div>
              <FieldLabel htmlFor="join-email">{t("email")}</FieldLabel>
              <TextField
                id="join-email"
                name="email"
                type="email"
                dir="ltr"
                autoComplete="email"
                value={values.email}
                required
                placeholder={t("emailPlaceholder")}
                onChange={(event) => change("email", event.target.value)}
                invalid={!!message("email")}
                aria-describedby={message("email") ? "join-email-error" : undefined}
              />
              {message("email") ? (
                <ErrorText id="join-email-error">{message("email")!}</ErrorText>
              ) : null}
            </div>
            <PasswordField
              id="join-password"
              label={t("password")}
              value={values.password}
              onChange={(value) => change("password", value)}
              error={message("password")}
              hint={t("passwordHint")}
              showLabel={t("showPassword")}
              hideLabel={t("hidePassword")}
            />
          </div>
          <div hidden={step !== 2} className="space-y-4">
            <div>
              <FieldLabel htmlFor="join-phoneNumber">{t("phone")}</FieldLabel>
              <TextField
                id="join-phoneNumber"
                name="phoneNumber"
                type="tel"
                dir="ltr"
                autoComplete="tel-national"
                value={values.phoneNumber}
                required
                placeholder={t("phonePlaceholder")}
                onChange={(event) => change("phoneNumber", event.target.value)}
                invalid={!!message("phoneNumber")}
                aria-describedby={message("phoneNumber") ? "join-phoneNumber-error" : undefined}
              />
              {message("phoneNumber") ? (
                <ErrorText id="join-phoneNumber-error">
                  {message("phoneNumber")!}
                </ErrorText>
              ) : null}
            </div>
            {institutions.length === 0 ? (
              <div role="status">
                <p className="text-sm leading-base text-ink-2">{t("catalogUnavailable")}</p>
                <button
                  type="button"
                  disabled={retrying}
                  className="inline-flex min-h-11 min-w-11 items-center font-semibold underline underline-offset-4"
                  onClick={() => startRetry(() => router.refresh())}
                >
                  {t(retrying ? "retrying" : "retry")}
                </button>
              </div>
            ) : null}
            <div>
              <FieldLabel htmlFor="join-institutionId">{t("university")}</FieldLabel>
              <SelectField
                id="join-institutionId"
                name="institutionId"
                value={values.institutionId}
                disabled={!institutions.length}
                required
                onChange={(event) => change("institutionId", event.target.value)}
                invalid={!!message("institutionId")}
                aria-describedby={message("institutionId") ? "join-institutionId-error" : undefined}
              >
                <option value="">{t("chooseUniversity")}</option>
                {institutions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {localize(item.name, locale)}
                  </option>
                ))}
              </SelectField>
              {message("institutionId") ? (
                <ErrorText id="join-institutionId-error">
                  {message("institutionId")!}
                </ErrorText>
              ) : null}
            </div>
            <div>
              <FieldLabel htmlFor="join-majorId">{t("major")}</FieldLabel>
              <SelectField
                id="join-majorId"
                name="majorId"
                value={values.majorId}
                disabled={!values.institutionId || !majors.length}
                required
                onChange={(event) => change("majorId", event.target.value)}
                invalid={!!message("majorId")}
                aria-describedby={message("majorId") ? "join-majorId-error" : undefined}
              >
                <option value="">{t("chooseMajor")}</option>
                {majors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {localize(item.name, locale)}
                  </option>
                ))}
              </SelectField>
              {message("majorId") ? (
                <ErrorText id="join-majorId-error">{message("majorId")!}</ErrorText>
              ) : null}
            </div>
          </div>
          <div id="join-form" tabIndex={-1} aria-live="polite">
            {message("form") ? (
              <ErrorText id="join-form-error">{message("form")!}</ErrorText>
            ) : null}
          </div>
          <PrimaryButton
            type="submit"
            disabled={pending || (step === 2 && !institutions.length)}
            className="w-full"
          >
            {t(pending ? "submitting" : step === 1 ? "next" : "submit")}
          </PrimaryButton>
          {step === 2 ? (
            <GhostButton
              className="w-full"
              onClick={() => {
                setStep(1);
                setIssue(null);
                requestAnimationFrame(
                  () => document.getElementById("join-name")?.focus(),
                );
              }}
            >
              {t("back")}
            </GhostButton>
          ) : null}
        </fieldset>
      </form>
      <p className="mt-6 text-sm leading-base text-ink-2">
        {t.rich("agreement", {
          terms: (chunks) => (
            <Link
              href="/terms"
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-pressable underline underline-offset-4"
            >
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link
              href="/privacy"
              className="inline-flex min-h-11 items-center text-pressable underline underline-offset-4"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
      <Link
        href={`/sign-in?${new URLSearchParams({ next: destination })}`}
        className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
      >
        {t("signIn")}
      </Link>
    </div>
  );
}
