import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createFormatter, createTranslator } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ar from "../../../../../messages/ar.json";
import en from "../../../../../messages/en.json";
import type { Allowance } from "@/lib/allowance/schema";
import type { BackendResult } from "@/lib/auth/read-backend";
import SubscriptionPage, { generateMetadata } from "./page";
import { RetryAllowance } from "./retry-allowance";

const backend = vi.hoisted(() => ({ allowance: vi.fn(), account: vi.fn(), refresh: vi.fn(), locale: "ar" as "ar" | "en" }));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ refresh: backend.refresh }) }));
vi.mock("@/lib/allowance/server", () => ({ getAllowance: backend.allowance }));
vi.mock("@/lib/auth/session", () => ({ requireAccount: backend.account }));
vi.mock("next-intl/server", () => ({
  setRequestLocale: (locale: "ar" | "en") => { backend.locale = locale; },
  getTranslations: async (options: string | { locale: "ar" | "en"; namespace: "Settings.Subscription" }) => {
    const locale = typeof options === "string" ? backend.locale : options.locale;
    return createTranslator({ locale, messages: locale === "ar" ? ar : en, namespace: "Settings.Subscription" });
  },
  getFormatter: async ({ locale }: { locale: "ar" | "en" }) => createFormatter({ locale, timeZone: "UTC" }),
}));
vi.mock("../_shell", () => ({
  SettingsShell: ({ title, lede, children }: { title: string; lede?: string; children: ReactNode }) => <main><h1>{title}</h1>{lede ? <p>{lede}</p> : null}{children}</main>,
  SettingsCard: ({ title, children }: { title?: string; children: ReactNode }) => <section>{title ? <h2>{title}</h2> : null}{children}</section>,
}));

const allowance: Allowance = {
  unlimited: false,
  plan: { id: "free", name: { ar: "الباقة المجانية", en: "Free plan" } },
  period: { start: "2026-10-01T00:00:00Z", end: "2026-10-31T00:00:00Z" },
  limits: { sessions: 6, seconds: 3600, enrollments: 1, sessionSeconds: 1800, minStartSeconds: 180 },
  usage: { sessions: 4, seconds: 2280, enrollments: 1 },
};

function props(locale: "ar" | "en", searchParams: Record<string, string> = {}) {
  return { params: Promise.resolve({ locale }), searchParams: Promise.resolve(searchParams) };
}
async function render(locale: "ar" | "en", result: BackendResult<Allowance>, searchParams = {}) {
  backend.allowance.mockResolvedValue(result);
  return renderToStaticMarkup(await SubscriptionPage(props(locale, searchParams)));
}
const textOf = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&#x27;/g, "'");

beforeEach(() => { vi.clearAllMocks(); backend.locale = "ar"; });

