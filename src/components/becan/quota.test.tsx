import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import ar from "../../../messages/ar.json";
import en from "../../../messages/en.json";
import { QuotaBlock } from "./quota";

const link = vi.hoisted(() => vi.fn());
vi.mock("@/i18n/navigation", () => ({
  Link: (props: ComponentProps<"a">) => { link(props.href); return <a {...props} />; },
}));

function render(locale: "ar" | "en", props: ComponentProps<typeof QuotaBlock>) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={locale === "ar" ? ar : en} timeZone="UTC">
      <QuotaBlock {...props} />
    </NextIntlClientProvider>,
  );
}
const textOf = (html: string) => html.replace(/<[^>]*>/g, "").replace(/&#x27;/g, "'");
function expectQuiet(html: string) {
  expect(html).toContain("bg-tint-amber");
  expect(html).not.toMatch(/<button|\/plans|\/checkout|SAR|ريال|ترقية|upgrade|للأسف|text-error|bg-error|bg-pressable/);
  expect(html).not.toMatch(/[٠-٩]/);
}

const plurals = [
  [0, "0 دقيقة", "0 حصة"],
  [1, "دقيقة واحدة", "حصة واحدة"],
  [2, "دقيقتين", "حصتين"],
  [3, "3 دقائق", "3 حصص"],
  [11, "11 دقيقةً", "11 حصةً"],
  [100, "100 دقيقة", "100 حصة"],
] as const;

describe("QuotaBlock", () => {
  it.each(plurals)("renders Arabic plurals for %i minutes and sessions", (count, minutes, sessions) => {
    const html = render("ar", { kind: "used-up", minutesStudied: count, sessionsUsed: count, renewalDate: new Date("2026-10-30T22:00:00Z") });
    const text = textOf(html);
    expect(text).toContain(ar.Quota.usedUp.limit);
    expect(text).toContain(`ذاكرت ${minutes} في ${sessions}`);
    expect(text).toContain("تتجدد حدود استخدامك في 31 أكتوبر 2026");
    expect(html).not.toContain("<a");
    expect(html).not.toMatch(/<h[1-6]/);
    expect(html).toMatch(/<section[^>]*><p class="text-lg leading-base font-semibold">/);
    expect(text.indexOf("ذاكرت") < text.indexOf(ar.Quota.usedUp.limit)).toBe(true);
    expectQuiet(html);
  });

  it.each([0, 1, 2, 3, 11, 100])("renders English plurals for %i minutes and sessions", (count) => {
    const html = render("en", { kind: "used-up", minutesStudied: count, sessionsUsed: count, renewalDate: new Date("2026-10-30T22:00:00Z") });
    const text = textOf(html);
    expect(text).toContain(en.Quota.usedUp.limit);
    expect(text).toContain(`You studied ${count} ${count === 1 ? "minute" : "minutes"} in ${count} ${count === 1 ? "session" : "sessions"}`);
    expect(text).toContain("Your usage limits renew on October 31, 2026");
    expect(html).not.toContain("<a");
    expect(html).not.toMatch(/<h[1-6]/);
    expect(text.indexOf("You studied") < text.indexOf(en.Quota.usedUp.limit)).toBe(true);
    expectQuiet(html);
  });

  it.each(["ar", "en"] as const)("pluralizes minutes and sessions independently in %s", (locale) => {
    const text = textOf(render(locale, { kind: "used-up", minutesStudied: 38, sessionsUsed: 1, renewalDate: new Date("2026-10-30T22:00:00Z") }));
    expect(text).toContain(locale === "ar" ? "ذاكرت 38 دقيقةً في حصة واحدة" : "You studied 38 minutes in 1 session");
  });

  it.each(["ar", "en"] as const)("links to each held course with singular and plural guidance in %s", (locale) => {
    const courses = [
      { id: "acct-101", name: locale === "ar" ? "المحاسبة" : "Accounting" },
      { id: "math-101", name: locale === "ar" ? "الرياضيات" : "Mathematics" },
      { id: "physics-101", name: locale === "ar" ? "الفيزياء" : "Physics" },
    ];
    for (const count of [1, 2, 3]) {
      link.mockClear();
      const html = render(locale, { kind: "slots-full", courses: courses.slice(0, count), limit: count });
      expect(textOf(html)).toContain(locale === "ar" ? "مسجّل في" : "You're enrolled in");
      for (const course of courses.slice(0, count)) {
        expect(html).toContain(`href="/c/${course.id}"`);
        expect(textOf(html)).toContain(course.name);
        expect(link).toHaveBeenCalledWith(`/c/${course.id}`);
      }
      expect((html.match(/<a /g) ?? []).length).toBe(count);
      expect(textOf(html)).toContain(locale === "ar"
        ? count === 1 ? "ألغِ تسجيلك فيه لتسجّل هنا" : count === 2 ? "ألغِ تسجيلك في أحد المقررَين لتسجّل هنا" : "ألغِ تسجيلك في أحد هذه المقررات لتسجّل هنا"
        : count === 1 ? "Un-enroll from it to enroll here" : "Un-enroll from one of these courses to enroll here");
      expect((html.match(/dir="auto"/g) ?? []).length).toBe(count);
      expect(html).toContain("min-h-11 min-w-11 items-center justify-center");
      expect(html).not.toMatch(/<h[1-6]/);
      expect(html).toContain("underline");
      expectQuiet(html);
    }
  });

  it.each([
    [0, "بـ0 مقرر"], [1, "بمقرر واحد"], [2, "بمقررَين"],
    [3, "بـ3 مقررات"], [11, "بـ11 مقررًا"], [100, "بـ100 مقرر"],
  ] as const)("explains the Arabic allowance limit of %i courses", (limit, label) => {
    const html = render("ar", { kind: "slots-full", courses: [{ id: "acct-101", name: "ACCT 101" }], limit });
    expect(textOf(html)).toContain(`حدود استخدامك تسمح ${label} في وقت واحد`);
    expect(html).not.toContain("باقة");
    expectQuiet(html);
  });

  it.each([1, 2, 3, 11])("explains the English allowance limit of %i courses", (limit) => {
    const html = render("en", { kind: "slots-full", courses: [{ id: "acct-101", name: "المحاسبة" }], limit });
    expect(textOf(html)).toContain(`Your usage limits allow ${limit} ${limit === 1 ? "course" : "courses"} at a time`);
    expectQuiet(html);
  });

  it.each(["ar", "en"] as const)("keeps a course name in the other content language isolated in %s", (locale) => {
    const name = locale === "ar" ? "ACCT 101" : "المحاسبة";
    const html = render(locale, { id: "quota", kind: "slots-full", courses: [{ id: "acct-101", name }], limit: 2 });
    expect(html).toMatch(/<a[^>]*dir="auto"[^>]*>/);
    expect(textOf(html)).toContain(name);
    expect(html).toContain('id="quota"');
    expect(html).toContain("max-w-2xl");
  });

  it("replaces the old quota keys with one shared locale tree", () => {
    expect(Object.keys(ar.Quota)).toEqual(Object.keys(en.Quota));
    expect(Object.keys(ar.Quota.usedUp)).toEqual(Object.keys(en.Quota.usedUp));
    expect(ar.Quota.usedUp).not.toHaveProperty("title");
    expect(en.Quota.usedUp).not.toHaveProperty("title");
    expect(Object.keys(ar.Quota.slotsFull)).toEqual(Object.keys(en.Quota.slotsFull));
    for (const key of ["title", "progress", "continue", "plans", "allowance"]) {
      expect(ar.Quota).not.toHaveProperty(key);
      expect(en.Quota).not.toHaveProperty(key);
    }
  });
});
