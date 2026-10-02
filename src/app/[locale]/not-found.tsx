import type { Metadata } from "next";
import { PageShell, QuietLink, Section, SiteHeader } from "@/components/becan/kit";

export const metadata: Metadata = {
  title: "الصفحة مو موجودة — بيكان",
};

/* E1 — 404.

   ثلاثة أجزاء كقاعدة كل شاشات الخطأ: **ماذا حدث · لماذا · ماذا تفعل
   الآن**. والثالث شرط قبول — شاشة بلا فعل ممكن مرفوضة.

   بلا رسوم توضيحية ولا نكات: الطالب وصل هنا وهو يبحث عن شيء، والطرفة
   تؤخّره عنه. وبلا زرّ كهرماني: ثلاثة مخارج متساوية لا فعل واحد
   مرجَّح — لا نعرف أيّها كان يقصد. */

const WAYS = [
  { href: "/home", label: "مقرراتي" },
  { href: "/courses", label: "ابحث عن مقرر" },
  { href: "/", label: "الصفحة الرئيسية" },
];

export default function NotFound() {
  return (
    <PageShell>
      <SiteHeader />

      <Section className="pt-12 pb-16 md:pt-16">
        <div className="max-w-measure">
          {/* ماذا حدث */}
          <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
            الصفحة مو موجودة
          </h1>

          {/* لماذا */}
          <p className="mt-4 leading-base text-ink-2">
            الرابط اللي فتحته قديم، أو العنوان فيه حرف ناقص.
          </p>

          {/* ماذا تفعل الآن */}
          <nav aria-label="مخارج" className="mt-8 flex flex-col items-start">
            {WAYS.map((w) => (
              <QuietLink key={w.href} href={w.href}>
                {w.label}
              </QuietLink>
            ))}
          </nav>
        </div>
      </Section>
    </PageShell>
  );
}
