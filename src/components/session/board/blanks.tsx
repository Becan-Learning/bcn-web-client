import type { BlanksPayload, SlotValue } from "@/lib/session/teaching-board";
import type { SessionLanguage } from "../parts";

/* املأ الفراغ (§5.9).

   القالب يُقسَّم على `___` بالترتيب: أول فراغ هو blanks[0]. والفراغ
   غير المملوء يُرسم خطًّا تحتيًا ظاهرًا — الفجوة الخالية تُقرأ خطأً
   مطبعيًا لا سؤالًا.

   والجواب لا يُرسم عند الإضافة أبدًا: `fill` مُسقَط عند التحليل،
   ويصل لاحقًا بـ `board_update` على خانة الفراغ. فيُملأ في مكانه
   بومضة قصيرة، والسطر لا يُعاد رسمه. */

const PLACEHOLDER = "___";

/* الخطّ التحتي وحده لا يُنطق، فالجملة تُقرأ منقوصة بلا إشارة إلى
   موضع الفراغ. يُنطق بكلمة مخفية بصريًا. */
const BLANK_LABEL = { Arabic: "فراغ", English: "blank" } as const;

export function BlanksItem({
  payload,
  slots,
  language,
}: {
  payload: BlanksPayload;
  slots: Record<string, SlotValue>;
  language: SessionLanguage;
}) {
  const parts = payload.template.split(PLACEHOLDER);

  return (
    <p dir="auto" className="leading-loose text-ink">
      {parts.map((part, i) => {
        if (i === parts.length - 1) return <span key={i}>{part}</span>;

        const blank = payload.blanks[i];
        const fill = blank ? slots[blank.id]?.text : undefined;

        return (
          <span key={i}>
            {part}
            {fill ? (
              /* المفتاح على القيمة، فيُعاد تركيب المحضن عند الملء
                 وتعمل ومضته مرّة واحدة بلا مؤقّت. */
              <span
                key={fill}
                dir="auto"
                className="mx-1 inline-block border-b-2 border-ink px-1.5 font-bold text-ink animate-board-in"
              >
                {fill}
              </span>
            ) : (
              <>
                <span className="sr-only">{BLANK_LABEL[language]}</span>
                <span
                  aria-hidden="true"
                  className="mx-1 inline-block min-w-[5ch] border-b-2 border-ink-3 align-baseline"
                >
                  {" "}
                </span>
              </>
            )}
          </span>
        );
      })}
    </p>
  );
}
