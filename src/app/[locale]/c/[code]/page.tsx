import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { localize } from "@/i18n/localized";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseView, type ViewState } from "./course-view";
import { getCourse, getEnrollments } from "@/lib/auth/courses";
import { getAllowance } from "@/lib/allowance/server";
import { slotsFull } from "@/lib/allowance/rules";
import { getAccount } from "@/lib/auth/session";
import { PageShell, Section, SiteHeader } from "@/components/becan/kit";

export async function generateMetadata(
  props: PageProps<"/[locale]/c/[code]">,
): Promise<Metadata> {
  const { code, locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Course" });
  const result = await getCourse(code);
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
  const [result, account] = await Promise.all([getCourse(code), getAccount()]);
  if (!result.ok) notFound();
  const course = result.data;
  const enrollments = account ? await getEnrollments() : null;
  const enrollmentError = enrollments !== null && !enrollments.ok;
  const state: ViewState = !account ? "guest" : enrollments?.ok && enrollments.data.some((e) => e.course.id === course.id) ? "enrolled" : "new";

  const allowance = state === "new" ? await getAllowance() : null;
  const slotQuota = allowance?.ok && allowance.data.limits.enrollments !== null && enrollments?.ok && slotsFull(allowance.data, enrollments.data, course.id)
    ? {
      limit: allowance.data.limits.enrollments,
      courses: enrollments.data.map(({ course: held }) => ({ id: held.id, name: localize(held.name, locale) })),
    }
    : null;

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
        />
      </Section>
    </PageShell>
  );
}
