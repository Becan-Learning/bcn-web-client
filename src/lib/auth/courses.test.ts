import { afterEach, expect, it, vi } from "vitest";
import { findSessionTarget, getCourse, getCourses, getEnrollments } from "./courses";

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

const CH_A = "aaaaaaaa-0000-4000-8000-000000000001";
const CH_B = "bbbbbbbb-0000-4000-8000-000000000001";
const summary = (slug: string) => ({
  id: slug === "alpha" ? "11111111-1111-4111-8111-111111111111" : "22222222-2222-4222-8222-222222222222", slug, code: "X 101",
  name: { ar: "مقرر", en: "Course" }, institution: { id: "ksu", name: { ar: "جامعة", en: "University" } },
  icon: "atom", tone: "deep", chapterCount: 1, publishedChapterCount: 1,
});
const detail = (slug: string, chapterId: string) => ({
  ...summary(slug),
  chapters: [{ id: chapterId, number: 1, title: { ar: "فصل", en: "Chapter" }, minutes: 20, lessonCount: 2, state: "published", contentPath: `courses/${slug}/ch_1/` }],
});
/* خادم وهمي: الكتالوج alpha وbeta، وslug قديم "old" غير معروف. */
function mockCatalog() {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("BACKEND_URL", "https://backend.example.com");
  const request = vi.fn(async (url: string) => {
    const path = new URL(url).pathname;
    if (path === "/api/v1/courses") return Response.json([summary("alpha"), summary("beta")]);
    if (path === "/api/v1/courses/alpha") return Response.json(detail("alpha", CH_A));
    if (path === "/api/v1/courses/beta") return Response.json(detail("beta", CH_B));
    return Response.json({ error: { message: "Course not found", code: "COURSE_NOT_FOUND" } }, { status: 404 });
  });
  vi.stubGlobal("fetch", request);
  return request;
}

it("finds a session chapter with one read when the URL's course holds it", async () => {
  const request = mockCatalog();
  const target = await findSessionTarget("alpha", CH_A);
  expect(target.kind).toBe("found");
  expect(request).toHaveBeenCalledTimes(1);
});

it("redirects a stale slug to the current one after reading the rest of the catalog", async () => {
  mockCatalog();
  expect(await findSessionTarget("old", CH_A)).toEqual({ kind: "redirect", slug: "alpha" });
});

it("redirects when the chapter lives in another course than the URL's", async () => {
  mockCatalog();
  expect(await findSessionTarget("alpha", CH_B)).toEqual({ kind: "redirect", slug: "beta" });
});

it("is not found for an unknown chapter id", async () => {
  mockCatalog();
  expect(await findSessionTarget("alpha", "cccccccc-0000-4000-8000-000000000009")).toEqual({ kind: "not-found" });
});

it("is not found, with no request, for a malformed chapter id", async () => {
  const request = mockCatalog();
  expect(await findSessionTarget("alpha", "ch_1")).toEqual({ kind: "not-found" });
  expect(request).not.toHaveBeenCalled();
});

it("does not scan the catalog when the backend is unreachable", async () => {
  const request = mockCatalog();
  request.mockRejectedValue(new Error("Unreachable"));
  expect(await findSessionTarget("alpha", CH_A)).toEqual({ kind: "not-found" });
  expect(request).toHaveBeenCalledTimes(1);
});
