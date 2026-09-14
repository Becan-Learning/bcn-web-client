import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  chaptersOf,
  courseBySlug,
  readyCount,
  slugOf,
} from "@/lib/data/catalog";
import {
  GhostButton,
  PageShell,
  PrimaryButton,
  Section,
} from "@/components/becan/kit";
import { ArrowForward } from "@/components/becan/icons";
import { FeedbackForm } from "./feedback-form";

/* الشاشة ٩ — ملخص الجلسة.

   **فاتحة** لا داكنة: الجلسة انتهت، والخروج منها إلى السطح الفاتح
   هو ما يجعل دخولها يُحسّ كدخول غرفة مذاكرة (النمط ٩).

   هدفها الوحيد: يشعر أنه أنجز شيئًا محسوسًا، ويعرف موقعه من
   الاختبار. والعدّاد يُعرض هنا لا يُكتشف في الداشبورد — الإلحاح
   يضرب في اللحظة الأقوى: نهاية جلسة ناجحة.

   الحالات الأربع تُعايَن بـ`?s=`. */

export const metadata: Metadata = {
  title: "ملخص الجلسة — بيكان",
};

const STATES = ["done", "clean", "cut", "last", "nodate"] as const;
type SummaryState = (typeof STATES)[number];

const isState = (v: unknown): v is SummaryState =>
  typeof v === "string" && (STATES as readonly string[]).includes(v);

/* بيانات عرض حتى يصل حساب حقيقي — الأيام والتعثّر والتغطية. */
const DAYS_LEFT = 9;
const COVERED = { topics: 4, of: 12 };
const STUMBLES = ["تعريف الأصل", "الفرق بين السيطرة والملكية"];
const PENALTY = "تكتب «تملكه» بدل «تسيطر عليه»";

export default async function SummaryPage(
  props: PageProps<"/session/[code]/[n]/done">,
) {
  const { code, n } = await props.params;
  const sp = await props.searchParams;
  const raw = Array.isArray(sp.s) ? sp.s[0] : sp.s;
  const state: SummaryState = isState(raw) ? raw : "done";
  /* تصل من الجلسة الحقيقية: اسم غرفة LiveKit للتقييم، وبلوغ الحدّ الزمني */
  const roomRaw = Array.isArray(sp.room) ? sp.room[0] : sp.room;
  const room = typeof roomRaw === "string" && roomRaw ? roomRaw : null;
  const hitLimit = (Array.isArray(sp.limit) ? sp.limit[0] : sp.limit) === "1";
  /* بعد جلسة حقيقية لا تُعرض أرقام العرض كأنها بيانات الطالب (النمط 4):
     لا عدّاد ولا تقدّم ولا تعثّر حتى يرسل الوكيل ملخّصًا. معاينة ?s= باقية. */
  const real = room !== null;

  const course = courseBySlug(code);
  if (!course) notFound();

  const chapter = chaptersOf(course.code).find((c) => String(c.n) === n);
  if (!chapter || !chapter.ready) notFound();

  const total = readyCount(course.code);
  const done = Math.min(chapter.n, total);
  const slug = slugOf(course.code);

  const cut = state === "cut";
  const last = state === "last";
  const noDate = state === "nodate";
  /* جلسة نظيفة: يُحذف قسم التعثّر ولا يُستبدل بمدح */
  const stumbles = real || state === "clean" || cut ? [] : STUMBLES;

  return (
    <PageShell>
      <Section className="flex flex-1 flex-col justify-center pt-10 pb-16 md:pt-14">
        <div className="w-full max-w-measure">
          {/* العدّاد — يُعرض هنا لا يُكتشف في الداشبورد.
              وبلا تاريخ محدَّد يصير سطرًا قابلًا للضغط لا كتلة. */}
          {real ? null : noDate ? (
            <Link
              href="/home"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-tint-amber px-4 py-2.5 font-semibold text-ink"
            >
              حدّد تاريخ اختبارك
              <ArrowForward className="h-4 w-4" />
            </Link>
          ) : (
            <p className="inline-flex items-center rounded-lg bg-tint-amber px-4 py-2.5 font-semibold text-ink">
              باقي {DAYS_LEFT} أيام على اختبار {course.name}
            </p>
          )}

          {/* الرقم الواحد البارز — ما أنجزه للتوّ */}
          <h1 className="mt-6 font-display text-4xl leading-tight font-bold tracking-tight text-ink md:text-5xl">
            {real
              ? `انتهت جلستك في الفصل ${chapter.n}`
              : cut
              ? `غطّيت ${COVERED.topics} من ${COVERED.of} موضوع`
              : last
                ? `خلّصت ${course.name} كاملة`
                : `خلّصت الفصل ${chapter.n}`}
          </h1>

          {real ? null : <Progress done={done} total={total} />}

          {/* الحدّ الزمني — كهرماني هادئ مع فعل ممكن، لا إنذار أحمر (النمط 7) */}
          {hitLimit ? (
            <p className="mt-6 rounded-lg bg-tint-amber px-4 py-3 leading-base text-ink">
              خلص وقت الجلسة المسموح. قيّم جلستك تحت، وتقدر تبدأ جلسة جديدة
              بعدها.
            </p>
          ) : null}

          {stumbles.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-ink-2">تعثّرت في:</h2>
              <ul className="mt-2 flex flex-col gap-1">
                {stumbles.map((s) => (
                  <li key={s} className="flex items-baseline gap-2 text-ink">
                    <span aria-hidden="true" className="text-ink-2">
                      ·
                    </span>
                    {s}
                  </li>
                ))}
              </ul>

              {/* ما يفقد الدرجة — الجوزيّ حدًّا لا نصًّا */}
              <p className="mt-4 rounded-md border-s-4 border-s-warmth bg-tint-walnut px-4 py-3 text-ink">
                <span className="font-semibold">ما يفقد الدرجة: </span>
                {PENALTY}
              </p>
            </section>
          ) : null}

          {/* الأساسي يتبع الحالة: الجلسة المقطوعة تُكمَّل، وغيرها
              يذهب إلى الخطة (قرار المؤسس)، و«الفصل التالي» يبقى
              ثانويًا ظاهرًا ليكون تبديل الأولوية اختبارًا بضغطة. */}
          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {cut ? (
              <PrimaryButton
                href={`/session/${slug}/${chapter.n}`}
                className="w-full sm:w-fit"
              >
                كمّل الفصل
              </PrimaryButton>
            ) : (
              <PrimaryButton href="/home" className="w-full sm:w-fit">
                شوف خطتك
              </PrimaryButton>
            )}

            {last ? (
              <GhostButton href={`/c/${slug}`}>
                راجع اللي تعثّرت فيه
              </GhostButton>
            ) : chapter.n < total ? (
              <Link
                href={`/session/${slug}/${chapter.n + 1}`}
                className="group inline-flex min-h-11 items-center gap-2 px-2 font-semibold text-ink"
              >
                الفصل التالي
                <ArrowForward className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              </Link>
            ) : null}
          </div>

          {room ? <FeedbackForm room={room} /> : null}
        </div>
      </Section>
    </PageShell>
  );
}

function Progress({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="mt-4">
      <p className="text-ink-2">
        أنجزت {done} من {total} فصول
      </p>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`أنجزت ${done} من ${total} فصول`}
        className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-line"
      >
        <div
          className="h-full rounded-pill bg-aubergine-mid"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
