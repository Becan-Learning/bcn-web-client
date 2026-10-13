import { describe, expect, it } from "vitest";
import type { Allowance } from "./schema";
import type { Enrollment } from "@/lib/courses/schema";
import { slotsFull } from "./rules";

const allowance: Allowance = {
  plan: { id: "free", name: { ar: "مجانية", en: "Free" } },
  period: { start: "2026-10-01T00:00:00Z", end: "2026-10-31T00:00:00Z" },
  limits: { sessions: 6, seconds: 3600, enrollments: 1, sessionSeconds: 1800, minStartSeconds: 180 },
  usage: { sessions: 4, seconds: 2280, enrollments: 1 },
};
const enrollment: Enrollment = {
  enrolledAt: "2026-10-01T00:00:00Z",
  course: {
    id: "acct-101", code: "ACCT 101", name: { ar: "المحاسبة", en: "Accounting" },
    institution: { id: "university", name: { ar: "الجامعة", en: "University" } },
    icon: "coins", tone: "lilac", chapterCount: 3, publishedChapterCount: 2,
  },
};

describe("Course slots", () => {
  it("does not block when the allowance read failed", () => {
    expect(slotsFull(null, [enrollment], "math-101")).toBe(false);
  });
  it("never blocks a null enrollment limit", () => {
    expect(slotsFull({ ...allowance, limits: { ...allowance.limits, enrollments: null } }, [enrollment], "math-101")).toBe(false);
  });
  it.each([[0, false], [1, true], [2, true]])("uses allowance usage of %i to decide fullness", (enrollments, expected) => {
    expect(slotsFull({ ...allowance, usage: { ...allowance.usage, enrollments } }, [enrollment], "math-101")).toBe(expected);
  });
  it("keeps an already enrolled course available at the limit", () => {
    expect(slotsFull(allowance, [enrollment], "acct-101")).toBe(false);
  });
  it("handles more than one course slot", () => {
    expect(slotsFull({ ...allowance, limits: { ...allowance.limits, enrollments: 2 } }, [enrollment], "math-101")).toBe(false);
  });
  it("honors a zero slot limit", () => {
    expect(slotsFull({ ...allowance, limits: { ...allowance.limits, enrollments: 0 } }, [], "math-101")).toBe(true);
  });
});
