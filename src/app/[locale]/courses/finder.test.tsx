import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import ar from "../../../../messages/ar.json";
import en from "../../../../messages/en.json";
import type { CourseSummary } from "@/lib/courses/schema";
import { Finder } from "./finder";

vi.mock("@/i18n/navigation", () => ({ Link: (props: ComponentProps<"a">) => <a {...props} /> }));

const course = (slug: string, status: CourseSummary["status"]): CourseSummary => ({
  id: slug === "math-101" ? "11111111-1111-4111-8111-111111111111" : "22222222-2222-4222-8222-222222222222", slug, status,
  code: slug.toUpperCase(), name: { ar: `مقرر ${slug}`, en: `Course ${slug}` },
  institution: { id: "university", name: { ar: "الجامعة", en: "University" } },
  icon: "blocks", tone: "lilac", chapterCount: 1, publishedChapterCount: 0,
});

function render(courses: CourseSummary[], locale: "ar" | "en") {
  return renderToStaticMarkup(<NextIntlClientProvider locale={locale} messages={locale === "ar" ? ar : en} timeZone="UTC">
    <Finder institutions={[]} courses={courses} />
  </NextIntlClientProvider>);
}

describe("Finder Draft label", () => {
  it.each(["ar", "en"] as const)("marks a Draft course, and only that one, in %s", (locale) => {
    const label = (locale === "ar" ? ar : en).Preview.draft;
    const html = render([course("math-101", "draft"), course("acct-101", "published")], locale);
    expect(html.match(new RegExp(`>${label}</span>`, "g"))).toHaveLength(1);
    const cards = html.match(/<a [\s\S]*?<\/a>/g)!.filter((card) => card.includes("/c/"));
    expect(cards).toHaveLength(2);
    expect(cards.filter((card) => card.includes(`>${label}</span>`))).toHaveLength(1);
    expect(cards.find((card) => card.includes(label))).toContain("/c/math-101");
  });
  it("shows no label for the courses a student sees", () => {
    const html = render([course("math-101", "published"), course("acct-101", "archived")], "ar");
    expect(html).not.toContain(ar.Preview.draft);
  });
});
