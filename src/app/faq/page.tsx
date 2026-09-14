import type { Metadata } from "next";
import { PageShell, QuietLink, Section, SiteHeader } from "@/components/becan/kit";
import { FaqView } from "./faq-view";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة — بيكان",
};

export default function FaqPage() {
  return (
    <PageShell withFooter>
      <SiteHeader />

      <Section className="pt-10 pb-16 md:pt-14">
        <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
          الأسئلة الشائعة
        </h1>
        <p className="mt-3 max-w-measure leading-base text-ink-2">
          ابحث عن سؤالك، وإذا ما لقيته راسلنا ونضيفه.
        </p>

        <div className="mt-8">
          <FaqView />
        </div>

        <div className="mt-12">
          <QuietLink href="/contact">ما لقيت جوابك؟ راسلنا</QuietLink>
        </div>
      </Section>
    </PageShell>
  );
}
