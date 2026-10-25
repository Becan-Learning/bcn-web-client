import { describe, expect, it } from "vitest";
import {
  DEFAULT_SLIDE_RATIO,
  centerDelta,
  currentSlide,
  isWithin,
  slideMark,
  slideRatio,
} from "./slides";

describe("slideRatio", () => {
  it("reads the real page ratio", () => {
    expect(slideRatio(1920, 1080)).toBeCloseTo(16 / 9);
    expect(slideRatio(720, 540)).toBeCloseTo(4 / 3);
    expect(slideRatio(595, 842)).toBeLessThan(1);
  });

  it("falls back to 4:3 for unusable dimensions", () => {
    expect(slideRatio(0, 540)).toBe(DEFAULT_SLIDE_RATIO);
    expect(slideRatio(720, 0)).toBe(DEFAULT_SLIDE_RATIO);
    expect(slideRatio(NaN, 540)).toBe(DEFAULT_SLIDE_RATIO);
    expect(slideRatio(-1, -1)).toBe(DEFAULT_SLIDE_RATIO);
    expect(DEFAULT_SLIDE_RATIO).toBeCloseTo(4 / 3);
  });
});

describe("currentSlide", () => {
  const base = { numPages: 10 };

  it("follows the tutor and defaults to slide 1", () => {
    expect(currentSlide({ ...base, picked: null, agentPage: 4 })).toEqual({
      page: 4, tutorPage: 4, pickedActive: false,
    });
    expect(currentSlide({ ...base, picked: null, agentPage: null })).toEqual({
      page: 1, tutorPage: null, pickedActive: false,
    });
  });

  it("keeps the student's pick until the tutor asks for another slide", () => {
    const picked = { page: 7, agentPage: 4 };
    expect(currentSlide({ ...base, picked, agentPage: 4 })).toEqual({
      page: 7, tutorPage: 4, pickedActive: true,
    });
    expect(currentSlide({ ...base, picked, agentPage: 5 })).toEqual({
      page: 5, tutorPage: 5, pickedActive: false,
    });
  });

  it("clamps to the document", () => {
    expect(currentSlide({ ...base, picked: null, agentPage: 99 }).page).toBe(10);
    expect(currentSlide({ ...base, picked: null, agentPage: 0 }).tutorPage).toBe(1);
  });
});

describe("slideMark", () => {
  it("marks only the tutor's slide as now", () => {
    const cur = currentSlide({ numPages: 5, picked: null, agentPage: 3 });
    expect([1, 2, 3, 4, 5].map((p) => slideMark(p, cur))).toEqual([
      "other", "other", "now", "other", "other",
    ]);
  });

  it("keeps now on the tutor's slide and marks the student's pick apart from it", () => {
    const cur = currentSlide({ numPages: 5, picked: { page: 5, agentPage: 3 }, agentPage: 3 });
    expect([1, 2, 3, 4, 5].map((p) => slideMark(p, cur))).toEqual([
      "other", "other", "now", "other", "picked",
    ]);
  });

  it("is simply now when the student picks the tutor's own slide", () => {
    const cur = currentSlide({ numPages: 5, picked: { page: 3, agentPage: 3 }, agentPage: 3 });
    expect([1, 2, 3].map((p) => slideMark(p, cur))).toEqual(["other", "other", "now"]);
  });

  it("starts on slide 1 without a now tag before the tutor scrolls", () => {
    const cur = currentSlide({ numPages: 5, picked: null, agentPage: null });
    expect([1, 2].map((p) => slideMark(p, cur))).toEqual(["start", "other"]);
    const pickedEarly = currentSlide({ numPages: 5, picked: { page: 2, agentPage: null }, agentPage: null });
    expect([1, 2].map((p) => slideMark(p, pickedEarly))).toEqual(["other", "picked"]);
  });
});

describe("centering", () => {
  it("returns how far to scroll to centre an item", () => {
    expect(centerDelta(0, 400, 500, 100)).toBe(350);
    expect(centerDelta(100, 400, 0, 100)).toBe(-250);
    expect(centerDelta(0, 400, 150, 100)).toBe(0);
  });

  it("detects an item fully inside the container", () => {
    expect(isWithin(0, 400, 100, 200)).toBe(true);
    expect(isWithin(0, 400, 300, 200)).toBe(false);
    expect(isWithin(0, 400, -10, 100)).toBe(false);
  });
});
