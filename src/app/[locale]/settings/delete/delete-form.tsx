"use client";

import { useTranslations } from "next-intl";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ErrorText, FieldLabel, TextField } from "@/components/becan/kit";

/* S4 — تأكيد حذف الحساب.

   **بتأكيد نصّي**: الطالب يكتب الجملة بيده، فلا يقع الحذف بضغطة
   عابرة. وهو الحارس الوحيد — لا نوافذ متتالية ولا عروض إبقاء.

   **الزرّ ليس أحمر**: `--error` للخطأ وحده في هذي الهوية، والحذف قرار
   الطالب لا خطؤه. الحارس هو الجملة المكتوبة لا لون الزرّ. */

export function DeleteForm({ activeUntil }: { activeUntil: string | null }) {
  const t = useTranslations("Settings.Delete");
  const phrase = t("phrase");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const matches = value.trim() === phrase;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!matches) {
      setError(t("phraseInvalid", { phrase }));
      document.getElementById("del-confirm")?.focus();
      return;
    }
    setDone(true);
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

      <FieldLabel htmlFor="del-confirm" hint={t("phraseHint", { phrase })}>
        {t("confirmLabel")}
      </FieldLabel>
      <TextField
        id="del-confirm"
        dir="auto"
        name="confirm"
        autoComplete="off"
        value={value}
        invalid={!!error}
        aria-describedby={error ? "del-err" : undefined}
        onChange={(e) => {
          setValue(e.target.value);
          setError("");
        }}
      />
      {error ? <ErrorText id="del-err">{error}</ErrorText> : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          className="inline-flex h-14 items-center justify-center rounded-pill border border-ink px-8 text-lg font-semibold text-ink"
        >
          {t("delete")}
        </button>

        <Link
          href="/settings/data"
          className="inline-flex min-h-11 items-center px-2 font-semibold text-ink"
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
