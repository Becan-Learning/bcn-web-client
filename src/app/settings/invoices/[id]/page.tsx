import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowForward } from "@/components/becan/icons";
import { PageShell, Section, SiteHeader } from "@/components/becan/kit";
import {
  INVOICES,
  invoiceRow,
  METHODS,
  SUBSCRIPTION,
} from "@/lib/data/billing";
import { VAT } from "@/lib/data/plans";
import { PrintButton } from "./print-button";

export async function generateMetadata(
  props: PageProps<"/settings/invoices/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `فاتورة ${id} — بيكان` };
}

/* P5 — الفاتورة الواحدة، صفحة قابلة للطباعة.

   لا زرّ «تحميل» بلا ملف خلفه: الطباعة إلى PDF من المتصفّح تعطي
   الطالب ملفًا حقيقيًا اليوم، ويحلّ محلّها ملفّ من الخادم متى جهز.

   ⚠️ هذه ليست فاتورة ضريبية معتمدة: متطلبات ZATCA (الرقم الضريبي،
   رمز QR، صيغة XML) تحتاج تأكيد المحاسب. المبنيّ تخطيط وتفصيل. */

export default async function InvoicePage(
  props: PageProps<"/settings/invoices/[id]">,
) {
  const { id } = await props.params;
  const found = INVOICES.find((i) => i.id === id);
  if (!found) notFound();

  const inv = invoiceRow(found);
  const method = METHODS.find((m) => m.id === SUBSCRIPTION.method)!;

  return (
    <PageShell>
      <SiteHeader minimal />

      <Section className="pt-8 pb-16 md:pt-12">
        <div className="mx-auto w-full max-w-[34rem]">
          {/* السهم مقلوب فيشير إلى بداية السطر — رجوع */}
          <Link
            href="/settings/invoices"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-ink-2 print:hidden"
          >
            <ArrowForward className="h-4 w-4 rotate-180" />
            الفواتير
          </Link>

          <article className="mt-4 rounded-xl border border-line bg-surface p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-2xl font-bold text-ink">
                  بيكان
                </p>
                <p className="mt-1 text-sm text-ink-2">فاتورة اشتراك</p>
              </div>

              <div className="text-end">
                <p className="text-sm text-ink-2">رقم الفاتورة</p>
                <p className="font-semibold text-ink" dir="ltr">
                  {inv.id}
                </p>
              </div>
            </div>

            <dl className="mt-8 flex flex-col gap-2 text-sm">
              <Row term="التاريخ" value={inv.date} />
              <Row term="الوصف" value={`خطة ${inv.plan.name} — شهر واحد`} />
              <Row
                term="وسيلة الدفع"
                value={
                  <>
                    {method.latin ? (
                      <span dir="ltr">{method.latin}</span>
                    ) : (
                      method.label
                    )}{" "}
                    · <span dir="ltr">•••• {SUBSCRIPTION.last4}</span>
                  </>
                }
              />
            </dl>

            <div className="mt-8 border-t border-line pt-5">
              <dl className="flex flex-col gap-2 text-sm">
                <Row term="الصافي" value={`${inv.net.toFixed(2)} ريال`} />
                <Row
                  term={`ضريبة القيمة المضافة ${VAT * 100}٪`}
                  value={`${inv.vat.toFixed(2)} ريال`}
                />
              </dl>

              <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-line pt-4">
                <span className="font-semibold text-ink">الإجمالي المدفوع</span>
                <span className="text-2xl font-bold text-ink">
                  {inv.gross} ريال
                </span>
              </div>
            </div>

            <p className="mt-6 text-sm text-ink-2">
              مدفوعة · المبالغ بالريال السعودي.
            </p>
          </article>

          <div className="mt-6 print:hidden">
            <PrintButton />
          </div>
        </div>
      </Section>
    </PageShell>
  );
}

function Row({ term, value }: { term: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-ink-2">{term}</dt>
      <dd className="text-end font-semibold text-ink">{value}</dd>
    </div>
  );
}
