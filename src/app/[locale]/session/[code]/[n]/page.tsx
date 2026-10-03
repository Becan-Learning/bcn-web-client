import { localize } from "@/i18n/localized";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SessionView } from "@/components/session/session-view";
import { chaptersOf, courseBySlug, slugOf } from "@/lib/data/catalog";
import { contentFor, slidesUrl } from "@/lib/session/content";
import { getLessons } from "@/lib/session/lessons";

export async function generateMetadata(
  props: PageProps<"/[locale]/session/[code]/[n]">,
): Promise<Metadata> {
  const { code, n, locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Session" });
  const course = courseBySlug(code);
  const chapter = chaptersOf(course?.code ?? "").find((c) => String(c.n) === n);
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

  const course = courseBySlug(code);
  if (!course) notFound();

  const chapter = chaptersOf(course.code).find((c) => String(c.n) === n);
  /* الفصل غير الجاهز لا تُفتح جلسته — البريف يمنع الوعد به */
  if (!chapter || !chapter.ready) notFound();

  const content = contentFor(course.code, chapter.n);
  const lessons = await getLessons(content);

  return (
    <SessionView
      courseName={localize(course.name, locale)}
      courseSlug={slugOf(course.code)}
      chapterNo={chapter.n}
      chapterTitle={localize(chapter.title, locale)}
      minutes={chapter.minutes}
      content={content}
      pdfUrl={slidesUrl(content)}
      lessons={lessons}
    />
  );
}
