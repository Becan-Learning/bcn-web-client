import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CourseCardBody } from "@/app/[locale]/courses/course-card";
import { TONES } from "@/lib/courses/presentation";
import { GearIcon } from "@/components/becan/icons";
import { Copy, GhostButton, PageShell, PrimaryButton } from "@/components/becan/kit";
import type { Enrollment } from "@/lib/courses/schema";

/* الشاشة ٨ — الداشبورد `/home`، مقصور على المقررات المسجَّلة. */

export async function HomeView({ name, enrollments }: { name: string; enrollments: Enrollment[] | null }) {
  const t = await getTranslations("Home");

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

        {enrollments === null ? (
          <p role="alert" className="mt-6 text-error">{t("loadError")}</p>
        ) : enrollments.length === 0 ? (
          <div className="mt-6">
            <p className="text-ink-2">{t("empty")}</p>
            <PrimaryButton href="/courses" className="mt-6">{t("browseCourses")}</PrimaryButton>
          </div>
        ) : (
          <>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {enrollments.map((c) => (
                <li key={c.course.id}><EnrolledCard c={c} /></li>
              ))}
            </ul>
            <div className="mt-6"><GhostButton href="/courses">{t("add")}</GhostButton></div>
          </>
        )}
      </main>
    </PageShell>
  );
}

/* البطاقة هي بطاقة /courses نفسها، ويبقى المقرر غير المنشور رابطًا لإدارة التسجيل. */
async function EnrolledCard({ c }: { c: Enrollment }) {
  const t = await getTranslations("Home");
  const tone = TONES[c.course.tone];
  return (
    <Link
      href={`/c/${c.course.id}`}
      className={`group relative flex min-h-36 flex-col justify-between overflow-hidden rounded-lg border p-3 shadow-soft transition-transform duration-200 hover:-translate-y-1 hover:shadow-lift ${tone.card}`}
    >
      <CourseCardBody course={c.course} />
      {c.course.publishedChapterCount === 0 ? (
        <span className={`relative mt-2 w-fit rounded-pill border px-2 py-0.5 text-[11px] font-semibold ${tone.chip}`}>{t("soon")}</span>
      ) : null}
    </Link>
  );
}
