import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CourseCardBody } from "@/app/[locale]/courses/course-card";
import { TONES, slugOf } from "@/lib/data/catalog";
import { GearIcon } from "@/components/becan/icons";
import { Copy, GhostButton, PageShell } from "@/components/becan/kit";
import { enrolledCourses, type EnrolledCourse } from "@/lib/data/home";

/* الشاشة ٨ — الداشبورد `/home`، مقصور على المقررات المسجَّلة. */

export async function HomeView({ name }: { name: string }) {
  const t = await getTranslations("Home");
  const courses = enrolledCourses();

  return (
    <PageShell>
      {/* التحية من الحساب والإعدادات فقط — لا إشعارات ولا بحث */}
      <header className="mx-auto flex w-full max-w-page items-center justify-between gap-3 px-4 pt-5 pb-2 md:px-8 xl:px-10">
        <p className="min-w-0 break-words text-ink"><Copy>{t("greeting", { name })}</Copy></p>
        <Link
          href="/settings"
          aria-label={t("settings")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-2 transition-colors hover:bg-surface hover:text-ink"
        >
          <GearIcon />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-page px-4 pt-4 pb-16 md:px-8 xl:px-10">
        <h1 className="font-display text-3xl leading-tight font-bold text-ink md:text-4xl">
          {t("title")}
        </h1>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <li key={c.code}>
              <EnrolledCard c={c} />
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <GhostButton href="/courses">{t("add")}</GhostButton>
        </div>
      </main>
    </PageShell>
  );
}

/* البطاقة هي بطاقة /courses نفسها — نفس الجسم من `CourseCardBody`
   لا نسخةً منه.

   والمقرر الذي لم تجهز فصوله لا يُخفى: تظهر بوسم «قريبًا» ولا
   تكون رابطًا، فالضغط لا يعد بما ليس موجودًا. */

async function EnrolledCard({ c }: { c: EnrolledCourse }) {
  const t = await getTranslations("Home");
  const tone = TONES[c.course.tone];
  const shell = `group relative flex min-h-36 flex-col justify-between overflow-hidden rounded-lg border p-3 shadow-soft ${tone.card}`;

  if (c.soon) {
    return (
      <div className={`${shell} opacity-60`}>
        <CourseCardBody course={c.course} />
        <span
          className={`relative mt-2 w-fit rounded-pill border px-2 py-0.5 text-[11px] font-semibold ${tone.chip}`}
        >
          {t("soon")}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={`/c/${slugOf(c.code)}`}
      className={`${shell} transition-transform duration-200 hover:-translate-y-1 hover:shadow-lift`}
    >
      <CourseCardBody course={c.course} />
    </Link>
  );
}
