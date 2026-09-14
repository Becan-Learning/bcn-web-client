import type { Metadata } from "next";
import Link from "next/link";
import { SettingsCard, SettingsShell } from "../_shell";
import { INVOICES, invoiceRow } from "@/lib/data/billing";

export const metadata: Metadata = {
  title: "الفواتير — بيكان",
};

/* P5 — الفواتير.

   **الصافي والضريبة مفصولان** لأن الأسعار شاملة: الطالب دفع 149،
   والفاتورة تشرح ما بداخلها لا تضيف عليه. الاشتقاق من `breakdown`
   وحدها فلا يفترق رقم عن رقم بين شاشتين.

   ⚠️ متطلبات الفوترة الإلكترونية (ZATCA) — الرقم الضريبي، رمز QR،
   صيغة الفاتورة المعتمدة — تحتاج تأكيد المحاسب لا اجتهاد التصميم.
   المبنيّ هنا تخطيط الجدول والتفصيل فقط.

   جدول على الديسكتوب وبطاقات على الجوال: ستة أعمدة عند 390px تُقرأ
   بالتمرير الأفقي، والفاتورة ليست شيئًا يُمرَّر بحثًا عنه. */

export default function InvoicesPage() {
  const rows = INVOICES.map(invoiceRow);

  return (
    <SettingsShell
      active="invoices"
      title="الفواتير"
      lede="كل مبلغ دفعته، والضريبة مفصولة عن الصافي."
    >
      {rows.length === 0 ? (
        <SettingsCard title="ما فيه فواتير بعد">
          <p className="mt-2 max-w-measure leading-base text-ink-2">
            أول فاتورة تظهر هنا بعد أول اشتراك مدفوع.
          </p>
        </SettingsCard>
      ) : (
        <>
          {/* ————— الجوال: بطاقة لكل فاتورة ————— */}
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-line bg-surface p-5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold text-ink">{r.date}</p>
                  <p className="text-lg font-bold text-ink">{r.gross} ريال</p>
                </div>

                <p className="mt-1 text-sm text-ink-2">خطة {r.plan.name}</p>

                <dl className="mt-3 flex flex-col gap-1 text-sm">
                  <Line term="الصافي" value={`${r.net.toFixed(2)} ريال`} />
                  <Line term="الضريبة" value={`${r.vat.toFixed(2)} ريال`} />
                </dl>

                <OpenLink id={r.id} date={r.date} className="mt-4" />
              </li>
            ))}
          </ul>

          {/* ————— الديسكتوب: جدول ————— */}
          <div className="hidden overflow-hidden rounded-xl border border-line bg-surface md:block">
            <table className="w-full text-start text-sm">
              <caption className="sr-only">سجل فواتيرك</caption>
              <thead>
                <tr className="border-b border-line">
                  <Th>التاريخ</Th>
                  <Th>الخطة</Th>
                  <Th numeric>الصافي</Th>
                  <Th numeric>الضريبة</Th>
                  <Th numeric>الإجمالي</Th>
                  <Th>
                    <span className="sr-only">الفاتورة</span>
                  </Th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0">
                    <Td>{r.date}</Td>
                    <Td>{r.plan.name}</Td>
                    <Td numeric>{r.net.toFixed(2)}</Td>
                    <Td numeric>{r.vat.toFixed(2)}</Td>
                    <Td numeric>
                      <span className="font-semibold text-ink">{r.gross}</span>
                    </Td>
                    <Td>
                      <OpenLink id={r.id} date={r.date} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-ink-2">
            كل المبالغ بالريال السعودي وشاملة ضريبة القيمة المضافة. تحتاج فاتورة
            باسم جهة؟{" "}
            <Link
              href="/contact"
              className="font-semibold text-pressable underline underline-offset-4"
            >
              راسلنا
            </Link>
            .
          </p>
        </>
      )}
    </SettingsShell>
  );
}

/** فتح الفاتورة كصفحة قابلة للطباعة — لا زرّ تحميل بلا ملف خلفه. */
function OpenLink({
  id,
  date,
  className = "",
}: {
  id: string;
  date: string;
  className?: string;
}) {
  return (
    <Link
      href={`/settings/invoices/${id}`}
      className={`inline-flex min-h-11 items-center font-semibold text-pressable underline underline-offset-4 ${className}`}
    >
      افتح الفاتورة
      <span className="sr-only"> — {date}</span>
    </Link>
  );
}

function Th({
  children,
  numeric,
}: {
  children: React.ReactNode;
  numeric?: boolean;
}) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 font-semibold text-ink-2 ${
        numeric ? "text-end" : "text-start"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  numeric,
}: {
  children: React.ReactNode;
  numeric?: boolean;
}) {
  return (
    <td className={`px-4 py-3 text-ink ${numeric ? "text-end" : "text-start"}`}>
      {children}
    </td>
  );
}

function Line({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-2">{term}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}
