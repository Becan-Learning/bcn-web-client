import type { Metadata } from "next";
import Link from "next/link";
import { DocPage, P, Points, type DocSection } from "@/components/becan/doc-page";

export const metadata: Metadata = {
  title: "ملفات تعريف الارتباط — بيكان",
};

/* L4 — ملفات تعريف الارتباط.

   ⚠️ الجدول يصف ما نستعمله فعلًا اليوم. أي أداة تحليلات أو إعلانات
   تُضاف لاحقًا يجب أن تُضاف إلى هذه الصفحة في نفس الدفعة — صفحة
   ارتباطات لا تطابق ما يحمّله الموقع أسوأ من غيابها. */

const SECTIONS: DocSection[] = [
  {
    id: "what",
    title: "وش هي",
    body: (
      <P>
        ملفات صغيرة يحفظها متصفّحك عشان يتذكّر إنك داخل على حسابك، ويتذكّر
        تفضيلاتك بين الزيارات. بلاها تحتاج تسجّل دخول من جديد كل مرة تفتح فيها
        صفحة.
      </P>
    ),
  },
  {
    id: "kinds",
    title: "وش نستعمل منها",
    body: (
      <>
        <P>ثلاثة أنواع فقط، وكلها ضرورية لتشغيل الخدمة:</P>
        <Points
          items={[
            "جلسة الدخول: تبقيك مسجّلًا حتى تخرج بنفسك. تنتهي بعد 30 يومًا من آخر استعمال.",
            "تفضيلاتك: سرعة الشرح وشكل الاختبار وآخر مقرر فتحته، عشان ما تعيد ضبطها كل مرة.",
            "الأمان: تمنع إرسال طلبات من مواقع ثانية باسمك، وتنتهي بانتهاء الجلسة.",
          ]}
        />
        <P>
          <span className="font-semibold text-ink">
            ما نستعمل ارتباطات إعلانية ولا تتبّعًا عبر المواقع
          </span>
          ، وما نبيع بياناتك لأحد. عشان كذا ما تشوف عندنا نافذة موافقة تلاحقك في
          كل صفحة.
        </P>
      </>
    ),
  },
  {
    id: "control",
    title: "كيف تتحكّم فيها",
    body: (
      <>
        <P>
          تقدر تحذفها أو تمنعها من إعدادات متصفّحك في أي وقت. لكن منع ارتباطات
          الدخول يعني إنك ما تقدر تسجّل دخول ولا تكمّل جلسة — الخدمة نفسها
          تحتاجها.
        </P>
        <P>
          وإذا تبي تمسح كل شيء يخصّك عندنا، فذلك من{" "}
          <Link
            href="/settings/data"
            className="font-semibold text-pressable underline underline-offset-4"
          >
            بياناتك
          </Link>{" "}
          لا من المتصفّح.
        </P>
      </>
    ),
  },
  {
    id: "more",
    title: "المزيد",
    body: (
      <P>
        تفاصيل ما نجمعه عنك وكيف نستعمله في{" "}
        <Link
          href="/privacy"
          className="font-semibold text-pressable underline underline-offset-4"
        >
          سياسة الخصوصية
        </Link>
        .
      </P>
    ),
  },
];

export default function CookiesPage() {
  return (
    <DocPage
      title="ملفات تعريف الارتباط"
      updated="23 أغسطس 2026"
      lede="ثلاثة أنواع، كلها لتشغيل حسابك. ولا واحد منها للإعلانات."
      sections={SECTIONS}
    />
  );
}
