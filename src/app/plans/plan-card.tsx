import Link from "next/link";
import { PrimaryButton } from "@/components/becan/kit";
import { CURRENT_PLAN, type Plan } from "@/lib/data/plans";

/* بطاقة الخطة — مشتركة بين قسم الأسعار في اللاندينج وصفحة `/plans`،
   فلا يفترق شكل التسعير بين موضعين.

   **المميّزة سطحٌ باذنجانيّ معتم لا تعبئة خفيفة**: الحدّ الملوّن
   والتعبئة الفاتحة تُقرآن «مختلفة قليلًا»، والسطح المعتم يُقرأ
   «هذه هي». وترتفع درجةً على الديسكتوب بظلٍّ وإزاحة، فتُقرأ مرفوعة
   لا مجاورة.

   و`data-theme="dark"` عليها يقلب التوكنات إلى نسخها الداكنة — فالنصّ
   يصير فاتحًا والكهرماني يصير `--amber-bright` فيقرأ زرّها على
   الباذنجاني العميق بدل أن يذوب فيه. وهو نمط `CaptureBand` نفسه.

   **و`text-ink` مثبَّت على الغلاف**: النصّ داخل سمة الثيم يرث لون
   `body` لا لون السطح — مزلق مسجَّل في docs/STATE.md.

   **الرقم البارز عدد الدقائق**، وتحته ترجمتها إلى ساعات — الطالب لا
   يقيس مذاكرته بالدقيقة، والبريف يشترط الترجمة. وحُذف عدد الفصول
   بطلب صريح، وهو باقٍ في جدول المقارنة في `/plans`. */

export function PlanCard({
  plan,
  /** اللاندينج يقود إلى `/plans`، وصفحة الخطط تقود إلى الدفع */
  href,
  /** الوسم يظهر على المميّزة وحدها في اللاندينج، وعلى الكلّ في `/plans` */
  showBadge = true,
}: {
  plan: Plan;
  href: string;
  showBadge?: boolean;
}) {
  const featured = !!plan.featured;
  const current = plan.id === CURRENT_PLAN;
  const free = plan.price === 0;

  return (
    <div
      {...(featured ? { "data-theme": "dark" as const } : {})}
      className={`flex h-full flex-col rounded-xl p-6 md:p-8 ${
        featured
          ? "bg-aubergine-deep text-ink shadow-lift md:-translate-y-3"
          : "border border-line bg-surface text-ink"
      }`}
    >
      {/* الاسم والوسم — الوسم يحجز سطره دائمًا فلا تتفاوت البطاقات */}
      <div className="flex min-h-8 items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-ink">{plan.name}</h3>

        {current ? (
          <span className="shrink-0 rounded-pill border border-line px-3 py-1 text-xs font-semibold text-ink-2">
            خطتك الحالية
          </span>
        ) : showBadge && plan.badge ? (
          <span
            className={`shrink-0 rounded-pill px-3 py-1 text-xs font-semibold ${
              featured
                ? "bg-pressable text-on-pressable"
                : "border border-aubergine-mid text-aubergine-base"
            }`}
          >
            {plan.badge}
          </span>
        ) : null}
      </div>

      {/* السعر */}
      <p className="mt-5 flex items-baseline gap-2">
        <span className="font-display text-6xl leading-none font-bold text-ink">
          {plan.price}
        </span>
        <span className="text-ink-2">{free ? "" : "ريال / شهر"}</span>
      </p>
      <p className="mt-2 text-sm text-ink-2">
        {free ? "بلا بطاقة ولا اشتراك" : "شامل ضريبة القيمة المضافة"}
      </p>

      {/* الدقائق وترجمتها والمقررات — لا عدد فصول */}
      <div
        className={`mt-7 border-t pt-6 ${
          featured ? "border-aubergine-mid" : "border-line"
        }`}
      >
        <p className="font-display text-3xl leading-none font-bold text-ink">
          {plan.minutes}
          <span className="ms-2 text-base font-normal text-ink-2">
            دقيقة في الشهر
          </span>
        </p>
        {/* ترجمة الدقيقة إلى ساعات — الطالب لا يقيس مذاكرته بالدقيقة */}
        <p className="mt-2 text-sm text-ink-2">{plan.hours}</p>
        <p className="mt-4 font-semibold text-ink">{plan.courses}</p>
      </div>

      {/* الفعل — كهرماني على المميّزة وحدها */}
      <div className="mt-8 flex flex-1 items-end">
        {current ? (
          <span className="inline-flex h-14 w-full cursor-default items-center justify-center rounded-pill border border-line px-6 font-semibold text-ink-2">
            خطتك الحالية
          </span>
        ) : featured ? (
          <PrimaryButton href={href} className="w-full">
            اختر {plan.name}
          </PrimaryButton>
        ) : (
          <Link
            href={href}
            className="inline-flex h-14 w-full items-center justify-center rounded-pill border border-aubergine-mid px-6 font-semibold text-aubergine-base"
          >
            {free ? "ابدأ مجانًا" : `اختر ${plan.name}`}
          </Link>
        )}
      </div>
    </div>
  );
}
