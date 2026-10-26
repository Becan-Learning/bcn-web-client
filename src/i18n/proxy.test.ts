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
      const incoming = request(path, "en");
      incoming.cookies.set("better-auth.session_token", "signed-token");
      const response = proxy(incoming);
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

describe("Account route gating", () => {
  it("keeps the English sign-in URL localized but its return path unprefixed", () => {
    const response = proxy(request("/en/home?x=1"));
    expect(response.headers.get("location")).toBe(
      "https://becan.test/en/sign-in?next=%2Fhome%3Fx%3D1",
    );
  });
  it("redirects a signed-out Arabic session visit with its original query", () => {
    const response = proxy(request("/session/acct101/1?room=test&n=2"));
    const destination = new URL(response.headers.get("location")!);
    expect(destination.pathname).toBe("/sign-in");
    expect(destination.searchParams.get("next")).toBe("/session/acct101/1?room=test&n=2");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it.each(["/home", "/settings", "/settings/account", "/settings/invoices/inv-1", "/session/acct101/1/done?room=test"])(
    "gates Arabic and English visits to %s",
    (path) => {
      for (const prefix of ["", "/en"]) {
        const response = proxy(request(`${prefix}${path}`));
        const destination = new URL(response.headers.get("location")!);
        expect(destination.pathname).toBe(`${prefix}/sign-in`);
        expect(destination.searchParams.get("next")).toBe(path);
      }
    },
  );
  it("uses the saved English choice on an unprefixed gated visit", () => {
    const destination = new URL(proxy(request("/home?a=1", "en")).headers.get("location")!);
    expect(destination.pathname).toBe("/en/sign-in");
    expect(destination.searchParams.get("next")).toBe("/home?a=1");
  });
  it("honors the explicit Arabic switcher prefix despite an English choice", () => {
    const destination = new URL(proxy(request("/ar/settings/account", "en")).headers.get("location")!);
    expect(destination.pathname).toBe("/sign-in");
    expect(destination.searchParams.get("next")).toBe("/settings/account");
  });
  it.each(["/", "/join", "/en/sign-in", "/courses", "/plans", "/checkout?plan=lite", "/checkout/result?s=success", "/refunds", "/homework", "/settings-guide", "/session-info"])(
    "does not gate public path %s",
    (path) => expect(proxy(request(path)).headers.get("location")).toBeNull(),
  );
  it.each(["better-auth.session_token", "__Secure-better-auth.session_token"])(
    "passes a gated visit with cookie %s through to locale routing",
    (name) => {
      const incoming = request("/en/settings/account");
      incoming.cookies.set(name, "signed-token");
      expect(proxy(incoming).headers.get("location")).toBeNull();
      expect(handleI18nRouting).toHaveBeenCalledWith(incoming);
    },
  );
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
