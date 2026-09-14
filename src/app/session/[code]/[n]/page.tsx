import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SessionView } from "@/components/session/session-view";
import { chaptersOf, courseBySlug, slugOf } from "@/lib/data/catalog";
import { contentFor, slidesUrl } from "@/lib/session/content";
import { getLessons } from "@/lib/session/lessons";

export async function generateMetadata(
  props: PageProps<"/session/[code]/[n]">,
): Promise<Metadata> {
  const { code, n } = await props.params;
  const course = courseBySlug(code);
  const chapter = chaptersOf(course?.code ?? "").find((c) => String(c.n) === n);
  if (!course || !chapter) return { title: "الجلسة — بيكان" };
  return { title: `${chapter.title} — ${course.name} — بيكان` };
}

export default async function SessionPage(
  props: PageProps<"/session/[code]/[n]">,
) {
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
      courseName={course.name}
      courseSlug={slugOf(course.code)}
      chapterNo={chapter.n}
      chapterTitle={chapter.title}
      minutes={chapter.minutes}
      content={content}
      pdfUrl={slidesUrl(content)}
      lessons={lessons}
    />
  );
}
