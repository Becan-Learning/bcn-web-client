import { getTranslations, setRequestLocale } from "next-intl/server";
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
import { getPlans } from "@/lib/plans/server";
import { planById } from "@/lib/plans/view";
import { whatsappHref } from "@/lib/data/support";
import { WhatsappIcon } from "@/components/becan/icons";

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

   **الدفع تجريبي حتى تتوفّر بوابة**، فالنجاح هنا شكر لا ترقية: نقول صراحةً
   إن الدفع المباشر على المنصة غير متاح الآن، ونحيله إلى خدمة العملاء على
   واتساب ليكمل الاشتراك (الكهرماني الأساسي، برسالة جاهزة فيها اسم الباقة
   إن عُرفت)، ونطمئنه أنه لم يُخصم شيء وباقته كما هي. «تصفّح المقررات»
   محدّد الإطار. والفشل والمعلّق لا يبلغهما إلا من يكتب `?s=` بنفسه.

   الصفحة مفتوحة للزائر. والباقة تُقرأ من الخادم؛ إن غابت أو تعذّرت
   قراءتها يبقى الشكر بلا اسم باقة. */

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
  const plans = await getPlans();
  const found = plans.ok ? planById(plans.plans, rawPlan ?? "") : undefined;
  /* الباقة المجانية لا تُدفع: لا تُسمّى هنا. */
  const plan = found && found.price > 0 ? found : undefined;
  const reason = Object.hasOwn(REASONS, rawReason ?? "") ? REASONS[rawReason as keyof typeof REASONS] : FALLBACK;

  return (
    <PageShell withFooter>
      <SiteHeader minimal />

      <Section className="pt-12 pb-16 md:pt-16">
        <div className="mx-auto w-full max-w-[34rem]">
          {state === "success" ? (
            <Success plan={plan ? localize(plan.name, locale) : null} />
          ) : state === "failed" ? (
            <Failed planId={plan?.id ?? null} reason={reason} />
          ) : (
            <Pending />
          )}
        </div>
      </Section>
    </PageShell>
  );
}

/* ————— نجاح ————— */

async function Success({ plan }: { plan: string | null }) {
  const t = await getTranslations("Checkout.Result");
  return (
    <div>
      <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
        {t("successTitle")}
      </h1>

      <p className="mt-4 leading-base font-semibold text-ink">{t("successDirect")}</p>
      <p className="mt-3 leading-base text-ink-2">
        {plan ? t("successContactPlan", { plan }) : t("successContact")}
      </p>
      <p className="mt-3 leading-base text-ink-2">{t("successNothing")}</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* الفعل الأول — الكهرماني الوحيد في الشاشة. رابط خارجي، فلا `PrimaryButton` (يمرّ بـ`Link` المترجَم). */}
        <a
          href={whatsappHref(plan ? t("whatsappMessagePlan", { plan }) : t("whatsappMessage"))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-pill bg-pressable px-8 text-lg font-semibold text-on-pressable transition-transform duration-200 hover:-translate-y-1 hover:shadow-lift sm:w-fit"
        >
          <WhatsappIcon className="h-6 w-6" />
          {t("whatsapp")}
        </a>

        <GhostButton href="/courses" className="w-full sm:w-fit">
          {t("browse")}
        </GhostButton>
      </div>

      <div className="mt-6">
        <QuietLink href="/plans">{t("backToPlans")}</QuietLink>
      </div>
    </div>
  );
}

/* ————— فشل ————— */

async function Failed({
  planId,
  reason,
}: {
  planId: string | null;
  reason: (typeof REASONS)[keyof typeof REASONS];
}) {
  const t = await getTranslations("Checkout.Result");
  /* بلا باقة معروفة لا رابط دفع لها: يرجع إلى الباقات يختار. */
  const retryHref = planId ? `/checkout?plan=${encodeURIComponent(planId)}` : "/plans";
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
          href={retryHref}
          className="w-full sm:w-fit"
        >
          {t("retry")}
        </PrimaryButton>

        <GhostButton href={retryHref}>
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

async function Pending() {
  const t = await getTranslations("Checkout.Result");
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
          {t("pendingDefault")}
        </p>
      </section>

      <PrimaryButton href="/home" className="mt-6 w-full sm:w-fit">
        {t("home")}
      </PrimaryButton>

      <div className="mt-6">
        <QuietLink href="/settings/subscription">{t("status")}</QuietLink>
      </div>
    </div>
  );
}
