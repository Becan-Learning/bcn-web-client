import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ar from "../../../../../messages/ar.json";
import en from "../../../../../messages/en.json";
import type { Course } from "@/lib/courses/schema";
import type { Allowance } from "@/lib/allowance/schema";
import CoursePage from "./page";

const backend = vi.hoisted(() => ({ course: vi.fn(), account: vi.fn(), enrollments: vi.fn(), allowance: vi.fn(), refresh: vi.fn() }));
vi.mock("@/lib/auth/courses", () => ({ getCourse: backend.course, getEnrollments: backend.enrollments }));
vi.mock("@/lib/auth/session", () => ({ getAccount: backend.account }));
vi.mock("@/lib/allowance/server", () => ({ getAllowance: backend.allowance }));
vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({
  Link: (props: ComponentProps<"a">) => <a {...props} />,
  useRouter: () => ({ refresh: backend.refresh }),
}));
vi.mock("@/components/becan/kit", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
  Section: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  SiteHeader: () => null,
  PrimaryButton: ({ href, ...props }: ComponentProps<"button"> & { href?: string }) => href
    ? <a href={href}>{props.children}</a> : <button {...props} />,
}));

const course: Course = {
  id: "11111111-1111-4111-8111-111111111111", slug: "math-101", code: "MATH 101", name: { ar: "الرياضيات", en: "Mathematics" },
  institution: { id: "university", name: { ar: "الجامعة", en: "University" } },
  icon: "blocks", tone: "lilac", chapterCount: 2, publishedChapterCount: 1, status: "published",
  chapters: [
    { id: "aaaaaaaa-0000-4000-8000-000000000001", number: 1, title: { ar: "الأول", en: "First" }, minutes: 30, lessonCount: 3, state: "published", contentPath: "courses/math-101/ch_1/" },
    { id: "aaaaaaaa-0000-4000-8000-000000000002", number: 2, title: { ar: "الثاني", en: "Second" }, minutes: 30, lessonCount: 3, state: "coming_soon", contentPath: null },
  ],
};
const held = { enrolledAt: "2026-10-01T00:00:00Z", course: { ...course, id: "33333333-3333-4333-8333-333333333333", slug: "acct-101", name: { ar: "المحاسبة", en: "Accounting" } } };
const allowance: Allowance = {
  unlimited: false,
  plan: { id: "free", name: { ar: "مجانية", en: "Free" } },
  period: { start: "2026-10-01T00:00:00Z", end: "2026-10-31T00:00:00Z" },
  limits: { sessions: 6, seconds: 3600, enrollments: 1, sessionSeconds: 1800, minStartSeconds: 180 },
  usage: { sessions: 4, seconds: 2280, enrollments: 1 },
};

beforeEach(() => {
  vi.clearAllMocks();
  backend.course.mockResolvedValue({ ok: true, data: course });
  backend.account.mockResolvedValue({ id: "student" });
  backend.enrollments.mockResolvedValue({ ok: true, data: [held] });
  backend.allowance.mockResolvedValue({ ok: true, data: allowance });
});
async function render(locale: "ar" | "en" = "ar") {
  const page = await CoursePage({ params: Promise.resolve({ locale, code: course.slug }), searchParams: Promise.resolve({}) });
  return renderToStaticMarkup(<NextIntlClientProvider locale={locale} messages={locale === "ar" ? ar : en} timeZone="Asia/Riyadh">{page}</NextIntlClientProvider>);
}
function expectEnrollButtons(html: string, locale: "ar" | "en" = "ar") {
  const label = (locale === "ar" ? ar : en).Course.enroll;
  expect(html.match(new RegExp(`>${label}</button>`, "g"))).toHaveLength(2);
  expect(html).not.toContain('href="/c/acct-101"');
}

