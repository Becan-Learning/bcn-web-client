import "server-only";

import { headers } from "next/headers";
import type { Locale } from "next-intl";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import type { AccountSession } from "./types";
import { safeNext } from "./next-path";
import { backendUrl } from "./backend";

const accountSessionSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    name: z.string(),
    email: z.string(),
    emailVerified: z.boolean(),
    image: z.string().nullable().optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    phoneNumber: z.string(),
    phoneNumberVerified: z.boolean(),
    institutionId: z.string(),
    majorId: z.string(),
    /* حقل ملحقة التحقق بخطوتين في نوع المستخدم؛ الخادم قد يغفله للحساب العادي. */
    twoFactorEnabled: z.boolean().nullable().default(null),
  }),
  session: z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
    token: z.string(),
    expiresAt: z.coerce.date(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
  }),
});

export async function getAccountFromCookie(cookie: string): Promise<AccountSession | null> {
  try {
    const response = await fetch(`${backendUrl()}/api/auth/get-session`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (response.status !== 200) {
      console.error("Account session request failed", { status: response.status });
      return null;
    }
    const data: unknown = await response.json();
    if (data === null) return null;
    const parsed = accountSessionSchema.safeParse(data);
    if (!parsed.success) {
      console.error("Invalid Account session response");
      return null;
    }
    return parsed.data;
  } catch {
    console.error("Account session request failed");
    return null;
  }
}

export async function getAccount(): Promise<AccountSession | null> {
  /* قراءة الطلب خارج التقاط أخطاء الشبكة كي لا نبتلع إشارات الرسم الديناميكي. */
  const cookie = (await headers()).get("cookie") ?? "";
  return getAccountFromCookie(cookie);
}

export async function requireAccount(locale: Locale, path: string): Promise<AccountSession> {
  const accountSession = await getAccount();
  if (!accountSession) {
    return redirect({ locale, href: { pathname: "/sign-in", query: { next: safeNext(path) } } });
  }
  return accountSession;
}
