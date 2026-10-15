import type { ComponentProps, ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ar from "../../../../messages/ar.json";
import en from "../../../../messages/en.json";
import type { Allowance } from "@/lib/allowance/schema";
import type { Enrollment } from "@/lib/courses/schema";
import HomePage from "./page";
import { HomeView } from "./home-view";

const backend = vi.hoisted(() => ({ allowance: vi.fn(), enrollments: vi.fn(), account: vi.fn(), locale: "ar" as "ar" | "en" }));
vi.mock("@/lib/allowance/server", () => ({ getAllowance: backend.allowance }));
vi.mock("@/lib/auth/courses", () => ({ getEnrollments: backend.enrollments }));
vi.mock("@/lib/auth/session", () => ({ requireAccount: backend.account }));
vi.mock("next-intl/server", () => ({
  setRequestLocale: (locale: "ar" | "en") => { backend.locale = locale; },
  getLocale: async () => backend.locale,
  getTranslations: async () => createTranslator({ locale: backend.locale, messages: backend.locale === "ar" ? ar : en, namespace: "Home" }),
}));
vi.mock("@/i18n/navigation", () => ({ Link: (props: ComponentProps<"a">) => <a {...props} /> }));
vi.mock("@/components/becan/kit", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Copy: ({ children }: { children: ReactNode }) => <>{children}</>,
  PrimaryButton: (props: ComponentProps<"a">) => <a {...props} />,
  GhostButton: (props: ComponentProps<"a">) => <a {...props} />,
}));

const enrollment: Enrollment = {
  enrolledAt: "2026-10-01T00:00:00Z",
  course: {
    id: "11111111-1111-4111-8111-111111111111", slug: "math-101", code: "MATH 101", name: { ar: "الرياضيات", en: "Mathematics" },
    institution: { id: "university", name: { ar: "الجامعة", en: "University" } },
    icon: "blocks", tone: "lilac", chapterCount: 1, publishedChapterCount: 1,
  },
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
  backend.account.mockResolvedValue({ user: { name: "Student" } });
  backend.enrollments.mockResolvedValue({ ok: true, data: [enrollment] });
  backend.allowance.mockResolvedValue({ ok: true, data: allowance });
});

async function render(locale: "ar" | "en" = "ar") {
  const page = await HomePage({ params: Promise.resolve({ locale }), searchParams: Promise.resolve({}) });
  const view = await HomeView(page.props);
  const stream = await renderToReadableStream(<NextIntlClientProvider locale={locale} messages={locale === "ar" ? ar : en} timeZone="UTC">{view}</NextIntlClientProvider>);
  await stream.allReady;
  return (await new Response(stream).text()).replace(/&#x27;/g, "'");
}

describe("Home allowance notice", () => {
  it.each(["ar", "en"] as const)("shows exhausted sessions or minutes above the intact course list in %s", async (locale) => {
    for (const [sessions, seconds] of [[6, 2281], [4, 3421], [4, 3600]]) {
      backend.allowance.mockResolvedValue({ ok: true, data: { ...allowance, usage: { ...allowance.usage, sessions, seconds } } });
      const html = await render(locale);
      const label = (locale === "ar" ? ar : en).Quota.usedUp.limit;
      expect(html).toContain(label);
      expect(html).toContain(String(Math.ceil(seconds / 60)));
      expect(html).toContain(locale === "ar" ? "31 أكتوبر 2026" : "October 31, 2026");
      expect(html).toContain(enrollment.course.name[locale]);
      expect(html).toContain('href="/c/math-101"');
      expect(html.indexOf("</header>")).toBeLessThan(html.indexOf(label));
      expect(html.indexOf(label)).toBeLessThan(html.indexOf("<h1"));
      expect(html.indexOf(label)).toBeLessThan(html.indexOf("<ul"));
      expect(html).not.toContain("/plans");
      expect(html).not.toContain('data-theme="dark"');
      expect(html).not.toMatch(/[٠-٩]/);
    }
  });

  it.each(["ample", "nearly-out", "unlimited"])("shows nothing new for an %s allowance", async (kind) => {
    const data = kind === "nearly-out"
      ? { ...allowance, usage: { ...allowance.usage, seconds: 3000 } }
      : kind === "unlimited" ? { ...allowance, limits: { ...allowance.limits, sessions: null, seconds: null } } : allowance;
    backend.allowance.mockResolvedValue({ ok: true, data });
    const html = await render();
    expect(html).not.toContain(ar.Quota.usedUp.limit);
    expect(html).toContain('href="/c/math-101"');
  });

  it.each(["network", "http", "invalid"])("shows nothing new on a %s allowance failure", async (kind) => {
    backend.allowance.mockResolvedValue({ ok: false, kind });
    const html = await render();
    expect(html).not.toContain(ar.Quota.usedUp.limit);
    expect(html).toContain('href="/c/math-101"');
  });

  it.each(["empty", "failed"])("keeps the %s course state alongside a used-up notice", async (kind) => {
    backend.allowance.mockResolvedValue({ ok: true, data: { ...allowance, usage: { ...allowance.usage, sessions: 6 } } });
    backend.enrollments.mockResolvedValue(kind === "empty" ? { ok: true, data: [] } : { ok: false, kind: "network" });
    const html = await render();
    expect(html).toContain(ar.Quota.usedUp.limit);
    expect(html).toContain(kind === "empty" ? ar.Home.empty : ar.Home.loadError);
  });

  it("removes the notice when the next period's fresh allowance is available", async () => {
    backend.allowance.mockResolvedValueOnce({ ok: true, data: { ...allowance, usage: { ...allowance.usage, sessions: 6 } } });
    expect(await render()).toContain(ar.Quota.usedUp.limit);
    expect(await render()).not.toContain(ar.Quota.usedUp.limit);
    expect(backend.allowance).toHaveBeenCalledTimes(2);
  });
});