describe("Course page slot limit", () => {
  it.each(["ar", "en"] as const)("shows one quota block and a quiet link from published chapters in %s", async (locale) => {
    const html = await render(locale);
    expect(html.match(/href="\/c\/acct-101"/g)).toHaveLength(1);
    expect(html.match(/id="quota"/g)).toHaveLength(1);
    expect(html.match(/bg-tint-amber/g)).toHaveLength(1);
    expect(html.match(/href="#quota"/g)).toHaveLength(1);
    expect(html).toContain((locale === "ar" ? ar : en).Course.slotsFullHint);
    expect(html).toContain(held.course.name[locale]);
    expect(html).not.toContain(`>${(locale === "ar" ? ar : en).Course.enroll}</button>`);
    expect(html).not.toContain("/plans");
    expect(html.match(/<li[^>]*data-theme="dark"/g)).toHaveLength(2);
    expect(html).not.toMatch(/<h2/);
    const unpublished = html.match(/<li id="ch-2"[\s\S]*?<\/li>/)![0];
    expect(unpublished).toContain("opacity-45");
    expect(unpublished).not.toMatch(/<a |<button/);
  });
  it("shows the allowance limit even when it differs from the number of held courses", async () => {
    backend.allowance.mockResolvedValue({ ok: true, data: { ...allowance, limits: { ...allowance.limits, enrollments: 3 }, usage: { ...allowance.usage, enrollments: 3 } } });
    expect(await render("en")).toContain("Your usage limits allow 3 courses at a time");
  });

  it.each(["guest", "new", "enrolled"])("renders no interactive action in an unpublished chapter for %s", async (state) => {
    if (state === "guest") backend.account.mockResolvedValue(null);
    if (state === "new") backend.allowance.mockResolvedValue({ ok: false, kind: "network" });
    if (state === "enrolled") backend.enrollments.mockResolvedValue({ ok: true, data: [{ ...held, course }] });
    const html = await render();
    const unpublished = html.match(/<li id="ch-2"[\s\S]*?<\/li>/)![0];
    expect(unpublished).toContain(ar.Course.soon);
    expect(unpublished).not.toMatch(/<a |<button/);
  });

  it("keeps the held course's own page enrolled without reading an allowance", async () => {
    backend.enrollments.mockResolvedValue({ ok: true, data: [{ ...held, course }] });
    const html = await render();
    expect(html).toContain(ar.Course.unenroll);
    expect(html).toContain('href="/session/math-101/aaaaaaaa-0000-4000-8000-000000000001"');
    expect(html).not.toContain(ar.Quota.slotsFull.release);
    expect(backend.allowance).not.toHaveBeenCalled();
  });
  it("does not read student data for a guest", async () => {
    backend.account.mockResolvedValue(null);
    const html = await render();
    expect(html).toContain("/join?course=");
    expect(backend.enrollments).not.toHaveBeenCalled();
    expect(backend.allowance).not.toHaveBeenCalled();
  });
  it.each(["network", "http", "invalid"])("keeps enrollment available after a %s allowance failure", async (kind) => {
    backend.allowance.mockResolvedValue({ ok: false, kind });
    expectEnrollButtons(await render());
  });
  it("keeps enrollment available with an unlimited slot allowance", async () => {
    backend.allowance.mockResolvedValue({ ok: true, data: { ...allowance, limits: { ...allowance.limits, enrollments: null } } });
    expectEnrollButtons(await render());
  });
  it("restores enrollment when fresh reads show that the held course was un-enrolled", async () => {
    expect(await render()).toContain('href="/c/acct-101"');
    backend.enrollments.mockResolvedValue({ ok: true, data: [] });
    backend.allowance.mockResolvedValue({ ok: true, data: { ...allowance, usage: { ...allowance.usage, enrollments: 0 } } });
    expectEnrollButtons(await render());
    expect(backend.enrollments).toHaveBeenCalledTimes(2);
    expect(backend.allowance).toHaveBeenCalledTimes(2);
  });
  it("preserves the disabled enrollment error state when enrollment reads fail", async () => {
    backend.enrollments.mockResolvedValue({ ok: false, kind: "network" });
    const html = await render();
    expect(html).toContain(ar.Course.enrollmentLoadError);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>/);
    expect(html).not.toContain('href="/c/acct-101"');
  });
});

describe("Course page for an unlimited account", () => {
  beforeEach(() => {
    backend.enrollments.mockResolvedValue({ ok: true, data: [] });
    backend.allowance.mockResolvedValue({ ok: true, data: { ...allowance, unlimited: true } });
  });
  it.each(["ar", "en"] as const)("lets a published chapter start without enrolling and shows no enroll or quota UI in %s", async (locale) => {
    const html = await render(locale);
    const messages = locale === "ar" ? ar : en;
    expect(html).toContain('href="/session/math-101/aaaaaaaa-0000-4000-8000-000000000001"');
    expect(html).not.toContain(`>${messages.Course.enroll}<`);
    expect(html).not.toContain('id="quota"');
    expect(html).not.toContain(messages.Course.slotsFullHint);
    expect(html).not.toContain(messages.Course.unenroll);
  });
  it("starts a chapter even when the held courses fill every slot", async () => {
    backend.enrollments.mockResolvedValue({ ok: true, data: [held] });
    const html = await render();
    expect(html).toContain('href="/session/math-101/aaaaaaaa-0000-4000-8000-000000000001"');
    expect(html).not.toContain('id="quota"');
  });
  it("keeps the unpublished chapter inert", async () => {
    const unpublished = (await render()).match(/<li id="ch-2"[\s\S]*?<\/li>/)![0];
    expect(unpublished).toContain(ar.Course.soon);
    expect(unpublished).not.toMatch(/<a |<button/);
  });
  it("leaves a student who is not enrolled with the enroll buttons and no start link", async () => {
    backend.enrollments.mockResolvedValue({ ok: true, data: [] });
    backend.allowance.mockResolvedValue({ ok: true, data: { ...allowance, usage: { ...allowance.usage, enrollments: 0 } } });
    const html = await render();
    expect(html).not.toContain('href="/session/math-101/aaaaaaaa-0000-4000-8000-000000000001"');
    expect(html.match(new RegExp(`>${ar.Course.enroll}</button>`, "g"))).toHaveLength(2);
  });
});

