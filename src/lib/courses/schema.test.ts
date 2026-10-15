import { describe, expect, it } from "vitest";
import { backendErrorSchema, chapterLookupSchema, chapterSchema, courseSchema, coursesSchema, enrollmentsSchema, tokenSchema } from "./schema";

const summary = {
  id: "11111111-1111-4111-8111-111111111111", slug: "course-101", code: "COURSE 101", name: { ar: "مقرر", en: "Course" },
  institution: { id: "ksu", name: { ar: "جامعة", en: "University" } },
  icon: "atom", tone: "deep", chapterCount: 2, publishedChapterCount: 1, status: "published",
};
const chapter = {
  id: "aaaaaaaa-0000-4000-8000-000000000001", number: 1, title: { ar: "فصل", en: "Chapter" }, minutes: 20, lessonCount: 2,
  state: "published", contentPath: "courses/course-101/ch_1/",
};

describe("courses backend contract", () => {
  it("parses catalog, detail and timestamped active enrollments", () => {
    expect(coursesSchema.parse([summary])).toEqual([summary]);
    expect(courseSchema.parse({ ...summary, chapters: [chapter] }).chapters).toEqual([chapter]);
    const enrollment = { enrolledAt: "2026-10-12T10:00:00.000Z", course: summary };
    expect(enrollmentsSchema.parse([enrollment])).toEqual([enrollment]);
    expect(enrollmentsSchema.parse([])).toEqual([]);
  });
  it("parses an archived course in the detail, the list and the enrollments", () => {
    const archived = { ...summary, status: "archived" };
    expect(coursesSchema.parse([archived])[0].status).toBe("archived");
    expect(courseSchema.parse({ ...archived, chapters: [chapter] }).status).toBe("archived");
    expect(enrollmentsSchema.parse([{ enrolledAt: "2026-10-12T10:00:00.000Z", course: archived }])[0].course.status).toBe("archived");
  });
  it.each(["draft", "Archived", "", null, 1, undefined])("rejects the course status %j", (status) => {
    expect(coursesSchema.safeParse([{ ...summary, status }]).success).toBe(false);
  });
  it("parses the chapter lookup: the chapter beside its whole course", () => {
    const body = { chapter, course: { ...summary, status: "archived", chapters: [chapter] } };
    expect(chapterLookupSchema.parse(body)).toEqual(body);
  });
  it.each([{ chapter }, { course: { ...summary, chapters: [chapter] } }, { chapter, course: summary }, { chapter: { ...chapter, id: "ch_1" }, course: { ...summary, chapters: [chapter] } }])(
    "rejects a malformed chapter lookup %j", (body) => {
      expect(chapterLookupSchema.safeParse(body).success).toBe(false);
    });
  it("accepts unknown presentation strings with safe defaults", () => {
    const [course] = coursesSchema.parse([{ ...summary, icon: "new-icon", tone: "new-tone" }]);
    expect(course.icon).toBe("blocks");
    expect(course.tone).toBe("lilac");
  });
  it.each([
    { id: "course-101" }, { slug: "../course" }, { slug: "11111111-1111-4111-8111-111111111111/x" }, { name: { ar: "مقرر" } }, { institution: { id: "ksu" } },
    { chapterCount: -1 }, { publishedChapterCount: 1.5 }, { icon: null }, { tone: 2 },
  ])("rejects malformed catalog fields %j", (fields) => {
    expect(coursesSchema.safeParse([{ ...summary, ...fields }]).success).toBe(false);
  });
  it.each([{ number: 0 }, { minutes: 0 }, { lessonCount: -1 }, { id: "ch_1" }, { state: "draft" }, { state: undefined },
    { published: true, state: undefined }, { contentPath: "/courses/x/" }, { contentPath: "courses/../x/" }, { contentPath: "courses/x" }])("rejects malformed chapter fields %j", (fields) => {
    expect(chapterSchema.safeParse({ ...chapter, ...fields }).success).toBe(false);
  });
  it("parses a coming-soon chapter with no content path", () => {
    const soon = { ...chapter, state: "coming_soon", contentPath: null };
    expect(chapterSchema.parse(soon)).toEqual(soon);
  });
  it("has no published boolean any more", () => {
    expect(chapterSchema.parse(chapter)).not.toHaveProperty("published");
  });
  it("rejects partial details and invalid enrollment dates", () => {
    expect(courseSchema.safeParse(summary).success).toBe(false);
    expect(enrollmentsSchema.safeParse([{ enrolledAt: "yesterday", course: summary }]).success).toBe(false);
    expect(enrollmentsSchema.safeParse([{ enrolledAt: "2026-10-12T10:00:00Z" }]).success).toBe(false);
  });
  it("parses tokens and error envelopes without exposing malformed payloads", () => {
    const token = { token: "jwt", serverUrl: "wss://session.example.com", contentPath: "courses/becan-test/ch_1/", courseContentPath: "courses/becan-test/" };
    expect(tokenSchema.parse(token)).toEqual(token);
    expect(tokenSchema.safeParse({ ...token, token: "", serverUrl: "not-a-url" }).success).toBe(false);
    expect(tokenSchema.safeParse({ token: "jwt" }).success).toBe(false);
    expect(tokenSchema.safeParse({ token: "jwt", serverUrl: token.serverUrl }).success).toBe(false);
    expect(tokenSchema.safeParse({ ...token, contentPath: "courses/../ch_1/" }).success).toBe(false);
    expect(backendErrorSchema.parse({ error: { message: "Enrollment required", code: "NOT_ENROLLED" } }).error.code).toBe("NOT_ENROLLED");
    expect(backendErrorSchema.safeParse({ message: "Enrollment required" }).success).toBe(false);
  });
});
