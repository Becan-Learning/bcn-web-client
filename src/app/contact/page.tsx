import type { Metadata } from "next";
import Link from "next/link";
import {
  PageShell,
  PrimaryButton,
  QuietLink,
  Section,
  SiteHeader,
} from "@/components/becan/kit";
import { ContactForm } from "./contact-form";
import { HOURS, WHATSAPP_SHOWN, whatsappHref } from "@/lib/data/support";

export const metadata: Metadata = {
  title: "تواصل معنا — بيكان",
};

/* H2 — تواصل معنا.

   **واتساب أولًا كزرّ أساسي**، والنموذج بديل احتياطي — لا العكس:
   الطالب السعودي يراسل على واتساب، وإجباره على نموذج بريد يعني
   ألّا يراسل.

   **أوقات الرد مذكورة صراحة** ولا وعد بـ«24/7»: الوعد الذي لا نفي
   به يكلّف ثقةً أكثر مما يكسبه الوعد نفسه.

   الرقم وأوقات الرد في `./support` — مصدر واحد يشاركه زرّ واتساب
   الطافي في كل صفحة. */

export default function ContactPage() {
  return (
    <PageShell withFooter>
      <SiteHeader />

      <Section className="pt-10 pb-16 md:pt-14">
        <div className="max-w-measure">
          <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
            تواصل معنا
          </h1>
          <p className="mt-3 leading-base text-ink-2">
            واتساب أسرع طريقة توصلنا فيها. وإذا تفضّل الكتابة، النموذج تحت.
          </p>

          {/* الفعل الأول — الكهرماني الوحيد في الشاشة */}
          <PrimaryButton
            href={whatsappHref("السلام عليكم، عندي سؤال عن بيكان")}
            className="mt-7 w-full sm:w-fit"
          >
            راسلنا على واتساب
          </PrimaryButton>

          <p className="mt-3 text-sm text-ink-2">
            <span dir="ltr">{WHATSAPP_SHOWN}</span>
          </p>

          {/* أوقات الرد — صريحة لا وعدًا عامًّا */}
          <dl className="mt-8 flex flex-col gap-3">
            {HOURS.map((h) => (
              <div
                key={h.channel}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line pt-3 first:border-0 first:pt-0"
              >
                <dt className="font-semibold text-ink">{h.channel}</dt>
                <dd className="text-ink-2">
                  {h.when} · نردّ {h.reply}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 leading-base text-ink-2">
            قبل ما تراسلنا، جواب سؤالك يمكن يكون في{" "}
            <Link
              href="/faq"
              className="font-semibold text-pressable underline underline-offset-4"
            >
              الأسئلة الشائعة
            </Link>
            . ولو الخدمة كلها واقفة، شوف{" "}
            <Link
              href="/status"
              className="font-semibold text-pressable underline underline-offset-4"
            >
              حالة النظام
            </Link>{" "}
            قبل — يمكن نكون نعرف ونشتغل عليها.
          </p>

          <div className="mt-12">
            <h2 className="text-xl font-bold text-ink md:text-2xl">
              أو اكتب لنا
            </h2>
            <p className="mt-2 leading-base text-ink-2">
              نردّ على نفس العنوان اللي تكتبه خلال يوم عمل.
            </p>

            <div className="mt-6">
              <ContactForm />
            </div>
          </div>

          <div className="mt-10">
            <QuietLink href="/faq">شوف الأسئلة الشائعة</QuietLink>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
