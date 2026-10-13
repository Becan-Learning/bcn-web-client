import { expect, it, vi } from "vitest";
import { clientIp, createRateLimiter, isHoneypotTripped, isTooFast } from "./spam-guards";

vi.mock("server-only", () => ({}));

it("reads the first x-forwarded-for address", () => {
  expect(clientIp(new Headers({ "x-forwarded-for": " 203.0.113.7 , 10.0.0.1" }))).toBe("203.0.113.7");
  expect(clientIp(new Headers())).toBe("unknown");
});

it("flags filled honeypots and fast or missing fill times", () => {
  expect(isHoneypotTripped("")).toBe(false);
  expect(isHoneypotTripped(undefined)).toBe(false);
  expect(isHoneypotTripped("x")).toBe(true);
  expect(isTooFast(10_000, 12_999)).toBe(true);
  expect(isTooFast(10_000, 13_000)).toBe(false);
  expect(isTooFast("10000", 99_000)).toBe(true);
});

it("allows 5 per window per key and frees the slot after 10 minutes", () => {
  const limiter = createRateLimiter();
  for (let i = 0; i < 5; i++) expect(limiter.take("a", 1_000 + i)).toBe(true);
  expect(limiter.take("a", 1_010)).toBe(false);
  expect(limiter.take("b", 1_010)).toBe(true);
  expect(limiter.take("a", 1_000 + 10 * 60 * 1000)).toBe(true);
});
