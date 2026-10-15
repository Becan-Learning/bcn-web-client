import { describe, expect, it } from "vitest";
import type { Chapter, Course } from "@/lib/courses/schema";
import { chapterIsPublished, resolveSessionTarget, sessionHref } from "./resolve";

const chapter = (id: string, number: number, state: Chapter["state"] = "published"): Chapter => ({
  id, number, title: { ar: "فصل", en: "Chapter" }, minutes: 20, lessonCount: 2, state,
  contentPath: state === "published" ? `courses/x/ch_${number}/` : null,
});
const course = (slug: string, id: string, chapters: Chapter[]): Course => ({
  id, slug, code: "X 101", name: { ar: "مقرر", en: "Course" },
  institution: { id: "ksu", name: { ar: "جامعة", en: "University" } },
  icon: "atom", tone: "deep", chapterCount: chapters.length, publishedChapterCount: chapters.length, chapters,
});

const A1 = "aaaaaaaa-0000-4000-8000-000000000001";
const A2 = "aaaaaaaa-0000-4000-8000-000000000002";
const B1 = "bbbbbbbb-0000-4000-8000-000000000001";
const courseA = course("alpha", "11111111-1111-4111-8111-111111111111", [chapter(A1, 1), chapter(A2, 2, "coming_soon")]);
const courseB = course("beta", "22222222-2222-4222-8222-222222222222", [chapter(B1, 1)]);

describe("resolveSessionTarget", () => {
  it("finds the chapter in the course named by the URL", () => {
    expect(resolveSessionTarget({ slug: "alpha", chapterId: A1, courses: [courseA, courseB] }))
      .toEqual({ kind: "found", course: courseA, chapter: courseA.chapters[0] });
  });
  it("resolves by chapter id, not by number: renumbering never lands on another chapter", () => {
    const renumbered = course("alpha", courseA.id, [chapter(A1, 5), chapter(A2, 1, "coming_soon")]);
    const target = resolveSessionTarget({ slug: "alpha", chapterId: A1, courses: [renumbered] });
    expect(target.kind === "found" && target.chapter.number).toBe(5);
  });
  it("redirects a stale slug to the course's current slug", () => {
    expect(resolveSessionTarget({ slug: "old-alpha", chapterId: A1, courses: [courseA, courseB] }))
      .toEqual({ kind: "redirect", slug: "alpha" });
  });
  it("redirects when the chapter belongs to a different course than the URL says", () => {
    expect(resolveSessionTarget({ slug: "alpha", chapterId: B1, courses: [courseA, courseB] }))
      .toEqual({ kind: "redirect", slug: "beta" });
  });
  it("returns found for a coming-soon chapter so the caller decides (it renders as not startable)", () => {
    expect(resolveSessionTarget({ slug: "alpha", chapterId: A2, courses: [courseA] }).kind).toBe("found");
  });
  it("is not found for an unknown chapter id", () => {
    expect(resolveSessionTarget({ slug: "alpha", chapterId: "cccccccc-0000-4000-8000-000000000009", courses: [courseA, courseB] }))
      .toEqual({ kind: "not-found" });
  });
  it.each(["1", "ch_1", "", "../x", `${A1}/done`])("is not found for the malformed chapter id %j", (chapterId) => {
    expect(resolveSessionTarget({ slug: "alpha", chapterId, courses: [courseA, courseB] })).toEqual({ kind: "not-found" });
  });
  it("is not found when the catalog is empty", () => {
    expect(resolveSessionTarget({ slug: "alpha", chapterId: A1, courses: [] })).toEqual({ kind: "not-found" });
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
  it("builds /session/{slug}/{chapterId} and its done page", () => {
    expect(sessionHref("alpha", A1)).toBe(`/session/alpha/${A1}`);
    expect(sessionHref("alpha", A1, true)).toBe(`/session/alpha/${A1}/done`);
  });
  it("encodes its segments", () => {
    expect(sessionHref("a/b", "x y")).toBe("/session/a%2Fb/x%20y");
  });
});
