"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useRef, useState, useTransition } from "react";
import { localize } from "@/i18n/localized";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import type { Account } from "@/lib/auth/types";
import type { Institution } from "@/lib/auth/catalog";
import { authErrorKey } from "@/lib/auth/errors";
import { toLocalSaudi } from "@/lib/auth/phone";
import { ErrorText, FieldLabel, SelectField, TextField } from "@/components/becan/kit";
import { LanguageSwitcher } from "@/components/becan/language-switcher";
import { SaveNotice, useSaveNotice } from "../_controls";
import { SettingsCard } from "../_shell";
import { planAccountChange, type AccountChange, type SavedAccount } from "./account-changes";
import { AddPasswordForm, EmailForm, PasswordForm } from "./security-forms";
import { runSettingsAuthMutation } from "../_auth-mutations";
import { retryAccountInstitutions } from "./retry-catalog";
import { useHasPassword } from "@/components/auth/use-has-password";

/* الحفظ التلقائي للبيانات العادية فقط؛ البريد وكلمة المرور يحتاجان قرارًا صريحًا. */
export function AccountView({ account, institutions }: { account: Account; institutions: Institution[] }) {
  const t = useTranslations("Settings.Account");
  const authErrors = useTranslations("Auth.Errors");
  const locale = useLocale();
  const router = useRouter();
  const { saved, ping } = useSaveNotice();
  const hasPassword = useHasPassword();
  const lastSaved = useRef<SavedAccount>({
    name: account.name, phoneNumber: account.phoneNumber,
    institutionId: account.institutionId, majorId: account.majorId,
  });
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [retrying, startRetry] = useTransition();
  const [retryError, setRetryError] = useState("");
  const [name, setName] = useState(account.name);
  const [phone, setPhone] = useState(() => toLocalSaudi(account.phoneNumber));
  const [institutionId, setInstitutionId] = useState(account.institutionId);
  const [majorId, setMajorId] = useState(account.majorId);
  const [errors, setErrors] = useState<Partial<Record<keyof SavedAccount, string>>>({});
  const [changing, setChanging] = useState<"email" | "password" | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const returnFocus = useRef<"email" | "password" | null>(null);
  const focusEmailTrigger = useCallback((node: HTMLButtonElement | null) => {
    if (node && returnFocus.current === "email") {
      node.focus();
      returnFocus.current = null;
    }
  }, []);
  const focusPasswordTrigger = useCallback((node: HTMLButtonElement | null) => {
    if (node && returnFocus.current === "password") {
      node.focus();
      returnFocus.current = null;
    }
  }, []);
  const focusEmailNotice = useCallback((node: HTMLParagraphElement | null) => node?.focus(), []);
  const majors = institutions.find((i) => i.id === institutionId)?.majors ?? [];

  const setSecurityPending = (value: boolean) => {
    busy.current = value;
    setPending(value);
  };

  const restore = (change: AccountChange) => {
    if (change.field === "name") setName(lastSaved.current.name);
    else if (change.field === "phoneNumber") setPhone(toLocalSaudi(lastSaved.current.phoneNumber));
    else {
      setInstitutionId(lastSaved.current.institutionId);
      setMajorId(lastSaved.current.majorId);
    }
  };

  const save = async (change: AccountChange) => {
    if (busy.current) return;
    const plan = planAccountChange(lastSaved.current, change, institutions);
    if (plan.kind === "incomplete") return;
    if (plan.kind === "invalid") {
      setErrors((prev) => ({ ...prev, [plan.field]: plan.error === "nameRequired" ? t(plan.error) : authErrors(plan.error) }));
      restore(change);
      return;
    }
    if (plan.kind === "unchanged") {
      restore(change);
      return;
    }

    busy.current = true;
    setPending(true);
    const errorField = change.field === "study" ? "majorId" : change.field;
    const fail = (error?: { code?: string; status?: number }) => {
      const key = authErrorKey(error);
      const field = key === "invalidInstitution" ? "institutionId" : errorField;
      setErrors((prev) => ({ ...prev, [field]: authErrors(key) }));
      restore(change);
    };
    try {
      const result = await runSettingsAuthMutation(() => authClient.updateUser(plan.values));
      if (result.error) {
        fail(result.error);
        return;
      }
      lastSaved.current = { ...lastSaved.current, ...plan.values };
      restore(change);
      ping();
      router.refresh();
    } catch {
      fail();
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <SaveNotice saved={saved} />

      <SettingsCard title={t("interfaceLanguage")}>
        <div className="mt-4"><LanguageSwitcher /></div>
      </SettingsCard>

      <SettingsCard title={t("data")}>
        <fieldset disabled={pending} aria-busy={pending} className="mt-4 flex min-w-0 flex-col gap-4">
          <div>
            <FieldLabel htmlFor="acc-name">{t("name")}</FieldLabel>
            <TextField id="acc-name" name="name" autoComplete="name" value={name}
              invalid={!!errors.name} aria-describedby={errors.name ? "acc-name-err" : undefined}
              onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: undefined })); }}
              onBlur={() => void save({ field: "name", value: name })} />
            {errors.name ? <div role="alert"><ErrorText id="acc-name-err">{errors.name}</ErrorText></div> : null}
          </div>
          <div>
            <FieldLabel htmlFor="acc-phone">{t("phone")}</FieldLabel>
            <p id="acc-phone-hint" className="mt-1 text-xs leading-base text-ink-2">
              {t.rich("phoneHint", { number: (chunks) => <span dir="ltr">{chunks}</span> })}
            </p>
            <TextField id="acc-phone" name="tel" type="tel" dir="ltr" autoComplete="tel-national"
              value={phone} invalid={!!errors.phoneNumber}
              aria-describedby={`acc-phone-hint${errors.phoneNumber ? " acc-phone-err" : ""}`}
              onChange={(e) => { setPhone(e.target.value); setErrors((prev) => ({ ...prev, phoneNumber: undefined })); }}
              onBlur={() => void save({ field: "phoneNumber", value: phone })} />
            {errors.phoneNumber ? <div role="alert"><ErrorText id="acc-phone-err">{errors.phoneNumber}</ErrorText></div> : null}
          </div>
        </fieldset>

        <div className="mt-4">
          <FieldLabel htmlFor="acc-email">{t("email")}</FieldLabel>
          <TextField id="acc-email" dir="ltr" type="email" value={account.email} readOnly />
          {emailSent ? <p ref={focusEmailNotice} tabIndex={-1} role="status" className="mt-2 text-sm leading-base text-ink-2">{t("emailSent")}</p> : null}
          {changing === "email" ? (
            <EmailForm disabled={pending} onPendingChange={setSecurityPending}
              onDone={() => { setChanging(null); setEmailSent(true); }}
              onCancel={() => { returnFocus.current = "email"; setChanging(null); }} />
          ) : (
            <button ref={focusEmailTrigger} type="button" disabled={pending} onClick={() => { setChanging("email"); setEmailSent(false); }}
              className="mt-2 inline-flex min-h-11 items-center px-2 font-semibold text-ink underline underline-offset-4">
              {t("changeEmail")}
            </button>
          )}
        </div>
      </SettingsCard>

      <SettingsCard title={t("universityAndMajor")}>
        <p className="mt-2 max-w-measure text-sm leading-base text-ink-2">{t("universityEffect")}</p>
        {institutions.length === 0 ? (
          <div className="mt-4">
            <p role="status" className="text-sm leading-base text-ink-2">{t("catalogError")}</p>
            <button type="button" disabled={retrying} aria-busy={retrying}
              onClick={() => startRetry(async () => {
                setRetryError("");
                try {
                  await retryAccountInstitutions();
                  router.refresh();
                } catch {
                  setRetryError(authErrors("generic"));
                }
              })}
              className="mt-2 inline-flex min-h-11 items-center rounded-pill border border-line px-4 font-semibold text-ink">
              {t("retry")}
            </button>
            {retryError ? <div role="alert"><ErrorText id="acc-catalog-err">{retryError}</ErrorText></div> : null}
          </div>
        ) : (
          <fieldset disabled={pending} aria-busy={pending} className="mt-4 flex min-w-0 flex-col gap-4">
            <div>
              <FieldLabel htmlFor="acc-university">{t("university")}</FieldLabel>
              <SelectField id="acc-university" name="institutionId" value={institutionId}
                invalid={!!errors.institutionId} aria-describedby={errors.institutionId ? "acc-university-err" : undefined}
                onChange={(e) => {
                  setInstitutionId(e.target.value);
                  setMajorId("");
                  setErrors((prev) => ({ ...prev, institutionId: undefined, majorId: undefined }));
                }}>
                <option value="" disabled>{t("chooseUniversity")}</option>
                {institutions.map((i) => <option key={i.id} value={i.id}>{localize(i.name, locale)}</option>)}
              </SelectField>
              {errors.institutionId ? <div role="alert"><ErrorText id="acc-university-err">{errors.institutionId}</ErrorText></div> : null}
            </div>
            <div>
              <FieldLabel htmlFor="acc-major">{t("major")}</FieldLabel>
              <SelectField id="acc-major" name="majorId" value={majorId} disabled={!institutionId || majors.length === 0}
                invalid={!!errors.majorId} aria-describedby={`acc-major-hint${errors.majorId ? " acc-major-err" : ""}`}
                onChange={(e) => {
                  setMajorId(e.target.value);
                  setErrors((prev) => ({ ...prev, institutionId: undefined, majorId: undefined }));
                  void save({ field: "study", institutionId, majorId: e.target.value });
                }}>
                <option value="" disabled>{t("chooseMajor")}</option>
                {majors.map((m) => <option key={m.id} value={m.id}>{localize(m.name, locale)}</option>)}
              </SelectField>
              <p id="acc-major-hint" className="mt-2 text-xs leading-base text-ink-2">{t("majorSaveHint")}</p>
              {errors.majorId ? <div role="alert"><ErrorText id="acc-major-err">{errors.majorId}</ErrorText></div> : null}
            </div>
          </fieldset>
        )}
      </SettingsCard>

      <SettingsCard title={t("password")}>
        {hasPassword === null ? null : !hasPassword ? (
          <AddPasswordForm email={account.email} disabled={pending} onPendingChange={setSecurityPending} />
        ) : changing === "password" ? (
          <PasswordForm disabled={pending} onPendingChange={setSecurityPending}
            onDone={() => { returnFocus.current = "password"; setChanging(null); ping(); router.refresh(); }}
            onCancel={() => { returnFocus.current = "password"; setChanging(null); }} />
        ) : (
          <>
            <p className="mt-2 max-w-measure text-sm leading-base text-ink-2">{t("passwordEffect")}</p>
            <button ref={focusPasswordTrigger} type="button" disabled={pending} onClick={() => setChanging("password")}
              className="mt-4 inline-flex min-h-11 items-center px-2 font-semibold text-ink underline underline-offset-4">
              {t("changePassword")}
            </button>
          </>
        )}
      </SettingsCard>
    </div>
  );
}
