import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearGoogleJoinDraft,
  googleReauthRequest,
  googleSignInRequest,
  googleSignUpRequest,
  hasPasswordAccount,
  saveGoogleJoinDraft,
  signInErrorRoute,
  takeGoogleJoinDraft,
} from "./google";

const fields = { phoneNumber: "050 123 4567", institutionId: "ksu", majorId: "ksu-cs" };

describe("Google sign-up request", () => {
  it("asks Better Auth to create the Account and carries the study fields as E.164", () => {
    expect(googleSignUpRequest("ar", "/session/algebra/ch-1", fields)).toEqual({
      provider: "google",
      requestSignUp: true,
      additionalData: { phoneNumber: "+966501234567", institutionId: "ksu", majorId: "ksu-cs" },
      callbackURL: "/session/algebra/ch-1",
      newUserCallbackURL: "/session/algebra/ch-1",
      errorCallbackURL: "/join?method=google&next=%2Fsession%2Falgebra%2Fch-1",
    });
  });

  it("prefixes every return URL with the English locale", () => {
    const request = googleSignUpRequest("en", "/home", fields);
    expect(request.callbackURL).toBe("/en/home");
    expect(request.newUserCallbackURL).toBe("/en/home");
    expect(request.errorCallbackURL).toBe("/en/join?method=google&next=%2Fhome");
  });

  it("never lets a hostile next leave the site", () => {
    const request = googleSignUpRequest("ar", "//evil.example", fields);
    expect(request.callbackURL).toBe("/home");
    expect(request.errorCallbackURL).toBe("/join?method=google&next=%2Fhome");
  });

  it("refuses a phone number the form should have rejected", () => {
    expect(() => googleSignUpRequest("ar", "/home", { ...fields, phoneNumber: "123" })).toThrow();
  });
});

describe("Google sign-in request", () => {
  it("does not request sign-up, so an unknown email comes back as an error", () => {
    const request = googleSignInRequest("ar", "/home");
    expect(request).toEqual({
      provider: "google",
      callbackURL: "/home",
      errorCallbackURL: "/sign-in?next=%2Fhome",
    });
    expect(request).not.toHaveProperty("requestSignUp");
  });

  it("keeps the English prefix on the error return", () => {
    expect(googleSignInRequest("en", "/session/a/b").errorCallbackURL)
      .toBe("/en/sign-in?next=%2Fsession%2Fa%2Fb");
  });
});

describe("Google re-authentication before deleting an Account", () => {
  it("returns to the delete page whether it succeeds or fails", () => {
    expect(googleReauthRequest("ar")).toEqual({
      provider: "google",
      callbackURL: "/settings/delete",
      errorCallbackURL: "/settings/delete",
    });
    expect(googleReauthRequest("en").callbackURL).toBe("/en/settings/delete");
  });
});

describe("sign-in error routing", () => {
  it("sends an email without an Account to the join page in Google mode", () => {
    expect(signInErrorRoute("signup_disabled", "/session/a/b")).toEqual({
      kind: "join",
      query: { method: "google", notice: "no-account", next: "/session/a/b" },
    });
  });

  it("sanitises next on the way to the join page", () => {
    expect(signInErrorRoute("signup_disabled", "https://evil.example")).toMatchObject({
      query: { next: "/home" },
    });
  });

  it("shows the banned message so the support link can follow", () => {
    expect(signInErrorRoute("BANNED_USER", "/home")).toEqual({ kind: "message", key: "accountBanned" });
  });

  it("tells an Admin to use email and password", () => {
    expect(signInErrorRoute("ADMIN_GOOGLE_FORBIDDEN", "/home"))
      .toEqual({ kind: "message", key: "adminGoogleForbidden" });
  });

  it("explains an existing Account whose email is not verified", () => {
    expect(signInErrorRoute("account_not_linked", "/home"))
      .toEqual({ kind: "message", key: "googleAccountNotLinked" });
  });

  it("tells a new sign-up with an unverified Google address to check their inbox", () => {
    expect(signInErrorRoute("email_not_verified", "/home"))
      .toEqual({ kind: "message", key: "googleEmailNotVerified" });
  });

  it("shows one generic Google message for other OAuth failures", () => {
    expect(signInErrorRoute("unable_to_create_session", "/home")).toEqual({ kind: "message", key: "googleFailed" });
  });

  it("does nothing when there is no error", () => {
    expect(signInErrorRoute("", "/home")).toEqual({ kind: "none" });
    expect(signInErrorRoute(undefined, "/home")).toEqual({ kind: "none" });
  });
});

describe("password-less Account detection", () => {
  it("has a password only when a credential account exists", () => {
    expect(hasPasswordAccount([{ providerId: "google" }])).toBe(false);
    expect(hasPasswordAccount([{ providerId: "google" }, { providerId: "credential" }])).toBe(true);
    expect(hasPasswordAccount([])).toBe(false);
  });
});

describe("Google join draft", () => {
  afterEach(() => vi.unstubAllGlobals());

  const stubStorage = () => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    });
  };

  it("survives one round trip and is read once", () => {
    stubStorage();
    saveGoogleJoinDraft(fields);
    expect(takeGoogleJoinDraft()).toEqual(fields);
    expect(takeGoogleJoinDraft()).toBeNull();
  });

  it("is cleared when the round trip succeeds", () => {
    stubStorage();
    saveGoogleJoinDraft(fields);
    clearGoogleJoinDraft();
    expect(takeGoogleJoinDraft()).toBeNull();
  });

  it("expires after the OAuth state would have", () => {
    stubStorage();
    saveGoogleJoinDraft(fields, 1_000);
    expect(takeGoogleJoinDraft(1_000 + 11 * 60 * 1000)).toBeNull();
    saveGoogleJoinDraft(fields, 1_000);
    expect(takeGoogleJoinDraft(1_000 + 5 * 60 * 1000)).toEqual(fields);
  });

  it("ignores a corrupted draft", () => {
    stubStorage();
    sessionStorage.setItem("becan:join-google", "{not json");
    expect(takeGoogleJoinDraft()).toBeNull();
  });

  it("works when storage is blocked", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    });
    expect(() => saveGoogleJoinDraft(fields)).not.toThrow();
    expect(takeGoogleJoinDraft()).toBeNull();
  });
});
