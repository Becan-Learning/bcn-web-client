"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { requireAccount } from "@/lib/auth/session";

export async function retryAccountInstitutions() {
  const locale = (await getLocale()) === "en" ? "en" : "ar";
  await requireAccount(locale, "/settings/account");
  /* تحديث الموجّه وحده لا يلغي نسخة الكتالوج المحفوظة على الخادم. */
  revalidatePath("/[locale]/settings/account", "page");
}
