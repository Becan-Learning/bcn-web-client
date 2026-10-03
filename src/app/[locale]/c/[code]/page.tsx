import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { localize } from "@/i18n/localized";
import { routing } from "@/i18n/routing";
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
  props: PageProps<"/[locale]/c/[code]">,
): Promise<Metadata> {
  const { code, locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Course" });
  const course = courseBySlug(code);
  if (!course) return { title: t("notFoundTitle") };
  return {
    title: t("metadataTitle", { course: localize(course.name, locale) }),
    description: t("metadataDescription", { university: localize(course.university, locale), count: readyCount(course.code), countLabel: String(readyCount(course.code)) }),
  };
}

export default async function CoursePage(props: PageProps<"/[locale]/c/[code]">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

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
  const examDate = new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn-ca-gregory" : "en", {
    numberingSystem: "latn",
    calendar: "gregory",
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
