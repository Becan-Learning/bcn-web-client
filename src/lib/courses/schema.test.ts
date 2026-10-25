import { describe, expect, it } from "vitest";
import { backendErrorSchema, chapterSchema, courseSchema, coursesSchema, enrollmentsSchema, tokenSchema } from "./schema";

const summary = {
  id: "course-101", code: "COURSE 101", name: { ar: "مقرر", en: "Course" },
  institution: { id: "ksu", name: { ar: "جامعة", en: "University" } },
  icon: "atom", tone: "deep", chapterCount: 2, publishedChapterCount: 1,
};
const chapter = { number: 1, title: { ar: "فصل", en: "Chapter" }, minutes: 20, lessonCount: 2, published: true };

describe("courses backend contract", () => {
  it("parses catalog, detail and timestamped active enrollments", () => {
    expect(coursesSchema.parse([summary])).toEqual([summary]);
    expect(courseSchema.parse({ ...summary, chapters: [chapter] }).chapters).toEqual([chapter]);
    const enrollment = { enrolledAt: "2026-10-12T10:00:00.000Z", course: summary };
    expect(enrollmentsSchema.parse([enrollment])).toEqual([enrollment]);
    expect(enrollmentsSchema.parse([])).toEqual([]);
  });
  it("accepts unknown presentation strings with safe defaults", () => {
    const [course] = coursesSchema.parse([{ ...summary, icon: "new-icon", tone: "new-tone" }]);
    expect(course.icon).toBe("blocks");
    expect(course.tone).toBe("lilac");
  });
  it.each([
    { id: "../course" }, { name: { ar: "مقرر" } }, { institution: { id: "ksu" } },
    { chapterCount: -1 }, { publishedChapterCount: 1.5 }, { icon: null }, { tone: 2 },
  ])("rejects malformed catalog fields %j", (fields) => {
    expect(coursesSchema.safeParse([{ ...summary, ...fields }]).success).toBe(false);
  });
  it.each([{ number: 0 }, { minutes: 0 }, { lessonCount: -1 }, { published: "true" }])("rejects malformed chapter fields %j", (fields) => {
    expect(chapterSchema.safeParse({ ...chapter, ...fields }).success).toBe(false);
  });
  it("rejects partial details and invalid enrollment dates", () => {
    expect(courseSchema.safeParse(summary).success).toBe(false);
    expect(enrollmentsSchema.safeParse([{ enrolledAt: "yesterday", course: summary }]).success).toBe(false);
    expect(enrollmentsSchema.safeParse([{ enrolledAt: "2026-10-12T10:00:00Z" }]).success).toBe(false);
  });
  it("parses tokens and error envelopes without exposing malformed payloads", () => {
    expect(tokenSchema.parse({ token: "jwt", serverUrl: "wss://session.example.com" }).token).toBe("jwt");
    expect(tokenSchema.safeParse({ token: "", serverUrl: "not-a-url" }).success).toBe(false);
    expect(tokenSchema.safeParse({ token: "jwt" }).success).toBe(false);
    expect(backendErrorSchema.parse({ error: { message: "Enrollment required", code: "NOT_ENROLLED" } }).error.code).toBe("NOT_ENROLLED");
    expect(backendErrorSchema.safeParse({ message: "Enrollment required" }).success).toBe(false);
  });
});
