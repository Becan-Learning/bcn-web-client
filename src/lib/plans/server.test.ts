import { afterEach, describe, expect, it, vi } from "vitest";
import { getPlans, getViewer } from "./server";

vi.mock("server-only", () => ({}));
const incoming = vi.hoisted(() => vi.fn());
const allowance = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ headers: incoming }));
vi.mock("@/lib/allowance/server", () => ({ getAllowance: allowance }));

const body = {
  plans: [
    { id: "free", name: { ar: "باقة مجانية", en: "Free plan" }, priceHalalas: 0, featured: false, badge: null, limits: { sessions: 6, seconds: 3600, enrollments: 1, sessionSeconds: 1800, minStartSeconds: 180 } },
    { id: "lite", name: { ar: "باقة لايت", en: "Lite plan" }, priceHalalas: 9000, featured: true, badge: { ar: "الأنسب للبداية", en: "Best for getting started" }, limits: { sessions: 25, seconds: 15000, enrollments: null, sessionSeconds: 1800, minStartSeconds: 180 } },
  ],
};

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); incoming.mockReset(); allowance.mockReset(); });

function mockFetch(response: Response | Error) {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const request = response instanceof Error ? vi.fn().mockRejectedValue(response) : vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", request);
  vi.stubEnv("BACKEND_URL", "https://backend.example.com/");
  return request;
}

describe("getPlans", () => {
  it("reads the public endpoint with a five-minute cache and returns view-models", async () => {
    const request = mockFetch(Response.json(body));
    const result = await getPlans();
    expect(request).toHaveBeenCalledWith("https://backend.example.com/api/v1/plans", { next: { revalidate: 300 } });
    expect(result).toEqual({
      ok: true,
      plans: [
        { id: "free", name: body.plans[0].name, price: 0, minutes: 60, hours: 1, courses: 1, sessions: 6, badge: null, featured: false },
        { id: "lite", name: body.plans[1].name, price: 90, minutes: 250, hours: 4, courses: null, sessions: 25, badge: body.plans[1].badge, featured: true },
      ],
    });
    expect(console.error).not.toHaveBeenCalled();
  });
  it("logs and fails on an HTTP error", async () => {
    mockFetch(new Response("down", { status: 503 }));
    expect(await getPlans()).toEqual({ ok: false });
    expect(console.error).toHaveBeenCalledWith("Plans request failed", { status: 503 });
  });
  it("logs and fails on an invalid body", async () => {
    mockFetch(Response.json({ plans: [{ id: "free" }] }));
    expect(await getPlans()).toEqual({ ok: false });
    expect(console.error).toHaveBeenCalledWith("Invalid plans response");
  });
  it("logs and fails on an empty list", async () => {
    mockFetch(Response.json({ plans: [] }));
    expect(await getPlans()).toEqual({ ok: false });
  });
  it("logs and fails on non-JSON", async () => {
    mockFetch(new Response("<html>", { status: 200 }));
    expect(await getPlans()).toEqual({ ok: false });
    expect(console.error).toHaveBeenCalled();
  });
  it("logs and fails on a network error", async () => {
    mockFetch(new Error("ECONNREFUSED"));
    expect(await getPlans()).toEqual({ ok: false });
    expect(console.error).toHaveBeenCalledWith("Plans request failed");
  });
});

describe("getViewer", () => {
  it("does not call the backend for a visitor without a session cookie", async () => {
    incoming.mockResolvedValue(new Headers({ cookie: "theme=dark" }));
    expect(await getViewer()).toEqual({ signedIn: false, planId: null });
    incoming.mockResolvedValue(new Headers());
    expect(await getViewer()).toEqual({ signedIn: false, planId: null });
    expect(allowance).not.toHaveBeenCalled();
  });
  it("reads the current Plan id from the allowance for a signed-in student", async () => {
    incoming.mockResolvedValue(new Headers({ cookie: "better-auth.session_token=abc" }));
    allowance.mockResolvedValue({ ok: true, data: { plan: { id: "lite", name: { ar: "x", en: "x" } } } });
    expect(await getViewer()).toEqual({ signedIn: true, planId: "lite" });
  });
  it("stays signed in without a current Plan when the allowance cannot be read", async () => {
    incoming.mockResolvedValue(new Headers({ cookie: "better-auth.session_token=abc" }));
    allowance.mockResolvedValue({ ok: false, kind: "network" });
    expect(await getViewer()).toEqual({ signedIn: true, planId: null });
  });
});
