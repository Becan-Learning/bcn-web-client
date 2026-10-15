import { describe, expect, it } from "vitest";
import {
  LESSONS_FILE, SLIDES_FILE, activeContentPath, contentProxyUrl, contentSegments, contentStorageUrl,
  lessonsNeedRefetch, parseLessons,
} from "./content";

describe("content path building", () => {
  it("appends the file to the prefix the backend returned, without inventing any segment", () => {
    expect(contentProxyUrl("courses/becan-test/ch_1/", SLIDES_FILE)).toBe("/api/fetch-bunny/courses/becan-test/ch_1/slides.pdf");
    expect(contentProxyUrl("courses/becan-test/ch_1/", LESSONS_FILE)).toBe("/api/fetch-bunny/courses/becan-test/ch_1/lessons_list.json");
  });
  it("treats the prefix as opaque: a deeper or renamed prefix works the same", () => {
    expect(contentSegments("content/chapters/2f0c/v3/", SLIDES_FILE)).toEqual(["content", "chapters", "2f0c", "v3", "slides.pdf"]);
  });
  it("accepts a prefix without its trailing slash", () => {
    expect(contentSegments("courses/becan-test", SLIDES_FILE)).toEqual(["courses", "becan-test", "slides.pdf"]);
  });
  it("builds the storage URL on the pull zone, tolerating trailing slashes on the base", () => {
    expect(contentStorageUrl("https://zone.example.com//", "courses/becan-test/ch_1/", LESSONS_FILE))
      .toBe("https://zone.example.com/courses/becan-test/ch_1/lessons_list.json");
  });
  it("percent-encodes every segment", () => {
    expect(contentProxyUrl("courses/a b/ch_1/", SLIDES_FILE)).toBe("/api/fetch-bunny/courses/a%20b/ch_1/slides.pdf");
  });
  it.each(["", "/", "/courses/x/", "courses//x/", "courses/../x/", "./courses/x/", "courses/x\\y/", "courses/x/../"])(
    "refuses the unsafe prefix %j", (prefix) => {
      expect(() => contentSegments(prefix, SLIDES_FILE)).toThrow("Invalid content path");
    },
  );
});

describe("pinned content", () => {
  it("prefers the path pinned in the token over the catalog path", () => {
    expect(activeContentPath("courses/a/ch_1/", null)).toBe("courses/a/ch_1/");
    expect(activeContentPath("courses/a/ch_1/", "courses/a/ch_1/v1/")).toBe("courses/a/ch_1/v1/");
  });
  it("re-reads the lessons only when the pinned path differs from the one the server read", () => {
    expect(lessonsNeedRefetch("courses/a/ch_1/", null)).toBe(false);
    expect(lessonsNeedRefetch("courses/a/ch_1/", "courses/a/ch_1/")).toBe(false);
    expect(lessonsNeedRefetch("courses/a/ch_1/", "courses/a/ch_1/old/")).toBe(true);
  });
});

describe("lesson list parsing", () => {
  it("keeps well-formed lessons and defaults a missing brief", () => {
    expect(parseLessons({ lessons: [{ name: "A", slug: "a", brief: "x" }, { name: "B", slug: "b" }, { name: 3 }, null] }))
      .toEqual([{ name: "A", slug: "a", brief: "x" }, { name: "B", slug: "b", brief: "" }]);
  });
  it.each([null, "x", {}, { lessons: "no" }])("returns no lessons for %j", (data) => {
    expect(parseLessons(data)).toEqual([]);
  });
});
