import { describe, expect, it } from "vitest";
import { courseAfterSessionHref, readLimitReached, readRateRoom } from "./rating";

describe("courseAfterSessionHref", () => {
  it("returns to the course page carrying the room as the rate param", () => {
    expect(courseAfterSessionHref("math-101", { room: "ss_123", limit: false })).toBe("/c/math-101?rate=ss_123");
  });
  it("adds limit=1 when the session ended at its time limit", () => {
    expect(courseAfterSessionHref("math-101", { room: "ss_123", limit: true })).toBe("/c/math-101?rate=ss_123&limit=1");
  });
  it("omits the rate param when there is no room, so nothing can be rated", () => {
    expect(courseAfterSessionHref("math-101", { room: null, limit: false })).toBe("/c/math-101");
    expect(courseAfterSessionHref("math-101", { room: "", limit: true })).toBe("/c/math-101?limit=1");
  });
  it("encodes the slug and the room", () => {
    expect(courseAfterSessionHref("a/b", { room: "x y", limit: false })).toBe("/c/a%2Fb?rate=x+y");
  });
});

describe("rating params", () => {
  it.each([[undefined, null], ["", null], ["  ", null], [[], null], ["ss_1", "ss_1"], [["ss_1", "ss_2"], "ss_1"]])("reads the room from %j", (value, room) => {
    expect(readRateRoom(value)).toBe(room);
  });
  it.each([["1", true], [["1", "0"], true], ["0", false], ["true", false], [undefined, false]])("reads limit from %j", (value, limit) => {
    expect(readLimitReached(value)).toBe(limit);
  });
});
