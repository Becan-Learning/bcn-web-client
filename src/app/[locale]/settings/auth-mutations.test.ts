import { describe, expect, it } from "vitest";
import { runSettingsAuthMutation } from "./_auth-mutations";

describe("Settings auth mutations", () => {
  it("still allows sign-out after a failed Account save", async () => {
    await expect(runSettingsAuthMutation(async () => {
      throw new Error("Network unavailable");
    })).rejects.toThrow("Network unavailable");
    await expect(runSettingsAuthMutation(async () => "signed out")).resolves.toBe("signed out");
  });
  it("signs out after a pending save finishes installing its session cookies", async () => {
    let signedIn = true;
    let releaseSave!: () => void;
    const saveResponse = new Promise<void>((resolve) => { releaseSave = resolve; });

    const save = runSettingsAuthMutation(async () => {
      await saveResponse;
      signedIn = true;
    });
    const signOut = runSettingsAuthMutation(async () => { signedIn = false; });

    releaseSave();
    await Promise.all([save, signOut]);
    expect(signedIn).toBe(false);
  });
});
