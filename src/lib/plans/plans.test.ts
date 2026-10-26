import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import ar from "../../../messages/ar.json";
import en from "../../../messages/en.json";
import { coursesLabel, hoursLabel, minutesLabel, sessionsLabel, type FactsTranslator } from "./labels";
import { planSchema, plansResponseSchema, type ApiPlan } from "./schema";
import { breakdown, currentPaidPlan, formatPrice, planById, toPlanView, VAT } from "./view";

const free: ApiPlan = {
  id: "free",
  name: { ar: "باقة مجانية", en: "Free plan" },
  priceHalalas: 0,
  featured: false,
  badge: null,
  limits: { sessions: 6, seconds: 3600, enrollments: 1, sessionSeconds: 1800, minStartSeconds: 180 },
};
const lite: ApiPlan = {
  id: "lite",
  name: { ar: "باقة لايت", en: "Lite plan" },
  priceHalalas: 9000,
  featured: true,
  badge: { ar: "الأنسب للبداية", en: "Best for getting started" },
  limits: { sessions: 25, seconds: 15000, enrollments: null, sessionSeconds: 1800, minStartSeconds: 180 },
};
const pro: ApiPlan = {
  id: "pro",
  name: { ar: "باقة برو", en: "Pro plan" },
  priceHalalas: 14900,
  featured: false,
  badge: { ar: "الأنسب قبل الاختبارات", en: "Best before exams" },
  limits: { sessions: 50, seconds: 30000, enrollments: null, sessionSeconds: 1800, minStartSeconds: 180 },
};

describe("plans response schema", () => {
  it("parses the contract with the seed Plans in display order", () => {
    const parsed = plansResponseSchema.parse({ plans: [free, lite, pro] });
    expect(parsed.plans.map((plan) => plan.id)).toEqual(["free", "lite", "pro"]);
    expect(parsed.plans[1].limits.enrollments).toBeNull();
    expect(parsed.plans[0].badge).toBeNull();
  });
  it("accepts any limit as null (unlimited)", () => {
    const limits = { sessions: null, seconds: null, enrollments: null, sessionSeconds: null, minStartSeconds: null };
    expect(planSchema.parse({ ...pro, limits }).limits).toEqual(limits);
  });
  it.each([
    ["an empty list", { plans: [] }],
    ["no plans key", {}],
    ["a negative price", { plans: [{ ...lite, priceHalalas: -1 }] }],
    ["a fractional price", { plans: [{ ...lite, priceHalalas: 90.5 }] }],
    ["a string price", { plans: [{ ...lite, priceHalalas: "9000" }] }],
    ["a missing name language", { plans: [{ ...lite, name: { ar: "باقة لايت" } }] }],
    ["an empty id", { plans: [{ ...lite, id: "" }] }],
    ["a missing badge", { plans: [{ ...lite, badge: undefined }] }],
    ["a negative limit", { plans: [{ ...lite, limits: { ...lite.limits, sessions: -1 } }] }],
    ["a missing limit", { plans: [{ ...lite, limits: { sessions: 1 } }] }],
    ["a non-boolean featured", { plans: [{ ...lite, featured: "yes" }] }],
  ])("rejects %s", (_name, body) => {
    expect(plansResponseSchema.safeParse(body).success).toBe(false);
  });
});

