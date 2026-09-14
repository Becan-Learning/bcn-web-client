import Link from "next/link";
import { CourseCardBody } from "@/app/courses/course-card";
import { TONES, slugOf } from "@/lib/data/catalog";
import { GearIcon } from "@/components/becan/icons";
import { GhostButton, PageShell } from "@/components/becan/kit";
import { enrolledCourses, type EnrolledCourse } from "@/lib/data/home";

/* الشاشة ٨ — الداشبورد `/home`.

   مقصورة الآن على المقررات المسجَّلة والتقدّم فيها بطلب صريح.

   ما بُني من البريف ثم رُفع — كتلة الإلحاح بالأيام حتى أقرب اختبار،
   والحالات الست، واقتراح تاريخ الاختبار من المجتمع، وطبقة الأحداث،
   والطبقة الثانية (المهام والترم) — محفوظ كاملًا في الحفظة `1c34c65`
   ويُسترجَع منها متى عادت الحاجة. */

export function HomeView() {
  const courses = enrolledCourses();

  return (
    <PageShell>
      {/* تحية بالاسم الأول والإعدادات فقط — لا إشعارات ولا بحث */}
      <header className="mx-auto flex w-full max-w-page items-center justify-between gap-3 px-4 pt-5 pb-2 md:px-8 xl:px-10">
        <p className="text-ink">مساك يا عبدالرحمن</p>
        <Link
          href="/settings"
          aria-label="الإعدادات"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-2 transition-colors hover:bg-surface hover:text-ink"
        >
          <GearIcon />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-page px-4 pt-4 pb-16 md:px-8 xl:px-10">
        <h1 className="font-display text-3xl leading-tight font-bold text-ink md:text-4xl">
          مقرراتك
        </h1>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <li key={c.code}>
              <EnrolledCard c={c} />
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <GhostButton href="/courses">أضف مقررًا</GhostButton>
        </div>
      </main>
    </PageShell>
  );
}

/* البطاقة هي بطاقة /courses نفسها — نفس الجسم من `CourseCardBody`
   لا نسخةً منه — ويزيد عليها شريط التقدّم.

   والمقرر الذي لم تجهز فصوله لا يُخفى: تظهر بوسم «قريبًا» ولا
   تكون رابطًا، فالضغط لا يعد بما ليس موجودًا. */

function EnrolledCard({ c }: { c: EnrolledCourse }) {
  const tone = TONES[c.course.tone];
  const shell = `group relative flex min-h-36 flex-col justify-between overflow-hidden rounded-lg border p-3 shadow-soft ${tone.card}`;

  if (c.soon) {
    return (
      <div className={`${shell} opacity-60`}>
        <CourseCardBody course={c.course} />
        <span
          className={`relative mt-2 w-fit rounded-pill border px-2 py-0.5 text-[11px] font-semibold ${tone.chip}`}
        >
          قريبًا
        </span>
      </div>
    );
  }

  return (
    <Link
      href={`/c/${slugOf(c.code)}`}
      className={`${shell} transition-transform duration-200 hover:-translate-y-1 hover:shadow-lift`}
    >
      <CourseCardBody
        course={c.course}
        progress={{ done: c.done, total: c.ready }}
      />
    </Link>
  );
}
