import { useFormatter, useTranslations } from "next-intl";
import { formatRenewalDate } from "@/lib/allowance/format";
import { Link } from "@/i18n/navigation";

/* حدود الاستخدام — كتلة لا نافذة، لا تقطع الحصة الجارية.

   - كهرمانية لا حمراء: إلحاح هادئ (النمط ٧)، والأحمر محجوز للخطأ.
   - ما أنجزه قبل ما ينقصه: نذكر المذاكرة أو التسجيل قبل الخطوة التالية.
   - روابط المقررات هادئة: يبقى زر كهرماني أساسي واحد للشاشة (النمط ٨).

   ممنوع فيها: «للأسف» · «انتهت صلاحيتك» · عدّاد تنازلي · سعر أو ترقية. */

export type HeldCourse = { id: string; name: string };

export type CourseSlotQuota = { courses: HeldCourse[]; limit: number };

type QuotaBlockProps = { id?: string } & (
  | { kind: "used-up"; minutesStudied: number; sessionsUsed: number; renewalDate: Date }
  | ({ kind: "slots-full" } & CourseSlotQuota)
);

export function QuotaBlock(props: QuotaBlockProps) {
  const t = useTranslations("Quota");
  const format = useFormatter();
  const number = (value: number) => format.number(value, { numberingSystem: "latn" });

  return (
    <section id={props.id} className="max-w-2xl scroll-mt-6 rounded-xl bg-tint-amber p-5 text-ink md:p-6">
      {props.kind === "used-up" ? (
        <>
          <p className="text-lg leading-base font-semibold">
            {t("usedUp.progress", {
              minutes: props.minutesStudied,
              minutesLabel: number(props.minutesStudied),
              sessions: props.sessionsUsed,
              sessionsLabel: number(props.sessionsUsed),
            })}
          </p>
          <p className="mt-3 leading-base text-ink-2">{t("usedUp.limit")}</p>
          <p className="mt-3 leading-base text-ink-2">{t("usedUp.renewal", { date: formatRenewalDate(format, props.renewalDate) })}</p>
        </>
      ) : (
        <>
          <p className="text-lg leading-base font-semibold">
            {t.rich("slotsFull.enrolled", {
              courses: () => <>{format.list(props.courses.map((course) => (
                <Link key={course.id} href={`/c/${course.id}`} dir="auto"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-1 underline underline-offset-4 hover:text-aubergine-base">
                  {course.name}
                </Link>
              )))}</>,
            })}
          </p>
          <p className="mt-3 max-w-measure leading-base text-ink-2">
            {t("slotsFull.rule", { count: props.limit, countLabel: number(props.limit) })}
          </p>
          <p className="mt-3 max-w-measure leading-base text-ink-2">
            {t("slotsFull.release", { count: props.courses.length })}
          </p>
        </>
      )}
    </section>
  );
}
