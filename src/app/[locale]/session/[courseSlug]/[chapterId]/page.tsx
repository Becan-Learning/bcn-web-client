import { localize } from "@/i18n/localized";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SessionView } from "@/components/session/session-view";
import { findSessionTarget, getEnrollments } from "@/lib/auth/courses";
import { chapterIsPublished, sessionHref } from "@/lib/session/resolve";
import { redirect } from "@/i18n/navigation";
import { getLessons } from "@/lib/session/lessons";
import { requireAccount } from "@/lib/auth/session";
import { accountReturnPath } from "@/lib/auth/next-path";
import { getAllowance } from "@/lib/allowance/server";
import { minutesLeft, nearlyOut, startDecision } from "@/lib/allowance/rules";
import { usedUpQuota } from "@/lib/allowance/presentation";
import { SessionUsedUp } from "@/components/session/session-start";

export async function generateMetadata(
  props: PageProps<"/[locale]/session/[courseSlug]/[chapterId]">,
): Promise<Metadata> {
  const { courseSlug, chapterId, locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Session" });
  const target = await findSessionTarget(courseSlug, chapterId);
  if (target.kind !== "found") return { title: t("metadataFallback")};
  const { course, chapter } = target;
  return { title: t("metadata", { chapter: localize(chapter.title, locale), course: localize(course.name, locale) }) };
}

export default async function SessionPage(
  props: PageProps<"/[locale]/session/[courseSlug]/[chapterId]">,
) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const { courseSlug, chapterId } = await props.params;
  const search = await props.searchParams;
  await requireAccount(locale, accountReturnPath(sessionHref(courseSlug, chapterId), search));

  const [target, enrollments, allowanceResult] = await Promise.all([findSessionTarget(courseSlug, chapterId), getEnrollments(), getAllowance()]);
  if (target.kind === "not-found") notFound();
  /* رابط قديم: المقرر غيّر الـ slug؛ نحوّل إلى الحالي ونُبقي معاملات الرابط. */
  if (target.kind === "redirect") return redirect({ locale, href: accountReturnPath(sessionHref(target.slug, chapterId), search) });
  const { course, chapter } = target;

  const allowance = allowanceResult.ok ? allowanceResult.data : null;
  const decision = startDecision({
    allowance,
    enrolled: enrollments.ok && enrollments.data.some((e) => e.course.id === course.id),
    published: chapterIsPublished(chapter),
    courseStatus: course.status,
  });
  if (!decision.ok) {
    if (decision.reason === "unpublished") notFound();
    /* المقرر المؤرشف لا يخدم إلا تسجيلاته النشطة؛ صفحته تشرح ذلك. */
    if (decision.reason === "not-enrolled" || decision.reason === "archived") return redirect({ locale, href: `/c/${course.slug}` });
    const quota = usedUpQuota(allowance);
    if (quota) {
      return <SessionUsedUp
        courseName={localize(course.name, locale)}
        courseSlug={course.slug}
        chapterNo={chapter.number}
        chapterTitle={localize(chapter.title, locale)}
        quota={quota}
      />;
    }
  }

  /* قبل أن يضغط الطالب «ابدأ» لا رمز بعد (الرمز يفتح حصةً ويحسب منها)، فتُعرض الدروس والشرائح من مسار الكتالوج.
     عند وصول الرمز يتبنّى العميل المسار المثبَّت فيه، فيعيد جلبهما إن اختلف. */
  const contentPath = chapter.contentPath;
  if (contentPath === null) notFound();
  const lessons = await getLessons(contentPath);

  return (
    <SessionView
      courseName={localize(course.name, locale)}
      courseSlug={course.slug}
      chapterNo={chapter.number}
      chapterTitle={localize(chapter.title, locale)}
      minutes={chapter.minutes}
      chapterId={chapter.id}
      contentPath={contentPath}
      lessons={lessons}
      minutesRemaining={allowance && nearlyOut(allowance) ? minutesLeft(allowance) : null}
    />
  );
}
