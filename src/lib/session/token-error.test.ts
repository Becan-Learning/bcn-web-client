import { describe, expect, it } from "vitest";
import { tokenErrorOutcome } from "./token-error";

const envelope = (code: string) => ({ error: { code, message: "Refused" } });

describe("Token error outcomes", () => {
  it.each(["SESSIONS_USED_UP", "MINUTES_USED_UP"])("maps 403 %s to the allowance gate", (code) => {
    expect(tokenErrorOutcome(403, envelope(code))).toBe("used-up");
  });

  it.each([401, 409, 429, 500])("keeps status %i on the connection failure path even with a quota code", (status) => {
    for (const code of ["SESSIONS_USED_UP", "MINUTES_USED_UP"]) {
      expect(tokenErrorOutcome(status, envelope(code))).toBe("connection-failed");
    }
  });

  it.each([
    envelope("NOT_ENROLLED"), envelope("CHAPTER_NOT_PUBLISHED"),
    { error: { message: "Forbidden" } },
    { error: { code: "SESSIONS_USED_UP" } },
    { code: "MINUTES_USED_UP", message: "Refused" },
    null, "Not JSON",
  ])("keeps unknown or malformed errors on the existing path: %j", (body) => {
    expect(tokenErrorOutcome(403, body)).toBe("connection-failed");
  });
});
