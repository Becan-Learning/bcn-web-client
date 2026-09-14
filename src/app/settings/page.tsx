import type { Metadata } from "next";
import Link from "next/link";
import { ArrowForward } from "@/components/becan/icons";
import { PageShell, Section, SiteHeader } from "@/components/becan/kit";
import { SETTINGS_SECTIONS } from "./_shell";

export const metadata: Metadata = {
  title: "الإعدادات — بيكان",
};

/* فهرس الإعدادات — هو نفسه «قائمة الأقسام على الجوال» التي يطلبها
   البريف، ويصير على الديسكتوب عمودًا جانبيًا ملازمًا داخل كل قسم. */

export default function SettingsIndexPage() {
  return (
    <PageShell>
      <SiteHeader />

      <Section className="pt-10 pb-16 md:pt-14">
        <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
          الإعدادات
        </h1>

        <ul className="mt-8 grid max-w-page gap-3 md:grid-cols-2">
          {SETTINGS_SECTIONS.map((s) => (
            <li key={s.id}>
              <Link
                href={s.href}
                className="flex min-h-16 items-center justify-between gap-4 rounded-xl border border-line bg-surface p-5"
              >
                <span>
                  <span className="block font-semibold text-ink">
                    {s.label}
                  </span>
                  <span className="mt-1 block text-sm text-ink-2">
                    {s.hint}
                  </span>
                </span>

                {/* السهم يشير إلى نهاية السطر — يسارًا في RTL */}
                <ArrowForward className="h-4 w-4 shrink-0 text-ink-2" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </PageShell>
  );
}
