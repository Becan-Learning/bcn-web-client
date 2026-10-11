"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Link, useRouter } from "@/i18n/navigation";
import {
  ErrorText,
  FieldLabel,
  PrimaryButton,
  TextField,
} from "@/components/becan/kit";
import { useAuthReturn } from "@/components/auth/use-auth-return";
import { AuthCard } from "@/components/auth/auth-card";
import { authClient, useAccount } from "@/lib/auth/client";
import { authErrorKey } from "@/lib/auth/errors";
import { cooldownSeconds } from "@/lib/auth/cooldown";

export function VerifyEmailForm({
  next,
  email: initialEmail,
  queryError,
  title,
}: {
  next: string;
  email: string;
  queryError: string;
  title: string;
}) {
  const t = useTranslations("VerifyEmail");
  const errors = useTranslations("Auth.Errors");
  const { destination, verifyCallbackURL, clearReturn } = useAuthReturn(next, false);
  const { account, isPending } = useAccount();
  const router = useRouter();
  const hasEmail = z.string().email().safeParse(initialEmail.trim()).success;
  const [email, setEmail] = useState(initialEmail);
  const [remaining, setRemaining] = useState(queryError || !hasEmail ? 0 : 60);
  const deadline = useRef(0);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!queryError && account?.emailVerified) {
      clearReturn();
      router.replace(destination);
    }
  }, [account, queryError, clearReturn, destination, router]);

  useEffect(() => {
    deadline.current = queryError || !hasEmail ? 0 : Date.now() + 60_000;
    const timer = window.setInterval(
      () => setRemaining(cooldownSeconds(deadline.current, Date.now())),
      1_000,
    );
    return () => window.clearInterval(timer);
  }, [queryError, initialEmail, hasEmail]);

  const resend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending || cooldownSeconds(deadline.current, Date.now()) > 0) return;
    if (!z.string().email().safeParse(email.trim()).success) {
      setError(errors("invalidEmail"));
      document.getElementById("verify-email-address")?.focus();
      return;
    }
    setError("");
    setSent(false);
    setPending(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: email.trim(),
        callbackURL: verifyCallbackURL,
      });
      if (error) {
        setError(errors(authErrorKey(error)));
        if (error.status !== 429) return;
      } else {
        clearReturn();
        setSent(true);
      }
      deadline.current = Date.now() + 60_000;
      setRemaining(60);
    } catch {
      setError(errors("generic"));
    } finally {
      setPending(false);
    }
  };

  if (!queryError && (account?.emailVerified || (!hasEmail && isPending))) return null;

  return (
    <AuthCard title={title}>
      <p className="text-ink-2">{t("body")}</p>
      {hasEmail ? (
        <p dir="ltr" className="mt-3 break-all font-semibold">
          {initialEmail}
        </p>
      ) : null}
      {queryError ? (
        <div role="alert" className="mt-4">
          <ErrorText id="verify-email-link-error">
            {errors(authErrorKey({ code: queryError }))}
          </ErrorText>
        </div>
      ) : null}
      <form onSubmit={resend} noValidate aria-busy={pending} className="mt-5">
        {queryError || !hasEmail ? (
          <div className="mb-4">
            <FieldLabel htmlFor="verify-email-address">{t("email")}</FieldLabel>
            <TextField
              id="verify-email-address"
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              value={email}
              required
              placeholder={t("emailPlaceholder")}
              disabled={pending}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              invalid={!!error}
              aria-describedby={error ? "verify-email-error" : undefined}
            />
          </div>
        ) : null}
        <div aria-live="polite">
          {error ? <ErrorText id="verify-email-error">{error}</ErrorText> : null}
          {sent ? (
            <p className="mb-4 text-sm leading-base text-ink-2">{t("sent")}</p>
          ) : null}
        </div>
        <PrimaryButton
          type="submit"
          disabled={pending || remaining > 0}
          className="w-full"
        >
          {t(pending ? "sending" : "resend")}
        </PrimaryButton>
        {remaining > 0 ? (
          <p className="mt-3 text-sm leading-base text-ink-2">
            {t("cooldown", { seconds: String(remaining) })}
          </p>
        ) : null}
      </form>
      <Link
        href={`/sign-in?${new URLSearchParams({ next: destination })}`}
        className="mt-4 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
      >
        {t("signIn")}
      </Link>
    </AuthCard>
  );
}
