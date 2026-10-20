import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { localize } from "@/i18n/localized";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseView, type ViewState } from "./course-view";
import { getCourseFor, getEnrollments } from "@/lib/auth/courses";
import { readsPreview } from "@/lib/preview/rules";
import { getAllowance } from "@/lib/allowance/server";
import { viewerReadsPreview } from "@/lib/preview/viewer";
import { slotsFull, startDecision } from "@/lib/allowance/rules";
import { usedUpQuota } from "@/lib/allowance/presentation";
import { RATE_PARAM, LIMIT_PARAM, readLimitReached, readRateRoom } from "@/lib/session/rating";
import { getAccount } from "@/lib/auth/session";
import { PageShell, Section, SiteHeader } from "@/components/becan/kit";

export async function generateMetadata(
  props: PageProps<"/[locale]/c/[code]">,
): Promise<Metadata> {
  const { code, locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Course" });
  const { result } = await getCourseFor(code, await viewerReadsPreview());
  if (!result.ok) return { title: t("notFoundTitle") };
  const course = result.data;
  const format = await getFormatter({ locale });
  return {
    title: t("metadataTitle", { course: localize(course.name, locale) }),
    description: t("metadataDescription", { university: localize(course.institution.name, locale), count: course.publishedChapterCount, countLabel: format.number(course.publishedChapterCount, { numberingSystem: "latn" }) }),
  };
}

export default async function CoursePage(props: PageProps<"/[locale]/c/[code]">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const { code } = await props.params;
  const search = await props.searchParams;
  /* الحدود قبل المقرر: الحساب غير المحدود (مشرف) يقرأ معاينة المسوّدات، وغيره الكتالوج العام المخزَّن. */
  const account = await getAccount();
  const [enrollments, allowance] = account ? await Promise.all([getEnrollments(), getAllowance()]) : [null, null];
  const { source, result } = await getCourseFor(code, readsPreview(allowance?.ok ? allowance.data : null));
  if (!result.ok) notFound();
  const course = result.data;
  const enrollmentError = enrollments !== null && !enrollments.ok;
  const archived = course.status === "archived";
  const baseState: ViewState = !account ? "guest" : enrollments?.ok && enrollments.data.some((e) => e.course.id === course.id) ? "enrolled" : "new";

  /* الحساب غير المحدود يبدأ فصلًا منشورًا دون تسجيل. المقرر المؤرشف لا يقبل تسجيلًا جديدًا:
     غير المسجَّل فيه ("closed") لا يرى تسجيلًا ولا بدءًا، بل شرحًا. */
  const state: ViewState = baseState === "enrolled" ? baseState
    : startDecision({ allowance: allowance?.ok ? allowance.data : null, enrolled: false, published: true, courseStatus: course.status }).ok && baseState === "new"
      ? "open"
      : archived ? "closed" : baseState;
  const slotQuota = !archived && allowance?.ok && allowance.data.limits.enrollments !== null && enrollments?.ok && slotsFull(allowance.data, enrollments.data, course.id)
    ? {
      limit: allowance.data.limits.enrollments,
      courses: enrollments.data.map(({ course: held }) => ({ slug: held.slug, name: localize(held.name, locale) })),
    }
    : null;

  /* بعد الحصة: كتلة الحدود المستنفدة لمن يملك حصةً هنا (كانت في ملخّص الحصة)، وجملة بلوغ وقت الحصة إن لم تكن الحدود مستنفدة.
     بطاقة التقييم للحساب وحده؛ الضيف لا حصة له. */
  const startsHere = state === "enrolled" || state === "open";
  const usedUp = startsHere ? usedUpQuota(allowance?.ok ? allowance.data : null) : null;
  const limitNotice = startsHere && usedUp === null && readLimitReached(search[LIMIT_PARAM]);
  const rateRoom = account ? readRateRoom(search[RATE_PARAM]) : null;

  return (
    <PageShell withFooter>
      <SiteHeader />

      <Section className="pt-10 pb-16 md:pt-14">
        <CourseView
          course={course}
          chapters={course.chapters}
          enrollmentError={enrollmentError}
          state={state}
          slotQuota={slotQuota}
          usedUp={usedUp}
          limitNotice={limitNotice}
          rateRoom={rateRoom}
          preview={source === "preview"}
        />
      </Section>
    </PageShell>
  );
}
