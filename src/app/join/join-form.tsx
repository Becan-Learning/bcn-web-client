"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ErrorText, FieldLabel, PrimaryButton, TextField } from "@/components/becan/kit";

/* بريف الشاشة 6: يعبر في أقل من 30 ثانية ويعود بالضبط إلى حيث كان.

   المتطلب السلوكي الإلزامي — «اختيار المقرر والفصل ينجو من التسجيل» —
   منفَّذ بطبقتين: معامل `next` في الرابط، ونسخة في sessionStorage.
   الثانية ضرورية لأن مصادقة Google تغادر الموقع كليًا ثم تعود، فتضيع
   أي حالة في الذاكرة، وقد يعود المزوّد إلى رابط بلا معاملاتنا.

   ممنوع هنا وفق البريف: الاسم · الجامعة · التخصص · تأكيد كلمة المرور
   · اختيار خطة. */

const NEXT_KEY = "becan:next";

export function JoinForm({ next }: { next: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  /* نحفظ الوجهة فور الوصول كي تنجو من رحلة المصادقة الخارجية */
  useEffect(() => {
    if (next) sessionStorage.setItem(NEXT_KEY, next);
  }, [next]);

  const destination = () => {
    if (next) return next;
    try {
      return sessionStorage.getItem(NEXT_KEY) || "/courses";
    } catch {
      return "/courses";
    }
  };

  const proceed = () => {
    const dest = destination();
    try {
      sessionStorage.removeItem(NEXT_KEY);
    } catch {
      /* الوضع الخاص يمنع التخزين — لا يعطّل شيئًا */
    }
    router.push(dest);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const v = value.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const isPhone = /^0\d{9}$/.test(v.replace(/[\s-]/g, ""));

    if (!v) {
      setError("اكتب بريدك أو رقم جوالك");
      document.getElementById("join-id")?.focus();
      return;
    }
    if (!isEmail && !isPhone) {
      setError("تأكد من البريد أو من أن الرقم 10 أرقام يبدأ بـ 05");
      document.getElementById("join-id")?.focus();
      return;
    }
    proceed();
  };

  return (
    /* عرضه من البطاقة الحاوية لا من max-w-measure: المتن يقيَّد بعرض
       القراءة، وهذا نموذج داخل بطاقة مقيَّدة أصلًا. */
    <div className="mt-6 w-full">
      {/* الأساسي — الكهرماني الوحيد في الشاشة */}
      <PrimaryButton onClick={proceed} className="w-full">
        متابعة بحساب Google
      </PrimaryButton>

      <div className="my-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="text-sm font-semibold text-ink-2">أو</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submit} noValidate>
        <FieldLabel htmlFor="join-id">البريد أو رقم الجوال</FieldLabel>
        <TextField
          id="join-id"
          name="identifier"
          dir="ltr"
          autoComplete="username"
          value={value}
          invalid={!!error}
          aria-describedby={error ? "join-err" : undefined}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder="name@example.com"
        />
        {error ? <ErrorText id="join-err">{error}</ErrorText> : null}

        <button
          type="submit"
          className="mt-4 inline-flex h-14 w-full items-center justify-center rounded-pill border border-aubergine-mid px-8 text-lg font-semibold text-aubergine-base"
        >
          متابعة
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-2">
        بالمتابعة أنت توافق على{" "}
        <Link
          href="/terms"
          className="text-pressable underline underline-offset-4"
        >
          الشروط
        </Link>{" "}
        و
        <Link
          href="/privacy"
          className="text-pressable underline underline-offset-4"
        >
          سياسة الخصوصية
        </Link>
      </p>
    </div>
  );
}
