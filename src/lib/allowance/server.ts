import "server-only";

import { headers } from "next/headers";
import { studentHeaders } from "@/lib/auth/forwarded-headers";
import { readBackend } from "@/lib/auth/read-backend";
import { allowanceSchema } from "./schema";

export async function getAllowance() {
  /* قراءة الطلب خارج التقاط أخطاء الشبكة كي تبقى إشارات الرسم الديناميكي سليمة. */
  const forwarded = studentHeaders(await headers());
  return readBackend("/me/allowance", allowanceSchema, { headers: forwarded, cache: "no-store" });
}
