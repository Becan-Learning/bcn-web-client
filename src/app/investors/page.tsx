import type { Metadata } from "next";
import { PageShell, Section, SiteHeader } from "@/components/becan/kit";
import { InvestorForm } from "./investor-form";

export const metadata: Metadata = {
  title: "للمستثمرين — بيكان",
  /* **خارج قائمة التنقّل الرئيسية**، وخارج الفهرسة كذلك: صفحة لا
     تُعرض للطالب لا يصحّ أن يجدها في نتيجة بحث عن بيكان. */
  robots: { index: false, follow: false },
};

/* M6 — للمستثمرين.

   **هنا فقط تُعرض أرقام المستثمرين**، ولا تظهر في أي صفحة للطالب:
   كل جمهور وأرقامه. الطالب يقرأ «120 طالب» ضعفًا، والمستثمر يقرأها
   بداية — ونفس الرقم لا يخدم القراءتين في مكان واحد.

   الاستثناء الوحيد لنمط «رقم واحد بارز»: المستثمر يقارن مجموعة أرقام
   بعضها ببعض، ورقم واحد لا يقول له شيئًا.

   ⚠️ الأرقام كما وردت في البريف. أي رقم يتغيّر يُحدَّث هنا وفي
   نسخة الـDeck معًا. */

const METRICS = [
  { value: "120", unit: "طالب", note: "مسجَّلون ونشطون" },
  { value: "307", unit: "جلسة", note: "جلسة شرح مكتملة" },
  { value: "25.4", unit: "ساعة", note: "تعلّم فعلي داخل الجلسات" },
  { value: "62٪", unit: "عودة", note: "يرجعون لجلسة ثانية" },
  { value: "4.12", unit: "من 5", note: "تقييم الطلاب للجلسة" },
];

export default function InvestorsPage() {
  return (
    <PageShell withFooter>
      <SiteHeader minimal />

      <main>
        <Section className="pt-12 pb-14 md:pt-16">
          <div className="max-w-measure">
            <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl xl:text-6xl">
              بيكان — للمستثمرين
            </h1>
            <p className="mt-5 text-lg leading-base text-ink-2">
              منتج ويب عربي يشرح للطالب الجامعي مقرره بالصوت على سبورة تفاعلية،
              ثم يسأله ليتأكد أنه فهم. سوقنا الأول: طلاب الجامعات السعودية.
            </p>
          </div>

          {/* أرقام هذه الصفحة وحدها */}
          <dl className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {METRICS.map((m) => (
              <div
                key={m.unit + m.value}
                className="rounded-xl border border-line bg-surface p-6"
              >
                <dt className="text-sm font-semibold text-ink-2">{m.note}</dt>
                <dd className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-4xl leading-none font-bold text-ink md:text-5xl">
                    {m.value}
                  </span>
                  <span className="font-semibold text-ink-2">{m.unit}</span>
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 max-w-measure text-sm leading-base text-ink-2">
            أرقام تشغيلية حتى 23 أغسطس 2026، من الاستخدام الفعلي لا من تسجيلات
            الاهتمام.
          </p>
        </Section>

        <Section className="pb-16">
          <div className="max-w-measure">
            <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">
              اطلب الـ<span dir="ltr">Deck</span>
            </h2>
            <p className="mt-2 leading-base text-ink-2">
              يشمل السوق والمنتج ونموذج الإيراد والفريق والخطة المالية. نرسله
              خلال يوم عمل واحد.
            </p>

            <div className="mt-6">
              <InvestorForm />
            </div>
          </div>
        </Section>
      </main>
    </PageShell>
  );
}
