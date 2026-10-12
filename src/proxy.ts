import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const prefix = routing.locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  const prefixed = prefix !== undefined;
  const path = prefix ? pathname.slice(prefix.length + 1) || "/" : pathname;
  const locale = prefix ?? (request.cookies.get("NEXT_LOCALE")?.value === "en" ? "en" : "ar");
  const gated = path === "/home" || ["/session", "/settings", "/checkout"].some(
    (route) => path === route || path.startsWith(`${route}/`),
  );

  /* وجود الكوكي فحص سريع فقط؛ الصفحات تتحقّق من الجلسة لدى الخادم. */
  if (gated && !getSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = locale === "en" ? "/en/sign-in" : "/sign-in";
    url.search = "";
    url.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  /* فتح رابط إنجليزي لا يُسجّل اختيارًا؛ نقرأ اختيار المبدّل فقط. */
  if (!prefixed && request.cookies.get("NEXT_LOCALE")?.value === "en") {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: "/((?!api(?:/|$)|_next(?:/|$)|_vercel(?:/|$)|.*\\..*).*)",
};
