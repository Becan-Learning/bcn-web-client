"use client";

import { useCallback, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/client";
import { authErrorKey } from "@/lib/auth/errors";
import { ErrorText, FieldLabel, GhostButton, TextField } from "@/components/becan/kit";
import { runSettingsAuthMutation } from "../_auth-mutations";

type FormActions = {
  onDone: () => void;
  onCancel: () => void;
  onPendingChange: (pending: boolean) => void;
  disabled: boolean;
};

function useSecurityRequest(onPendingChange: FormActions["onPendingChange"]) {
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  const run = async (request: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    onPendingChange(true);
    try {
      await request();
    } finally {
      busy.current = false;
      setPending(false);
      onPendingChange(false);
    }
  };

  return { pending, run };
}

export function EmailForm({ onDone, onCancel, onPendingChange, disabled }: FormActions) {
  const t = useTranslations("Settings.Account");
  const errors = useTranslations("Auth.Errors");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const { pending, run } = useSecurityRequest(onPendingChange);
  const focusEmail = useCallback((node: HTMLFieldSetElement | null) => node?.querySelector("input")?.focus(), []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || disabled) return;
    const input = event.currentTarget.elements.namedItem("newEmail") as HTMLInputElement;
    if (!input.checkValidity()) {
      setError(errors("invalidEmail"));
      input.focus();
      return;
    }
    setError("");
    try {
      await run(async () => {
        const result = await runSettingsAuthMutation(() => authClient.changeEmail({
          newEmail: email.trim(), callbackURL: locale === "en" ? "/en/settings/account" : "/settings/account",
        }));
        if (result.error) setError(errors(authErrorKey(result.error)));
        else onDone();
      });
    } catch {
      setError(errors("generic"));
    }
  };

  return (
    <form className="mt-4" onSubmit={submit} noValidate>
      <fieldset ref={focusEmail} disabled={pending || disabled} aria-busy={pending} className="min-w-0">
        <FieldLabel htmlFor="acc-email-new">{t("newEmail")}</FieldLabel>
        <TextField id="acc-email-new" name="newEmail" type="email" dir="ltr" autoComplete="email"
          required value={email} invalid={!!error} aria-describedby={error ? "acc-email-err" : undefined}
          onChange={(e) => { setEmail(e.target.value); setError(""); }} />
        {error ? <div role="alert"><ErrorText id="acc-email-err">{error}</ErrorText></div> : null}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <GhostButton type="submit">{t(pending ? "sendingEmail" : "sendEmailLink")}</GhostButton>
          <button type="button" onClick={onCancel} className="inline-flex min-h-11 items-center px-2 font-semibold text-ink">{t("cancel")}</button>
        </div>
      </fieldset>
    </form>
  );
}

export function PasswordForm({ onDone, onCancel, onPendingChange, disabled }: FormActions) {
  const t = useTranslations("Settings.Account");
  const errors = useTranslations("Auth.Errors");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<{ field: "current" | "next"; text: string } | null>(null);
  const { pending, run } = useSecurityRequest(onPendingChange);
  const focusCurrent = useCallback((node: HTMLFieldSetElement | null) => node?.querySelector("input")?.focus(), []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending || disabled) return;
    if (!current) {
      setError({ field: "current", text: t("currentRequired") });
      document.getElementById("acc-pass-current")?.focus();
      return;
    }
    if (next.length < 8 || next.length > 128) {
      setError({ field: "next", text: errors(next.length < 8 ? "passwordTooShort" : "passwordTooLong") });
      document.getElementById("acc-pass-next")?.focus();
      return;
    }
    setError(null);
    try {
      await run(async () => {
        const result = await runSettingsAuthMutation(() => authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true }));
        if (result.error) {
          const key = authErrorKey(result.error);
          setError({ field: key === "passwordTooShort" || key === "passwordTooLong" ? "next" : "current", text: errors(key) });
        } else onDone();
      });
    } catch {
      setError({ field: "current", text: errors("generic") });
    }
  };

  return (
    <form className="mt-4" onSubmit={submit} noValidate>
      <fieldset ref={focusCurrent} disabled={pending || disabled} aria-busy={pending} className="min-w-0">
        <div className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="acc-pass-current">{t("currentPassword")}</FieldLabel>
            <TextField id="acc-pass-current" name="current-password" type="password" dir="ltr" autoComplete="current-password"
              value={current} invalid={error?.field === "current"} aria-describedby={error?.field === "current" ? "acc-pass-current-err" : undefined}
              onChange={(e) => { setCurrent(e.target.value); setError(null); }} />
            {error?.field === "current" ? <div role="alert"><ErrorText id="acc-pass-current-err">{error.text}</ErrorText></div> : null}
          </div>
          <div>
            <FieldLabel htmlFor="acc-pass-next" hint={t("passwordHint")}>{t("newPassword")}</FieldLabel>
            <TextField id="acc-pass-next" name="new-password" type="password" dir="ltr" autoComplete="new-password"
              value={next} invalid={error?.field === "next"} aria-describedby={error?.field === "next" ? "acc-pass-next-err" : undefined}
              onChange={(e) => { setNext(e.target.value); setError(null); }} />
            {error?.field === "next" ? <div role="alert"><ErrorText id="acc-pass-next-err">{error.text}</ErrorText></div> : null}
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <GhostButton type="submit">{t(pending ? "savingPassword" : "savePassword")}</GhostButton>
          <button type="button" onClick={onCancel} className="inline-flex min-h-11 items-center px-2 font-semibold text-ink">{t("cancel")}</button>
        </div>
      </fieldset>
    </form>
  );
}
