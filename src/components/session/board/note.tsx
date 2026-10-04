import { spanMarks } from "@/lib/session/board/rich-text";
import type { BoardKindProps } from "./kind-props";
import { RichTextCore } from "./rich-text";
import { Accent } from "./text-kinds";

/* الملاحظة هامشٌ شارح (§5.5): أصغر مقاسات السبورة الثلاثة وأخفتها حبرًا،
   لكنها تبقى في تدفّق اللوح مقروءةً دون نقر — لا تلميح ولا طيّ. */
export function NoteItem({ item }: BoardKindProps<"note">) {
  return (
    <Accent>
      <p dir="auto" className="text-sm leading-base text-ink-2">
        <RichTextCore
          wrap="none"
          text={item.payload.text}
          markup
          pen={item.pen}
          spans={spanMarks(item.marks)}
        />
      </p>
    </Accent>
  );
}
