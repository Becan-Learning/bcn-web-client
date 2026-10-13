import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createFormatter, createTranslator, NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ar from "../../../../../../../messages/ar.json";
import en from "../../../../../../../messages/en.json";
import type { Allowance } from "@/lib/allowance/schema";
import type { Course } from "@/lib/courses/schema";
import SummaryPage from "./page";

const backend = vi.hoisted(() => ({
  course: vi.fn(), enrollments: vi.fn(), allowance: vi.fn(), account: vi.fn(),
  locale: "ar" as "ar" | "en",
}));
vi.mock("@/lib/auth/courses", () => ({ getCourse: backend.course, getEnrollments: backend.enrollments }));
vi.mock("@/lib/auth/session", () => ({ requireAccount: backend.account }));
vi.mock("@/lib/allowance/server", () => ({ getAllowance: backend.allowance }));
vi.mock("next-intl/server", () => ({
  setRequestLocale: (locale: "ar" | "en") => { backend.locale = locale; },
  getTranslations: async () => createTranslator({ locale: backend.locale, messages: backend.locale === "ar" ? ar : en, namespace: "SessionSummary" }),
  getFormatter: async () => createFormatter({ locale: backend.locale, timeZone: "UTC" }),
}));
vi.mock("@/i18n/navigation", () => ({ Link: (props: ComponentProps<"a">) => <a {...props} />, redirect: vi.fn() }));
vi.mock("@/components/becan/kit", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Section: ({ children, className }: { children: ReactNode; className: string }) => <section className={className}>{children}</section>,
  PrimaryButton: (props: ComponentProps<"a">) => <a {...props} />,
}));

const course: Course = {
  id: "math-101", code: "MATH 101", name: { ar: "الرياضيات", en: "Mathematics" },
  institution: { id: "university", name: { ar: "الجامعة", en: "University" } },
  icon: "blocks", tone: "lilac", chapterCount: 2, publishedChapterCount: 2,
  chapters: [
    { number: 1, title: { ar: "الفصل الأول", en: "First chapter" }, minutes: 30, lessonCount: 1, published: true },
    { number: 2, title: { ar: "الفصل الثاني", en: "Second chapter" }, minutes: 30, lessonCount: 1, published: true },
  ],
};
const allowance: Allowance = {
  plan: { id: "free", name: { ar: "مجانية", en: "Free" } },
  period: { start: "2026-10-01T00:00:00Z", end: "2026-10-30T22:00:00Z" },
  limits: { sessions: 6, seconds: 3600, enrollments: 1, sessionSeconds: 1800, minStartSeconds: 180 },
  usage: { sessions: 4, seconds: 2281, enrollments: 1 },
};

beforeEach(() => {
  vi.clearAllMocks();
  backend.course.mockResolvedValue({ ok: true, data: course });
  backend.enrollments.mockResolvedValue({ ok: true, data: [{ course }] });
  backend.allowance.mockResolvedValue({ ok: true, data: allowance });
});

async function render(locale: "ar" | "en" = "ar", searchParams: Record<string, string | string[] | undefined> = { room: "real-room" }) {
  const page = await SummaryPage({ params: Promise.resolve({ locale, code: course.id, n: "1" }), searchParams: Promise.resolve(searchParams) });
  return renderToStaticMarkup(<NextIntlClientProvider locale={locale} messages={locale === "ar" ? ar : en} timeZone="UTC">{page}</NextIntlClientProvider>).replace(/&#x27;/g, "'");
}

describe("done allowance decision", () => {
  it.each(["ar", "en"] as const)("shows fresh used-up usage after the title and before feedback for any ending in %s", async (locale) => {
    for (const [sessions, seconds] of [[6, 2281], [4, 3421], [4, 3600]]) {
      backend.allowance.mockResolvedValue({ ok: true, data: { ...allowance, usage: { ...allowance.usage, sessions, seconds } } });
      for (const searchParams of [{ room: "real-room" }, { room: "real-room", limit: "1" }]) {
        const html = await render(locale, searchParams);
        const label = (locale === "ar" ? ar : en).Quota.usedUp.limit;
        expect(html).toContain(label);
        expect(html).toContain(String(Math.ceil(seconds / 60)));
        expect(html).toContain(locale === "ar" ? "31 أكتوبر 2026" : "October 31, 2026");
        expect(html.indexOf("</h1>")).toBeLessThan(html.indexOf(label));
        expect(html.indexOf(label)).toBeLessThan(html.indexOf("<form"));
        expect(html).toContain((locale === "ar" ? ar : en).SessionFeedback.title);
        expect(html).toContain('href="/c/math-101"');
        expect(html).toContain('href="/session/math-101/2"');
        expect(html).not.toContain((locale === "ar" ? ar : en).SessionSummary.limit);
        expect(html).not.toContain('data-theme="dark"');
        expect(html).not.toMatch(/[٠-٩]/);
      }
    }
  });

  it.each(["ample", "nearly-out", "unlimited"])("adds nothing for %s usage and retains the generic limit notice", async (kind) => {
    const data = kind === "nearly-out"
      ? { ...allowance, usage: { ...allowance.usage, seconds: 3000 } }
      : kind === "unlimited" ? { ...allowance, limits: { ...allowance.limits, sessions: null, seconds: null } } : allowance;
    backend.allowance.mockResolvedValue({ ok: true, data });
    const html = await render("ar", { room: "real-room", limit: "1" });
    expect(html).not.toContain(ar.Quota.usedUp.limit);
    expect(html).toContain(ar.SessionSummary.limit);
    expect(html).toContain("<form");
  });

  it.each(["network", "http", "invalid"])("adds nothing after a %s read failure", async (kind) => {
    backend.allowance.mockResolvedValue({ ok: false, kind });
    const html = await render();
    expect(html).not.toContain(ar.Quota.usedUp.limit);
    expect(html).toContain("<form");
  });

  it.each([{}, { room: "" }, { room: [] }])("does not read usage or show feedback without a real room %#", async (searchParams) => {
    backend.allowance.mockResolvedValue({ ok: true, data: { ...allowance, usage: { ...allowance.usage, sessions: 6 } } });
    const html = await render("ar", searchParams);
    expect(backend.allowance).not.toHaveBeenCalled();
    expect(html).not.toContain(ar.Quota.usedUp.limit);
    expect(html).not.toContain("<form");
  });

  it("accepts the first room query value and reads a fresh snapshot on every render", async () => {
    backend.allowance.mockResolvedValueOnce({ ok: true, data: { ...allowance, usage: { ...allowance.usage, sessions: 6 } } });
    expect(await render("ar", { room: ["real-room", "other"] })).toContain(ar.Quota.usedUp.limit);
    expect(await render()).not.toContain(ar.Quota.usedUp.limit);
    expect(backend.allowance).toHaveBeenCalledTimes(2);
  });

  it("does not read an allowance when the account guard redirects", async () => {
    backend.account.mockRejectedValueOnce(new Error("Redirect to sign in"));
    await expect(render()).rejects.toThrow("Redirect to sign in");
    expect(backend.allowance).not.toHaveBeenCalled();
  });
});
