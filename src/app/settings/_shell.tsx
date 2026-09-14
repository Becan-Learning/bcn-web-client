import Link from "next/link";
import { ArrowForward } from "@/components/becan/icons";
import { PageShell, Section, SiteHeader } from "@/components/becan/kit";

/* تخطيط الإعدادات الموحَّد — الاشتراك والفواتير معه في نفس القشرة.

   الطالب لا يفصل «إعدادات» عن «اشتراك»: كلاهما «حسابي». وفصلهما إلى
   قشرتين يعني قائمتَي تنقّل متشابهتين في المنتج نفسه.

   **قائمة أقسام على الجوال، وعمودان على الديسكتوب** كما يطلب البريف:
   `/settings` هي القائمة، وكل قسم صفحته. وعلى الديسكتوب تسكن القائمة
   في عمود جانبي ملازم، وعلى الجوال يعود منها برابط رجوع واحد. */

export type SectionId =
  "account" | "study" | "notifications" | "subscription" | "invoices" | "data";

export const SETTINGS_SECTIONS: {
  id: SectionId;
  href: string;
  label: string;
  hint: string;
}[] = [
  {
    id: "account",
    href: "/settings/account",
    label: "الحساب",
    hint: "اسمك وبريدك وجامعتك",
  },
  {
    id: "study",
    href: "/settings/study",
    label: "تفضيلات المذاكرة",
    hint: "سرعة الشرح وشكل الاختبار",
  },
  {
    id: "notifications",
    href: "/settings/notifications",
    label: "الإشعارات",
    hint: "واتساب والبريد، كل نوع بمفتاحه",
  },
  {
    id: "subscription",
    href: "/settings/subscription",
    label: "الاشتراك",
    hint: "خطتك ودقائقك والتجديد",
  },
  {
    id: "invoices",
    href: "/settings/invoices",
    label: "الفواتير",
    hint: "سجل مدفوعاتك بالضريبة مفصولة",
  },
  {
    id: "data",
    href: "/settings/data",
    label: "بياناتك",
    hint: "تنزيل بياناتك أو حذف حسابك",
  },
];

export function SettingsShell({
  active,
  title,
  lede,
  children,
}: {
  active: SectionId;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <PageShell>
      <SiteHeader />

      <Section className="pt-8 pb-16 md:pt-12">
        {/* رجوع على الجوال حيث لا عمود جانبي — السهم مقلوب فيشير إلى البداية */}
        <Link
          href="/settings"
          className="inline-flex min-h-11 items-center gap-2 font-semibold text-ink-2 md:hidden"
        >
          <ArrowForward className="h-4 w-4 rotate-180" />
          الإعدادات
        </Link>

        <div className="md:grid md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10">
          <nav aria-label="أقسام الإعدادات" className="hidden md:block">
            <p className="font-display text-2xl font-bold text-ink">
              الإعدادات
            </p>

            <ul className="mt-4 flex flex-col gap-1">
              {SETTINGS_SECTIONS.map((s) => {
                const on = s.id === active;
                /* الصنف يُبنى شرطيًا لا بتكديس صنفين متساويي الأولوية */
                return (
                  <li key={s.id}>
                    <Link
                      href={s.href}
                      aria-current={on ? "page" : undefined}
                      className={`flex min-h-11 items-center rounded-md px-3 font-semibold ${
                        on ? "bg-tint-aubergine text-ink" : "text-ink-2"
                      }`}
                    >
                      {s.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-6 md:mt-0">
            <h1 className="font-display text-3xl leading-tight font-bold text-ink md:text-4xl">
              {title}
            </h1>
            {lede ? (
              <p className="mt-3 max-w-measure leading-base text-ink-2">
                {lede}
              </p>
            ) : null}

            <div className="mt-8">{children}</div>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}

/** بطاقة داخل قسم — حدّ خفيف وسطح أبيض، بلا ظلال ثقيلة. */
export function SettingsCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-line bg-surface p-5 md:p-6 ${className}`}
    >
      {title ? (
        <h2 className="text-lg font-bold text-ink md:text-xl">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}
