"use client";

import { useLocale, useTranslations } from "next-intl";

import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import { authErrorKey, oauthErrorKey } from "@/lib/auth/errors";
import { googleReauthRequest } from "@/lib/auth/google";
import { ErrorText, FieldLabel, GhostButton, TextField } from "@/components/becan/kit";
import { useHasPassword } from "@/components/auth/use-has-password";
import { useGoogleRedirect } from "@/components/auth/use-google-redirect";
import { runSettingsAuthMutation } from "../_auth-mutations";
import { deleteFailure, planDelete } from "./delete-flow";

/* S4 — تأكيد حذف الحساب.

   **بتأكيد نصّي**: الطالب يكتب الجملة بيده، فلا يقع الحذف بضغطة
   عابرة. ومع كلمة المرور لا نحتاج نوافذ متتالية ولا عروض إبقاء.

   **الزرّ ليس أحمر**: `--error` للخطأ وحده في هذي الهوية، والحذف قرار
   الطالب لا خطؤه. الحارس هو الجملة المكتوبة لا لون الزرّ.

   **حساب بلا كلمة مرور** (دخل بـGoogle): لا نسأل عنها، ويطلب الخادم جلسة طازجة؛
   إن كانت الجلسة قديمة دعوناه إلى الدخول بـGoogle من جديد ثم يعود إلى هذه الصفحة.

   **تحذير الاشتراك المدفوع** يظهر حين تكون باقة الطالب الحالية بسعر أكبر من صفر
   وحدها (`activeUntil` تاريخ نهاية دورته)؛ اليوم لا أحد على باقة مدفوعة فلا يظهر. */

export function DeleteForm({ googleError = "", activeUntil = null }: { googleError?: string; activeUntil?: string | null }) {
  const t = useTranslations("Settings.Delete");
  const authErrors = useTranslations("Auth.Errors");
  const locale = useLocale();
  const router = useRouter();
  const hasPassword = useHasPassword();
  const { redirecting, start: startGoogle } = useGoogleRedirect();
  const [needsFresh, setNeedsFresh] = useState(false);
  const phrase = t("phrase");
  const [value, setValue] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ field: "phrase" | "password" | "form"; text: string } | null>(() => {
    const key = oauthErrorKey(googleError);
    return key ? { field: "form", text: authErrors(key) } : null;
  });
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const [done, setDone] = useState(false);

  const matches = value.trim() === phrase;

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 2500);
    return () => clearTimeout(timer);
  }, [done, router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current) return;
    if (!matches) {
      setError({ field: "phrase", text: t("phraseInvalid", { phrase }) });
      document.getElementById("del-confirm")?.focus();
      return;
    }
    const plan = planDelete(hasPassword, password);
    if (plan.kind === "wait") return;
    if (plan.kind === "needPassword") {
      setError({ field: "password", text: t("passwordRequired") });
      document.getElementById("del-password")?.focus();
      return;
    }
    busy.current = true;
    setPending(true);
    setError(null);
    setNeedsFresh(false);
    try {
      const result = await runSettingsAuthMutation(() => plan.password === null
        ? authClient.deleteUser()
        : authClient.deleteUser({ password: plan.password }));
      if (result.error) {
        const key = authErrorKey(result.error);
        const failure = deleteFailure(!!hasPassword, key);
        if (failure.kind === "reauthenticate") setNeedsFresh(true);
        else setError({ field: failure.field, text: authErrors(key) });
      } else {
        setPassword("");
        setDone(true);
      }
    } catch {
      setError({ field: hasPassword ? "password" : "form", text: authErrors("generic") });
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  if (done) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl bg-tint-amber p-5 md:p-6"
      >
        <h2 className="text-lg font-bold text-ink md:text-xl">
          {t("receivedTitle")}
        </h2>
        <p className="mt-2 max-w-measure leading-base text-ink-2">
          {t("receivedBody")}
        </p>

        <p className="mt-4">
          <Link
            href="/"
            className="font-semibold text-pressable underline underline-offset-4"
          >
            {t("home")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form
      className="rounded-xl border border-line bg-surface p-5 md:p-6"
      onSubmit={submit}
      noValidate
    >
      {activeUntil ? (
        <p className="mb-5 max-w-measure leading-base text-ink-2">
          {t.rich("activeSubscription", { date: activeUntil, strong: (chunks) => <span className="font-semibold text-ink">{chunks}</span>, cancel: (chunks) => <Link href="/settings/subscription" className="font-semibold text-pressable underline underline-offset-4">{chunks}</Link> })}
        </p>
      ) : null}

      <fieldset disabled={pending || redirecting} aria-busy={pending} className="min-w-0">
      <FieldLabel htmlFor="del-confirm" hint={t("phraseHint", { phrase })}>
        {t("confirmLabel")}
      </FieldLabel>
      <TextField
        id="del-confirm"
        dir="auto"
        name="confirm"
        autoComplete="off"
        value={value}
        invalid={error?.field === "phrase"}
        aria-describedby={error?.field === "phrase" ? "del-err" : undefined}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
      />
      {error?.field === "phrase" ? <div role="alert"><ErrorText id="del-err">{error.text}</ErrorText></div> : null}

      {hasPassword ? (
      <div className="mt-4">
        <FieldLabel htmlFor="del-password">{t("currentPassword")}</FieldLabel>
        <TextField id="del-password" name="password" type="password" dir="ltr" autoComplete="current-password"
          value={password} invalid={error?.field === "password"}
          aria-describedby={error?.field === "password" ? "del-password-err" : undefined}
          onChange={(e) => { setPassword(e.target.value); setError(null); }} />
        {error?.field === "password" ? <div role="alert"><ErrorText id="del-password-err">{error.text}</ErrorText></div> : null}
      </div>
      ) : null}

      {error?.field === "form" ? <div role="alert"><ErrorText id="del-form-err">{error.text}</ErrorText></div> : null}
      {needsFresh ? (
        <div role="alert" className="mt-4">
          <ErrorText id="del-fresh-err">{authErrors("sessionNotFresh")}</ErrorText>
          <GhostButton
            className="mt-3 w-full gap-3 sm:w-auto"
            disabled={redirecting}
            onClick={() => void startGoogle(googleReauthRequest(locale)).then((failure) => {
              if (failure) setError({ field: "form", text: authErrors(authErrorKey(failure)) });
            })}
          >
            {t(redirecting ? "reauthRedirecting" : "reauth")}
          </GhostButton>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={hasPassword === null}
          className="inline-flex h-14 items-center justify-center rounded-pill border border-ink px-8 text-lg font-semibold text-ink disabled:opacity-60"
        >
          {t(pending ? "deleting" : "delete")}
        </button>

        <Link
          href="/settings/data"
          aria-disabled={pending || undefined}
          tabIndex={pending ? -1 : undefined}
          onClick={(event) => { if (pending) event.preventDefault(); }}
          className="inline-flex min-h-11 items-center px-2 font-semibold text-ink aria-disabled:opacity-60"
        >
          {t("cancel")}
        </Link>
      </div>
      </fieldset>
    </form>
  );
}
