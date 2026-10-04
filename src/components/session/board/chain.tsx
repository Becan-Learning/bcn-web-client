import { decorationAttrs, type Decoration } from "@/lib/session/board/marks";
import type { BoardKindProps } from "./kind-props";
import { ANNOTATION_LABEL, MARK_LABEL } from "./labels";
import { RichText } from "./rich-text";
import { MarkIcon } from "./table";

/* السلسلة — آليّة السبب والنتيجة (§5.11).

   هذا أحد موضعين يستحقّان رسمًا حقيقيًا: سهمٌ بين صندوقين. والتكديس
   الرأسيّ بأسهم نازلة هو التخطيط الصحيح على الجوال، فيُستثنى من
   معالجة البطاقات في §8 ويبقى واحدًا في المقاسين.

   الواصل المكسور يحمل ✕ بلون الطباشير لا بالنبيذيّ: `--error` محجوز
   للخطأ المصحَّح، ووصلةٌ ألغاها المعلّم ليست إجابةً خاطئة. */

function Connector({ broken, index }: { broken: boolean; index: number }) {
  return (
    <span aria-hidden="true" data-board-connector={index} data-broken={broken ? "" : undefined} className="board-chain-connector flex h-7 w-5 shrink-0 justify-center">
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

export function ChainItem({ item, language }: BoardKindProps<"chain">) {
  const { payload, slots } = item;
  const spans = item.marks.filter((mark) => mark.scope === "span");
  return (
    <ol className="board-chain flex min-w-0 flex-col items-stretch gap-0">
      {payload.links.map((link, i) => {
        /* الفهرس يخص الوصلة التي يدخل إليها السهم، لا التي يخرج منها. */
        const state = slots[String(i)]?.state;
        const broken = i > 0 && (payload.breakAt === i || state === "broken");
        const linkDecoration = { answer: state === "correct" || state === "wrong" ? state : null, dim: false, focus: false, dimmedByFocus: false, highlight: state === "key", strike: i === 0 && state === "broken" } satisfies Decoration;
        return (
          <li key={i} className="flex min-w-0 flex-col items-center">
            {i > 0 ? <Connector broken={broken} index={i} /> : null}
            {broken ? <span className="sr-only">{ANNOTATION_LABEL.broken?.[language]}</span> : null}
            <span data-board-link={i} {...decorationAttrs(linkDecoration)} aria-current={state === "key" ? true : undefined} className="relative w-full min-w-0 rounded-md border border-chalkboard-edge bg-ink/5 px-3 py-2 text-center text-sm leading-base text-ink [overflow-wrap:anywhere]">
              <MarkIcon answer={linkDecoration.answer} language={language} />
              {i === 0 && state === "broken" ? <span className="sr-only">{ANNOTATION_LABEL.broken?.[language]}</span> : null}
              {state === "key" ? <span className="sr-only">{MARK_LABEL.highlight[language]}</span> : null}
              <RichText text={link} markup={false} pen={item.pen} spans={spans} />
            </span>
          </li>
        );
      })}
    </ol>
  );
}
