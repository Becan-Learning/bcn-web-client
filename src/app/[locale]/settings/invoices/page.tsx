import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { localize } from "@/i18n/localized";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { SettingsCard, SettingsShell } from "../_shell";
import { INVOICES, invoiceRow } from "@/lib/data/billing";

export async function generateMetadata({ params }: PageProps<"/[locale]/settings/invoices">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Settings.Invoices" });
  return { title: t("metadataTitle") };
}

/* P5 — الفواتير.

   **الصافي والضريبة مفصولان** لأن الأسعار شاملة: الطالب دفع 149،
   والفاتورة تشرح ما بداخلها لا تضيف عليه. الاشتقاق من `breakdown`
   وحدها فلا يفترق رقم عن رقم بين شاشتين.

   ⚠️ متطلبات الفوترة الإلكترونية (ZATCA) — الرقم الضريبي، رمز QR،
   صيغة الفاتورة المعتمدة — تحتاج تأكيد المحاسب لا اجتهاد التصميم.
   المبنيّ هنا تخطيط الجدول والتفصيل فقط.

   جدول على الديسكتوب وبطاقات على الجوال: ستة أعمدة عند 390px تُقرأ
   بالتمرير الأفقي، والفاتورة ليست شيئًا يُمرَّر بحثًا عنه. */

export default async function InvoicesPage(props: PageProps<"/[locale]/settings/invoices">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Settings.Invoices");

  const rows = INVOICES.map(invoiceRow);

  return (
    <SettingsShell
      active="invoices"
      title={t("title")}
      lede={t("lede")}
    >
      {rows.length === 0 ? (
        <SettingsCard title={t("emptyTitle")}>
          <p className="mt-2 max-w-measure leading-base text-ink-2">
            {t("emptyBody")}
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
                  <p className="font-semibold text-ink">{localize(r.date, locale)}</p>
                  <p className="text-lg font-bold text-ink">{t("amount", { amount: String(r.gross) })}</p>
                </div>

                <p className="mt-1 text-sm text-ink-2">{t("planName", { plan: localize(r.plan.name, locale) })}</p>

                <dl className="mt-3 flex flex-col gap-1 text-sm">
                  <Line term={t("net")} value={t("amount", { amount: r.net.toFixed(2) })} />
                  <Line term={t("vat")} value={t("amount", { amount: r.vat.toFixed(2) })} />
                </dl>

                <OpenLink id={r.id} date={localize(r.date, locale)} className="mt-4" />
              </li>
            ))}
          </ul>

          {/* ————— الديسكتوب: جدول ————— */}
          <div className="hidden overflow-hidden rounded-xl border border-line bg-surface md:block">
            <table className="w-full text-start text-sm">
              <caption className="sr-only">{t("caption")}</caption>
              <thead>
                <tr className="border-b border-line">
                  <Th>{t("date")}</Th>
                  <Th>{t("plan")}</Th>
                  <Th numeric>{t("net")}</Th>
                  <Th numeric>{t("vat")}</Th>
                  <Th numeric>{t("total")}</Th>
                  <Th>
                    <span className="sr-only">{t("invoice")}</span>
                  </Th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0">
                    <Td>{localize(r.date, locale)}</Td>
                    <Td>{localize(r.plan.name, locale)}</Td>
                    <Td numeric>{r.net.toFixed(2)}</Td>
                    <Td numeric>{r.vat.toFixed(2)}</Td>
                    <Td numeric>
                      <span className="font-semibold text-ink">{r.gross}</span>
                    </Td>
                    <Td>
                      <OpenLink id={r.id} date={localize(r.date, locale)} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-ink-2">
            {t.rich("note", { contact: (chunks) => <Link href="/contact" className="font-semibold text-pressable underline underline-offset-4">{chunks}</Link> })}
          </p>
        </>
      )}
    </SettingsShell>
  );
}

/** فتح الفاتورة كصفحة قابلة للطباعة — لا زرّ تحميل بلا ملف خلفه. */
async function OpenLink({
  id,
  date,
  className = "",
}: {
  id: string;
  date: string;
  className?: string;
}) {
  const t = await getTranslations("Settings.Invoices");
  return (
    <Link
      href={`/settings/invoices/${id}`}
      className={`inline-flex min-h-11 items-center font-semibold text-pressable underline underline-offset-4 ${className}`}
    >
      {t("open")}<span className="sr-only"> — {date}</span>
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
