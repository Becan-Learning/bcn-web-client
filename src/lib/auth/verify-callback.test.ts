import { describe, expect, it } from "vitest";
import { buildVerifyCallbackURL } from "./verify-callback";

describe("Email verification callback", () => {
  it("uses an unprefixed Arabic verification page with the destination encoded", () => {
    expect(buildVerifyCallbackURL("ar", "/session/example/1"))
      .toBe("/verify-email?next=%2Fsession%2Fexample%2F1");
  });
  it("prefixes only the English verification page, keeping next unprefixed", () => {
    expect(buildVerifyCallbackURL("en", "/session/example/1"))
      .toBe("/en/verify-email?next=%2Fsession%2Fexample%2F1");
  });
  it.each([undefined, null, "", "https://example.com", "//example.com", "/\\example.com", "/%2Fexample.com"])(
    "uses the safe default for a missing or unsafe destination: %s",
    (next) => {
      expect(buildVerifyCallbackURL("ar", next))
        .toBe("/verify-email?next=%2Fhome");
    },
  );
  it("keeps the full destination query and fragment inside next", () => {
    expect(buildVerifyCallbackURL("en", "/session/example/1?mode=review&from=email#question"))
      .toBe("/en/verify-email?next=%2Fsession%2Fexample%2F1%3Fmode%3Dreview%26from%3Demail%23question");
  });
});
