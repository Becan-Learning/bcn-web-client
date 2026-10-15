import { afterEach, describe, expect, it, vi } from "vitest";
import { findSessionTarget, getChapterLookup, getCourseFor, getCoursesFor, getPreviewChapterLookup, getPreviewCourse, getPreviewCourses, getCourse, getCourses, getEnrollments } from "./courses";

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

describe("Admin preview reads (ADR 0005)", () => {
  const V1 = "dddddddd-0000-4000-8000-000000000001";
  const CV1 = "cccccccc-0000-4000-8000-000000000001";
  const version = (id: string, path: string) => ({ id, version: 1, live: true, previewed: false, contentPath: path });
  const previewCourse = (status: "draft" | "published" | "archived" = "draft") => {
    const base = detail("alpha", CH_A, "published");
    return {
      ...base, status,
      chapters: [{ ...base.chapters[0], state: "draft", contentPath: null, versions: [version(V1, "courses/alpha/ch_1/v1/")] }],
      versions: [version(CV1, "courses/alpha/v1/")],
    };
  };
  const previewList = () => [{ ...previewCourse(), chapters: undefined, versions: undefined }];
  const headersOf = () => new Headers({ cookie: "session=admin", "x-forwarded-for": "192.0.2.20", authorization: "private" });
  const forwarded = { cookie: "session=admin", "x-forwarded-for": "192.0.2.20" };

  it.each([
    ["the list", () => getPreviewCourses(), "/admin/preview/courses", () => previewList()],
    ["a Course", () => getPreviewCourse("alpha"), "/admin/preview/courses/alpha", () => previewCourse()],
    ["a Chapter", () => getPreviewChapterLookup(CH_A), `/admin/preview/chapters/${CH_A}`, () => ({ chapter: previewCourse().chapters[0], course: previewCourse() })],
  ])("reads %s uncached, with the forwarded cookie and no shared-cache option", async (_name, read, path, body) => {
    incoming.mockResolvedValue(headersOf());
    const request = mockFetch(Response.json(body()));
    const result = await read();
    expect(result.ok).toBe(true);
    const [url, init] = request.mock.calls[0];
    expect(url).toBe(`https://backend.example.com/api/v1${path}`);
    expect(init.cache).toBe("no-store");
    expect(init.next).toBeUndefined();
    expect(Object.fromEntries(init.headers)).toEqual(forwarded);
  });

  it("parses the Draft status, the Chapter state, contentPath and the versions", async () => {
    incoming.mockResolvedValue(headersOf());
    mockFetch(Response.json(previewCourse()));
    const result = await getPreviewCourse("alpha");
    expect(result.ok && result.data.status).toBe("draft");
    expect(result.ok && result.data.chapters[0]).toMatchObject({ state: "draft", contentPath: null, versions: [{ id: V1, live: true }] });
    expect(result.ok && result.data.versions).toHaveLength(1);
  });

  it("keeps the public reads on the shared cache with no student headers, whatever the viewer", async () => {
    incoming.mockResolvedValue(headersOf());
    const request = mockFetch(Response.json(lookupBody("alpha", CH_A)));
    await getChapterLookup(CH_A);
    expect(request).toHaveBeenCalledWith(`https://backend.example.com/api/v1/chapters/${CH_A}`, { next: { revalidate: 300 } });
    expect(incoming).not.toHaveBeenCalled();
  });

  it("refuses a Draft status on the public read, so a leak could not render", async () => {
    const draftBody = { ...detail("alpha", CH_A), status: "draft" };
    mockFetch(Response.json(draftBody));
    expect(await getCourse("alpha")).toMatchObject({ ok: false, kind: "invalid" });
  });

  describe("getCoursesFor and getCourseFor", () => {
    it("take the public cached read when the viewer is not unlimited, without touching the request headers", async () => {
      const request = mockFetch(Response.json([]));
      expect(await getCoursesFor(false)).toEqual({ source: "public", result: { ok: true, data: [] } });
      expect(request).toHaveBeenCalledTimes(1);
      expect(request).toHaveBeenCalledWith("https://backend.example.com/api/v1/courses", { next: { revalidate: 300 } });
      expect(incoming).not.toHaveBeenCalled();
    });
    it("take the preview read alone for an unlimited viewer", async () => {
      incoming.mockResolvedValue(headersOf());
      const request = mockFetch(Response.json(previewList()));
      const { source, result } = await getCoursesFor(true);
      expect(source).toBe("preview");
      expect(result.ok && result.data[0].status).toBe("draft");
      expect(request).toHaveBeenCalledTimes(1);
      expect(request.mock.calls[0][0]).toBe("https://backend.example.com/api/v1/admin/preview/courses");
    });
    it.each([401, 403])("fall back to the public read when the preview read answers %i", async (status) => {
      incoming.mockResolvedValue(headersOf());
      const request = mockFetch(Response.json({ error: { message: "No", code: status === 401 ? "UNAUTHENTICATED" : "ADMIN_TWO_FACTOR_REQUIRED" } }, { status }));
      request.mockResolvedValueOnce(Response.json({ error: { message: "No", code: "X" } }, { status }));
      request.mockResolvedValueOnce(Response.json(detail("alpha", CH_A)));
      const { source, result } = await getCourseFor("alpha", true);
      expect(source).toBe("public");
      expect(result.ok).toBe(true);
      expect(request.mock.calls.map(([url]) => url)).toEqual([
        "https://backend.example.com/api/v1/admin/preview/courses/alpha",
        "https://backend.example.com/api/v1/courses/alpha",
      ]);
      expect(request.mock.calls[1][1]).toEqual({ next: { revalidate: 300 } });
    });
    it.each([404, 429, 500])("do not fall back on %i: the failure stays the preview read's", async (status) => {
      incoming.mockResolvedValue(headersOf());
      const request = mockFetch(Response.json({ error: { message: "No", code: "COURSE_NOT_FOUND" } }, { status }));
      const { source, result } = await getCourseFor("alpha", true);
      expect(source).toBe("preview");
      expect(result).toMatchObject({ ok: false, kind: "http", status });
      expect(request).toHaveBeenCalledTimes(1);
    });
  });

  describe("findSessionTarget with the preview read", () => {
    const lookup = () => ({ chapter: previewCourse().chapters[0], course: previewCourse() });
    it("finds a Draft chapter with a single uncached read, marked as the preview source", async () => {
      incoming.mockResolvedValue(headersOf());
      const request = mockFetch(Response.json(lookup()));
      const target = await findSessionTarget("alpha", CH_A, { preview: true });
      expect(target).toMatchObject({ kind: "found", source: "preview" });
      expect(target.kind === "found" && target.chapter.versions?.[0].id).toBe(V1);
      expect(request).toHaveBeenCalledTimes(1);
      const [url, init] = request.mock.calls[0];
      expect(url).toBe(`https://backend.example.com/api/v1/admin/preview/chapters/${CH_A}`);
      expect(init).toMatchObject({ cache: "no-store" });
    });
    it("redirects a stale slug on the preview read too", async () => {
      incoming.mockResolvedValue(headersOf());
      mockFetch(Response.json(lookup()));
      expect(await findSessionTarget("old", CH_A, { preview: true })).toEqual({ kind: "redirect", slug: "alpha" });
    });
    it("is not found when the preview read says CHAPTER_NOT_FOUND, without a public read", async () => {
      incoming.mockResolvedValue(headersOf());
      const request = mockFetch(Response.json({ error: { message: "No", code: "CHAPTER_NOT_FOUND" } }, { status: 404 }));
      expect(await findSessionTarget("alpha", CH_A, { preview: true })).toEqual({ kind: "not-found" });
      expect(request).toHaveBeenCalledTimes(1);
    });
    it.each([401, 403])("falls back to the public cached read when the preview read answers %i", async (status) => {
      incoming.mockResolvedValue(headersOf());
      const request = mockFetch(Response.json({}));
      request.mockResolvedValueOnce(Response.json({ error: { message: "No", code: "X" } }, { status }));
      request.mockResolvedValueOnce(Response.json(lookupBody("alpha", CH_A)));
      expect(await findSessionTarget("alpha", CH_A, { preview: true })).toMatchObject({ kind: "found", source: "public" });
      expect(request.mock.calls[1]).toEqual([`https://backend.example.com/api/v1/chapters/${CH_A}`, { next: { revalidate: 300 } }]);
    });
    it("does not even try the preview read for a malformed id", async () => {
      const request = mockFetch(Response.json({}));
      expect(await findSessionTarget("alpha", "ch_1", { preview: true })).toEqual({ kind: "not-found" });
      expect(request).not.toHaveBeenCalled();
    });
  });
});
