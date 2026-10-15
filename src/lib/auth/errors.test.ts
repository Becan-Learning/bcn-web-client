import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import ar from "../../../messages/ar.json";
import en from "../../../messages/en.json";
import { authErrorKey } from "./errors";

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
