import type { BoardKindProps } from "./kind-props";

/* الأنواع النصّية الأربعة — منقولة عن `BoardLine` في الإصدار الأول.

   `dir="auto"` على محضن النصّ لا على الصفّ، فتبقى العلامة والرقم في
   بداية السطر مهما كان خطّ النصّ — وهو ما يجعل بندًا إنجليزيًا وسط
   لوحٍ عربيّ لا يكسر محاذاة جيرانه (§7).

   ولون النصّ يُبنى شرطيًا لا بالتكديس (مزلق 8). */

export function HeadingLine({ item }: BoardKindProps<"heading" | "title">) {
  const { text } = item.payload;
  return (
    <p className="text-base leading-base font-bold text-ink md:text-lg">
      <span dir="auto">{text}</span>
    </p>
  );
}

export function TextLine({ item }: BoardKindProps<"text">) {
  const { text } = item.payload;
  return (
    <p dir="auto" className="leading-base text-ink-2">
      {text}
    </p>
  );
}

export function BulletLine({ item }: BoardKindProps<"bullet">) {
  const { text } = item.payload;
  return (
    <p className="flex items-baseline gap-3">
      <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center">
        <span className="h-1.5 w-1.5 rounded-pill bg-ink-2" />
      </span>
      <span dir="auto" className="min-w-0 leading-base text-ink">
        {text}
      </span>
    </p>
  );
}

/** الترقيم مقصور على المنطقة (§5.1) — وأرقامه إنجليزية كبقية الواجهة */
export function StepLine({ item, n }: BoardKindProps<"step">) {
  const { text } = item.payload;
  return (
    <p className="flex items-baseline gap-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-aubergine-mid text-xs font-bold text-on-dominant">
        {n}
      </span>
      <span dir="auto" className="min-w-0 leading-base font-semibold text-ink">
        {text}
      </span>
    </p>
  );
}
