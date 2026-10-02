import { ANNOTATION_LABEL, OPTION_LABELS } from "./labels";
import { CheckIcon, CloseIcon } from "@/components/becan/icons";
import type { OptionsPayload, SlotValue } from "@/lib/session/teaching-board";
import type { ExplanationLanguage } from "../explanation-language";

/* الاختيار من متعدّد (§5.10).

   هذه الخيارات **ليست تفاعلية**: الطالب يجيب بصوته، والسبورة تعكس
   النتيجة. فلا مستمع ضغطٍ عليها ولا دور لها في التحقّق — سؤال
   `set_topic` سطحٌ آخر قائم بذاته.

   وصحّة الخيار لا تصل الصفحة أصلًا (تُسقَط عند التحليل)، فلا يمكن
   أن تتسرّب قبل الإجابة. الحالة تأتي وحدها بـ `board_update`.

   والصحّ والخطأ لا يُبلَّغان باللون وحده: مع كلٍّ أيقونته. */

const STATE_STYLE = {
  correct: { tone: "text-live", ring: "border-live" },
  wrong: { tone: "text-error", ring: "border-error" },
} as const;

/* الأيقونة `aria-hidden` واللون لا يُنطق، فيُنطق الحال نصًّا مخفيًا */

export function OptionsItem({
  payload,
  slots,
  language,
}: {
  payload: OptionsPayload;
  slots: Record<string, SlotValue>;
  language: ExplanationLanguage;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p dir="auto" className="leading-base font-semibold text-ink">
        {payload.stem}
      </p>
      <ul className="flex flex-col gap-1.5">
        {payload.options.map((option, i) => {
          const state = slots[option.id]?.state;
          const style =
            state === "correct" || state === "wrong" ? STATE_STYLE[state] : null;

          return (
            <li key={option.id} className="flex items-baseline gap-2.5">
              <span
                dir="ltr"
                lang="en"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border text-xs font-bold ${
                  style ? `${style.ring} ${style.tone}` : "border-ink-3 text-ink-2"
                }`}
              >
                {OPTION_LABELS[language][i] ?? i + 1}
              </span>
              <span
                dir="auto"
                className={`min-w-0 leading-base ${style ? style.tone : "text-ink"}`}
              >
                {option.text}
              </span>
              {state === "correct" || state === "wrong" ? (
                <>
                  <span className="sr-only">{ANNOTATION_LABEL[state]?.[language]}</span>
                  {state === "correct" ? (
                    <CheckIcon className="h-4 w-4 shrink-0 text-live" />
                  ) : (
                    <CloseIcon className="h-4 w-4 shrink-0 text-error" />
                  )}
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
