import { describe, expect, it } from "vitest";
import { allowanceSchema, type Allowance } from "./schema";
import { minutesLeft, nearlyOut, usedUp } from "./rules";

const allowance: Allowance = {
  plan: { id: "free", name: { ar: "الباقة المجانية", en: "Free plan" } },
  period: { start: "2026-10-01T00:00:00Z", end: "2026-10-31T00:00:00Z" },
  limits: { sessions: 6, seconds: 3600, enrollments: 1, sessionSeconds: 1800, minStartSeconds: 180 },
  usage: { sessions: 4, seconds: 2280, enrollments: 1 },
};
const limitKeys = ["sessions", "seconds", "enrollments", "sessionSeconds", "minStartSeconds"] as const;
const usageKeys = ["sessions", "seconds", "enrollments"] as const;

function withSeconds(seconds: number, limits: Partial<Allowance["limits"]> = {}): Allowance {
  return { ...allowance, limits: { ...allowance.limits, ...limits }, usage: { ...allowance.usage, seconds } };
}

describe("allowance backend contract", () => {
  it("parses the real contract and timezone offsets", () => {
    expect(allowanceSchema.parse(allowance)).toEqual(allowance);
    expect(allowanceSchema.safeParse({ ...allowance, period: { ...allowance.period, end: "2026-10-31T03:00:00+03:00" } }).success).toBe(true);
  });
  it.each(limitKeys)("accepts a null %s limit", (key) => {
    expect(allowanceSchema.parse({ ...allowance, limits: { ...allowance.limits, [key]: null } }).limits[key]).toBeNull();
  });
  it("accepts zero limits, all unlimited limits, and over-limit usage", () => {
    for (const value of [0, null]) {
      const limits = Object.fromEntries(limitKeys.map((key) => [key, value]));
      expect(allowanceSchema.safeParse({ ...allowance, limits }).success).toBe(true);
    }
    expect(allowanceSchema.safeParse(withSeconds(4000)).success).toBe(true);
  });
  it.each(limitKeys)("rejects invalid or missing %s limits", (key) => {
    for (const value of [-1, 1.5, "6", undefined, Infinity, NaN]) {
      expect(allowanceSchema.safeParse({ ...allowance, limits: { ...allowance.limits, [key]: value } }).success).toBe(false);
    }
  });
  it.each(usageKeys)("rejects invalid or missing %s usage", (key) => {
    for (const value of [-1, 1.5, "4", null, undefined, Infinity, NaN]) {
      expect(allowanceSchema.safeParse({ ...allowance, usage: { ...allowance.usage, [key]: value } }).success).toBe(false);
    }
  });
  it.each([
    { plan: { id: "", name: allowance.plan.name } },
    { plan: { id: "free", name: { ar: "الباقة المجانية" } } },
    { plan: { id: "free", name: { ...allowance.plan.name, en: "" } } },
    { period: { ...allowance.period, start: "yesterday" } },
    { period: { ...allowance.period, end: "2026-10-31T00:00:00" } },
    { period: { ...allowance.period, end: "2026-02-30T00:00:00Z" } },
    { limits: undefined }, { usage: undefined },
  ])("rejects malformed required fields %j", (fields) => {
    expect(allowanceSchema.safeParse({ ...allowance, ...fields }).success).toBe(false);
  });
});

describe("minutesLeft", () => {
  it.each([[2280, 22], [2281, 21], [2290, 21], [3599, 0], [3600, 0], [4000, 0]])("subtracts rounded-up usage of %i seconds to leave %i minutes", (seconds, expected) => {
    expect(minutesLeft(withSeconds(seconds))).toBe(expected);
  });
  it.each([0, 1, 59, 60, 61, 2290, 3599, 3600])("keeps used and remaining minutes consistent for %i seconds used", (seconds) => {
    const data = withSeconds(seconds);
    expect(Math.ceil(data.usage.seconds / 60) + minutesLeft(data)!).toBe(60);
  });
  it("uses the displayed limit minutes when the limit includes partial minutes", () => {
    expect(minutesLeft(withSeconds(1, { seconds: 3601 }))).toBe(59);
    expect(minutesLeft(withSeconds(2290, { seconds: 3601 }))).toBe(21);
  });
  it("returns null for unlimited minutes", () => {
    expect(minutesLeft(withSeconds(10000, { seconds: null }))).toBeNull();
  });
});

describe("usedUp", () => {
  it.each([6, 7])("is true at or above the session limit (%i)", (sessions) => {
    expect(usedUp({ ...allowance, usage: { ...allowance.usage, sessions } })).toBe(true);
  });
  it.each([[3420, false], [3421, true], [3600, true], [4000, true]])("compares %i seconds used against the minimum start time", (seconds, expected) => {
    expect(usedUp(withSeconds(seconds))).toBe(expected);
  });
  it.each([[3599, false], [3600, true], [4000, true]])("treats null minStartSeconds as one second (%i used)", (seconds, expected) => {
    expect(usedUp(withSeconds(seconds, { minStartSeconds: null }))).toBe(expected);
  });
  it("keeps an explicit zero minimum start time", () => {
    expect(usedUp(withSeconds(3600, { minStartSeconds: 0 }))).toBe(false);
  });
  it("ignores unlimited counters while keeping the other finite limit", () => {
    expect(usedUp(withSeconds(4000, { sessions: null }))).toBe(true);
    expect(usedUp({ ...withSeconds(4000, { seconds: null }), usage: { ...allowance.usage, sessions: 6 } })).toBe(true);
    expect(usedUp({ ...withSeconds(4000, { sessions: null, seconds: null }), usage: { sessions: 100, seconds: 4000, enrollments: 1 } })).toBe(false);
  });
  it("does not treat enrollment or per-session limits as exhaustion", () => {
    expect(usedUp(withSeconds(2280, { enrollments: 0, sessionSeconds: 0 }))).toBe(false);
  });
  it("recognizes zero session and seconds limits", () => {
    expect(usedUp(withSeconds(0, { sessions: 0 }))).toBe(true);
    expect(usedUp(withSeconds(0, { seconds: 0 }))).toBe(true);
  });
});

describe("nearlyOut", () => {
  it.each([[2700, false], [2701, true], [3420, true], [3421, false]])("handles the 15-minute and minimum-start edges (%i seconds used)", (seconds, expected) => {
    expect(nearlyOut(withSeconds(seconds))).toBe(expected);
  });
  it("is false when sessions are exhausted even with minutes left", () => {
    expect(nearlyOut({ ...withSeconds(3000), usage: { sessions: 6, seconds: 3000, enrollments: 1 } })).toBe(false);
  });
  it("is false for unlimited minutes", () => {
    expect(nearlyOut(withSeconds(10000, { seconds: null }))).toBe(false);
  });
});
