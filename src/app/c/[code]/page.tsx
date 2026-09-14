import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseView, type ViewState } from "./course-view";
import {
  COURSES,
  chaptersOf,
  courseBySlug,
  readyCount,
  slugOf,
} from "@/lib/data/catalog";
import { PageShell, Section, SiteHeader } from "@/components/becan/kit";

export function generateStaticParams() {
  return COURSES.map((c) => ({ code: slugOf(c.code) }));
}

export async function generateMetadata(
  props: PageProps<"/c/[code]">,
): Promise<Metadata> {
  const { code } = await props.params;
  const course = courseBySlug(code);
  if (!course) return { title: "المقرر غير موجود — بيكان" };
  return {
    title: `${course.name} — بيكان`,
    description: `${course.university} · ${readyCount(course.code)} فصول جاهزة.`,
  };
}

export default async function CoursePage(props: PageProps<"/c/[code]">) {
  const { code } = await props.params;
  const sp = await props.searchParams;

  const course = courseBySlug(code);
  if (!course) notFound();

  /* حالات البريف الأربع. الافتراضي «زائر غير مسجّل» — وهو الحال
     الحقيقي لأي قادم من صفحة البحث. */
  /* تاريخ الاختبار المتوقّع — يُحسب على الخادم فيصل نصًّا جاهزًا،
     فلا يختلف بين الخادم والعميل. أرقام لاتينية صراحةً بـ nu-latn
     لأن لغة ar تعطي أرقامًا هندية في بعض البيئات. */
  const exam = new Date();
  exam.setDate(exam.getDate() + 21);
  const examDate = new Intl.DateTimeFormat("ar-u-nu-latn-ca-gregory", {
    day: "numeric",
    month: "long",
  }).format(exam);

  const raw = Array.isArray(sp.state) ? sp.state[0] : sp.state;
  const state: ViewState = raw === "new" || raw === "progress" ? raw : "guest";

  return (
    <PageShell withFooter>
      <SiteHeader />

      <Section className="pt-10 pb-16 md:pt-14">
        <CourseView
          course={course}
          chapters={chaptersOf(course.code)}
          readyCount={readyCount(course.code)}
          state={state}
          examDate={examDate}
        />
      </Section>
    </PageShell>
  );
}
