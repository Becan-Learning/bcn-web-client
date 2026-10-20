import { describe, expect, it } from "vitest";
import { deleteFailure, planDelete } from "./delete-flow";

describe("delete plan", () => {
  it("waits until the sign-in methods are known", () => {
    expect(planDelete(null, "")).toEqual({ kind: "wait" });
  });

  it("asks an Account with a password for it", () => {
    expect(planDelete(true, "")).toEqual({ kind: "needPassword" });
    expect(planDelete(true, "secret-pass")).toEqual({ kind: "delete", password: "secret-pass" });
  });

  it("does not ask a Google-only Account for a password, even if one was typed", () => {
    expect(planDelete(false, "")).toEqual({ kind: "delete", password: null });
    expect(planDelete(false, "stale")).toEqual({ kind: "delete", password: null });
  });
});

describe("delete failure", () => {
  it("offers Google re-authentication when a password-less session is not fresh", () => {
    expect(deleteFailure(false, "sessionNotFresh")).toEqual({ kind: "reauthenticate" });
  });

  it("shows other password-less failures on the form", () => {
    expect(deleteFailure(false, "generic")).toEqual({ kind: "error", field: "form" });
  });

  it("keeps password errors under the password field", () => {
    expect(deleteFailure(true, "invalidPassword")).toEqual({ kind: "error", field: "password" });
    expect(deleteFailure(true, "sessionNotFresh")).toEqual({ kind: "error", field: "password" });
  });
});
