import type { Metadata } from "next";
import { PageShell, QuietLink, Section, SiteHeader } from "@/components/becan/kit";
import { CheckIcon } from "@/components/becan/icons";
import { breakdown, PLANS, VAT, type Plan } from "@/lib/data/plans";
import { PlanCard } from "./plan-card";

export const metadata: Metadata = {
  title: "الخطط — بيكان",
  description: "الأسعار شاملة ضريبة القيمة المضافة.",
};

/* P1 — الخطط.

   **الفارق بين الخطط كمّيّ لا وظيفيّ.** بيكان واحد في الثلاث: نفس
   الشرح ونفس السبورة ونفس الأسئلة ونفس الملخّص. وهذه أصدق ورقة في
   الصفحة وأقواها — فتُقال صراحةً في أعلاها، ولا تُبنى قائمةُ «مزايا»
   بعلامات صحّ تُوحي بفوارق لا وجود لها.

   ولهذا الجدول أسفلها **جدول حجمٍ لا جدول مزايا**: أربعة صفوف كلّها
   كمّيّة، وصفٌّ خامس يقول إن كل ما عداها مشترك.

   والبطاقة مشتركة مع قسم الأسعار في اللاندينج (`./plan-card`) فلا
   يفترق شكل التسعير بين موضعين. **زرّ كهرماني واحد** في الصفحة
   كلّها، على الخطة المميّزة. والخطة الحالية موسومة ومعطّلة الزرّ.

   والتفصيل الضريبيّ مشتقّ من `breakdown` لا مكتوب: الطالب يرى 149
   ويدفع 149، والصافي يُشتقّ منه لا يُضاف إليه. */

/* صفوف المقارنة — كلّها كمّيّة، فالجدول يقول الحجم لا الوظيفة. */
const ROWS: { label: string; of: (p: Plan) => string }[] = [
  { label: "الفصول في الشهر", of: (p) => p.chapters.replace("≈ ", "≈ ") },
  { label: "الدقائق", of: (p) => `${p.minutes} دقيقة` },
  { label: "بالساعات", of: (p) => p.hours.replace("≈ ", "≈ ") },
  { label: "المقررات", of: (p) => p.courses },
];

export default function PlansPage() {
  return (
    <PageShell withFooter>
      <SiteHeader />

      <Section className="pt-12 pb-16 md:pt-16">
        <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
          الخطط
        </h1>

        {/* الورقة الأصدق في الصفحة، في أعلاها */}
        <p className="mt-4 max-w-measure text-lg leading-base text-ink-2">
          بيكان نفسه في كل الخطط — نفس الشرح، ونفس السبورة، ونفس الأسئلة، ونفس
          الملخّص. الفرق في{" "}
          <span className="font-semibold text-ink">الوقت</span> و
          <span className="font-semibold text-ink">عدد المقررات</span> فقط.
        </p>

        <ul className="mt-10 grid items-start gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <li key={plan.id}>
              <PlanCard plan={plan} href={`/checkout?plan=${plan.id}`} />
            </li>
          ))}
        </ul>

        {/* ————— جدول الحجم — الديسكتوب ————— */}
        <div className="mt-12 hidden overflow-hidden rounded-xl border border-line bg-surface md:block">
          <table className="w-full text-start">
            <caption className="sr-only">مقارنة حجم الخطط</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="px-5 py-4 text-start text-ink-2">
                  <span className="text-sm font-semibold">المقارنة</span>
                </th>
                {PLANS.map((p) => (
                  <th
                    key={p.id}
                    scope="col"
                    className="px-5 py-4 text-start font-bold text-ink"
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-line">
                  <th
                    scope="row"
                    className="px-5 py-4 text-start text-sm font-semibold text-ink-2"
                  >
                    {row.label}
                  </th>
                  {PLANS.map((p) => (
                    <td key={p.id} className="px-5 py-4 text-ink">
                      {row.of(p)}
                    </td>
                  ))}
                </tr>
              ))}

              {/* الصفّ الذي يقول إن ما عدا ما فوق مشترك */}
              <tr>
                <th
                  scope="row"
                  className="px-5 py-4 text-start text-sm font-semibold text-ink-2"
                >
                  الشرح والسبورة والأسئلة والملخّص
                </th>
                {PLANS.map((p) => (
                  <td key={p.id} className="px-5 py-4">
                    <span className="flex items-center gap-2 text-ink">
                      <CheckIcon className="h-4 w-4 text-success" />
                      كامل
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* ————— الطمأنة والتفصيل الضريبي ————— */}
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-tint-walnut p-5 md:p-6">
            <h2 className="font-bold text-ink">قبل ما تدفع</h2>
            <ul className="mt-3 flex flex-col gap-2 leading-base text-ink-2">
              <li>الخطة المجانية بلا بطاقة — جرّب أولًا.</li>
              <li>تلغي التجديد بضغطة، وخطتك تكمل إلى نهاية المدة المدفوعة.</li>
              <li>مدى و Apple Pay والبطاقات الائتمانية.</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-x-6">
              <QuietLink href="/refunds">الاسترجاع والإلغاء</QuietLink>
              <QuietLink href="/faq">أسئلة عن الأسعار</QuietLink>
            </div>
          </div>

          <div className="rounded-xl border border-line p-5 md:p-6">
            <h2 className="font-bold text-ink">الضريبة داخل السعر</h2>
            <p className="mt-2 leading-base text-ink-2">
              السعر الذي تراه هو الذي يُخصم — لا رسوم تُضاف عند الدفع. والفاتورة
              تفصل الصافي عن الضريبة.
            </p>

            <dl className="mt-4 flex flex-col gap-2 text-sm">
              {PLANS.filter((p) => p.price > 0).map((p) => {
                const b = breakdown(p.price);
                return (
                  <div
                    key={p.id}
                    className="flex items-baseline justify-between gap-3 border-t border-line pt-2 first:border-0 first:pt-0"
                  >
                    <dt className="text-ink-2">{p.name}</dt>
                    <dd className="text-end text-ink">
                      {b.net.toFixed(2)} + {b.vat.toFixed(2)} ضريبة ={" "}
                      <span className="font-semibold">{b.gross} ريال</span>
                    </dd>
                  </div>
                );
              })}
            </dl>
            <p className="mt-3 text-sm text-ink-2">
              ضريبة القيمة المضافة {VAT * 100}٪.
            </p>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
