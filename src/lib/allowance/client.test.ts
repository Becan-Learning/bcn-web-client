import { afterEach, expect, it, vi } from "vitest";
import { readSessionAllowance } from "./client";

const allowance = {
  unlimited: false,
  plan: { id: "free", name: { ar: "مجانية", en: "Free" } },
  period: { start: "2026-10-01T00:00:00Z", end: "2026-10-31T00:00:00Z" },
  limits: { sessions: 6, seconds: 3600, enrollments: 1, sessionSeconds: 1800, minStartSeconds: 180 },
  usage: { sessions: 4, seconds: 2281, enrollments: 1 },
};

afterEach(() => vi.unstubAllGlobals());

it("reads and validates fresh usage through the same-origin backend rewrite with cancellation", async () => {
  const request = vi.fn().mockResolvedValue(Response.json(allowance));
  vi.stubGlobal("fetch", request);
  const signal = new AbortController().signal;
  expect(await readSessionAllowance(signal)).toEqual(allowance);
  expect(request).toHaveBeenCalledWith("/api/v1/me/allowance", { cache: "no-store", signal });
});

it.each([Response.json(null, { status: 401 }), Response.json({ usage: allowance.usage }), new Response("invalid JSON")])(
  "does not supply invented usage for a failed or malformed response %#", async (response) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    expect(await readSessionAllowance(new AbortController().signal)).toBeNull();
  },
);

it.each([new Error("network"), new DOMException("Aborted", "AbortError")])("handles a network or cancellation failure %#", async (error) => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(error));
  expect(await readSessionAllowance(new AbortController().signal)).toBeNull();
});
