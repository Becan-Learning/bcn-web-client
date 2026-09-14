import type { Metadata } from "next";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: "نتيجة الدفع — بيكان",
};

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
const REASONS: Record<string, { why: string; fix: string }> = {
  declined: {
    why: "بنكك رفض العملية.",
    fix: "تواصل مع بنكك أو جرّب بطاقة ثانية — الرفض من عندهم لا من بيكان.",
  },
  funds: {
    why: "الرصيد لا يكفي المبلغ.",
    fix: "اشحن الحساب أو جرّب وسيلة ثانية، والخطة تبقى محجوزة لك.",
  },
  expired: {
    why: "البطاقة منتهية الصلاحية.",
    fix: "استخدم بطاقة سارية، أو ادفع من جوالك بلا كتابة أرقام.",
  },
  online: {
    why: "الشراء عبر الإنترنت غير مفعّل على بطاقتك.",
    fix: "فعّله من تطبيق بنكك — عادةً تحت «إعدادات البطاقة» — ثم أعد المحاولة.",
  },
};

const FALLBACK = REASONS.declined;

export default async function ResultPage(props: PageProps<"/checkout/result">) {
  const sp = await props.searchParams;
  const rawState = Array.isArray(sp.s) ? sp.s[0] : sp.s;
  const rawPlan = Array.isArray(sp.plan) ? sp.plan[0] : sp.plan;
  const rawReason = Array.isArray(sp.r) ? sp.r[0] : sp.r;

  const state: ResultState = isState(rawState) ? rawState : "success";
  const plan = planById(rawPlan ?? "") ?? planById("pro")!;
  const reason = REASONS[rawReason ?? ""] ?? FALLBACK;
  const resume = resumePoint();

  return (
    <PageShell withFooter>
      <SiteHeader minimal />

      <Section className="pt-12 pb-16 md:pt-16">
        <div className="mx-auto w-full max-w-[34rem]">
          {state === "success" ? (
            <Success plan={plan.name} minutes={plan.minutes} resume={resume} />
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

function Success({
  plan,
  minutes,
  resume,
}: {
  plan: string;
  minutes: number;
  resume: ReturnType<typeof resumePoint>;
}) {
  return (
    <div>
      {/* رقم واحد بارز: الحصّة الجديدة — لا لوحة إحصائيات */}
      <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
        تمت الترقية
      </h1>

      <p className="mt-4 leading-base text-ink-2">
        صرت على خطة {plan} — {minutes} دقيقة شهريًا، وكل مقرراتك مفتوحة. وصلتك
        الفاتورة على بريدك.
      </p>

      {/* الفعل الوحيد: يرجعه إلى الفصل الذي كان فيه، لا إلى الرئيسية */}
      {resume ? (
        <div className="mt-8">
          <p className="text-sm font-semibold text-ink-2">كنت في</p>
          <p className="mt-1 text-lg font-bold text-ink">
            {resume.courseName} · الفصل {resume.chapterNo} —{" "}
            {resume.chapterTitle}
          </p>

          <PrimaryButton
            href={`/session/${resume.slug}/${resume.chapterNo}`}
            className="mt-5 w-full sm:w-fit"
          >
            كمّل من وين وقفت
          </PrimaryButton>
        </div>
      ) : (
        <PrimaryButton href="/home" className="mt-8 w-full sm:w-fit">
          ارجع لمقرراتك
        </PrimaryButton>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-6">
        <QuietLink href="/settings/invoices">شوف فاتورتك</QuietLink>
        <QuietLink href="/settings/subscription">إدارة الاشتراك</QuietLink>
      </div>
    </div>
  );
}

/* ————— فشل ————— */

function Failed({
  planId,
  reason,
}: {
  planId: string;
  reason: { why: string; fix: string };
}) {
  return (
    <div>
      {/* ماذا حدث */}
      <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
        ما تمّ الدفع
      </h1>

      {/* لماذا — سبب محدّد، والأحمر لدلالة الخطأ وحدها */}
      <p className="mt-4 text-lg font-semibold text-error">{reason.why}</p>

      {/* ماذا تفعل الآن */}
      <p className="mt-3 leading-base text-ink-2">{reason.fix}</p>

      <p className="mt-4 leading-base text-ink-2">
        ما انخصم منك شيء، وخطتك ما تغيّرت.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <PrimaryButton
          href={`/checkout?plan=${planId}`}
          className="w-full sm:w-fit"
        >
          حاول مرة ثانية
        </PrimaryButton>

        <GhostButton href={`/checkout?plan=${planId}`}>
          جرّب وسيلة ثانية
        </GhostButton>
      </div>

      <p className="mt-6 text-sm text-ink-2">
        تكرّر معك؟{" "}
        <Link
          href="/contact"
          className="font-semibold text-pressable underline underline-offset-4"
        >
          راسلنا على واتساب
        </Link>{" "}
        ونتابعها معك.
      </p>
    </div>
  );
}

/* ————— معلّق ————— */

function Pending({ resume }: { resume: ReturnType<typeof resumePoint> }) {
  return (
    <div>
      {/* ماذا حدث · لماذا — بلا لون خطأ: هذه ليست حالة خطأ */}
      <h1 className="font-display text-4xl leading-tight font-bold text-ink md:text-5xl">
        الدفع قيد المعالجة
      </h1>

      <p className="mt-4 leading-base text-ink-2">
        بنكك يراجع العملية، وهذا يستغرق دقائق. نبلّغك على واتساب وعلى بريدك أول
        ما تكتمل، وما تحتاج تعيد المحاولة.
      </p>

      {/* ماذا تفعل الآن — ما يستطيع فعله بخطته الحالية، لا انتظارًا فارغًا */}
      <section className="mt-8 rounded-xl bg-tint-amber p-5">
        <h2 className="text-lg font-bold text-ink">تقدر تكمّل الحين</h2>
        <p className="mt-2 leading-base text-ink-2">
          {resume
            ? `دقائق خطتك الحالية باقية، وتقدر تكمّل ${resume.courseName} — الفصل ${resume.chapterNo} إلى أن يكتمل الدفع.`
            : "دقائق خطتك الحالية باقية، وتقدر تذاكر بها إلى أن يكتمل الدفع."}
        </p>
      </section>

      {resume ? (
        <PrimaryButton
          href={`/session/${resume.slug}/${resume.chapterNo}`}
          className="mt-6 w-full sm:w-fit"
        >
          كمّل من وين وقفت
        </PrimaryButton>
      ) : (
        <PrimaryButton href="/home" className="mt-6 w-full sm:w-fit">
          ارجع لمقرراتك
        </PrimaryButton>
      )}

      <div className="mt-6">
        <QuietLink href="/settings/subscription">تابع حالة الاشتراك</QuietLink>
      </div>
    </div>
  );
}
