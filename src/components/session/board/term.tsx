import { spanMarks } from "@/lib/session/board/rich-text";
import type { BoardKindProps } from "./kind-props";
import { RichTextCore } from "./rich-text";
import { Accent } from "./text-kinds";

/* المصطلح ثنائي اللغة (§5.7).

   الصيغة الإنجليزية هي ما يظهر في ورقة الاختبار فهي الأساسية،
   والعربية شرحٌ ثانويّ. والخطّان في رمزٍ واحد، فيلزمه عزل ثنائيّ
   خاصّ به: `isolate` على الحاوية و`dir` صريح لكل نصف. وهذا هو
   الحال الشائع على لوحٍ عربيّ لا الحالة الشاذّة.

   النصفان حقلان مستقلان: علامة المقطع تُطابَق على كلٍّ منهما وحده،
   ولا وسوم فيهما. وقوسا الشرح خارج النصّ المطابَق كي لا تعتمد
   علامةٌ على علامات الترقيم. */
export function TermItem({ item }: BoardKindProps<"term">) {
  const { payload } = item;
  const spans = spanMarks(item.marks);
  return (
    <Accent pen={item.pen}>
      <p className="leading-base">
        <span
          style={{ unicodeBidi: "isolate" }}
          className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
        >
          <span dir="ltr" className="font-semibold text-ink [overflow-wrap:anywhere]">
            <RichTextCore wrap="none" text={payload.en} markup={false} pen={item.pen} spans={spans} />
          </span>
          <span dir="rtl" className="text-sm leading-base text-ink-2">
            (<RichTextCore wrap="none" text={payload.ar} markup={false} pen={item.pen} spans={spans} />)
          </span>
        </span>
      </p>
    </Accent>
  );
}
