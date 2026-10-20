import { describe, expect, it } from "vitest";
import type { Chapter, ChapterLookup, Course } from "@/lib/courses/schema";
import { chapterIsPublished, chapterStartable, resolveSessionTarget, sessionHref } from "./resolve";

const chapter = (id: string, number: number, state: Chapter["state"] = "published"): Chapter => ({
  id, number, title: { ar: "فصل", en: "Chapter" }, minutes: 20, lessonCount: 2, state,
  contentPath: state === "published" ? `courses/x/ch_${number}/` : null,
});
const course = (slug: string, id: string, chapters: Chapter[]): Course => ({
  id, slug, code: "X 101", name: { ar: "مقرر", en: "Course" },
  institution: { id: "ksu", name: { ar: "جامعة", en: "University" } },
  icon: "atom", tone: "deep", status: "published", chapterCount: chapters.length, publishedChapterCount: chapters.length, chapters,
});
const lookup = (c: Course, chapterId: string): ChapterLookup => ({ course: c, chapter: c.chapters.find((x) => x.id === chapterId)! });

const A1 = "aaaaaaaa-0000-4000-8000-000000000001";
const A2 = "aaaaaaaa-0000-4000-8000-000000000002";
const B1 = "bbbbbbbb-0000-4000-8000-000000000001";
const courseA = course("alpha", "11111111-1111-4111-8111-111111111111", [chapter(A1, 1), chapter(A2, 2, "coming_soon")]);
const courseB = course("beta", "22222222-2222-4222-8222-222222222222", [chapter(B1, 1)]);

describe("resolveSessionTarget", () => {
  it("finds the chapter in the course named by the URL", () => {
    expect(resolveSessionTarget({ slug: "alpha", chapterId: A1, lookup: lookup(courseA, A1) }))
      .toEqual({ kind: "found", course: courseA, chapter: courseA.chapters[0], source: "public" });
  });
  it("uses the chapter the backend returned, so renumbering never lands on another chapter", () => {
    const renumbered = course("alpha", courseA.id, [chapter(A1, 5), chapter(A2, 1, "coming_soon")]);
    const target = resolveSessionTarget({ slug: "alpha", chapterId: A1, lookup: lookup(renumbered, A1) });
    expect(target.kind === "found" && target.chapter.number).toBe(5);
  });
  it("redirects a stale slug to the course's current slug", () => {
    expect(resolveSessionTarget({ slug: "old-alpha", chapterId: A1, lookup: lookup(courseA, A1) }))
      .toEqual({ kind: "redirect", slug: "alpha" });
  });
  it("redirects when the chapter belongs to a different course than the URL says", () => {
    expect(resolveSessionTarget({ slug: "alpha", chapterId: B1, lookup: lookup(courseB, B1) }))
      .toEqual({ kind: "redirect", slug: "beta" });
  });
  it("finds a chapter of an archived course, and redirects its stale slug too", () => {
    const archived = { ...courseB, status: "archived" as const };
    const target = resolveSessionTarget({ slug: "beta", chapterId: B1, lookup: lookup(archived, B1) });
    expect(target.kind === "found" && target.course.status).toBe("archived");
    expect(resolveSessionTarget({ slug: "old-beta", chapterId: B1, lookup: lookup(archived, B1) })).toEqual({ kind: "redirect", slug: "beta" });
  });
  it("returns found for a coming-soon chapter so the caller decides (it renders as not startable)", () => {
    expect(resolveSessionTarget({ slug: "alpha", chapterId: A2, lookup: lookup(courseA, A2) }).kind).toBe("found");
  });
  it("is not found when the backend has no such chapter", () => {
    expect(resolveSessionTarget({ slug: "alpha", chapterId: A1, lookup: null })).toEqual({ kind: "not-found" });
  });
  it("is not found when the lookup answers for a different chapter than the URL's", () => {
    expect(resolveSessionTarget({ slug: "alpha", chapterId: A2, lookup: lookup(courseA, A1) })).toEqual({ kind: "not-found" });
  });
  it.each(["1", "ch_1", "", "../x", `${A1}/done`])("is not found for the malformed chapter id %j", (chapterId) => {
    expect(resolveSessionTarget({ slug: "alpha", chapterId, lookup: lookup(courseA, A1) })).toEqual({ kind: "not-found" });
  });
});

describe("resolveSessionTarget source", () => {
  it("records that the answer came from the Admin preview read", () => {
    const target = resolveSessionTarget({ slug: "alpha", chapterId: A1, lookup: lookup(courseA, A1), source: "preview" });
    expect(target).toEqual({ kind: "found", course: courseA, chapter: courseA.chapters[0], source: "preview" });
  });
  it("keeps the redirect for a stale slug on the preview read too", () => {
    expect(resolveSessionTarget({ slug: "old", chapterId: A1, lookup: lookup(courseA, A1), source: "preview" })).toEqual({ kind: "redirect", slug: "alpha" });
  });
});

describe("chapterStartable", () => {
  const draft: Chapter = { ...chapter(A1, 1, "draft"), versions: [] };
  it("needs a published chapter with a live path for everyone on the public read", () => {
    expect(chapterStartable(chapter(A1, 1), "public")).toBe(true);
    expect(chapterStartable(chapter(A1, 1, "coming_soon"), "public")).toBe(false);
    expect(chapterStartable(draft, "public")).toBe(false);
  });
  it("lets the preview read start anything with a live path or a valid version", () => {
    expect(chapterStartable(draft, "preview")).toBe(false);
    expect(chapterStartable({ ...draft, contentPath: "courses/x/ch_1/" }, "preview")).toBe(true);
    expect(chapterStartable({ ...draft, versions: [{ id: A2, version: 1, live: false, previewed: false, contentPath: "courses/x/ch_1/v1/" }] }, "preview")).toBe(true);
  });
});

describe("chapterIsPublished", () => {
  it("needs the published state and a live content path", () => {
    expect(chapterIsPublished(chapter(A1, 1))).toBe(true);
    expect(chapterIsPublished(chapter(A1, 1, "coming_soon"))).toBe(false);
    expect(chapterIsPublished({ ...chapter(A1, 1), contentPath: null })).toBe(false);
  });
});

describe("sessionHref", () => {
  it("builds /session/{slug}/{chapterId}", () => {
    expect(sessionHref("alpha", A1)).toBe(`/session/alpha/${A1}`);
  });
  it("adds the version pins of a preview link, in a fixed order, and nothing when there are none", () => {
    expect(sessionHref("alpha", A1, { courseVersion: B1, version: A2 })).toBe(`/session/alpha/${A1}?version=${A2}&courseVersion=${B1}`);
    expect(sessionHref("alpha", A1, { version: A2 })).toBe(`/session/alpha/${A1}?version=${A2}`);
    expect(sessionHref("alpha", A1, {})).toBe(`/session/alpha/${A1}`);
  });
  it("encodes its segments", () => {
    expect(sessionHref("a/b", "x y")).toBe("/session/a%2Fb/x%20y");
  });
});
