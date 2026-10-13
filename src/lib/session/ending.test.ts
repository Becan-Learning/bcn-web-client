import { describe, expect, it } from "vitest";
import type { Allowance } from "@/lib/allowance/schema";
import { INITIAL_SESSION_STATE, sessionReducer } from "./session-reducer";
import { sessionEndingQuota } from "./ending";

const allowance: Allowance = {
  plan: { id: "free", name: { ar: "مجانية", en: "Free" } },
  period: { start: "2026-10-01T00:00:00Z", end: "2026-10-30T22:00:00Z" },
  limits: { sessions: 6, seconds: 3600, enrollments: 1, sessionSeconds: 1800, minStartSeconds: 180 },
  usage: { sessions: 4, seconds: 2281, enrollments: 1 },
};
const reached = sessionReducer(INITIAL_SESSION_STATE, { action: "allowance_reached" });
const ended = sessionReducer(reached, { action: "session_ending", message: "budget" });

describe("session ending presentation", () => {
  it("uses fresh backend usage even before webhook usage reaches the limit", () => {
    expect(sessionEndingQuota(ended, allowance)).toEqual({
      kind: "used-up", minutesStudied: 39, sessionsUsed: 4,
      renewalDate: new Date(allowance.period.end),
    });
  });

  it("does not interrupt the session on the marker alone", () => {
    expect(sessionEndingQuota(reached, allowance)).toBeNull();
  });

  it("keeps a generic ending without the marker, even if the allowance is used up", () => {
    const generic = sessionReducer(INITIAL_SESSION_STATE, { action: "session_ending", message: "cap" });
    expect(sessionEndingQuota(generic, { ...allowance, usage: { ...allowance.usage, seconds: 3600 } })).toBeNull();
  });

  it("does not invent usage for a pending or failed read", () => {
    expect(sessionEndingQuota(ended, null)).toBeNull();
  });

  it("uses the latest snapshot and clears the presentation on a new session", () => {
    expect(sessionEndingQuota(ended, { ...allowance, usage: { ...allowance.usage, sessions: 5, seconds: 3600 } }))
      .toMatchObject({ minutesStudied: 60, sessionsUsed: 5 });
    expect(sessionEndingQuota(sessionReducer(ended, { action: "session_reset" }), allowance)).toBeNull();
  });
});
