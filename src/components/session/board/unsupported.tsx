import type { BoardKindProps } from "./kind-props";
import { UNSUPPORTED_LABEL } from "./labels";

/* نوعٌ لا تعرفه هذه النسخة يصل من خادمٍ أحدث: يُرسم بطاقةً محايدة
   بوسمٍ واحد، ولا يُخمَّن له محتوى. اسم النوع على السلك لا يُعرض
   للطالب — هو لفظ برمجيّ — لكنه يبقى سمةً لمن يفحص الصفحة. */
export function UnsupportedItem({ item, language }: BoardKindProps<"unsupported">) {
  return (
    <p
      data-wire-kind={item.payload.wireKind}
      dir="auto"
      className="rounded-md border border-dashed border-ink-3 px-3 py-2 text-sm leading-base text-ink-2"
    >
      {UNSUPPORTED_LABEL[language]}
    </p>
  );
}
