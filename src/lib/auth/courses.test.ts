import { afterEach, expect, it, vi } from "vitest";
import { getCourse, getCourses, getEnrollments } from "./courses";

vi.mock("server-only", () => ({}));
const incoming = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ headers: incoming }));

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); incoming.mockReset(); });

function mockFetch(response: Response) {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const request = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", request);
  vi.stubEnv("BACKEND_URL", "https://backend.example.com/");
  return request;
}

it("caches public reads for 300 seconds without forwarding student headers", async () => {
  const request = mockFetch(Response.json([]));
  expect(await getCourses()).toEqual({ ok: true, data: [] });
  expect(request).toHaveBeenCalledWith("https://backend.example.com/api/v1/courses", { next: { revalidate: 300 } });
  expect(incoming).not.toHaveBeenCalled();
});

it("forwards student headers on an uncached enrollment read", async () => {
  incoming.mockResolvedValue(new Headers({ cookie: "session=student", "x-forwarded-for": "192.0.2.10", authorization: "private" }));
  const request = mockFetch(Response.json([]));
  expect(await getEnrollments()).toEqual({ ok: true, data: [] });
  const [url, init] = request.mock.calls[0];
  expect(url).toBe("https://backend.example.com/api/v1/me/enrollments");
  expect(init.cache).toBe("no-store");
  expect(Object.fromEntries(init.headers)).toEqual({ cookie: "session=student", "x-forwarded-for": "192.0.2.10" });
  expect(init.next).toBeUndefined();
});

it("returns typed HTTP errors and preserves their codes", async () => {
  const request = mockFetch(Response.json({ error: { message: "Unknown course", code: "COURSE_NOT_FOUND" } }, { status: 404 }));
  expect(await getCourse("course-101")).toEqual({ ok: false, kind: "http", status: 404, code: "COURSE_NOT_FOUND" });
  expect(request).toHaveBeenCalledWith("https://backend.example.com/api/v1/courses/course-101", { next: { revalidate: 300 } });
  expect(console.error).toHaveBeenCalled();
});

it.each([Response.json({ unexpected: true }), new Response("invalid JSON"), Response.json({ message: "Malformed error" }, { status: 401 })])("rejects malformed responses with a logged typed failure", async (response) => {
  mockFetch(response);
  expect(await getCourses()).toEqual({ ok: false, kind: "invalid", status: response.status });
  expect(console.error).toHaveBeenCalled();
});

it("returns a logged network failure without throwing", async () => {
  const request = mockFetch(Response.json([]));
  request.mockRejectedValue(new Error("Unreachable"));
  expect(await getCourses()).toEqual({ ok: false, kind: "network" });
  expect(console.error).toHaveBeenCalled();
});

it("keeps incoming-header dynamic rendering signals outside network error handling", async () => {
  incoming.mockRejectedValue(new Error("Dynamic rendering signal"));
  const request = mockFetch(Response.json([]));
  await expect(getEnrollments()).rejects.toThrow("Dynamic rendering signal");
  expect(request).not.toHaveBeenCalled();
});
