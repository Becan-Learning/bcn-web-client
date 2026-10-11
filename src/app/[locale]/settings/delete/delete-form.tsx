"use client";

import { useTranslations } from "next-intl";

import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import { authErrorKey } from "@/lib/auth/errors";
import { ErrorText, FieldLabel, TextField } from "@/components/becan/kit";

/* S4 — تأكيد حذف الحساب.

   **بتأكيد نصّي**: الطالب يكتب الجملة بيده، فلا يقع الحذف بضغطة
   عابرة. ومع كلمة المرور لا نحتاج نوافذ متتالية ولا عروض إبقاء.

   **الزرّ ليس أحمر**: `--error` للخطأ وحده في هذي الهوية، والحذف قرار
   الطالب لا خطؤه. الحارس هو الجملة المكتوبة لا لون الزرّ. */

export function DeleteForm({ activeUntil }: { activeUntil: string | null }) {
  const t = useTranslations("Settings.Delete");
  const authErrors = useTranslations("Auth.Errors");
  const router = useRouter();
  const phrase = t("phrase");
  const [value, setValue] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ field: "phrase" | "password"; text: string } | null>(null);
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
    if (!password) {
      setError({ field: "password", text: t("passwordRequired") });
      document.getElementById("del-password")?.focus();
      return;
    }
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await authClient.deleteUser({ password });
      if (result.error) {
        setError({ field: "password", text: authErrors(authErrorKey(result.error)) });
      } else {
        setPassword("");
        setDone(true);
      }
    } catch {
      setError({ field: "password", text: authErrors("generic") });
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

      <fieldset disabled={pending} aria-busy={pending} className="min-w-0">
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

      <div className="mt-4">
        <FieldLabel htmlFor="del-password">{t("currentPassword")}</FieldLabel>
        <TextField id="del-password" name="password" type="password" dir="ltr" autoComplete="current-password"
          value={password} invalid={error?.field === "password"}
          aria-describedby={error?.field === "password" ? "del-password-err" : undefined}
          onChange={(e) => { setPassword(e.target.value); setError(null); }} />
        {error?.field === "password" ? <div role="alert"><ErrorText id="del-password-err">{error.text}</ErrorText></div> : null}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          className="inline-flex h-14 items-center justify-center rounded-pill border border-ink px-8 text-lg font-semibold text-ink"
        >
          {t(pending ? "deleting" : "delete")}
        </button>

        <Link
          href="/settings/data"
          className="inline-flex min-h-11 items-center px-2 font-semibold text-ink"
        >
          {t("cancel")}
        </Link>
      </div>
      </fieldset>
    </form>
  );
}
