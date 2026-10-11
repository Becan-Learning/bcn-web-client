import type { Locale } from "next-intl";
import { safeNext } from "./next-path";

export function buildVerifyCallbackURL(
  locale: Locale,
  next: string | null | undefined,
): string {
  const prefix = locale === "en" ? "/en" : "";
  return `${prefix}/verify-email?${new URLSearchParams({ next: safeNext(next) })}`;
}
