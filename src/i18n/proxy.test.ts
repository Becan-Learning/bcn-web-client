import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import proxy, { config } from "../proxy";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import { routing } from "./routing";

const { handleI18nRouting, createMiddleware } = vi.hoisted(() => {
  const handleI18nRouting = vi.fn();
  return {
    handleI18nRouting,
    createMiddleware: vi.fn<(config: unknown) => typeof handleI18nRouting>(
      () => handleI18nRouting,
    ),
  };
});

/* وسيط Next يُحمَّل في بيئة Next؛ هنا نراقب تسليم الطلب إليه بلا تغيير. */
vi.mock("next-intl/middleware", () => ({ default: createMiddleware }));

const configuredRouting = createMiddleware.mock.calls[0]?.[0];

beforeEach(() => {
  handleI18nRouting.mockReset();
  handleI18nRouting.mockReturnValue(NextResponse.next());
});

/* نختبر حدود الاختيار من الطلب الحقيقي: اللغة المحفوظة والبادئة مستقلّتان. */
function request(path: string, cookie?: string, language = "en-US,en;q=0.9") {
  const headers = new Headers({ "accept-language": language });
  if (cookie) headers.set("cookie", `NEXT_LOCALE=${cookie}`);
  return new NextRequest(`https://becan.test${path}`, { headers });
}

describe("interface language routing", () => {
  it("disables automatic detection and cookie writes while keeping alternate links", () => {
    expect(configuredRouting).toEqual(routing);
    expect(routing.localeCookie).toBe(false);
    expect(routing.localeDetection).toBe(false);
    expect(routing.alternateLinks).toBe(true);
  });

  it("keeps Arabic for English browser preferences without an explicit choice", () => {
    const incoming = request("/courses?subject=math");
    const response = proxy(incoming);
    expect(handleI18nRouting).toHaveBeenCalledWith(incoming);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it.each(["/", "/courses?subject=math&level=2", "/session/acct101/1?room=test"])(
    "returns an explicit English choice to %s with its query intact",
    (path) => {
      const response = proxy(request(path, "en"));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        `https://becan.test/en${path === "/" ? "" : path}`,
      );
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(handleI18nRouting).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, "ar", "en", "invalid"])(
    "opens a shared English link without overwriting the choice %s",
    (cookie) => {
      const incoming = request("/en/courses", cookie, "ar");
      const response = proxy(incoming);
      expect(handleI18nRouting).toHaveBeenCalledWith(incoming);
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("set-cookie")).toBeNull();
    },
  );

  it.each(["ar", "invalid"])("keeps unprefixed Arabic for cookie %s", (cookie) => {
    const incoming = request("/courses", cookie);
    const response = proxy(incoming);
    expect(handleI18nRouting).toHaveBeenCalledWith(incoming);
    expect(response.headers.get("location")).toBeNull();
  });

  it("hands the Arabic switcher prefix to next-intl without applying the cookie redirect", () => {
    const incoming = request("/ar/courses?subject=math", "en");
    const response = proxy(incoming);
    expect(handleI18nRouting).toHaveBeenCalledWith(incoming);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

describe("proxy matcher", () => {
  it.each(["/api", "/api/feedback", "/_next/static/chunk.js", "/_vercel/insights", "/favicon.ico", "/brand/logo.png", "/en/missing.txt"])(
    "excludes %s",
    (url) => expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false),
  );

  it.each(["/", "/en", "/courses", "/en/courses", "/apiary", "/unknown/path"])(
    "handles page path %s",
    (url) => expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true),
  );
});

it("keeps both message catalogs on the same key tree", () => {
  function keys(value: object, prefix = ""): string[] {
    return Object.entries(value).flatMap(([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof child === "object" && child !== null ? keys(child, path) : [path];
    });
  }
  expect(keys(en).sort()).toEqual(keys(ar).sort());
});
