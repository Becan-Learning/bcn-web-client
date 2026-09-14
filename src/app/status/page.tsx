import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, QuietLink, Section, SiteHeader } from "@/components/becan/kit";

export const metadata: Metadata = {
  title: "حالة النظام — بيكان",
};

/* H3 — حالة النظام.

   منتج صوتي حيّ يعطب، وصفحة الحالة تمنع فيضان الدعم وقت العطل — وهي
   أرخص ما في القائمة بناءً.

   **ثلاث حالات لا أكثر**: يعمل · متأثر جزئيًا · متوقف. والتدرّج
   الأدقّ يوهم بدقّة لا نملكها.

   **الأخضر هنا في دوره**: `--live` معناه «يحدث الآن»، وهذا بالضبط ما
   تقوله الحالة الخضراء. والمتأثر جزئيًا كهرماني — إلحاح هادئ. أما
   المتوقّف فـ`--error`: عطل، وهي الحالة الوحيدة التي تستحقّ الأحمر
   في المنتج كله.

   الحالة واللقطات ثابتة هنا؛ في الإنتاج تأتي من المراقبة. والتواريخ
   مخزَّنة لا محسوبة من `new Date()` — الحساب وقت الرسم يكسر الترطيب. */

type Level = "ok" | "partial" | "down";

const LEVELS: Record<Level, { label: string; dot: string; note: string }> = {
  ok: {
    label: "كل شيء يشتغل",
    dot: "bg-live",
    note: "ما فيه عطل معروف الحين.",
  },
  partial: {
    label: "متأثر جزئيًا",
    dot: "bg-pressable",
    note: "جزء من الخدمة أبطأ من المعتاد أو متعطّل.",
  },
  down: {
    label: "متوقف",
    dot: "bg-error",
    note: "الخدمة موقوفة، وإحنا نشتغل عليها.",
  },
};

/* أجزاء الخدمة — كل جزء بحالته، فالطالب يعرف أي شيء يقدر يسويه. */
const PARTS: { name: string; level: Level; note?: string }[] = [
  { name: "الشرح الصوتي", level: "ok" },
  { name: "السبورة والشرائح", level: "ok" },
  { name: "الدخول والتسجيل", level: "ok" },
  { name: "الدفع والاشتراك", level: "ok" },
];

const OVERALL: Level = "ok";
const CHECKED_AT = "23 أغسطس 2026 · 4:20 مساءً";

/* سجل الأعطال — الشفافية تبني ثقة أكثر مما تكسر. */
const HISTORY: {
  date: string;
  title: string;
  minutes: number;
  what: string;
}[] = [
  {
    date: "11 أغسطس 2026",
    title: "الشرح الصوتي متقطّع",
    minutes: 47,
    what: "مزوّد المعالجة الصوتية تعطّل عنده تحديث. الجلسات المتأثرة رجعت من نفس الموضوع، وما انخصمت دقائقها.",
  },
  {
    date: "2 أغسطس 2026",
    title: "بطء في فتح الشرائح",
    minutes: 26,
    what: "ضغط على خادم الملفات وقت الاختبارات النهائية. زدنا السعة ووضعنا حدًّا يمنع تكراره.",
  },
  {
    date: "19 يوليو 2026",
    title: "صيانة مجدولة",
    minutes: 90,
    what: "تحديث الخوادم، وكان معلَنًا قبلها بيومين.",
  },
];

export default function StatusPage() {
  const overall = LEVELS[OVERALL];

  return (
    <PageShell withFooter>
      <SiteHeader />

      <Section className="pt-10 pb-16 md:pt-14">
        <div className="max-w-measure">
          <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
            حالة النظام
          </h1>

          {/* الحالة العامة — رقم واحد بارز بلغة هذه الشاشة */}
          <div className="mt-6 rounded-xl border border-line bg-surface p-5 md:p-6">
            <p className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`h-3 w-3 shrink-0 rounded-pill ${overall.dot}`}
              />
              <span className="font-display text-2xl font-bold text-ink md:text-3xl">
                {overall.label}
              </span>
            </p>
            <p className="mt-2 leading-base text-ink-2">{overall.note}</p>
            <p className="mt-3 text-sm text-ink-2">
              آخر فحص: {CHECKED_AT} · نفحص كل دقيقة.
            </p>
          </div>

          {/* أجزاء الخدمة */}
          <h2 className="mt-10 text-xl font-bold text-ink md:text-2xl">
            أجزاء الخدمة
          </h2>

          <ul className="mt-3 overflow-hidden rounded-xl border border-line bg-surface">
            {PARTS.map((p) => {
              const l = LEVELS[p.level];
              return (
                <li
                  key={p.name}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 last:border-0"
                >
                  <span className="font-semibold text-ink">{p.name}</span>

                  {/* الحالة نصّ ولون لا لونًا وحده */}
                  <span className="flex items-center gap-2 text-sm text-ink-2">
                    <span
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 shrink-0 rounded-pill ${l.dot}`}
                    />
                    {l.label}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* سجل الأعطال */}
          <h2 className="mt-10 text-xl font-bold text-ink md:text-2xl">
            الأعطال السابقة
          </h2>
          <p className="mt-2 leading-base text-ink-2">
            كل عطل صار عندنا، ومدته، ووش سوّينا عشان ما يتكرّر.
          </p>

          <ol className="mt-5 flex flex-col gap-5">
            {HISTORY.map((h) => (
              <li key={h.date} className="border-t border-line pt-5">
                <p className="text-sm font-semibold text-ink-2">{h.date}</p>
                <p className="mt-1 font-bold text-ink">
                  {h.title} · {h.minutes} دقيقة
                </p>
                <p className="mt-2 leading-base text-ink-2">{h.what}</p>
              </li>
            ))}
          </ol>

          <p className="mt-8 leading-base text-ink-2">
            تشوف مشكلة مو مذكورة هنا؟{" "}
            <Link
              href="/contact"
              className="font-semibold text-pressable underline underline-offset-4"
            >
              بلّغنا
            </Link>{" "}
            — أول بلاغ يوصلنا يفتح لنا العطل.
          </p>

          <div className="mt-8">
            <QuietLink href="/faq">الأسئلة الشائعة</QuietLink>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
