import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { localize } from "@/i18n/localized";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import {
  GhostButton,
  PageShell,
  PrimaryButton,
  QuietLink,
  Section,
  SiteHeader,
} from "@/components/becan/kit";
import { resumePoint } from "@/lib/data/home";
import { planById } from "@/lib/data/plans";

export async function generateMetadata({ params }: PageProps<"/[locale]/checkout/result">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Checkout.Result" });
  return { title: t("metadataTitle") };
}

/* P3 — نتيجة الدفع.

   ثلاث حالات تُعايَن بـ`?s=`. وكلها تلتزم قاعدة شاشات الخطأ العامة:
   **ماذا حدث · لماذا · ماذا تفعل الآن** — والجزء الثالث شرط قبول،
   فشاشةٌ بلا فعلٍ ممكن مرفوضة.

   الفشل يذكر **سببًا محدّدًا** لا «حدث خطأ»: الطالب لا يستطيع تصحيح
   ما لا يعرفه. والسبب يأتي من البوابة في الإنتاج، ويُعايَن هنا بـ`?r=`.

   النجاح **يعيده إلى ما كان يفعله** لا إلى الصفحة الرئيسية — ودفع
   وسط المذاكرة يعني أن الفصل ما زال مفتوحًا في ذهنه. */

const STATES = ["success", "failed", "pending"] as const;
type ResultState = (typeof STATES)[number];

const isState = (v: unknown): v is ResultState =>
  typeof v === "string" && (STATES as readonly string[]).includes(v);

/* أسباب الرفض التي تصل من بوابات الدفع — كلٌّ بفعله الممكن.
   `unknown` ليس «حدث خطأ»: يقول ما يعرفه ويحيل إلى البنك. */
const REASONS = {
  declined: {
    why: "declinedWhy",
    fix: "declinedFix",
  },
  funds: {
    why: "fundsWhy",
    fix: "fundsFix",
  },
  expired: {
    why: "expiredWhy",
    fix: "expiredFix",
  },
  online: {
    why: "onlineWhy",
    fix: "onlineFix",
  },
} as const;

const FALLBACK = REASONS.declined;

export default async function ResultPage(props: PageProps<"/[locale]/checkout/result">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const sp = await props.searchParams;
  const rawState = Array.isArray(sp.s) ? sp.s[0] : sp.s;
  const rawPlan = Array.isArray(sp.plan) ? sp.plan[0] : sp.plan;
  const rawReason = Array.isArray(sp.r) ? sp.r[0] : sp.r;

  const state: ResultState = isState(rawState) ? rawState : "success";
  const plan = planById(rawPlan ?? "") ?? planById("pro")!;
  const reason = Object.hasOwn(REASONS, rawReason ?? "") ? REASONS[rawReason as keyof typeof REASONS] : FALLBACK;
  const resume = resumePoint();

  return (
    <PageShell withFooter>
      <SiteHeader minimal />

      <Section className="pt-12 pb-16 md:pt-16">
        <div className="mx-auto w-full max-w-[34rem]">
          {state === "success" ? (
            <Success plan={localize(plan.name, locale)} minutes={plan.minutes} resume={resume} />
          ) : state === "failed" ? (
            <Failed planId={plan.id} reason={reason} />
          ) : (
            <Pending resume={resume} />
          )}
        </div>
      </Section>
    </PageShell>
  );
}

/* ————— نجاح ————— */

