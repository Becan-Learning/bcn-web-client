import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import ar from "../../../messages/ar.json";
import en from "../../../messages/en.json";
import { authErrorKey, oauthErrorKey } from "./errors";

const BACKEND_MESSAGE =
  "You have been banned from this application. Please contact support if you believe this is an error.";

describe("authErrorKey for a banned Account", () => {
  it("maps BANNED_USER to the localized suspended-account key", () => {
    expect(authErrorKey({ code: "BANNED_USER", status: 403 })).toBe("accountBanned");
  });

  it("ignores the backend's English message", () => {
    const error = { code: "BANNED_USER", status: 403, message: BACKEND_MESSAGE };
    expect(authErrorKey(error)).toBe("accountBanned");
  });

  it("does not turn other 403 errors into the banned message", () => {
    expect(authErrorKey({ code: "EMAIL_NOT_VERIFIED", status: 403 })).toBe("emailNotVerified");
    expect(authErrorKey({ status: 403 })).toBe("generic");
  });

  it.each(["ar", "en"] as const)("has the banned copy and support link label in %s", (locale) => {
    const messages = locale === "ar" ? ar : en;
    const errors = createTranslator({ locale, messages, namespace: "Auth.Errors" });
    const banned = createTranslator({ locale, messages, namespace: "Auth.Banned" });
    const text = errors(authErrorKey({ code: "BANNED_USER" }) as "accountBanned");
    expect(text).not.toBe(BACKEND_MESSAGE);
    expect(text).not.toBe(errors("generic"));
    expect(text.length).toBeGreaterThan(0);
    expect(banned("contact").length).toBeGreaterThan(0);
    if (locale === "ar") {
      expect(text).toBe("تم إيقاف حسابك. تواصل مع الدعم لمعرفة السبب.");
      expect(text).not.toContain("جلسة");
    }
    expect(text).not.toMatch(/[٠-٩]/);
  });
});

describe("Google error codes", () => {
  it("maps the sign-up-disabled redirect to the no-account key", () => {
    expect(oauthErrorKey("signup_disabled")).toBe("noAccountYet");
  });

  it("maps the backend's Google-specific codes", () => {
    expect(oauthErrorKey("ADMIN_GOOGLE_FORBIDDEN")).toBe("adminGoogleForbidden");
    expect(oauthErrorKey("BANNED_USER")).toBe("accountBanned");
    expect(oauthErrorKey("PHONE_NUMBER_TAKEN")).toBe("phoneNumberTaken");
    expect(oauthErrorKey("INVALID_PHONE_NUMBER")).toBe("invalidPhoneNumber");
    expect(oauthErrorKey("INVALID_INSTITUTION")).toBe("invalidInstitution");
    expect(oauthErrorKey("INVALID_MAJOR")).toBe("invalidMajor");
  });

  it("treats a cancelled consent screen as its own gentle message", () => {
    expect(oauthErrorKey("access_denied")).toBe("googleCancelled");
  });

  it.each(["account_not_linked", "state_mismatch", "unable_to_get_user_info", "email_not_verified"])(
    "sends the generic OAuth failure %s to the Google failure message",
    (code) => {
      expect(oauthErrorKey(code)).toBe("googleFailed");
    },
  );

  it("keeps unknown backend codes generic and ignores an empty error", () => {
    expect(oauthErrorKey("SOMETHING_ELSE")).toBe("generic");
    expect(oauthErrorKey("")).toBeNull();
    expect(oauthErrorKey(undefined)).toBeNull();
  });

  it("maps the stale-session error from account deletion", () => {
    expect(authErrorKey({ code: "SESSION_EXPIRED", status: 400 })).toBe("sessionNotFresh");
  });

  it.each(["ar", "en"] as const)("has copy for every Google key in %s", (locale) => {
    const messages = locale === "ar" ? ar : en;
    const errors = createTranslator({ locale, messages, namespace: "Auth.Errors" });
    for (const key of [
      "adminGoogleForbidden", "googleFailed", "googleCancelled", "noAccountYet", "sessionNotFresh",
    ] as const) {
      const text = errors(key);
      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toBe(errors("generic"));
      expect(text).not.toMatch(/[٠-٩]/);
      if (locale === "ar") expect(text).not.toContain("جلسة");
    }
  });
});
