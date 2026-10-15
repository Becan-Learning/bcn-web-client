import { describe, expect, it } from "vitest";
import type { Chapter, ContentVersion, Course } from "@/lib/courses/schema";
import { fallsBackToPublic, previewStartPins, previewStartable, readsPreview, resolveSessionContent, versionParams } from "./rules";

const V1 = "dddddddd-0000-4000-8000-000000000001";
const V2 = "dddddddd-0000-4000-8000-000000000002";
const CV1 = "cccccccc-0000-4000-8000-000000000001";
const CV2 = "cccccccc-0000-4000-8000-000000000002";
const version = (id: string, n: number, live: boolean, path: string): ContentVersion => ({ id, version: n, live, previewed: false, contentPath: path });

const chapterVersions = [version(V2, 2, false, "courses/x/ch_1/v2/"), version(V1, 1, true, "courses/x/ch_1/v1/")];
const courseVersions = [version(CV2, 2, false, "courses/x/v2/"), version(CV1, 1, true, "courses/x/v1/")];
const chapter = (over: Partial<Chapter> = {}): Chapter => ({
  id: "aaaaaaaa-0000-4000-8000-000000000001", number: 1, title: { ar: "فصل", en: "Chapter" }, minutes: 20, lessonCount: 2,
  state: "published", contentPath: "courses/x/ch_1/v1/", versions: chapterVersions, ...over,
});
const course = (over: Partial<Course> = {}): Course => ({
  id: "11111111-1111-4111-8111-111111111111", slug: "x", code: "X 101", name: { ar: "مقرر", en: "Course" },
  institution: { id: "ksu", name: { ar: "جامعة", en: "University" } }, icon: "atom", tone: "deep", status: "published",
  chapterCount: 1, publishedChapterCount: 1, chapters: [chapter()], versions: courseVersions, ...over,
});

describe("readsPreview", () => {
  it("is true only for an unlimited account", () => {
    expect(readsPreview({ unlimited: true })).toBe(true);
    expect(readsPreview({ unlimited: false })).toBe(false);
  });
  it("is false for a guest or a failed allowance read, which take the public path", () => {
    expect(readsPreview(null)).toBe(false);
  });
});

describe("fallsBackToPublic", () => {
  it.each([401, 403])("falls back on an HTTP %i, such as an Admin who turned two-factor off", (status) => {
    expect(fallsBackToPublic({ ok: false, kind: "http", status })).toBe(true);
  });
  it.each([
    { ok: false, kind: "http", status: 404 }, { ok: false, kind: "http", status: 429 }, { ok: false, kind: "http", status: 500 },
    { ok: false, kind: "network" }, { ok: false, kind: "invalid", status: 403 }, { ok: true },
  ])("does not fall back on %j", (result) => {
    expect(fallsBackToPublic(result)).toBe(false);
  });
});

describe("previewStartable", () => {
  it("needs a live path or at least one version", () => {
    expect(previewStartable(chapter())).toBe(true);
    expect(previewStartable(chapter({ contentPath: null }))).toBe(true);
    expect(previewStartable(chapter({ contentPath: null, versions: [] }))).toBe(false);
    expect(previewStartable({ contentPath: null })).toBe(false);
  });
});

describe("previewStartPins", () => {
  it("adds nothing when both sides are live", () => {
    expect(previewStartPins(course(), chapter())).toEqual({});
  });
  it("opens a chapter with no live version on its newest version", () => {
    expect(previewStartPins(course(), chapter({ contentPath: null }))).toEqual({ version: V2 });
  });
  it("opens a course with no live content version on its newest version", () => {
    expect(previewStartPins(course({ versions: [version(CV2, 2, false, "courses/x/v2/")] }), chapter())).toEqual({ courseVersion: CV2 });
  });
  it("adds nothing when there is nothing to pin", () => {
    expect(previewStartPins(course({ versions: [] }), chapter({ contentPath: null, versions: [] }))).toEqual({});
    expect(previewStartPins({}, { contentPath: null })).toEqual({});
  });
});

describe("versionParams", () => {
  it("reads the two params", () => {
    expect(versionParams({ version: V1, courseVersion: CV1 })).toEqual({ version: V1, courseVersion: CV1 });
  });
  it("treats absent and empty params as no pin, and takes the first of a repeated one", () => {
    expect(versionParams({})).toEqual({ version: null, courseVersion: null });
    expect(versionParams({ version: "", courseVersion: [] })).toEqual({ version: null, courseVersion: null });
    expect(versionParams({ version: [V2, V1] })).toEqual({ version: V2, courseVersion: null });
  });
});

