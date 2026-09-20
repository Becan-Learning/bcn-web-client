import type { ChainPayload, SlotValue } from "@/lib/session/teaching-board";

/* السلسلة — آليّة السبب والنتيجة (§5.8).

   هذا أحد موضعين يستحقّان رسمًا حقيقيًا: سهمٌ بين صندوقين. والتكديس
   الرأسيّ بأسهم نازلة هو التخطيط الصحيح على الجوال، فيُستثنى من
   معالجة البطاقات في §8 ويبقى واحدًا في المقاسين.

   الواصل المكسور يحمل ✕ بلون الطباشير لا بالنبيذيّ: `--error` محجوز
   للخطأ المصحَّح، ووصلةٌ ألغاها المعلّم ليست إجابةً خاطئة. */

function Connector({ broken }: { broken: boolean }) {
  return (
    <span aria-hidden="true" className="flex h-7 w-5 shrink-0 justify-center">
      <svg
        viewBox="0 0 16 28"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={broken ? "h-7 w-4 text-ink-3" : "h-7 w-4 text-ink-2"}
      >
        <path d="M8 2v17" strokeDasharray={broken ? "3 3" : undefined} />
        <path d="m4 16 4 5 4-5" />
        {broken ? <path d="m2.5 6.5 11 11m0-11-11 11" className="text-ink" /> : null}
      </svg>
    </span>
  );
}

export function ChainItem({
  payload,
  slots,
}: {
  payload: ChainPayload;
  slots: Record<string, SlotValue>;
}) {
  return (
    <ol className="flex flex-col items-stretch gap-0">
      {payload.links.map((link, i) => {
        /* الواصل الداخل إلى الوصلة i: `break_at` يعدّ من 1،
           و`slot` يعدّ من 0 — وكلاهما يكسر الواصل نفسه. */
        const broken =
          i > 0 && (payload.breakAt === i + 1 || slots[String(i)]?.state === "broken");

        return (
          <li key={i} className="flex flex-col items-center">
            {i > 0 ? <Connector broken={broken} /> : null}
            <span
              dir="auto"
              className="w-full rounded-md border border-chalkboard-edge bg-ink/5 px-3 py-2 text-center text-sm leading-base text-ink"
            >
              {link}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
