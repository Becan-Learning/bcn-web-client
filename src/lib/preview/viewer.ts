import "server-only";

import { getAllowance } from "@/lib/allowance/server";
import { getAccount } from "@/lib/auth/session";
import { readsPreview } from "./rules";

/* هل يقرأ هذا المشاهد معاينة المشرف (ADR 0005)؟ للبيانات الوصفية فقط؛ الصفحات تقرأ الحدود وتقرّر بنفسها.
   الضيف لا يُسأل (الحدود تحتاج حسابًا)، وفشل القراءة = المسار العام. */
export async function viewerReadsPreview(): Promise<boolean> {
  if (!(await getAccount())) return false;
  const result = await getAllowance();
  return result.ok && readsPreview(result.data);
}
