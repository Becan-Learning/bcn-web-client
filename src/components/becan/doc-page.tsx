import { PageShell, Section, SiteHeader } from "./kit";

/* المجموعة ج — قشرة صفحات السياسات.

   تخطيط واحد مشترك للأربع: عنوان · تاريخ آخر تحديث ظاهر في الأعلى ·
   فهرس جانبي · نص بعرض ≤ 74 حرفًا.

   الفهرس على الجوال صندوق فوق النص، وعلى الديسكتوب عمود ملازم —
   مَرْكَبٌ واحد بصنفين، لا نسختان من نفس القائمة.

   الروابط إلى هذه الصفحات في الفوتر فقط لا في التنقّل الرئيسي:
   الطالب لا يبحث عنها إلا حين يحتاجها، وإظهارها فوق يزاحم ما يحتاجه. */

export type DocSection = {
  id: string;
  title: string;
  body: React.ReactNode;
};

export function DocPage({
  title,
  updated,
  lede,
  sections,
}: {
  title: string;
  /** تاريخ آخر تحديث — ظاهر في الأعلى، شرط في البريف */
  updated: string;
  lede?: string;
  sections: DocSection[];
}) {
  return (
    <PageShell withFooter>
      <SiteHeader />

      <Section className="pt-10 pb-16 md:pt-14">
        <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
          {title}
        </h1>

        <p className="mt-3 text-sm font-semibold text-ink-2">
          آخر تحديث: {updated}
        </p>

        {lede ? (
          <p className="mt-4 max-w-measure leading-base text-ink-2">{lede}</p>
        ) : null}

        <div className="mt-10 md:grid md:grid-cols-[14rem_minmax(0,1fr)] md:items-start md:gap-10">
          <nav
            aria-label="محتويات الصفحة"
            className="rounded-xl border border-line p-4 md:sticky md:top-6 md:rounded-none md:border-0 md:p-0"
          >
            <p className="text-sm font-semibold text-ink-2">المحتويات</p>

            <ol className="mt-2 flex flex-col">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex min-h-11 items-center font-semibold text-ink md:text-ink-2"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-8 max-w-measure md:mt-0">
            {sections.map((s) => (
              <section key={s.id} className="mt-10 first:mt-0">
                {/* scroll-mt كي لا يختفي العنوان تحت شريط الانقطاع حين يظهر */}
                <h2
                  id={s.id}
                  className="scroll-mt-20 text-xl font-bold text-ink md:text-2xl"
                >
                  {s.title}
                </h2>
                <div className="mt-3 flex flex-col gap-3">{s.body}</div>
              </section>
            ))}
          </div>
        </div>
      </Section>
    </PageShell>
  );
}

/** فقرة داخل صفحة سياسة — بارتفاع سطر النص العربي. */
export function P({ children }: { children: React.ReactNode }) {
  return <p className="leading-base text-ink-2">{children}</p>;
}

/** قائمة نقاط — للحقوق والبنود المعدودة. */
export function Points({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 ps-5 leading-base text-ink-2">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
