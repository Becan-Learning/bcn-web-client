import { CheckIcon, CloseIcon } from "@/components/becan/icons";
import type { OptionsPayload, SlotValue } from "@/lib/session/teaching-board";
import type { SessionLanguage } from "../parts";

/* الاختيار من متعدّد (§5.10).

   هذه الخيارات **ليست تفاعلية**: الطالب يجيب بصوته، والسبورة تعكس
   النتيجة. فلا مستمع ضغطٍ عليها ولا دور لها في التحقّق — سؤال
   `set_topic` سطحٌ آخر قائم بذاته.

   وصحّة الخيار لا تصل الصفحة أصلًا (تُسقَط عند التحليل)، فلا يمكن
   أن تتسرّب قبل الإجابة. الحالة تأتي وحدها بـ `board_update`.

   والصحّ والخطأ لا يُبلَّغان باللون وحده: مع كلٍّ أيقونته. */

const LABELS = ["A", "B", "C", "D", "E", "F"];

const STATE_STYLE = {
  correct: { tone: "text-live", ring: "border-live" },
  wrong: { tone: "text-error", ring: "border-error" },
} as const;

/* الأيقونة `aria-hidden` واللون لا يُنطق، فيُنطق الحال نصًّا مخفيًا */
const STATE_LABEL = {
  correct: { Arabic: "إجابة صحيحة", English: "Correct" },
  wrong: { Arabic: "إجابة خاطئة", English: "Wrong" },
} as const;

export function OptionsItem({
  payload,
  slots,
  language,
}: {
  payload: OptionsPayload;
  slots: Record<string, SlotValue>;
  language: SessionLanguage;
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
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border text-xs font-bold ${
                  style ? `${style.ring} ${style.tone}` : "border-ink-3 text-ink-2"
                }`}
              >
                {LABELS[i] ?? i + 1}
              </span>
              <span
                dir="auto"
                className={`min-w-0 leading-base ${style ? style.tone : "text-ink"}`}
              >
                {option.text}
              </span>
              {state === "correct" || state === "wrong" ? (
                <>
                  <span className="sr-only">{STATE_LABEL[state][language]}</span>
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
