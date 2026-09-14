"use client";

import { useState } from "react";
import Link from "next/link";
import { ErrorText, FieldLabel, TextField } from "@/components/becan/kit";

/* S4 — تأكيد حذف الحساب.

   **بتأكيد نصّي**: الطالب يكتب الجملة بيده، فلا يقع الحذف بضغطة
   عابرة. وهو الحارس الوحيد — لا نوافذ متتالية ولا عروض إبقاء.

   **الزرّ ليس أحمر**: `--error` للخطأ وحده في هذي الهوية، والحذف قرار
   الطالب لا خطؤه. الحارس هو الجملة المكتوبة لا لون الزرّ. */

const PHRASE = "احذف حسابي";

export function DeleteForm({ activeUntil }: { activeUntil: string | null }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const matches = value.trim() === PHRASE;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!matches) {
      setError(`اكتب «${PHRASE}» بالضبط عشان يتأكّد إنك قاصد`);
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
          استلمنا طلب الحذف
        </h2>
        <p className="mt-2 max-w-measure leading-base text-ink-2">
          حسابك أُقفل الحين، وبياناتك تُحذف خلال 30 يومًا. أرسلنا لك تأكيدًا على
          بريدك، وفيه رابط تلغي فيه الطلب خلال 7 أيام لو غيّرت رأيك.
        </p>

        <p className="mt-4">
          <Link
            href="/"
            className="font-semibold text-pressable underline underline-offset-4"
          >
            ارجع للصفحة الرئيسية
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
          عندك اشتراك مدفوع شغّال حتى{" "}
          <span className="font-semibold text-ink">{activeUntil}</span>. الحذف
          يوقفه من الحين، وما نرجّع قيمة المدة المتبقية —{" "}
          <Link
            href="/settings/subscription"
            className="font-semibold text-pressable underline underline-offset-4"
          >
            الإلغاء بدون حذف
          </Link>{" "}
          يخلّيك تستفيد منها لآخرها.
        </p>
      ) : null}

      <FieldLabel htmlFor="del-confirm" hint={`اكتبها بالضبط: ${PHRASE}`}>
        اكتب الجملة عشان نتأكّد
      </FieldLabel>
      <TextField
        id="del-confirm"
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
          احذف حسابي نهائيًا
        </button>

        <Link
          href="/settings/data"
          className="inline-flex min-h-11 items-center px-2 font-semibold text-ink"
        >
          تراجع
        </Link>
      </div>
    </form>
  );
}
