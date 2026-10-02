import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const prefixed = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

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
