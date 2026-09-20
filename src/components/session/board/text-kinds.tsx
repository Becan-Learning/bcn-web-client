/* الأنواع النصّية الأربعة — منقولة عن `BoardLine` في الإصدار الأول.

   `dir="auto"` على محضن النصّ لا على الصفّ، فتبقى العلامة والرقم في
   بداية السطر مهما كان خطّ النصّ — وهو ما يجعل بندًا إنجليزيًا وسط
   لوحٍ عربيّ لا يكسر محاذاة جيرانه (§7).

   ولون النصّ يُبنى شرطيًا لا بالتكديس (مزلق 8). */

export function HeadingLine({ text }: { text: string }) {
  return (
    <p className="text-base leading-base font-bold text-ink md:text-lg">
      <span dir="auto">{text}</span>
    </p>
  );
}

export function TextLine({ text }: { text: string }) {
  return (
    <p dir="auto" className="leading-base text-ink-2">
      {text}
    </p>
  );
}

export function BulletLine({ text }: { text: string }) {
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
export function StepLine({ text, n }: { text: string; n: number }) {
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
