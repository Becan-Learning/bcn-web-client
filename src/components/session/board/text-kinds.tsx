import type { ReactNode } from "react";
import { penAttrs } from "@/lib/session/board/marks";
import { spanMarks } from "@/lib/session/board/rich-text";
import type { Pen } from "@/lib/session/teaching-board";
import type { BoardKindProps } from "./kind-props";
import { RichTextCore } from "./rich-text";

/* الأنواع النصّية — العنوان الفرعي والمتن والنقطة والخطوة.

   ثلاثة مقاسات لا تلتبس (§4.4): عنوان العنصر ‏18/20 ثم المتن ‏16 ثم الملاحظة ‏14،
   والعنوان الأكبر منها كلها يرسمه إطار السبورة. والمقاس يتبع سلّم الواجهة
   الموجود لا قيمًا جديدة.

   `dir="auto"` على محضن النصّ لا على الصفّ، فتبقى العلامة والرقم في
   بداية السطر مهما كان خطّ النصّ — وهو ما يجعل بندًا إنجليزيًا وسط
   لوحٍ عربيّ لا يكسر محاذاة جيرانه (§7). والنصّ يُرسم تحت المحضن
   مباشرةً لا داخل غلافٍ له `dir`، وإلا تخطّاه كشف الاتجاه التلقائي.

   ولون النصّ يُبنى شرطيًا لا بالتكديس (مزلق 8). */

/** قلم العنصر حدٌّ هادئ على جانب البداية لا لونٌ يعيد صبغ المتن (§4.2) */
export function Accent({
  pen,
  className = "",
  children,
}: {
  pen: Pen | null;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div {...penAttrs(pen)} className={`${pen ? "ps-3" : ""} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function HeadingLine({ item }: BoardKindProps<"heading" | "title">) {
  return (
    <Accent pen={item.pen}>
      <p dir="auto" className="text-lg leading-base font-bold text-ink md:text-xl">
        <RichTextCore
          wrap="none"
          text={item.payload.text}
          markup={item.kind === "heading"}
          pen={item.pen}
          spans={spanMarks(item.marks)}
        />
      </p>
    </Accent>
  );
}

export function TextLine({ item }: BoardKindProps<"text">) {
  return (
    <Accent pen={item.pen}>
      <p dir="auto" className="text-base leading-base text-ink">
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

/* نقطة واحدة بمستوى فرعيّ واحد (§5.3): الأبناء قائمةٌ داخل أبيهم لا
   عناصر في المنطقة، بعلامةٍ مفرغة تميّزهم، وإزاحةٌ متواضعة على
   الجوال كي يحتفظ نصّهم بعرضٍ نافع. */
export function BulletLine({ item }: BoardKindProps<"bullet">) {
  const spans = spanMarks(item.marks);
  const { text, children } = item.payload;
  return (
    <Accent pen={item.pen}>
      <p className="flex items-baseline gap-3">
        <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-pill bg-ink-2" />
        </span>
        <span dir="auto" className="min-w-0 leading-base text-ink">
          <RichTextCore wrap="none" text={text} markup pen={item.pen} spans={spans} />
        </span>
      </p>
      {children.length > 0 ? (
        <ul className="mt-1 ms-3 flex flex-col gap-1 md:ms-8">
          {children.map((child, i) => (
            <li key={i} className="flex items-baseline gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-4 w-4 shrink-0 items-center justify-center"
              >
                <span className="h-1.5 w-1.5 rounded-pill border border-ink-2" />
              </span>
              <span dir="auto" className="min-w-0 leading-base text-ink">
                <RichTextCore wrap="none" text={child} markup pen={item.pen} spans={spans} />
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </Accent>
  );
}

/** الترقيم مقصور على المنطقة (§5.1) — وأرقامه إنجليزية كبقية الواجهة */
export function StepLine({ item, n }: BoardKindProps<"step">) {
  return (
    <Accent pen={item.pen}>
      <p className="flex items-baseline gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-aubergine-mid text-xs font-bold text-on-dominant">
          {n}
        </span>
        <span dir="auto" className="min-w-0 leading-base font-semibold text-ink">
          <RichTextCore
            wrap="none"
            text={item.payload.text}
            markup
            pen={item.pen}
            spans={spanMarks(item.marks)}
          />
        </span>
      </p>
    </Accent>
  );
}