describe("plan view-model", () => {
  it("converts halalas to riyals and seconds to minutes and hours", () => {
    expect(toPlanView(free)).toEqual({
      id: "free", name: free.name, price: 0, minutes: 60, hours: 1, courses: 1, sessions: 6, badge: null, featured: false,
    });
    expect(toPlanView(lite)).toMatchObject({ price: 90, minutes: 250, hours: 4, courses: null, sessions: 25, featured: true, badge: lite.badge });
    expect(toPlanView(pro)).toMatchObject({ price: 149, minutes: 500, hours: 8, courses: null, sessions: 50 });
  });
  it("does not estimate chapters", () => {
    expect(Object.keys(toPlanView(lite))).not.toContain("chapters");
  });
  it("keeps unlimited limits as null without inventing hours", () => {
    const view = toPlanView({ ...pro, limits: { ...pro.limits, seconds: null, sessions: null } });
    expect(view.minutes).toBeNull();
    expect(view.hours).toBeNull();
    expect(view.sessions).toBeNull();
  });
  it("drops an hours translation that rounds to zero", () => {
    expect(toPlanView({ ...free, limits: { ...free.limits, seconds: 600 } }).hours).toBeNull();
    expect(toPlanView({ ...free, limits: { ...free.limits, seconds: 1800 } }).hours).toBe(1);
  });
  it("formats prices with Latin digits and two decimals only when needed", () => {
    expect(formatPrice(toPlanView(pro).price)).toBe("149");
    expect(formatPrice(toPlanView({ ...pro, priceHalalas: 9990 }).price)).toBe("99.90");
    expect(formatPrice(0)).toBe("0");
  });
  it("derives net and VAT from the VAT-inclusive price", () => {
    expect(VAT).toBe(0.15);
    expect(breakdown(149)).toEqual({ net: 129.57, vat: 19.43, gross: 149 });
    expect(breakdown(90)).toEqual({ net: 78.26, vat: 11.74, gross: 90 });
    expect(breakdown(0)).toEqual({ net: 0, vat: 0, gross: 0 });
  });
  it("finds a Plan by id and reports the current Plan only when it has a price", () => {
    const plans = [free, lite, pro].map(toPlanView);
    expect(planById(plans, "pro")?.price).toBe(149);
    expect(planById(plans, "gold")).toBeUndefined();
    expect(currentPaidPlan("lite", plans)?.id).toBe("lite");
    expect(currentPaidPlan("free", plans)).toBeNull();
    expect(currentPaidPlan("gold", plans)).toBeNull();
    expect(currentPaidPlan("lite", null)).toBeNull();
    expect(currentPaidPlan(null, plans)).toBeNull();
  });
});

describe("plan labels", () => {
  const facts = (locale: "ar" | "en") =>
    createTranslator({ locale, messages: locale === "ar" ? ar : en, namespace: "PlanFacts" }) as unknown as FactsTranslator;
  const views = [free, lite, pro].map(toPlanView);

  it("labels the English seed Plans", () => {
    const t = facts("en");
    expect(views.map((plan) => hoursLabel(t, plan))).toEqual(["≈ 1 hour of guided study", "≈ 4 hours of guided study", "≈ 8 hours of guided study"]);
    expect(views.map((plan) => coursesLabel(t, plan))).toEqual(["One course", "All your courses", "All your courses"]);
    expect(views.map((plan) => sessionsLabel(t, plan))).toEqual(["Up to 6 sessions", "Up to 25 sessions", "Up to 50 sessions"]);
    expect(views.map((plan) => minutesLabel(t, plan))).toEqual(["60 minutes", "250 minutes", "500 minutes"]);
  });
  it("labels the Arabic seed Plans with Latin digits", () => {
    const t = facts("ar");
    expect(views.map((plan) => hoursLabel(t, plan))).toEqual(["≈ ساعة مذاكرة موجّهة", "≈ 4 ساعات مذاكرة موجّهة", "≈ 8 ساعات مذاكرة موجّهة"]);
    expect(views.map((plan) => coursesLabel(t, plan))).toEqual(["مقرر واحد", "كل مقرراتك", "كل مقرراتك"]);
    expect(views.map((plan) => sessionsLabel(t, plan))).toEqual(["حتى 6 حصص", "حتى 25 حصة", "حتى 50 حصة"]);
    expect(views.map((plan) => minutesLabel(t, plan))).toEqual(["60 دقيقة", "250 دقيقة", "500 دقيقة"]);
  });
  it.each(["ar", "en"] as const)("handles courses, sessions and minutes counts and null limits in %s", (locale) => {
    const t = facts(locale);
    const plan = { ...views[1], courses: 3, sessions: 12, minutes: null, hours: null };
    expect(coursesLabel(t, plan)).toContain("3");
    expect(sessionsLabel(t, plan)).toContain("12");
    expect(hoursLabel(t, plan)).toBeNull();
    const none = { ...plan, sessions: null };
    expect(sessionsLabel(t, none)).toBe(locale === "ar" ? "حصص بلا حد" : "Unlimited sessions");
    expect(minutesLabel(t, plan)).toBe(locale === "ar" ? "دقائق بلا حد" : "Unlimited minutes");
    for (const text of [coursesLabel(t, plan), sessionsLabel(t, plan), minutesLabel(t, plan)]) expect(text).not.toMatch(/[٠-٩]|null/);
  });
});
