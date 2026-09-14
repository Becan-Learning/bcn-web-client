import type { Metadata } from "next";
import { PageShell, Scribbled, Section, SiteHeader } from "@/components/becan/kit";
import { AmbassadorForm } from "./ambassador-form";

export const metadata: Metadata = {
  title: "سفراء بيكان",
  description: "طلاب يوصّلون بيكان لزملائهم، وياخذون مقابلها.",
};

/* M5 — سفراء بيكان.

   خطة النمو موثّقة كـ community-led، والسفراء بلا صفحة يعني أن الخطة
   شعار. هذه الصفحة تحوّلها إلى باب يُطرق.

   **رقم واحد بارز: العمولة** — لا عدد السفراء الحاليين. العدد في
   بداية برنامج صغير رقمٌ يُضعف الدعوة لا يقوّيها، والعمولة هي ما
   يقرّر بها الطالب.

   ⚠️ الأرقام (20٪، مدة العمولة، شرط الشارة) قرار مؤسّس لا قرار
   تصميم — مسجَّلة في docs/STATE.md كنقطة تنتظر تثبيتًا.

   الخربشة مرّة واحدة في الشاشة، والزرّ الكهرماني واحد في النموذج. */

const DOES = [
  "توصّل بيكان لزملائك في دفعتك — قروب، أو حساب، أو كلمة في المذاكرة الجماعية.",
  "تجرّب المقررات الجديدة قبل ما تنزل، وتقول لنا وش ناقصها.",
  "توصّل لنا المقررات اللي يحتاجها قسمك عشان نجهّزها قبل الترم الجاي.",
];

const GETS = [
  {
    title: "اشتراك برو مجاني",
    body: "طول ما أنت سفير — 500 دقيقة شهريًا وكل مقرراتك.",
  },
  {
    title: "عمولة على كل اشتراك",
    body: "20٪ من قيمة كل اشتراك يجي من رابطك، تتكرّر مع كل تجديد للسنة الأولى.",
  },
  {
    title: "شارة سفير",
    body: "على حسابك وفي ملفك، مع شهادة تقدر تحطّها في سيرتك الذاتية.",
  },
];

export default function AmbassadorsPage() {
  return (
    <PageShell withFooter>
      <SiteHeader />

      <main>
        <Section className="pt-12 pb-14 md:pt-16">
          <div className="max-w-measure">
            <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl xl:text-6xl">
              كن <Scribbled>سفير</Scribbled> بيكان في جامعتك
            </h1>
            <p className="mt-5 text-lg leading-base text-ink-2">
              الطلاب يسمعون من الطلاب. إذا بيكان نفعك، وصّله لزملائك وخذ مقابله.
            </p>
          </div>

          {/* رقم واحد بارز — العمولة، وهي ما يقرّر بها */}
          <div className="mt-10 max-w-measure rounded-xl bg-tint-amber p-6 md:p-8">
            <p className="font-display text-6xl leading-none font-bold text-ink md:text-7xl">
              20٪
            </p>
            <p className="mt-3 text-lg font-semibold text-ink">
              من كل اشتراك يجي من رابطك
            </p>
            <p className="mt-2 leading-base text-ink-2">
              مع اشتراك برو مجاني لك طول ما أنت سفير.
            </p>
          </div>
        </Section>

        <Section className="pb-14">
          <div className="max-w-measure">
            <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">
              وش يسوي السفير
            </h2>
            <ul className="mt-4 flex list-disc flex-col gap-2 ps-5 leading-base text-ink-2">
              {DOES.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>

          <h2 className="mt-12 font-display text-2xl font-bold text-ink md:text-3xl">
            وش تاخذ
          </h2>

          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {GETS.map((g) => (
              <li
                key={g.title}
                className="rounded-xl border border-line bg-surface p-5"
              >
                <p className="font-bold text-ink">{g.title}</p>
                <p className="mt-2 leading-base text-ink-2">{g.body}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section className="pb-16">
          <div className="max-w-measure">
            <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">
              سجّل
            </h2>
            <p className="mt-2 leading-base text-ink-2">
              أربعة أسطر، وندرس طلبك ونرد خلال خمسة أيام.
            </p>

            <div className="mt-6">
              <AmbassadorForm />
            </div>
          </div>
        </Section>
      </main>
    </PageShell>
  );
}
