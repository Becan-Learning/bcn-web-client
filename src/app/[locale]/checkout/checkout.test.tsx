import type { ReactNode } from "react";
import { renderToReadableStream, renderToStaticMarkup } from "react-dom/server";
import { createTranslator } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ar from "../../../../messages/ar.json";
import en from "../../../../messages/en.json";
import type { PlanView } from "@/lib/plans/view";
import CheckoutPage from "./page";
import ResultPage from "./result/page";

const mocks = vi.hoisted(() => ({ plans: vi.fn(), locale: "ar" as "ar" | "en", notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));
vi.mock("@/lib/plans/server", () => ({ getPlans: mocks.plans }));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a> }));
vi.mock("next-intl/server", () => ({
  setRequestLocale: (locale: "ar" | "en") => { mocks.locale = locale; },
  getTranslations: async (options: string | { locale: "ar" | "en"; namespace: string }) => {
    const locale = typeof options === "string" ? mocks.locale : options.locale;
    const namespace = typeof options === "string" ? options : options.namespace;
    return createTranslator({ locale, messages: locale === "ar" ? ar : en, namespace } as never);
  },
}));
vi.mock("@/components/becan/kit", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Section: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  SiteHeader: () => null,
  PrimaryButton: ({ href, children }: { href?: string; children: ReactNode }) => <a href={href}>{children}</a>,
  GhostButton: ({ href, children }: { href?: string; children: ReactNode }) => <a href={href}>{children}</a>,
  QuietLink: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("./checkout-form", () => ({ CheckoutForm: ({ plan }: { plan: PlanView }) => <form data-plan={plan.id} /> }));
vi.mock("../plans/retry-plans", () => ({ RetryPlans: ({ label }: { label: string }) => <button>{label}</button> }));
/* الصفحتان مفتوحتان للزائر: أي استدعاء لحارس الحساب يُسقط الاختبار. */
vi.mock("@/lib/auth/session", () => ({ requireAccount: () => { throw new Error("must stay public"); } }));

const plans: PlanView[] = [
  { id: "free", name: { ar: "باقة مجانية", en: "Free plan" }, price: 0, minutes: 60, hours: 1, courses: 1, sessions: 6, badge: null, featured: false },
  { id: "lite", name: { ar: "باقة لايت", en: "Lite plan" }, price: 90, minutes: 250, hours: 4, courses: null, sessions: 25, badge: null, featured: true },
];
const props = (locale: "ar" | "en", search: Record<string, string> = {}) => ({ params: Promise.resolve({ locale }), searchParams: Promise.resolve(search) });
/* صفحة النتيجة تُركّب مكوّنات خادم غير متزامنة، فتُرسم بالتدفّق لا بـ`renderToStaticMarkup`. */
async function renderAsync(node: ReactNode): Promise<string> {
  const stream = await renderToReadableStream(node);
  await stream.allReady;
  return new Response(stream).text();
}
const textOf = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");

beforeEach(() => {
  vi.clearAllMocks();
  mocks.plans.mockResolvedValue({ ok: true, plans });
});

describe("checkout page", () => {
  it.each(["ar", "en"] as const)("is open to a visitor and passes the listed paid Plan to the form in %s", async (locale) => {
    const html = renderToStaticMarkup(await CheckoutPage(props(locale, { plan: "lite" })));
    expect(html).toContain('data-plan="lite"');
    expect(textOf(html)).toContain(locale === "ar" ? "باقة لايت — 250 دقيقة كل 30 يومًا، كل مقرراتك." : "Lite plan — 250 minutes every 30 days, All your courses.");
  });

  it.each([["an unknown Plan", { plan: "gold" }], ["a free Plan", { plan: "free" }], ["no Plan", {}]])("returns not found for %s", async (_name, search) => {
    await expect(CheckoutPage(props("ar", search))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("returns not found for a Plan the endpoint does not list", async () => {
    mocks.plans.mockResolvedValue({ ok: true, plans: [plans[0]] });
    await expect(CheckoutPage(props("ar", { plan: "lite" }))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it.each(["ar", "en"] as const)("shows an error with a retry, not a 404, when the plans cannot be read in %s", async (locale) => {
    mocks.plans.mockResolvedValue({ ok: false });
    const html = renderToStaticMarkup(await CheckoutPage(props(locale, { plan: "lite" })));
    const messages = (locale === "ar" ? ar : en).Checkout;
    expect(textOf(html)).toContain(messages.errorTitle);
    expect(textOf(html)).toContain(messages.retry);
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});

describe("checkout result page", () => {
  it.each(["ar", "en"] as const)("says direct payment is unavailable and sends the visitor to WhatsApp with the Plan name in %s", async (locale) => {
    const html = await renderAsync(await ResultPage(props(locale, { s: "success", plan: "lite" })));
    const text = textOf(html);
    const messages = (locale === "ar" ? ar : en).Checkout.Result;
    const name = locale === "ar" ? "باقة لايت" : "Lite plan";
    expect(text).toContain(messages.successTitle);
    expect(text).toContain(messages.successDirect);
    expect(text).toContain(locale === "ar"
      ? `للاشتراك في ${name}، تواصل مع خدمة العملاء على واتساب`
      : `To subscribe to the ${name}, contact customer support on WhatsApp`);
    expect(text).toContain(messages.successNothing);
    const message = locale === "ar" ? `السلام عليكم، أبي أشترك في ${name}` : `Hi, I’d like to subscribe to the ${name}`;
    const whatsapp = html.match(/<a\b[^>]*wa\.me[^>]*>/)![0];
    expect(whatsapp).toContain(`href="https://wa.me/966501473370?text=${encodeURIComponent(message)}"`);
    expect(whatsapp).toContain('target="_blank"');
    expect(whatsapp).toContain('rel="noopener noreferrer"');
    expect(whatsapp).toContain("bg-pressable");
    expect(text).toContain(messages.whatsapp);
    expect(html).toContain("<svg");
    expect(html).toContain('href="/courses"');
    expect(html.match(/bg-pressable/g)).toHaveLength(1);
    expect(html).not.toContain("/settings/invoices");
    expect(html).not.toContain("/settings/subscription");
    expect(text).not.toMatch(/قريبًا|opens soon|received your request|استلمنا/);
  });

  it("defaults to the thank-you state and drops the Plan name when it is unknown, free or unreadable", async () => {
    for (const search of [{ plan: "gold" }, { plan: "free" }, {}] as Record<string, string>[]) {
      const html = await renderAsync(await ResultPage(props("en", search)));
      expect(textOf(html)).toContain(en.Checkout.Result.successContact);
      expect(textOf(html)).not.toContain("subscribe to the");
      expect(html).toContain(`wa.me/966501473370?text=${encodeURIComponent(en.Checkout.Result.whatsappMessage)}`);
    }
    mocks.plans.mockResolvedValue({ ok: false });
    expect(textOf(await renderAsync(await ResultPage(props("en", { s: "success", plan: "lite" }))))).toContain(en.Checkout.Result.successContact);
  });

  it("keeps the failed and pending states, retrying the listed Plan or falling back to /plans", async () => {
    const failed = await renderAsync(await ResultPage(props("en", { s: "failed", plan: "lite", r: "funds" })));
    expect(failed).toContain('href="/checkout?plan=lite"');
    expect(textOf(failed)).toContain(en.Checkout.Result.failedTitle);
    expect(await renderAsync(await ResultPage(props("en", { s: "failed", plan: "gold" })))).toContain('href="/plans"');
    expect(textOf(await renderAsync(await ResultPage(props("ar", { s: "pending" }))))).toContain(ar.Checkout.Result.pendingTitle);
  });
});
