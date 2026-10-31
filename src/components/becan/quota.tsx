import { useFormatter, useTranslations } from "next-intl";
import { formatRenewalDate } from "@/lib/allowance/format";
import { Link } from "@/i18n/navigation";
import { whatsappHref } from "@/lib/data/support";
import { ArrowForward, WhatsappIcon } from "./icons";

/* حدود الاستخدام — كتلة لا نافذة، لا تقطع الحصة الجارية.

   - كهرمانية في الموقع، وسطح هادئ في الحصة؛ الأحمر محجوز للخطأ.
   - ما أنجزه قبل ما ينقصه: نذكر المذاكرة أو التسجيل قبل الخطوة التالية.
   - روابط المقررات هادئة: يبقى زر كهرماني أساسي واحد للشاشة (النمط ٨).
   - «استُهلكت الحدود» تشجّع على باقة أكبر بلا ضغط: «قارن الباقات» (الكهرماني الأساسي
     إلا إن كان في الشاشة كهرماني آخر فيصير محدّد الإطار: `primary={false}`) وواتساب
     بمحدّد الإطار. صياغة عامة «باقة أكبر» لأننا لا نعرف أهو على أعلى باقة.

   ممنوع فيها: «للأسف» · «انتهت صلاحيتك» · عدّاد تنازلي · أي سعر. */

export type HeldCourse = { id: string; name: string };

export type CourseSlotQuota = { courses: HeldCourse[]; limit: number };

type QuotaBlockProps = { id?: string; surface?: "site" | "session"; primary?: boolean } & (
  | { kind: "used-up"; minutesStudied: number; sessionsUsed: number; renewalDate: Date }
  | ({ kind: "slots-full" } & CourseSlotQuota)
);

const ARROW = "h-5 w-5 transition-transform duration-200 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1";

/* إجراءات الترقية — أنماط الزرّين تتبع السطح: الموقع بأزرار المجموعة،
   والحصة بأزرار الحصة (h-12 · border-line). */
function UpgradeActions({ surface, primary }: { surface: "site" | "session"; primary: boolean }) {
  const t = useTranslations("Quota");
  const session = surface === "session";
  const shape = session ? "h-12 px-6" : "h-14 px-8 text-lg";
  const solid = `group inline-flex ${shape} items-center justify-center gap-3 rounded-pill bg-pressable font-semibold text-on-pressable transition-transform duration-200 hover:-translate-y-1 hover:shadow-lift`;
  const outline = `group inline-flex ${shape} items-center justify-center gap-3 rounded-pill border font-semibold ${session ? "border-line text-ink" : "border-aubergine-mid text-aubergine-base"}`;

  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
      <Link href="/plans" className={primary ? solid : outline}>
        {t("usedUp.compare")}
        <ArrowForward className={ARROW} />
      </Link>
      <a href={whatsappHref(t("usedUp.whatsappMessage"))} target="_blank" rel="noopener noreferrer" className={outline}>
        <WhatsappIcon className="h-5 w-5" />
        {t("usedUp.whatsapp")}
      </a>
    </div>
  );
}

export function QuotaBlock(props: QuotaBlockProps) {
  const t = useTranslations("Quota");
  const format = useFormatter();
  const number = (value: number) => format.number(value, { numberingSystem: "latn" });
  const skin = (props.surface ?? "site") === "session" ? "border border-line bg-panel" : "bg-tint-amber";

  return (
    <section id={props.id} className={`max-w-2xl scroll-mt-6 rounded-xl p-5 text-ink md:p-6 ${skin}`}>
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
          {props.surface === "session" ? (
            <p className="mt-3 leading-base text-ink-2">{t("usedUp.nextSession", { date: formatRenewalDate(format, props.renewalDate) })}</p>
          ) : (
            <>
              <p className="mt-3 leading-base text-ink-2">{t("usedUp.limit")}</p>
              <p className="mt-3 leading-base text-ink-2">{t("usedUp.renewal", { date: formatRenewalDate(format, props.renewalDate) })}</p>
            </>
          )}
          <p className="mt-3 leading-base text-ink-2">{t("usedUp.upgrade")}</p>
          <UpgradeActions surface={props.surface ?? "site"} primary={props.primary ?? true} />
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
