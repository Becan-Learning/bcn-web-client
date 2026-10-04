import { useState } from "react";
import { spanMarks } from "@/lib/session/board/rich-text";
import type { BoardKindProps } from "./kind-props";
import { RichTextCore } from "./rich-text";
import { Accent } from "./text-kinds";

/* التعريف يُكشف مقطعًا مقطعًا مع الصوت (§5.6).

   ما لم يُكشف بعدُ **لا يُرسم أصلًا**: لا في شجرة الوصول ولا في
   مصدر الصفحة ولا في تلميح، فلا يسبق النصُّ نطقَه. والكشف يضيف
   مقطعًا في آخر الفقرة فلا يتحرّك ما فوقه، فلا يُحجز له ارتفاعٌ.

   المقاطع حقول مستقلّة: كلمات الاختبار وعلامات المقاطع تُطابَق في
   كلٍّ منها وحده، ولا وسوم فيها. ولا مؤقّتات هنا: الوكيل يوقّت
   كل عملية على الصوت المنطوق، وأي تأخير من الصفحة يضاعف التوقيت
   ويفكّ التزامن (§1). */
export function DefinitionItem({ item }: BoardKindProps<"definition">) {
  const { payload, revealed } = item;
  const spans = spanMarks(item.marks);
  /* ما كان ظاهرًا لحظة وصول البند (إضافة أو استعادة لقطة) لا يُعاد
     إظهاره بحركة؛ يتحرّك المقطع الذي يُكشف بعدها فقط. */
  const [settled] = useState(revealed);

  return (
    <Accent>
      <p dir="auto" className="leading-base text-ink">
        {payload.chunks.slice(0, Math.max(revealed, 0)).map((chunk, i) => (
          <span key={i} className={i < settled ? undefined : "animate-board-in"}>
            <RichTextCore
              wrap="none"
              text={chunk}
              markup={false}
              pen={item.pen}
              spans={spans}
              emphasis={payload.keyWords}
            />{" "}
          </span>
        ))}
      </p>
    </Accent>
  );
}
