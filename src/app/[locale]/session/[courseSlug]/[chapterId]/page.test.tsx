import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ar from "../../../../../../messages/ar.json";
import en from "../../../../../../messages/en.json";
import type { Allowance } from "@/lib/allowance/schema";
import type { Course } from "@/lib/courses/schema";
import { SessionView } from "@/components/session/session-view";
import { RemainingMinutes } from "@/components/session/remaining-minutes";
import { redirect } from "@/i18n/navigation";
import SessionPage from "./page";

const backend = vi.hoisted(() => ({ target: vi.fn(), enrollments: vi.fn(), allowance: vi.fn(), lessons: vi.fn(), account: vi.fn(), push: vi.fn() }));
vi.mock("@/lib/auth/courses", () => ({ findSessionTarget: backend.target, getEnrollments: backend.enrollments }));
vi.mock("@/lib/auth/session", () => ({ requireAccount: backend.account }));
vi.mock("@/lib/allowance/server", () => ({ getAllowance: backend.allowance }));
vi.mock("@/lib/session/lessons", () => ({ getLessons: backend.lessons }));
vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push: backend.push }), redirect: vi.fn() }));
vi.mock("@/components/session/session-view", () => ({
  SessionView: vi.fn(({ minutesRemaining }: { minutesRemaining: number | null }) => (
    <div data-session-view="">{minutesRemaining !== null ? <RemainingMinutes count={minutesRemaining} /> : null}</div>
  )),
}));

const course: Course = {
  id: "11111111-1111-4111-8111-111111111111", slug: "math-101", code: "MATH 101", name: { ar: "الرياضيات", en: "Mathematics" },
  institution: { id: "university", name: { ar: "الجامعة", en: "University" } },
  icon: "blocks", tone: "lilac", chapterCount: 1, publishedChapterCount: 1, status: "published",
  chapters: [{ id: "aaaaaaaa-0000-4000-8000-000000000001", number: 1, title: { ar: "الفصل الأول", en: "First chapter" }, minutes: 30, lessonCount: 1, state: "published", contentPath: "courses/math-101/ch_1/" }],
};
const allowance: Allowance = {
  unlimited: false,
  plan: { id: "free", name: { ar: "مجانية", en: "Free" } },
  period: { start: "2026-10-01T00:00:00Z", end: "2026-10-30T22:00:00Z" },
  limits: { sessions: 6, seconds: 3600, enrollments: 1, sessionSeconds: 1800, minStartSeconds: 180 },
  usage: { sessions: 4, seconds: 2280, enrollments: 1 },
};

beforeEach(() => {
  vi.clearAllMocks();
  backend.target.mockResolvedValue({ kind: "found", course, chapter: course.chapters[0] });
  backend.enrollments.mockResolvedValue({ ok: true, data: [{ course }] });
  backend.allowance.mockResolvedValue({ ok: true, data: allowance });
  backend.lessons.mockResolvedValue([]);
});

async function render(locale: "ar" | "en" = "ar") {
  const page = await SessionPage({ params: Promise.resolve({ locale, courseSlug: course.slug, chapterId: "aaaaaaaa-0000-4000-8000-000000000001" }), searchParams: Promise.resolve({}) });
  return renderToStaticMarkup(<NextIntlClientProvider locale={locale} messages={locale === "ar" ? ar : en} timeZone="UTC">{page}</NextIntlClientProvider>);
}