describe("Plan page", () => {
  it.each(["ar", "en"] as const)("shows real usage, the localized plan and renewal in %s with Latin digits", async (locale) => {
    const messages = (locale === "ar" ? ar : en).Settings.Subscription;
    const html = await render(locale, { ok: true, data: allowance });
    const text = textOf(html);
    expect(text).toContain(messages.lede);
    expect(html).toContain(`<p class="text-sm leading-base text-ink-2">${messages.minutesLeft}</p>`);
    expect(html).not.toContain("<h2");
    expect(html).toMatch(/class="[^"]*text-4xl leading-none[^"]*tracking-tight/);
    expect(html).not.toContain("md:text-5xl");
    expect(text).not.toContain(locale === "ar" ? "ما تقدر تبدأ حصة جديدة" : "You can't start a new session");
    expect(text).toContain("22");
    expect(text).toContain(locale === "ar" ? "4 من 6" : "4 of 6");
    expect(text).toContain(locale === "ar" ? "38 من 60" : "38 of 60");
    expect(text).toContain(locale === "ar" ? "1 من 1" : "1 of 1");
    expect(text).toContain(allowance.plan.name[locale]);
    expect(text).toContain("31");
    expect(text).toContain("2026");
    expect(text).toContain(locale === "ar" ? "أكتوبر" : "October");
    expect(text).not.toMatch(/[٠-٩]/);
    const ordered = [messages.minutesLeft, messages.sessions, messages.minutesUsed, messages.courses, allowance.plan.name[locale]];
    const positions = ordered.map((label) => text.indexOf(label));
    expect(positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1]))).toBe(true);
    expect(html).not.toMatch(/<button|amber|pressable|ريال|SAR|وسيلة الدفع|Payment method|Cancel|إلغاء|upgrade|ترقية/);
    expect(backend.account).toHaveBeenCalledWith(locale, "/settings/subscription");
    expect(backend.allowance).toHaveBeenCalledOnce();
    expect((await generateMetadata(props(locale))).title).toBe(messages.metadataTitle);
  });

  it.each(["ar", "en"] as const)("shows unlimited usage without a denominator in %s", async (locale) => {
    const data = { ...allowance, limits: { ...allowance.limits, sessions: null, seconds: null, enrollments: null } };
    const html = await render(locale, { ok: true, data });
    expect(textOf(html)).toContain((locale === "ar" ? ar : en).Settings.Subscription.unlimited);
    expect(html).toMatch(/<dd[^>]*>4<\/dd>/);
    expect(html).toMatch(/<dd[^>]*>38<\/dd>/);
    expect(html).toMatch(/<dd[^>]*>1<\/dd>/);
    const usageText = textOf(html.slice(html.indexOf("<dl"), html.indexOf("</dl>")));
    expect(usageText).not.toMatch(/ من | of |null|NaN|Infinity/);
  });

  it.each(["network", "http", "invalid"] as const)("renders translated %s errors without invented numbers", async (kind) => {
    for (const locale of ["ar", "en"] as const) {
      const html = await render(locale, { ok: false, kind });
      const messages = (locale === "ar" ? ar : en).Settings.Subscription;
      expect(textOf(html)).toContain(messages.errorTitle);
      expect(textOf(html)).toContain(messages.errorBody);
      expect(textOf(html)).toContain(messages.lede);
      expect(html).not.toContain('role="alert"');
      expect(html).toMatch(/<section>.*<button[^>]*>.*<\/button>.*<\/section>/);
      expect(textOf(html)).toContain(messages.retry);
      expect(html).toContain("min-h-11 items-center rounded-pill border border-line");
      expect(html).not.toMatch(/amber|pressable/);
      expect(textOf(html)).not.toMatch(/[0-9٠-٩]/);
      expect(textOf(html)).not.toContain(allowance.plan.name[locale]);
      expect(html).not.toContain("<dl");
    }
  });

  it("refreshes the page when retry is clicked", () => {
    const button = RetryAllowance({ label: en.Settings.Subscription.retry });
    button.props.onClick();
    expect(backend.refresh).toHaveBeenCalledOnce();
  });

  it.each(["ar", "en"] as const)("keeps rounded used and remaining minutes consistent in %s", async (locale) => {
    const data = { ...allowance, usage: { ...allowance.usage, seconds: 2290 } };
    const html = await render(locale, { ok: true, data });
    expect(textOf(html)).toContain(locale === "ar" ? "39 من 60" : "39 of 60");
    expect(html).toMatch(/<p[^>]*tabular-nums[^>]*>21<\/p>/);

    const unlimited = { ...data, limits: { ...data.limits, seconds: null } };
    expect(await render(locale, { ok: true, data: unlimited })).toMatch(/<dd[^>]*>39<\/dd>/);
  });

  it.each(["ar", "en"] as const)("shows a quiet renewal notice when sessions or minutes are exhausted in %s", async (locale) => {
    for (const [sessions, seconds] of [[6, 2280], [4, 3421], [4, 3600]]) {
      const data = { ...allowance, usage: { ...allowance.usage, sessions, seconds } };
      const html = await render(locale, { ok: true, data });
      const text = textOf(html);
      const notice = locale === "ar" ? "ما تقدر تبدأ حصة جديدة قبل 31 أكتوبر 2026" : "You can't start a new session before October 31, 2026";
      expect(text).toContain(notice);
      expect(html).toMatch(/tabular-nums[^>]*>\d+<\/p><p class="mt-3 text-sm leading-base text-ink-2">/);
      expect(html).not.toMatch(/<button|text-error|amber/);
    }
  });

  it.each(["ar", "en"] as const)("uses the Riyadh date when the renewal crosses midnight in %s", async (locale) => {
    const data = { ...allowance, period: { ...allowance.period, end: "2026-10-30T22:00:00Z" } };
    const text = textOf(await render(locale, { ok: true, data }));
    expect(text).toContain(locale === "ar" ? "تتجدد حدود استخدامك في 31 أكتوبر 2026" : "Your usage limits renew on October 31, 2026");
  });

  it("ignores the old canceled preview", async () => {
    const result = { ok: true, data: allowance } as const;
    expect(await render("ar", result, { s: "canceled" })).toBe(await render("ar", result));
  });

  it("reads and displays the current response each time", async () => {
    const data = { ...allowance, usage: { sessions: 5, seconds: 3000, enrollments: 0 } };
    const text = textOf(await render("en", { ok: true, data }));
    expect(text).toContain("10");
    expect(text).toContain("5 of 6");
    expect(text).toContain("50 of 60");
    expect(text).toContain("0 of 1");
    expect(text).not.toContain("38 of 60");
  });

  it("does not request an allowance when the account guard redirects", async () => {
    backend.account.mockRejectedValueOnce(new Error("Redirect to sign in"));
    await expect(SubscriptionPage(props("ar"))).rejects.toThrow("Redirect to sign in");
    expect(backend.allowance).not.toHaveBeenCalled();
  });
});
