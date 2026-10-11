"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { ErrorText, PrimaryButton } from "@/components/becan/kit";
import { PasswordField } from "@/components/auth/password-field";
import { useAuthReturn } from "@/components/auth/use-auth-return";
import { authClient } from "@/lib/auth/client";
import { authErrorKey, type AuthErrorKey } from "@/lib/auth/errors";

export function ResetPasswordForm({ next, token, queryError }: { next: string; token: string; queryError: string }) {
  const t = useTranslations("ResetPassword");
  const errors = useTranslations("Auth.Errors");
  const router = useRouter();
  const { destination } = useAuthReturn(next, false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const invalidLink = !token || !!queryError || error === "invalidToken";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending || invalidLink) return;
    if (password.length < 8 || password.length > 128) {
      setError(password.length < 8 ? "passwordTooShort" : "passwordTooLong");
      document.getElementById("reset-password-new")?.focus(); return;
    }
    setError(null); setPending(true);
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token });
      if (error) setError(authErrorKey(error));
      else router.replace(`/sign-in?${new URLSearchParams({ next: destination, reset: "success" })}`);
    } catch {
      setError("generic");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {invalidLink ? <div role="alert"><ErrorText id="reset-password-link-error">{errors("invalidToken")}</ErrorText></div> : (
        <form onSubmit={submit} noValidate aria-busy={pending}>
          <fieldset disabled={pending}>
            <PasswordField id="reset-password-new" label={t("password")} value={password} hint={t("passwordHint")}
              onChange={(value) => { setPassword(value); setError(null); }} error={error ? errors(error) : undefined}
              showLabel={t("showPassword")} hideLabel={t("hidePassword")} />
            <PrimaryButton type="submit" disabled={pending} className="mt-5 w-full">{t(pending ? "submitting" : "submit")}</PrimaryButton>
          </fieldset>
        </form>
      )}
      <Link href={`/forgot-password?${new URLSearchParams({ next: destination })}`} className="mt-4 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">{t("requestLink")}</Link>
    </>
  );
}
