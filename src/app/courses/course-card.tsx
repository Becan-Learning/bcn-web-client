import { ArrowForward } from "@/components/becan/icons";
import { SubjectIcon } from "./subject-icon";
import { TONES, type Course } from "@/lib/data/catalog";

/* جسم بطاقة المقرر — مصدر واحد لـ/courses و/home.

   نُزع من finder.tsx ليستعمله الداشبورد بلا نسخ: النسخ يجعل
   البطاقتين تفترقان مع أول تعديل.

   الغلاف يبقى لكل شاشة: الباحث يلفّه بـmotion لحركة الدخول
   والتمرير، والداشبورد يلفّه برابط ساكن. أما حركة الختم عند
   التمرير فصارت CSS لا Motion — حركة ثابتة لا مقودة بحدث وقت
   تشغيل، وهي قاعدة CLAUDE.md. */

export function CourseCardBody({
  course,
  progress,
}: {
  course: Course;
  /** التقدّم في المقرر — يظهر حين يكون الطالب مسجَّلًا فيها */
  progress?: { done: number; total: number };
}) {
  const tone = TONES[course.tone];

  return (
    <>
      {/* الختم — نفس الأيقونة بحجم كبير، تنزف من الزاوية وتصنع نسيج
          البطاقة. شفافية منخفضة فلا تنافس النص. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-5 -end-5 block h-28 w-28 opacity-15 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${tone.icon}`}
      >
        <SubjectIcon icon={course.icon} className="h-full w-full" />
      </span>

      <div className="relative flex items-start justify-between gap-2">
        <span
          dir="ltr"
          className={`rounded-pill border px-2 py-0.5 text-[11px] font-semibold ${tone.chip}`}
        >
          {course.code}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border transition-colors group-hover:bg-pressable group-hover:text-on-pressable ${tone.arrow}`}
        >
          <ArrowForward className="h-3.5 w-3.5" />
        </span>
      </div>

      {/* قفل الاسم — الرمز الصغير ملتصق بالاسم فيقرآن وحدةً واحدة */}
      <div className="relative mt-3">
        <div className="flex items-start gap-2">
          <SubjectIcon
            icon={course.icon}
            className={`mt-0.5 h-5 w-5 shrink-0 ${tone.icon}`}
          />
          <h3
            className={`line-clamp-2 font-display text-[15px] leading-snug font-semibold ${tone.title}`}
          >
            {course.name}
          </h3>
        </div>

        {progress ? (
          <CardProgress {...progress} tone={tone} />
        ) : (
          <p className={`mt-1.5 text-[11px] ${tone.meta}`}>
            {course.university}
          </p>
        )}
      </div>
    </>
  );
}

/* شريط التقدّم داخل البطاقة.

   الأرضية والتعبئة من لون البطاقة نفسها لا من رمادي محايد: البطاقة
   ملوّنة، وشريط رمادي عليها يُقرأ غريبًا عنها. والأخضر ممنوع —
   حالة لا سطح. */

function CardProgress({
  done,
  total,
  tone,
}: {
  done: number;
  total: number;
  tone: (typeof TONES)[keyof typeof TONES];
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="relative mt-2.5">
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`أنجزت ${done} من ${total} فصول`}
        className="h-1.5 w-full overflow-hidden rounded-pill bg-ground/55"
      >
        <div
          className={`h-full rounded-pill ${tone.fill}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`mt-1.5 text-[11px] ${tone.meta}`}>
        أنجزت {done} من {total} فصول
      </p>
    </div>
  );
}
