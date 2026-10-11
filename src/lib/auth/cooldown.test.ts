import { describe, expect, it } from "vitest";
import { cooldownSeconds } from "./cooldown";

describe("Verification email resend cooldown", () => {
  it("starts with a full 60 seconds after sending", () => {
    expect(cooldownSeconds(61_000, 1_000)).toBe(60);
  });
  it.each([[1_001, 60], [31_000, 30], [60_999, 1], [61_000, 0], [120_000, 0]])(
    "uses elapsed time even when the tab's timer is delayed: %s", (now, remaining) => {
      expect(cooldownSeconds(61_000, now)).toBe(remaining);
    },
  );
});
