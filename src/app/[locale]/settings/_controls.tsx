"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon } from "@/components/becan/icons";

/* عناصر تحكّم الإعدادات.

   **الحفظ تلقائي بإشعار خفيف** — لا زرّ «حفظ» في أسفل الصفحة. الزرّ
   يجعل الطالب مسؤولًا عن تذكّر ضغطه، ويعاقبه بضياع تعديله إن نسي.

   الإشعار حيّ (`aria-live="polite"`) فيسمعه قارئ الشاشة، ويختفي بعد
   ثانيتين ونصف — أطول من أن يُفوَّت، وأقصر من أن يبقى ضجيجًا. */

export function useSaveNotice() {
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* المؤقّت يُلغى عند التفكيك — وإلا نادى setState على مكوّن مفكَّك */
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const ping = useCallback(() => {
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 2500);
  }, []);

  return { saved, ping };
}

/** الإشعار الخفيف — يظهر بلا أن يزيح ما تحته. */
export function SaveNotice({ saved }: { saved: boolean }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className="flex min-h-6 items-center gap-1.5 text-sm font-semibold text-ink-2"
    >
      {saved ? (
        <>
          <CheckIcon className="h-4 w-4" />
          انحفظ
        </>
      ) : null}
    </p>
  );
}

/* ————— المفتاح —————
   الكهرماني هنا في دوره: هذا عنصر قابل للضغط، وهو الفعل الوحيد في
   شاشة الإعدادات — لا زرّ أساسي يزاحمه. */

export function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  /** يُقرأ صوتيًا — المفتاح بلا نصّ داخله */
  label: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      /* هدف اللمس 44px والقرص المرئي أصغر داخله — نفس ما فعله شريط
         أدوات الجلسة، فيخفّ بصريًا بلا نزول الهدف تحت الحدّ. */
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center"
    >
      <span
        aria-hidden="true"
        className={`flex h-6 w-11 items-center rounded-pill p-0.5 transition-colors duration-200 ${
          checked ? "bg-pressable" : "bg-line"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-pill bg-surface transition-transform duration-200 ${
            /* -translate-x يتحرّك يسارًا دائمًا، والمفتاح في RTL يبدأ
               من اليمين — فالتشغيل إزاحة إلى اليسار. */
            checked ? "-translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

/* ————— اختيار من عدّة —————
   نفس لغة اختيار وسيلة الدفع: المحدَّد بحدّ باذنجاني وتعبئة خفيفة.
   لا كهرماني هنا كي لا تصير الشاشة كلها أفعالًا متزاحمة. */

export function Choice<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.id === value;
        /* الصنف يُبنى شرطيًا لا بتكديس صنفين متساويي الأولوية */
        return (
          <label
            key={o.id}
            className={`inline-flex min-h-11 cursor-pointer items-center rounded-pill border px-5 font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring ${
              on
                ? "border-aubergine-mid bg-tint-aubergine text-ink"
                : "border-line text-ink-2"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.id}
              checked={on}
              onChange={() => onChange(o.id)}
              className="sr-only"
            />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

/** صفّ تفضيل: عنوان · سطر يشرح أثره · عنصر التحكّم. */
export function PrefRow({
  title,
  effect,
  children,
}: {
  title: string;
  /** ما يفعله التفضيل فعلًا — لا وصفًا تسويقيًا */
  effect: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-line py-5 first:border-0 first:pt-0">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-measure text-sm leading-base text-ink-2">
        {effect}
      </p>
      {children}
    </div>
  );
}
