import type { ComparePayload } from "@/lib/session/teaching-board";

/* الزوج الأدنى (§5.6) — عمودان لا أكثر، و`x` للأول و`y` للثاني.

   المحاذاة صفًّا بصفّ هي الدرس نفسه، فلا بدّ أن يتقابل الجانبان.
   وعلى الجوال — وهو سطح الإطلاق — القرار مقفل (§8): بطاقات مكدّسة
   بتسميات محاذية، بلا تمرير أفقيّ ولا قلب للشاشة. واسما العمودين
   يتكرّران في كل بطاقة عمدًا: هما ما يحفظ التقابل بعد زوال الأعمدة.

   ولكل جانب لمسته الثابتة (جوزيّ للأول · حدّ خفيف للثاني) كي يمسح
   الطالبُ جانبًا واحدًا نازلًا عبر البطاقات. */

const SIDE_ACCENT = ["border-warmth", "border-ink-3"] as const;

export function CompareItem({ payload }: { payload: ComparePayload }) {
  const cellClass = "px-3 py-2 align-top leading-base";

  return (
    <div>
      {/* أعمدة حقيقية فوق نقطة التوقّف */}
      <table className="hidden w-full border-collapse text-sm md:table">
        <thead>
          <tr className="border-b border-chalkboard-edge">
            <th scope="col" className={`${cellClass} text-start font-bold text-ink-2`}>
              <span dir="auto">{payload.aspectLabel}</span>
            </th>
            {payload.columns.map((column, side) => (
              <th
                key={side}
                scope="col"
                className={`${cellClass} border-s-2 ${SIDE_ACCENT[side]} text-start font-bold text-ink`}
              >
                <span dir="auto">{column}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {payload.rows.map((row, i) => (
            <tr key={i} className="border-b border-chalkboard-edge/60 last:border-0">
              <th scope="row" className={`${cellClass} text-start font-semibold text-ink-2`}>
                <span dir="auto">{row.aspect}</span>
              </th>
              {[row.x, row.y].map((value, side) => (
                <td key={side} className={`${cellClass} border-s-2 ${SIDE_ACCENT[side]} text-ink`}>
                  <span dir="auto">{value}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* بطاقة لكل صفّ على الجوال — التسمية باقية فيبقى التقابل */}
      <ul className="flex flex-col gap-2 md:hidden">
        {payload.rows.map((row, i) => (
          <li
            key={i}
            className="rounded-md border border-chalkboard-edge px-3 py-2.5 text-sm"
          >
            <p dir="auto" className="leading-base font-bold text-ink">
              {row.aspect}
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              {[row.x, row.y].map((value, side) => (
                <div key={side} className={`border-s-2 ${SIDE_ACCENT[side]} ps-2.5`}>
                  <p dir="auto" className="text-xs leading-base font-semibold text-ink-2">
                    {payload.columns[side]}
                  </p>
                  <p dir="auto" className="leading-base text-ink">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
