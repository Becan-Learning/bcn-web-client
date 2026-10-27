import { describe, expect, it } from "vitest";
import { normalizeTotpCode, signInOutcome, TOTP_LENGTH } from "./two-factor";

describe("signInOutcome", () => {
  it("recognizes the held-back sign-in of a two-factor Account", () => {
    expect(signInOutcome({ twoFactorRedirect: true, twoFactorMethods: ["totp"] })).toBe("twoFactor");
  });

  it("treats a response with a user or a token as signed in", () => {
    expect(signInOutcome({ redirect: false, token: "abc", user: { id: "u1" } })).toBe("signedIn");
    expect(signInOutcome({ user: { id: "u1" } })).toBe("signedIn");
    expect(signInOutcome({ token: "abc" })).toBe("signedIn");
  });

  it("prefers the two-factor step over any other field", () => {
    expect(signInOutcome({ twoFactorRedirect: true, token: "abc" })).toBe("twoFactor");
  });

  it("does not call any other shape a success", () => {
    expect(signInOutcome(null)).toBe("unknown");
    expect(signInOutcome(undefined)).toBe("unknown");
    expect(signInOutcome("ok")).toBe("unknown");
    expect(signInOutcome({})).toBe("unknown");
    expect(signInOutcome({ twoFactorRedirect: false })).toBe("unknown");
    expect(signInOutcome({ token: "", user: null })).toBe("unknown");
    expect(signInOutcome({ user: {} })).toBe("unknown");
  });
});

describe("normalizeTotpCode", () => {
  it("keeps ASCII digits and drops everything else", () => {
    expect(normalizeTotpCode("123 456")).toBe("123456");
    expect(normalizeTotpCode("12-34ab56")).toBe("123456");
    expect(normalizeTotpCode("")).toBe("");
  });

  it("converts Arabic-Indic and Persian digits to ASCII", () => {
    expect(normalizeTotpCode("١٢٣٤٥٦")).toBe("123456");
    expect(normalizeTotpCode("۱۲۳۴۵۶")).toBe("123456");
    expect(normalizeTotpCode("12٣4٥6")).toBe("123456");
  });

  it("caps the code at the TOTP length", () => {
    expect(TOTP_LENGTH).toBe(6);
    expect(normalizeTotpCode("12345678")).toBe("123456");
  });
});
