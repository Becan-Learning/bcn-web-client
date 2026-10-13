import { afterEach, expect, it, vi } from "vitest";
import { getAllowance } from "./server";

vi.mock("server-only", () => ({}));
const incoming = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ headers: incoming }));

const allowance = {
  plan: { id: "free", name: { ar: "الباقة المجانية", en: "Free plan" } },
  period: { start: "2026-10-01T00:00:00Z", end: "2026-10-31T00:00:00Z" },
  limits: { sessions: 6, seconds: 3600, enrollments: 1, sessionSeconds: 1800, minStartSeconds: 180 },
  usage: { sessions: 4, seconds: 2280, enrollments: 1 },
};

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); incoming.mockReset(); });

function mockFetch(response: Response) {
  incoming.mockResolvedValue(new Headers({ cookie: "session=student", "x-forwarded-for": "192.0.2.10", authorization: "private" }));
  vi.spyOn(console, "error").mockImplementation(() => {});
  const request = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", request);
  vi.stubEnv("BACKEND_URL", "https://backend.example.com/");
  return request;
}

it("reads the allowance without caching and forwards only student headers", async () => {
  const request = mockFetch(Response.json(allowance));
  expect(await getAllowance()).toEqual({ ok: true, data: allowance });
  const [url, init] = request.mock.calls[0];
  expect(url).toBe("https://backend.example.com/api/v1/me/allowance");
  expect(init.cache).toBe("no-store");
  expect(Object.fromEntries(init.headers)).toEqual({ cookie: "session=student", "x-forwarded-for": "192.0.2.10" });
  expect(init.next).toBeUndefined();
});

it("preserves backend error status and code with a logged failure", async () => {
  mockFetch(Response.json({ error: { message: "Sign in", code: "UNAUTHORIZED" } }, { status: 401 }));
  expect(await getAllowance()).toEqual({ ok: false, kind: "http", status: 401, code: "UNAUTHORIZED" });
  expect(console.error).toHaveBeenCalled();
});

it.each([Response.json({ unexpected: true }), new Response("invalid JSON"), Response.json({ message: "Malformed error" }, { status: 500 })])("rejects malformed responses with a logged typed failure", async (response) => {
  mockFetch(response);
  expect(await getAllowance()).toEqual({ ok: false, kind: "invalid", status: response.status });
  expect(console.error).toHaveBeenCalled();
});

it("returns a logged network failure", async () => {
  const request = mockFetch(Response.json(allowance));
  request.mockRejectedValue(new Error("Unreachable"));
  expect(await getAllowance()).toEqual({ ok: false, kind: "network" });
  expect(console.error).toHaveBeenCalled();
});

it("keeps dynamic rendering signals outside network error handling", async () => {
  const request = mockFetch(Response.json(allowance));
  incoming.mockRejectedValue(new Error("Dynamic rendering signal"));
  await expect(getAllowance()).rejects.toThrow("Dynamic rendering signal");
  expect(request).not.toHaveBeenCalled();
});