describe("Session page allowance gate", () => {
  it.each(["ar", "en"] as const)("blocks exhausted sessions or minutes in %s without mounting the token requester", async (locale) => {
    for (const [sessions, seconds] of [[6, 2281], [4, 3421], [4, 3600]]) {
      backend.allowance.mockResolvedValue({ ok: true, data: { ...allowance, usage: { ...allowance.usage, sessions, seconds } } });
      const html = await render(locale);
      const text = html.replace(/<[^>]*>/g, " ").replace(/&#x27;/g, "'");
      expect(text).toContain(locale === "ar"
        ? "تقدر تبدأ حصتك الجاية في 31 أكتوبر 2026"
        : "You can start your next session on October 31, 2026");
      expect(text).toContain(course.chapters[0].title[locale]);
      expect(text).toContain(course.name[locale]);
      expect(text).toContain(locale === "ar" ? "31 أكتوبر 2026" : "October 31, 2026");
      expect(text).toContain(String(Math.ceil(seconds / 60)));
      expect(html).toContain('data-theme="dark" data-surface="session"');
      expect(html).toContain((locale === "ar" ? ar : en).Session.backCourse);
      const main = html.match(/<main\b[^>]*>.*?<\/main>/)![0];
      expect(main).toContain("bg-surface");
      expect(main).toContain("hover:bg-surface-2");
      expect(main).not.toContain("hover:bg-panel");
      expect(html).not.toContain("data-session-view");
      expect(html).not.toContain("/plans");
      expect(SessionView).not.toHaveBeenCalled();
      expect(backend.lessons).not.toHaveBeenCalled();
    }
  });

  it.each(["ar", "en"] as const)("passes the real rounded nearly-out count to the pre-start intro in %s", async (locale) => {
    backend.allowance.mockResolvedValue({ ok: true, data: { ...allowance, usage: { ...allowance.usage, seconds: 2761 } } });
    const html = await render(locale);
    expect(html).toContain(locale === "ar" ? "باقي لك 13 دقيقةً في دورة الاستخدام هذي" : "You have 13 minutes left in this usage period");
    expect(html).toContain("text-ink-2");
    expect(html).not.toMatch(/amber|pressable|[٠-٩]/);
    expect(backend.lessons).toHaveBeenCalledOnce();
  });

  it.each(["network", "http", "invalid"])("keeps today's start screen after a %s allowance failure", async (kind) => {
    backend.allowance.mockResolvedValue({ ok: false, kind });
    const html = await render();
    expect(html).toContain("data-session-view");
    expect(html).not.toContain(ar.Quota.usedUp.limit);
    expect(html).not.toContain("باقي لك");
    expect(vi.mocked(SessionView).mock.calls[0][0]).toMatchObject({ minutesRemaining: null });
  });

  it("keeps starting available without a zero-minute notice when the remaining seconds round down", async () => {
    backend.allowance.mockResolvedValue({ ok: true, data: {
      ...allowance, limits: { ...allowance.limits, minStartSeconds: null }, usage: { ...allowance.usage, seconds: 3599 },
    } });
    const html = await render();
    expect(html).toContain("data-session-view");
    expect(html).not.toContain("باقي لك");
    expect(vi.mocked(SessionView).mock.calls[0][0]).toMatchObject({ minutesRemaining: null });
  });

  it.each(["ample", "unlimited"])("keeps the %s allowance start screen unchanged", async (kind) => {
    if (kind === "unlimited") backend.allowance.mockResolvedValue({ ok: true, data: { ...allowance, limits: { ...allowance.limits, seconds: null, sessions: null } } });
    expect(await render()).toContain("data-session-view");
    expect(vi.mocked(SessionView).mock.calls[0][0]).toMatchObject({ minutesRemaining: null });
  });

  it("uses a fresh allowance on the next server render after a token refusal", async () => {
    expect(await render()).toContain("data-session-view");
    vi.mocked(SessionView).mockClear();
    backend.allowance.mockResolvedValue({ ok: true, data: { ...allowance, usage: { ...allowance.usage, sessions: 6 } } });
    expect(await render()).toContain("تقدر تبدأ حصتك الجاية في 31 أكتوبر 2026");
    expect(SessionView).not.toHaveBeenCalled();
    expect(backend.allowance).toHaveBeenCalledTimes(2);
  });
});

describe("Session page start gates", () => {
  const unlimited = { ...allowance, unlimited: true };
  const spent = { ...allowance, usage: { ...allowance.usage, seconds: 3600 } };
  const call = () => SessionPage({ params: Promise.resolve({ locale: "ar", courseSlug: course.slug, chapterId: "aaaaaaaa-0000-4000-8000-000000000001" }), searchParams: Promise.resolve({}) });

  it("redirects a student who is not enrolled to the Course page", async () => {
    backend.enrollments.mockResolvedValue({ ok: true, data: [] });
    await call();
    expect(redirect).toHaveBeenCalledWith({ locale: "ar", href: "/c/math-101" });
    expect(SessionView).not.toHaveBeenCalled();
    expect(backend.lessons).not.toHaveBeenCalled();
  });
  describe("for an archived course", () => {
    const archived: Course = { ...course, status: "archived" };
    beforeEach(() => backend.target.mockResolvedValue({ kind: "found", course: archived, chapter: archived.chapters[0] }));
    it("opens the session for a student with an active enrollment", async () => {
      backend.enrollments.mockResolvedValue({ ok: true, data: [{ course: archived }] });
      expect(await render()).toContain("data-session-view");
      expect(redirect).not.toHaveBeenCalled();
      expect(vi.mocked(SessionView).mock.calls[0][0]).toMatchObject({ courseSlug: "math-101", contentPath: "courses/math-101/ch_1/" });
    });
    it("sends a student who is not enrolled to the Course page, which explains it", async () => {
      backend.enrollments.mockResolvedValue({ ok: true, data: [] });
      await call();
      expect(redirect).toHaveBeenCalledWith({ locale: "ar", href: "/c/math-101" });
      expect(SessionView).not.toHaveBeenCalled();
      expect(backend.lessons).not.toHaveBeenCalled();
    });
    it("still blocks an enrolled student whose usage is used up", async () => {
      backend.enrollments.mockResolvedValue({ ok: true, data: [{ course: archived }] });
      backend.allowance.mockResolvedValue({ ok: true, data: spent });
      expect(await render()).not.toContain("data-session-view");
      expect(SessionView).not.toHaveBeenCalled();
    });
    it("opens the session for an unlimited account that is not enrolled", async () => {
      backend.enrollments.mockResolvedValue({ ok: true, data: [] });
      backend.allowance.mockResolvedValue({ ok: true, data: unlimited });
      expect(await render()).toContain("data-session-view");
    });
  });
  it("redirects when enrollments cannot be read", async () => {
    backend.enrollments.mockResolvedValue({ ok: false, kind: "network" });
    await call();
    expect(redirect).toHaveBeenCalledOnce();
  });
  it("redirects a student who is both not enrolled and used up", async () => {
    backend.enrollments.mockResolvedValue({ ok: true, data: [] });
    backend.allowance.mockResolvedValue({ ok: true, data: spent });
    await call();
    expect(redirect).toHaveBeenCalledOnce();
  });
  it("opens the session for an unlimited account that is not enrolled", async () => {
    backend.enrollments.mockResolvedValue({ ok: true, data: [] });
    backend.allowance.mockResolvedValue({ ok: true, data: unlimited });
    expect(await render()).toContain("data-session-view");
    expect(redirect).not.toHaveBeenCalled();
    expect(vi.mocked(SessionView).mock.calls[0][0]).toMatchObject({ minutesRemaining: null });
  });
  it("opens the session for an unlimited account whose usage is used up", async () => {
    backend.allowance.mockResolvedValue({ ok: true, data: { ...unlimited, usage: spent.usage } });
    const html = await render();
    expect(html).toContain("data-session-view");
    expect(html).not.toContain(ar.Quota.usedUp.limit);
  });
  it.each([false, true])("still returns 404 for a coming-soon chapter (unlimited: %s)", async (isUnlimited) => {
    const soon = { ...course.chapters[0], state: "coming_soon" as const, contentPath: null };
    backend.target.mockResolvedValue({ kind: "found", course: { ...course, chapters: [soon] }, chapter: soon });
    backend.allowance.mockResolvedValue({ ok: true, data: { ...allowance, unlimited: isUnlimited } });
    await expect(call()).rejects.toThrow();
    expect(SessionView).not.toHaveBeenCalled();
  });
});

describe("Session page routing and content", () => {
  const call = () => SessionPage({ params: Promise.resolve({ locale: "ar", courseSlug: "old-slug", chapterId: "aaaaaaaa-0000-4000-8000-000000000001" }), searchParams: Promise.resolve({ room: "r" }) });

  it("redirects a stale course slug to the current one, keeping the chapter id and query", async () => {
    backend.target.mockResolvedValue({ kind: "redirect", slug: "math-101" });
    await call();
    expect(redirect).toHaveBeenCalledWith({ locale: "ar", href: "/session/math-101/aaaaaaaa-0000-4000-8000-000000000001?room=r" });
    expect(SessionView).not.toHaveBeenCalled();
    expect(backend.lessons).not.toHaveBeenCalled();
  });
  it("returns 404 for an unknown chapter id", async () => {
    backend.target.mockResolvedValue({ kind: "not-found" });
    await expect(call()).rejects.toThrow();
    expect(SessionView).not.toHaveBeenCalled();
  });
  it("hands the view the chapter id and the catalog content path, and reads lessons from that path", async () => {
    expect(await render()).toContain("data-session-view");
    expect(backend.lessons).toHaveBeenCalledWith("courses/math-101/ch_1/");
    expect(vi.mocked(SessionView).mock.calls[0][0]).toMatchObject({
      courseSlug: "math-101", chapterId: "aaaaaaaa-0000-4000-8000-000000000001", chapterNo: 1, contentPath: "courses/math-101/ch_1/",
    });
    expect(vi.mocked(SessionView).mock.calls[0][0]).not.toHaveProperty("content");
    expect(vi.mocked(SessionView).mock.calls[0][0]).not.toHaveProperty("pdfUrl");
  });
});

describe("Remaining minutes copy", () => {
  it.each([
    [0, "0 دقيقة"], [1, "دقيقة واحدة"], [2, "دقيقتين"], [3, "3 دقائق"], [11, "11 دقيقةً"], [14, "14 دقيقةً"],
  ])("uses Arabic plurals for %i", (count, words) => {
    const html = renderToStaticMarkup(<NextIntlClientProvider locale="ar" messages={ar} timeZone="UTC"><RemainingMinutes count={count as number} /></NextIntlClientProvider>);
    expect(html).toContain(`باقي لك ${words} في دورة الاستخدام هذي`);
    expect(html).not.toMatch(/[٠-٩]/);
  });
  it.each([0, 1, 2, 14])("uses English plurals for %i", (count) => {
    const html = renderToStaticMarkup(<NextIntlClientProvider locale="en" messages={en} timeZone="UTC"><RemainingMinutes count={count} /></NextIntlClientProvider>);
    expect(html).toContain(`You have ${count} ${count === 1 ? "minute" : "minutes"} left in this usage period`);
  });
});
