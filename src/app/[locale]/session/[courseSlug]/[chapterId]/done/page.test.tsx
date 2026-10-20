import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "@/i18n/navigation";
import DonePage from "./page";

const backend = vi.hoisted(() => ({ target: vi.fn() }));
vi.mock("@/lib/auth/courses", () => ({ findSessionTarget: backend.target }));
vi.mock("@/i18n/navigation", () => ({ redirect: vi.fn() }));

const CHAPTER = "aaaaaaaa-0000-4000-8000-000000000001";
const course = { slug: "math-101" };

beforeEach(() => {
  vi.clearAllMocks();
  backend.target.mockResolvedValue({ kind: "found", course, chapter: {}, source: "public" });
});

const call = (searchParams: Record<string, string | string[] | undefined> = {}, locale = "ar", courseSlug = "math-101") =>
  DonePage({ params: Promise.resolve({ locale, courseSlug, chapterId: CHAPTER }), searchParams: Promise.resolve(searchParams) });

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

  it("goes to the Course's current slug when it changed during the session", async () => {
    backend.target.mockResolvedValue({ kind: "redirect", slug: "math-101-new" });
    await call({ room: "ss_123" }, "ar", "math-101");
    expect(redirect).toHaveBeenCalledWith({ locale: "ar", href: "/c/math-101-new?rate=ss_123" });
  });

  it("keeps the link's own slug when the public read does not find the chapter (an Admin's Draft)", async () => {
    backend.target.mockResolvedValue({ kind: "not-found" });
    await call({ room: "ss_123" });
    expect(redirect).toHaveBeenCalledWith({ locale: "ar", href: "/c/math-101?rate=ss_123" });
    expect(backend.target).toHaveBeenCalledTimes(1);
    expect(backend.target).not.toHaveBeenCalledWith(expect.anything(), expect.anything(), { preview: true });
  });

  it("rejects an unknown locale", async () => {
    await expect(call({}, "xx")).rejects.toThrow();
    expect(redirect).not.toHaveBeenCalled();
  });
});
