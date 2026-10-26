import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createTranslator } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ar from "../../../../messages/ar.json";
import en from "../../../../messages/en.json";
import type { PlanView } from "@/lib/plans/view";
import { Pricing } from "./sections";

const mocks = vi.hoisted(() => ({ plans: vi.fn() }));
vi.mock("@/lib/plans/server", () => ({ getPlans: mocks.plans }));
vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace: string) => createTranslator({ locale: "ar", messages: ar, namespace } as never),
}));
vi.mock("@/app/[locale]/plans/plan-card", () => ({ PlanCard: ({ plan }: { plan: PlanView }) => <article data-plan={plan.id} /> }));
vi.mock("@/components/becan/kit", () => ({
  Section: ({ children, id }: { children: ReactNode; id?: string }) => <section id={id}>{children}</section>,
  PrimaryButton: () => null,
  QuietLink: () => null,
}));
vi.mock("@/i18n/navigation", () => ({ Link: ({ children }: { children: ReactNode }) => <a>{children}</a> }));

const plan = (id: string, price: number): PlanView => ({ id, name: { ar: id, en: id }, price, minutes: 60, hours: 1, courses: 1, sessions: 6, badge: null, featured: false });

beforeEach(() => vi.clearAllMocks());

describe("landing Pricing section", () => {
  it("renders one card per listed Plan under #pricing, priced per 30 days", async () => {
    mocks.plans.mockResolvedValue({ ok: true, plans: [plan("free", 0), plan("lite", 90), plan("pro", 149)] });
    const html = renderToStaticMarkup(await Pricing());
    expect(html).toContain('id="pricing"');
    expect(html.match(/data-plan=/g)).toHaveLength(3);
    expect(ar.Landing.Sections.pricingNote).toContain("30 يومًا");
    expect(ar.Landing.Sections.pricingNote).not.toContain("شهر");
    expect(en.Landing.Sections.pricingNote).toContain("30 days");
  });

  it("renders nothing when the plans cannot be read, so the landing never breaks", async () => {
    mocks.plans.mockResolvedValue({ ok: false });
    expect(await Pricing()).toBeNull();
  });
});
