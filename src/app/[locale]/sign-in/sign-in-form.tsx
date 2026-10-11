"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Link, useRouter } from "@/i18n/navigation";
import { ErrorText, FieldLabel, PrimaryButton, TextField } from "@/components/becan/kit";
import { PasswordField } from "@/components/auth/password-field";
import { useAuthReturn, useSignedInRedirect } from "@/components/auth/use-auth-return";
import { authClient } from "@/lib/auth/client";
import { authErrorKey } from "@/lib/auth/errors";

export function SignInForm({ next, resetSuccess }: { next: string; resetSuccess: boolean }) {
  const t = useTranslations("SignIn");
  const errors = useTranslations("Auth.Errors");
  const router = useRouter();
  const { destination, callbackURL, clearReturn } = useAuthReturn(next);
  useSignedInRedirect(destination, clearReturn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [issue, setIssue] = useState<{ field: "email" | "password" | "form"; message: string } | null>(null);
  useEffect(() => {
    if (issue) document.getElementById(`sign-in-${issue.field}`)?.focus();
  }, [issue]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    if (!z.string().email().safeParse(email.trim()).success) {
      setIssue({ field: "email", message: errors("invalidEmail") }); return;
    }
    if (!password) { setIssue({ field: "password", message: t("passwordRequired") }); return; }
    setIssue(null);
    setPending(true);
    try {
      const { error } = await authClient.signIn.email({ email: email.trim(), password, callbackURL }, {
        /* موجّه اللغة يستبدل الصفحة؛ نمنع انتقال المكتبة الكامل الذي يسبقه. */
        onSuccess(context) { context.data.redirect = false; },
      });
      if (error?.code === "EMAIL_NOT_VERIFIED") {
        clearReturn();
        router.replace(`/verify-email?${new URLSearchParams({ email: email.trim(), next: destination })}`);
      } else if (error) {
        const key = authErrorKey(error);
        setIssue({ field: key === "invalidEmail" ? "email" : key === "invalidCredentials" || key === "invalidPassword" ? "password" : "form", message: errors(key) });
      } else {
        clearReturn();
        router.replace(destination);
      }
    } catch {
      setIssue({ field: "form", message: errors("generic") });
    } finally {
      setPending(false);
    }
  };

  const query = new URLSearchParams({ next: destination });
  return (
    <>
      {resetSuccess ? <p role="status" className="mb-5 rounded-xl border border-line bg-tint-aubergine px-4 py-3">{t("resetSuccess")}</p> : null}
      <form onSubmit={submit} noValidate aria-busy={pending}>
        <fieldset disabled={pending} className="space-y-4">
          <div>
            <FieldLabel htmlFor="sign-in-email">{t("email")}</FieldLabel>
            <TextField id="sign-in-email" name="email" type="email" dir="ltr" autoComplete="username" value={email} required
              placeholder={t("emailPlaceholder")} onChange={(event) => { setEmail(event.target.value); setIssue(null); }}
              invalid={issue?.field === "email"} aria-describedby={issue?.field === "email" ? "sign-in-email-error" : undefined} />
            {issue?.field === "email" ? <ErrorText id="sign-in-email-error">{issue.message}</ErrorText> : null}
          </div>
          <PasswordField id="sign-in-password" label={t("password")} value={password} autoComplete="current-password"
            onChange={(value) => { setPassword(value); setIssue(null); }} error={issue?.field === "password" ? issue.message : undefined}
            showLabel={t("showPassword")} hideLabel={t("hidePassword")} />
          <div id="sign-in-form" tabIndex={-1} aria-live="polite">
            {issue?.field === "form" ? <ErrorText id="sign-in-form-error">{issue.message}</ErrorText> : null}
          </div>
          <PrimaryButton type="submit" disabled={pending} className="w-full">{t(pending ? "submitting" : "submit")}</PrimaryButton>
        </fieldset>
      </form>
      <div className="mt-4 flex flex-col items-start">
        <Link href={`/forgot-password?${query}`} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">{t("forgotPassword")}</Link>
        <Link href={`/join?${query}`} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">{t("createAccount")}</Link>
      </div>
    </>
  );
}