describe("resolveSessionContent on the preview read", () => {
  const resolve = (over: { course?: Course; chapter?: Chapter; version?: string | null; courseVersion?: string | null } = {}) =>
    resolveSessionContent({ source: "preview", course: course(), chapter: chapter(), version: null, courseVersion: null, ...over });

  it("uses the live path and pins nothing without params; a published chapter has no marker", () => {
    expect(resolve()).toEqual({ kind: "ready", contentPath: "courses/x/ch_1/v1/", pins: {}, notice: null });
  });
  it("shows the chosen version's lessons and slides, pins it, and says it is not the live one", () => {
    expect(resolve({ version: V2 })).toEqual({
      kind: "ready", contentPath: "courses/x/ch_1/v2/", pins: { contentVersionId: V2 },
      notice: { draft: false, chapterVersion: { number: 2, live: false }, courseVersion: null },
    });
  });
  it("says so when the chosen version is the live one", () => {
    expect(resolve({ version: V1 })).toMatchObject({ notice: { chapterVersion: { number: 1, live: true } } });
  });
  it("pins the Course content version without changing the chapter's content path", () => {
    expect(resolve({ courseVersion: CV2 })).toEqual({
      kind: "ready", contentPath: "courses/x/ch_1/v1/", pins: { courseContentVersionId: CV2 },
      notice: { draft: false, chapterVersion: null, courseVersion: { number: 2, live: false } },
    });
  });
  it("pins both sides", () => {
    expect(resolve({ version: V2, courseVersion: CV1 })).toMatchObject({
      pins: { contentVersionId: V2, courseContentVersionId: CV1 },
      notice: { chapterVersion: { number: 2, live: false }, courseVersion: { number: 1, live: true } },
    });
  });
  it("lets a chosen version stand in for a missing live path", () => {
    expect(resolve({ chapter: chapter({ contentPath: null }), version: V2 })).toMatchObject({ kind: "ready", contentPath: "courses/x/ch_1/v2/" });
  });
  it("marks a Draft chapter or a Draft course", () => {
    expect(resolve({ chapter: chapter({ state: "draft" }) })).toMatchObject({ notice: { draft: true } });
    expect(resolve({ course: course({ status: "draft" }) })).toMatchObject({ notice: { draft: true } });
    expect(resolve({ chapter: chapter({ state: "coming_soon" }) })).toMatchObject({ notice: null });
  });
  it.each([V2.replace("2", "9"), "not-a-uuid", CV1])("is an unknown version for the chapter version %s", (id) => {
    expect(resolve({ version: id })).toEqual({ kind: "error", reason: "unknown-version" });
  });
  it.each([CV2.replace("2", "9"), "not-a-uuid", V1])("is an unknown Course version for %s, a Chapter version id included", (id) => {
    expect(resolve({ version: V2, courseVersion: id })).toEqual({ kind: "error", reason: "unknown-course-version" });
  });
  it("is an unknown version when the chapter lists no versions", () => {
    expect(resolve({ chapter: chapter({ versions: undefined }), version: V1 })).toEqual({ kind: "error", reason: "unknown-version" });
  });
  it("has no content with neither a live path nor a chosen version", () => {
    expect(resolve({ chapter: chapter({ contentPath: null }) })).toEqual({ kind: "error", reason: "no-content" });
  });
});

describe("resolveSessionContent on the public read", () => {
  const resolve = (over: { chapter?: Chapter; version?: string | null; courseVersion?: string | null } = {}) =>
    resolveSessionContent({ source: "public", course: course(), chapter: chapter(), version: null, courseVersion: null, ...over });

  it("ignores both params entirely, even well-formed or garbage ones: never a pin, never a marker", () => {
    for (const params of [{ version: V2, courseVersion: CV2 }, { version: "garbage" }, { courseVersion: V1 }]) {
      expect(resolve(params)).toEqual({ kind: "ready", contentPath: "courses/x/ch_1/v1/", pins: {}, notice: null });
    }
  });
  it("has no content without a live path", () => {
    expect(resolve({ chapter: chapter({ contentPath: null }), version: V2 })).toEqual({ kind: "error", reason: "no-content" });
  });
});
