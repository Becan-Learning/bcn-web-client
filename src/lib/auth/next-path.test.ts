import { describe, expect, it } from "vitest";
import { safeNext } from "./next-path";

describe("safeNext", () => {
  it.each([undefined, null, "", "/", "//evil.test", "/\\evil.test", "https://evil.test", "javascript:alert(1)", "home"])(
    "uses the fallback for a missing or non-local path: %s",
    (path) => expect(safeNext(path, "/courses")).toBe("/courses"),
  );
  it("preserves a local path, its query, and its locale prefix", () => {
    expect(safeNext("/en/session/acct101/1?room=test#board")).toBe(
      "/en/session/acct101/1?room=test#board",
    );
  });
  it.each([
    "/checkout?plan=pro&note=100%25",
    "/home?note=%5Cnotes&return=https%3A%2F%2Fexample.test",
    "/courses?search=%D8%AD%D8%B3%D8%A7%D8%A8#100%25",
  ])("preserves harmless encoded query values: %s", (path) => {
    expect(safeNext(path)).toBe(path);
  });
  it.each(["/%2fevil.test", "/%5cevil.test", "/%252Fevil.test", "%2F%2Fevil.test", "/\tevil.test", "/%0a/evil.test", "/a/..//evil.test", "/%2e%2e//evil.test", "/bad%ZZ"])(
    "rejects encoded or browser-normalized redirect escapes: %s",
    (path) => expect(safeNext(path)).toBe("/home"),
  );
});
