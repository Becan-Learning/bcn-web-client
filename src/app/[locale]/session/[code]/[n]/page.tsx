import { localize } from "@/i18n/localized";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SessionView } from "@/components/session/session-view";
import { getCourse, getEnrollments } from "@/lib/auth/courses";
import { redirect } from "@/i18n/navigation";
import { getLessons } from "@/lib/session/lessons";
import { requireAccount } from "@/lib/auth/session";
import { accountReturnPath } from "@/lib/auth/next-path";

export async function generateMetadata(
  props: PageProps<"/[locale]/session/[code]/[n]">,
): Promise<Metadata> {
  const { code, n, locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Session" });
  const result = await getCourse(code);
  const course = result.ok ? result.data : null;
  const chapter = course?.chapters.find((c) => String(c.number) === n);
  if (!course || !chapter) return { title: t("metadataFallback")};
  return { title: t("metadata", { chapter: localize(chapter.title, locale), course: localize(course.name, locale) }) };
}

export default async function SessionPage(
  props: PageProps<"/[locale]/session/[code]/[n]">,
) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const { code, n } = await props.params;
  await requireAccount(locale, accountReturnPath(`/session/${code}/${n}`, await props.searchParams));

  const [result, enrollments] = await Promise.all([getCourse(code), getEnrollments()]);
  if (!result.ok) notFound();
  const course = result.data;
  const chapter = course.chapters.find((c) => String(c.number) === n);
  if (!chapter || !chapter.published) notFound();
  if (!enrollments.ok || !enrollments.data.some((e) => e.course.id === course.id)) {
    return redirect({ locale, href: `/c/${course.id}` });
  }

  const content = { courseId: course.id, chapterId: `ch_${chapter.number}` };
  const lessons = await getLessons(content);

  return (
    <SessionView
      courseName={localize(course.name, locale)}
      courseSlug={course.id}
      chapterNo={chapter.number}
      chapterTitle={localize(chapter.title, locale)}
      minutes={chapter.minutes}
      content={content}
      pdfUrl={`/api/fetch-bunny/courses/${course.id}/${content.chapterId}/slides.pdf`}
      lessons={lessons}
    />
  );
}
