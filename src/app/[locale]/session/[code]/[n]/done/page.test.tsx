import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "@/i18n/navigation";
import DonePage from "./page";

vi.mock("@/i18n/navigation", () => ({ redirect: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

const call = (searchParams: Record<string, string | string[] | undefined> = {}, locale = "ar") =>
  DonePage({ params: Promise.resolve({ locale, code: "math-101", n: "1" }), searchParams: Promise.resolve(searchParams) });

describe("done route (removed summary page)", () => {
  it("redirects an in-flight link to the course page, carrying the room as the rate param", async () => {
    await call({ room: "ss_123" });
    expect(redirect).toHaveBeenCalledWith({ locale: "ar", href: "/c/math-101?rate=ss_123" });
  });

  it("carries the time-limit ending over as well", async () => {
    await call({ room: "ss_123", limit: "1" });
    expect(redirect).toHaveBeenCalledWith({ locale: "ar", href: "/c/math-101?rate=ss_123&limit=1" });
  });

  it.each([{}, { room: "" }, { room: [] }])("carries no rate param without a real room %#", async (searchParams) => {
    await call(searchParams);
    expect(redirect).toHaveBeenCalledWith({ locale: "ar", href: "/c/math-101" });
  });

  it("keeps the English locale", async () => {
    await call({ room: "ss_123" }, "en");
    expect(redirect).toHaveBeenCalledWith({ locale: "en", href: "/c/math-101?rate=ss_123" });
  });

  it("rejects an unknown locale", async () => {
    await expect(call({}, "xx")).rejects.toThrow();
    expect(redirect).not.toHaveBeenCalled();
  });
});