async function Success({
  plan,
  minutes,
  resume,
}: {
  plan: string;
  minutes: number;
  resume: ReturnType<typeof resumePoint>;
}) {
  const t = await getTranslations("Checkout.Result");
  const locale = await getLocale();
  return (
    <div>
      {/* رقم واحد بارز: الحصّة الجديدة — لا لوحة إحصائيات */}
      <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
        {t("successTitle")}
      </h1>

      <p className="mt-4 leading-base text-ink-2">
        {t("successBody", { plan, minutes, minutesLabel: String(minutes) })}
      </p>

      {/* الفعل الوحيد: يرجعه إلى الفصل الذي كان فيه، لا إلى الرئيسية */}
      {resume ? (
        <div className="mt-8">
          <p className="text-sm font-semibold text-ink-2">{t("resumeLabel")}</p>
          <p className="mt-1 text-lg font-bold text-ink">
            {t("resumeChapter", { course: localize(resume.courseName, locale), number: String(resume.chapterNo), title: localize(resume.chapterTitle, locale) })}
          </p>

          <PrimaryButton
            href={`/session/${resume.slug}/${resume.chapterNo}`}
            className="mt-5 w-full sm:w-fit"
          >
            {t("resume")}
          </PrimaryButton>
        </div>
      ) : (
        <PrimaryButton href="/home" className="mt-8 w-full sm:w-fit">
          {t("home")}
        </PrimaryButton>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-6">
        <QuietLink href="/settings/invoices">{t("invoice")}</QuietLink>
        <QuietLink href="/settings/subscription">{t("subscription")}</QuietLink>
      </div>
    </div>
  );
}

/* ————— فشل ————— */

async function Failed({
  planId,
  reason,
}: {
  planId: string;
  reason: (typeof REASONS)[keyof typeof REASONS];
}) {
  const t = await getTranslations("Checkout.Result");
  return (
    <div>
      {/* ماذا حدث */}
      <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
        {t("failedTitle")}
      </h1>

      {/* لماذا — سبب محدّد، والأحمر لدلالة الخطأ وحدها */}
      <p className="mt-4 text-lg font-semibold text-error">{t(reason.why)}</p>

      {/* ماذا تفعل الآن */}
      <p className="mt-3 leading-base text-ink-2">{t(reason.fix)}</p>

      <p className="mt-4 leading-base text-ink-2">
        {t("unchanged")}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <PrimaryButton
          href={`/checkout?plan=${planId}`}
          className="w-full sm:w-fit"
        >
          {t("retry")}
        </PrimaryButton>

        <GhostButton href={`/checkout?plan=${planId}`}>
          {t("anotherMethod")}
        </GhostButton>
      </div>

      <p className="mt-6 text-sm text-ink-2">
        {t.rich("help", { contact: (chunks) => <Link href="/contact" className="font-semibold text-pressable underline underline-offset-4">{chunks}</Link> })}
      </p>
    </div>
  );
}

/* ————— معلّق ————— */

async function Pending({ resume }: { resume: ReturnType<typeof resumePoint> }) {
  const t = await getTranslations("Checkout.Result");
  const locale = await getLocale();
  return (
    <div>
      {/* ماذا حدث · لماذا — بلا لون خطأ: هذه ليست حالة خطأ */}
      <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
        {t("pendingTitle")}
      </h1>

      <p className="mt-4 leading-base text-ink-2">
        {t("pendingBody")}
      </p>

      {/* ماذا تفعل الآن — ما يستطيع فعله بخطته الحالية، لا انتظارًا فارغًا */}
      <section className="mt-8 rounded-xl bg-tint-amber p-5">
        <h2 className="text-lg font-bold text-ink">{t("continueTitle")}</h2>
        <p className="mt-2 leading-base text-ink-2">
          {resume
            ? t("pendingResume", { course: localize(resume.courseName, locale), number: String(resume.chapterNo) })
            : t("pendingDefault")}
        </p>
      </section>

      {resume ? (
        <PrimaryButton
          href={`/session/${resume.slug}/${resume.chapterNo}`}
          className="mt-6 w-full sm:w-fit"
        >
          {t("resume")}
        </PrimaryButton>
      ) : (
        <PrimaryButton href="/home" className="mt-6 w-full sm:w-fit">
          {t("home")}
        </PrimaryButton>
      )}

      <div className="mt-6">
        <QuietLink href="/settings/subscription">{t("status")}</QuietLink>
      </div>
    </div>
  );
}
