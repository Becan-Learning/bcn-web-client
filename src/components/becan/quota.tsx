import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowForward } from "./icons";
import { PrimaryButton } from "./kit";

/* P6 — «نفدت دقائقك».

   شاشة الإيراد الفعلية، وتظهر في أسوأ لحظة: منتصف مذاكرة ليلة
   اختبار. لهذا:

   - **كتلة لا نافذة**: لا تحجب الشاشة ولا تقطع الجلسة الجارية.
     الجلسة الحالية تُكمَل حتى نهايتها ثم يظهر الحدّ.
   - **كهرمانية لا حمراء**: الإلحاح كهرماني هادئ (النمط ٧)، والأحمر
     محجوز للخطأ.
   - **ما أنجزه قبل ما ينقصه**: «ذاكرت 60 دقيقة» تسبق ذكر الحدّ.
     العكس يقرأ كعقوبة.
   - **الترقية مربوطة بالاختبار القادم** لا بميزة مجرّدة.

   ممنوع فيها: «للأسف» · «انتهت صلاحيتك» · عدّاد تنازلي · أي أحمر. */

export function QuotaBlock({
  studied,
  chaptersLeft,
  price,
  minutes,
  /** الأساسي يكون في مكان آخر من الشاشة أحيانًا — عندها يهدأ زرّها */
  quiet,
}: {
  studied: number;
  chaptersLeft: number;
  price: number;
  minutes: number;
  quiet?: boolean;
}) {
  const t = useTranslations("Quota");
  const format = useFormatter();
  const number = (value: number) => format.number(value, { numberingSystem: "latn" });
  return (
    <section className="rounded-xl bg-tint-amber p-5 md:p-6">
      <h2 className="text-xl font-bold text-ink md:text-2xl">
        {t("title")}
      </h2>

      {/* الإنجاز أولًا ثم الحدّ، والحدّ مربوط بما ينتظره لا بميزة */}
      <p className="mt-3 max-w-measure leading-base text-ink-2">
        {t.rich("progress", {
          studied,
          studiedLabel: number(studied),
          chaptersLeft,
          chaptersLabel: number(chaptersLeft),
          strong: (chunks) => <span className="font-semibold text-ink">{chunks}</span>,
        })}
      </p>

      <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        {quiet ? (
          <Link
            href="/plans"
            className="inline-flex h-12 items-center justify-center rounded-pill border border-aubergine-mid px-6 font-semibold text-aubergine-base"
          >
            {t("continue", { price: number(price) })}
          </Link>
        ) : (
          <PrimaryButton href="/plans" className="w-full sm:w-fit">
            {t("continue", { price: number(price) })}
          </PrimaryButton>
        )}

        <Link
          href="/plans"
          className="group inline-flex min-h-11 items-center gap-2 px-2 font-semibold text-ink"
        >
          {t("plans")}
          <ArrowForward className="h-4 w-4 transition-transform duration-200 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
        </Link>
      </div>

      <p className="mt-3 text-sm text-ink-2">
        {t("allowance", { minutes, minutesLabel: number(minutes) })}
      </p>
    </section>
  );
}
