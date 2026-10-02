import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { localize } from "@/i18n/localized";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowBack } from "@/components/becan/icons";
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
  props: PageProps<"/[locale]/settings/invoices/[id]">,
): Promise<Metadata> {
  const { id, locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Settings.Invoice" });
  return { title: t("metadataTitle", { id }) };
}

/* P5 — الفاتورة الواحدة، صفحة قابلة للطباعة.

   لا زرّ «تحميل» بلا ملف خلفه: الطباعة إلى PDF من المتصفّح تعطي
   الطالب ملفًا حقيقيًا اليوم، ويحلّ محلّها ملفّ من الخادم متى جهز.

   ⚠️ هذه ليست فاتورة ضريبية معتمدة: متطلبات ZATCA (الرقم الضريبي،
   رمز QR، صيغة XML) تحتاج تأكيد المحاسب. المبنيّ تخطيط وتفصيل. */

export default async function InvoicePage(
  props: PageProps<"/[locale]/settings/invoices/[id]">,
) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Settings.Invoice");

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
            <ArrowBack className="h-4 w-4" />
            {t("invoices")}
          </Link>

          <article className="mt-4 rounded-xl border border-line bg-surface p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-2xl font-bold text-ink">
                  {t("brand")}
                </p>
                <p className="mt-1 text-sm text-ink-2">{t("subscriptionInvoice")}</p>
              </div>

              <div className="text-end">
                <p className="text-sm text-ink-2">{t("number")}</p>
                <p className="font-semibold text-ink" dir="ltr">
                  {inv.id}
                </p>
              </div>
            </div>

            <dl className="mt-8 flex flex-col gap-2 text-sm">
              <Row term={t("date")} value={localize(inv.date, locale)} />
              <Row term={t("description")} value={t("planMonth", { plan: localize(inv.plan.name, locale) })} />
              <Row
                term={t("method")}
                value={
                  <>
                    {method.latin ? (
                      <span dir="ltr">{localize(method.latin, locale)}</span>
                    ) : (
                      localize(method.label, locale)
                    )}{" "}
                    · <span dir="ltr">•••• {SUBSCRIPTION.last4}</span>
                  </>
                }
              />
            </dl>

            <div className="mt-8 border-t border-line pt-5">
              <dl className="flex flex-col gap-2 text-sm">
                <Row term={t("net")} value={t("amount", { amount: inv.net.toFixed(2) })} />
                <Row
                  term={t("vatRate", { rate: String(VAT * 100) })}
                  value={t("amount", { amount: inv.vat.toFixed(2) })}
                />
              </dl>

              <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-line pt-4">
                <span className="font-semibold text-ink">{t("totalPaid")}</span>
                <span className="text-2xl font-bold text-ink">
                  {t("amount", { amount: String(inv.gross) })}
                </span>
              </div>
            </div>

            <p className="mt-6 text-sm text-ink-2">
              {t("paid")}
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
