import type { TablePayload } from "@/lib/session/teaching-board";

/* الجدول (§5.7).

   `variant: "journal"` يضمن أن الرأس هو Account · Debit · Credit،
   ويوجب محاذاة رقمية: إلى نهاية الخليّة، بأرقام ثابتة العرض، ومن
   اليسار إلى اليمين مهما كان اتجاه اللوح. المحاسب يقرأ العمود
   المنزاح إجابةً خاطئة.

   والخليّة الفارغة مشروعة — سطر القيد يملأ المدين أو الدائن لا
   كليهما — فيجب أن تحفظ عرضها لا أن تنطوي. */

const isNumericColumn = (payload: TablePayload, index: number) =>
  payload.variant === "journal" && index > 0;

function Cell({
  value,
  numeric,
  head = false,
}: {
  value: string;
  numeric: boolean;
  head?: boolean;
}) {
  const tone = head ? "leading-base font-bold text-ink-2" : "leading-base text-ink";
  /* مسافة غير قاصمة تحفظ ارتفاع السطر في الخليّة الفارغة */
  const content = value.trim().length > 0 ? value : " ";

  if (numeric) {
    return (
      <span
        dir="ltr"
        style={{ unicodeBidi: "isolate" }}
        className={`block min-w-16 text-end tabular-nums ${tone}`}
      >
        {content}
      </span>
    );
  }

  return (
    <span dir="auto" className={`block ${tone}`}>
      {content}
    </span>
  );
}

export function TableItem({ payload }: { payload: TablePayload }) {
  const cellClass = "px-3 py-2 align-top leading-base";

  return (
    <div>
      {/* جدول حقيقيّ فوق نقطة التوقّف */}
      <table className="hidden w-full border-collapse text-sm md:table">
        <thead>
          <tr className="border-b border-chalkboard-edge bg-ink/5">
            {payload.header.map((label, i) => (
              <th key={i} scope="col" className={cellClass}>
                <Cell value={label} numeric={isNumericColumn(payload, i)} head />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {payload.rows.map((row, i) => (
            <tr key={i} className="border-b border-chalkboard-edge/60 last:border-0">
              {row.map((value, j) => (
                <td key={j} className={cellClass}>
                  <Cell value={value} numeric={isNumericColumn(payload, j)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* بطاقة لكل صفّ على الجوال — الرأس يصير تسمية كل حقل (§8) */}
      <ul className="flex flex-col gap-2 md:hidden">
        {payload.rows.map((row, i) => (
          <li
            key={i}
            className="rounded-md border border-chalkboard-edge px-3 py-2.5 text-sm"
          >
            <dl className="flex flex-col gap-1">
              {payload.header.map((label, j) => (
                <div key={j} className="flex items-baseline justify-between gap-3">
                  <dt dir="auto" className="shrink-0 text-xs leading-base font-semibold text-ink-2">
                    {label}
                  </dt>
                  <dd className="min-w-0">
                    <Cell value={row[j] ?? ""} numeric={isNumericColumn(payload, j)} />
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
