import { describe, expect, it } from "vitest";
import { tokenErrorOutcome } from "./token-error";

const envelope = (code: string) => ({ error: { code, message: "Refused" } });

describe("Token error outcomes", () => {
  it.each(["SESSIONS_USED_UP", "MINUTES_USED_UP"])("maps 403 %s to the allowance gate", (code) => {
    expect(tokenErrorOutcome(403, envelope(code))).toBe("used-up");
  });

  it.each([401, 404, 409, 429, 500])("keeps status %i on the connection failure path even with a quota code", (status) => {
    for (const code of ["SESSIONS_USED_UP", "MINUTES_USED_UP"]) {
      expect(tokenErrorOutcome(status, envelope(code))).toBe("connection-failed");
    }
  });

  it("maps 409 CONTENT_NOT_AVAILABLE to its own outcome", () => {
    expect(tokenErrorOutcome(409, envelope("CONTENT_NOT_AVAILABLE"))).toBe("content-unavailable");
  });
  it("maps 409 CHAPTER_NOT_PUBLISHED to its own outcome", () => {
    expect(tokenErrorOutcome(409, envelope("CHAPTER_NOT_PUBLISHED"))).toBe("not-published");
  });
  it.each([403, 404, 500])("only maps the unavailable codes on 409, not %i", (status) => {
    expect(tokenErrorOutcome(status, envelope("CONTENT_NOT_AVAILABLE"))).toBe("connection-failed");
    expect(tokenErrorOutcome(status, envelope("CHAPTER_NOT_PUBLISHED"))).toBe("connection-failed");
  });

  it.each([
    envelope("NOT_ENROLLED"), envelope("CHAPTER_NOT_FOUND"),
    { error: { message: "Forbidden" } },
    { error: { code: "SESSIONS_USED_UP" } },
    { code: "MINUTES_USED_UP", message: "Refused" },
    null, "Not JSON",
  ])("keeps unknown or malformed errors on the existing path: %j", (body) => {
    expect(tokenErrorOutcome(403, body)).toBe("connection-failed");
  });

  it("maps the version pin refusals to their own outcomes", () => {
    expect(tokenErrorOutcome(403, envelope("VERSION_PIN_FORBIDDEN"))).toBe("version-forbidden");
    expect(tokenErrorOutcome(404, envelope("CONTENT_VERSION_NOT_FOUND"))).toBe("version-not-found");
    expect(tokenErrorOutcome(409, envelope("VERSION_INVALID"))).toBe("version-invalid");
  });
  it.each([
    [404, "VERSION_PIN_FORBIDDEN"], [409, "VERSION_PIN_FORBIDDEN"],
    [403, "CONTENT_VERSION_NOT_FOUND"], [409, "CONTENT_VERSION_NOT_FOUND"],
    [403, "VERSION_INVALID"], [404, "VERSION_INVALID"], [500, "VERSION_INVALID"],
  ])("only maps a version code on its own status, not %i %s", (status, code) => {
    expect(tokenErrorOutcome(status, envelope(code))).toBe("connection-failed");
  });
});
