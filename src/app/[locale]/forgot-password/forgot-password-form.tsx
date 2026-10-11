"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { z } from "zod";
import { Link } from "@/i18n/navigation";
import {
  ErrorText,
  FieldLabel,
  PrimaryButton,
  TextField,
} from "@/components/becan/kit";
import { useAuthReturn } from "@/components/auth/use-auth-return";
import { authClient } from "@/lib/auth/client";
import { authErrorKey } from "@/lib/auth/errors";

export function ForgotPasswordForm({ next }: { next: string }) {
  const t = useTranslations("ForgotPassword");
  const errors = useTranslations("Auth.Errors");
  const locale = useLocale();
  const { destination } = useAuthReturn(next, false);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    if (!z.string().email().safeParse(email.trim()).success) {
      setError(errors("invalidEmail"));
      document.getElementById("forgot-password-email")?.focus();
      return;
    }
    setError("");
    setPending(true);
    try {
      const path = `/reset-password?${new URLSearchParams({ next: destination })}`;
      const { error } = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: locale === "en" ? `/en${path}` : path,
      });
      if (error) setError(errors(authErrorKey(error)));
      else setSent(true);
    } catch {
      setError(errors("generic"));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {sent ? (
        <p
          role="status"
          className="rounded-xl border border-line bg-tint-aubergine px-4 py-3"
        >
          {t("confirmation")}
        </p>
      ) : (
        <form onSubmit={submit} noValidate aria-busy={pending}>
          <p className="mb-5 text-ink-2">{t("body")}</p>
          <FieldLabel htmlFor="forgot-password-email">{t("email")}</FieldLabel>
          <TextField
            id="forgot-password-email"
            name="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            value={email}
            required
            disabled={pending}
            placeholder={t("emailPlaceholder")}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            invalid={!!error}
            aria-describedby={error ? "forgot-password-error" : undefined}
          />
          <div aria-live="polite">
            {error ? <ErrorText id="forgot-password-error">{error}</ErrorText> : null}
          </div>
          <PrimaryButton type="submit" disabled={pending} className="mt-5 w-full">
            {t(pending ? "sending" : "submit")}
          </PrimaryButton>
        </form>
      )}
      <Link
        href={`/sign-in?${new URLSearchParams({ next: destination })}`}
        className="mt-4 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
      >
        {t("signIn")}
      </Link>
    </>
  );
}
