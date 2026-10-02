import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EXPLANATION_LANGUAGE_KEY,
  getExplanationLanguage,
  getServerExplanationLanguage,
  resolveExplanationLanguage,
  setExplanationLanguage,
  subscribeExplanationLanguage,
} from "./explanation-language";
import { boardFrame } from "./board/frame";

afterEach(() => vi.unstubAllGlobals());

describe("explanation language defaults", () => {
  it.each([
    [null, "ar", "Arabic"],
    [null, "en", "English"],
    ["Arabic", "en", "Arabic"],
    ["English", "ar", "English"],
    ["ar", "en", "English"],
    ["invalid", "ar", "Arabic"],
  ])("resolves stored %s in interface %s to %s", (stored, locale, expected) => {
    expect(resolveExplanationLanguage(stored, locale)).toBe(expected);
  });

  it("keeps the hydration snapshot independent of browser storage", () => {
    vi.stubGlobal("localStorage", { getItem: () => "English" });
    expect(getServerExplanationLanguage()).toBeNull();
    expect(resolveExplanationLanguage(getServerExplanationLanguage(), "ar")).toBe("Arabic");
    expect(getExplanationLanguage()).toBe("English");
  });

  it.each([null, "Arabic", "English", "invalid"])("validates persisted %s", (value) => {
    const getItem = vi.fn(() => value);
    vi.stubGlobal("localStorage", { getItem });
    expect(getExplanationLanguage()).toBe(value === "invalid" ? null : value);
    expect(getItem).toHaveBeenCalledWith(EXPLANATION_LANGUAGE_KEY);
  });

  it("falls back to the interface when storage is blocked", () => {
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); } });
    expect(getExplanationLanguage()).toBeNull();
    expect(resolveExplanationLanguage(getExplanationLanguage(), "en")).toBe("English");
  });

  it.each([false, true])("notifies same-tab and cross-tab changes with blocked storage %s", (blocked) => {
    const target = new EventTarget();
    const setItem = vi.fn(() => { if (blocked) throw new Error("blocked"); });
    vi.stubGlobal("window", target);
    vi.stubGlobal("localStorage", { setItem });
    const notify = vi.fn();
    const unsubscribe = subscribeExplanationLanguage(notify);
    setExplanationLanguage("English");
    expect(setItem).toHaveBeenCalledWith(EXPLANATION_LANGUAGE_KEY, "English");
    expect(notify).toHaveBeenCalledTimes(1);
    target.dispatchEvent(new Event("storage"));
    expect(notify).toHaveBeenCalledTimes(2);
    unsubscribe();
    setExplanationLanguage("Arabic");
    target.dispatchEvent(new Event("storage"));
    expect(notify).toHaveBeenCalledTimes(2);
  });
});

describe("board frame", () => {
  it.each(["ar", "en"])("follows the explanation independently of interface %s", (locale) => {
    expect(boardFrame(resolveExplanationLanguage("Arabic", locale))).toEqual({ dir: "rtl", lang: "ar" });
    expect(boardFrame(resolveExplanationLanguage("English", locale))).toEqual({ dir: "ltr", lang: "en" });
  });
});