describe("Course page for an archived course", () => {
  const archived: Course = { ...course, status: "archived" };
  const startHref = 'href="/session/math-101/aaaaaaaa-0000-4000-8000-000000000001"';
  beforeEach(() => {
    backend.course.mockResolvedValue({ ok: true, data: archived });
    backend.enrollments.mockResolvedValue({ ok: true, data: [{ ...held, course: archived }] });
  });
  it.each(["ar", "en"] as const)("marks it archived and lets an enrolled student start a published chapter in %s", async (locale) => {
    const messages = locale === "ar" ? ar : en;
    const html = await render(locale);
    expect(html).toContain(`>${messages.Course.archived}</span>`);
    expect(html).toContain(messages.Course.archivedEnrolled);
    expect(html).not.toContain(messages.Course.archivedClosed);
    expect(html).toContain(startHref);
    expect(html).not.toContain(`>${messages.Course.enroll}<`);
    expect(html).toContain(messages.Course.unenroll);
    expect(html).not.toContain('id="quota"');
    expect(backend.allowance).not.toHaveBeenCalled();
    const unpublished = html.match(/<li id="ch-2"[\s\S]*?<\/li>/)![0];
    expect(unpublished).not.toMatch(/<a |<button/);
  });
  it.each(["ar", "en"] as const)("gives a student who is not enrolled an explanation and no enroll or start action in %s", async (locale) => {
    const messages = locale === "ar" ? ar : en;
    backend.enrollments.mockResolvedValue({ ok: true, data: [] });
    backend.allowance.mockResolvedValue({ ok: true, data: { ...allowance, usage: { ...allowance.usage, enrollments: 0 } } });
    const html = await render(locale);
    expect(html).toContain(`>${messages.Course.archived}</span>`);
    expect(html).toContain(messages.Course.archivedClosed);
    expect(html).not.toContain(startHref);
    expect(html).not.toContain(messages.Course.enroll);
    expect(html).not.toContain(messages.Course.unenroll);
    expect(html.match(/<ul[\s\S]*<\/ul>/)![0]).not.toMatch(/<a |<button/);
    expect(html).not.toContain("aria-haspopup");
    expect(html).not.toContain('id="quota"');
  });
  it("does not offer a slot-limited student a quota block for a course they cannot join anyway", async () => {
    backend.enrollments.mockResolvedValue({ ok: true, data: [held] });
    const html = await render();
    expect(html).toContain(ar.Course.archivedClosed);
    expect(html).not.toContain('id="quota"');
    expect(html).not.toContain(ar.Course.slotsFullHint);
  });
  it("shows a guest the same explanation instead of a sign-up prompt", async () => {
    backend.account.mockResolvedValue(null);
    const html = await render();
    expect(html).toContain(ar.Course.archivedClosed);
    expect(html).not.toContain("/join?course=");
    expect(html).not.toContain(startHref);
    expect(backend.enrollments).not.toHaveBeenCalled();
  });
  it("lets an unlimited account start without enrolling", async () => {
    backend.enrollments.mockResolvedValue({ ok: true, data: [] });
    backend.allowance.mockResolvedValue({ ok: true, data: { ...allowance, unlimited: true } });
    const html = await render();
    expect(html).toContain(startHref);
    expect(html).not.toContain(`>${ar.Course.enroll}<`);
  });
  it("says nothing about archiving for a published course", async () => {
    backend.course.mockResolvedValue({ ok: true, data: course });
    const html = await render();
    expect(html).not.toContain(ar.Course.archived);
    expect(html).not.toContain(ar.Course.archivedClosed);
    expect(html).not.toContain(ar.Course.archivedEnrolled);
  });
});
