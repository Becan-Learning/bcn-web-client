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
const detail = (slug: string, chapterId: string, status: "published" | "archived" = "published") => ({
  id: "11111111-1111-4111-8111-111111111111", slug, status, code: "X 101",
  name: { ar: "مقرر", en: "Course" }, institution: { id: "ksu", name: { ar: "جامعة", en: "University" } },
  icon: "atom", tone: "deep", chapterCount: 1, publishedChapterCount: 1,
  chapters: [{ id: chapterId, number: 1, title: { ar: "فصل", en: "Chapter" }, minutes: 20, lessonCount: 2, state: "published", contentPath: `courses/${slug}/ch_1/` }],
});
const lookupBody = (slug: string, chapterId: string, status: "published" | "archived" = "published") => {
  const course = detail(slug, chapterId, status);
  return { chapter: course.chapters[0], course };
};
function mockLookup(response: Response) {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("BACKEND_URL", "https://backend.example.com");
  const request = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", request);
  return request;
}

it("finds a session chapter with a single cached read of GET /chapters/:chapterId", async () => {
  const request = mockLookup(Response.json(lookupBody("alpha", CH_A)));
  const target = await findSessionTarget("alpha", CH_A);
  expect(target.kind).toBe("found");
  expect(request).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledWith(`https://backend.example.com/api/v1/chapters/${CH_A}`, { next: { revalidate: 300 } });
});

it("finds a chapter of an archived course", async () => {
  mockLookup(Response.json(lookupBody("alpha", CH_A, "archived")));
  const target = await findSessionTarget("alpha", CH_A);
  expect(target.kind === "found" && target.course.status).toBe("archived");
});

it("redirects a stale slug to the current one with that same single read", async () => {
  const request = mockLookup(Response.json(lookupBody("alpha", CH_A)));
  expect(await findSessionTarget("old", CH_A)).toEqual({ kind: "redirect", slug: "alpha" });
  expect(request).toHaveBeenCalledTimes(1);
});

it("is not found for an unknown chapter id (CHAPTER_NOT_FOUND)", async () => {
  const request = mockLookup(Response.json({ error: { message: "Chapter not found", code: "CHAPTER_NOT_FOUND" } }, { status: 404 }));
  expect(await findSessionTarget("alpha", "cccccccc-0000-4000-8000-000000000009")).toEqual({ kind: "not-found" });
  expect(request).toHaveBeenCalledTimes(1);
});

it("is not found, with no request, for a malformed chapter id", async () => {
  const request = mockLookup(Response.json({}));
  expect(await findSessionTarget("alpha", "ch_1")).toEqual({ kind: "not-found" });
  expect(request).not.toHaveBeenCalled();
});

it("is not found when the backend is unreachable or answers with an unexpected body", async () => {
  const request = mockLookup(Response.json({}));
  request.mockRejectedValueOnce(new Error("Unreachable"));
  expect(await findSessionTarget("alpha", CH_A)).toEqual({ kind: "not-found" });
  expect(await findSessionTarget("alpha", CH_A)).toEqual({ kind: "not-found" });
  expect(request).toHaveBeenCalledTimes(2);
});
