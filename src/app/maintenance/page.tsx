import type { Metadata } from "next";
import { PageShell, QuietLink, Section, SiteHeader } from "@/components/becan/kit";

export const metadata: Metadata = {
  title: "صيانة — بيكان",
};

/* E4 — الصيانة.

   **الوقت المتوقع للعودة بالساعة، لا «قريبًا»**: الطالب الذي يذاكر
   ليلة اختبار يحتاج أن يقرّر — ينتظر أم يذاكر بطريقة ثانية. و«قريبًا»
   لا تُتيح له القرار.

   الساعة ثابتة لا محسوبة من `new Date()`: الحساب وقت الرسم يختلف بين
   الخادم والمتصفّح فينكسر الترطيب (مزلق مسجَّل في STATE). في الإنتاج
   تأتي من لوحة الصيانة نفسها. */

const BACK_AT = "2:00 صباحًا";
const BACK_IN = "ساعة ونصف";

export default function MaintenancePage() {
  return (
    <PageShell withFooter>
      <SiteHeader minimal />

      <Section className="pt-12 pb-16 md:pt-16">
        <div className="max-w-measure">
          {/* ماذا حدث */}
          <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
            بيكان تحت الصيانة
          </h1>

          {/* لماذا */}
          <p className="mt-4 leading-base text-ink-2">
            نحدّث الخوادم اللي تشغّل الشرح الصوتي. الخدمة موقوفة كاملة خلال
            التحديث، وحسابك ودقائقك واشتراكك ما تأثّر منها شيء.
          </p>

          {/* رقم واحد بارز: متى يرجع — بالساعة لا «قريبًا» */}
          <p className="mt-8 text-sm font-semibold text-ink-2">نرجع الساعة</p>
          <p className="font-display text-5xl leading-tight font-bold text-ink md:text-6xl">
            {BACK_AT}
          </p>
          <p className="mt-2 text-ink-2">بعد {BACK_IN} من الآن تقريبًا.</p>

          {/* ماذا تفعل الآن */}
          <div className="mt-8 flex flex-col items-start">
            <QuietLink href="/status">تابع حالة النظام</QuietLink>
            <QuietLink href="/contact">راسلنا لو أمرك مستعجل</QuietLink>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
