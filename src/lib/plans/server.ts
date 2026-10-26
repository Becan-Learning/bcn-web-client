import "server-only";

import { headers } from "next/headers";
import { getSessionCookie } from "better-auth/cookies";
import { backendUrl } from "@/lib/auth/backend";
import { getAllowance } from "@/lib/allowance/server";
import { plansResponseSchema } from "./schema";
import { toPlanView, type PlanView } from "./view";

export type PlansResult = { ok: true; plans: PlanView[] } | { ok: false };

/* الباقات المعروضة بترتيب العرض — عامّة ومخزّنة خمس دقائق كالكتالوج.
   الفشل لا يرمي: الصفحة تقرّر ما تعرضه (إخفاء القسم أو حالة خطأ). */
export async function getPlans(): Promise<PlansResult> {
  try {
    const response = await fetch(`${backendUrl()}/api/v1/plans`, { next: { revalidate: 300 } });
    if (!response.ok) {
      console.error("Plans request failed", { status: response.status });
      return { ok: false };
    }
    const parsed = plansResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      console.error("Invalid plans response");
      return { ok: false };
    }
    return { ok: true, plans: parsed.data.plans.map(toPlanView) };
  } catch {
    console.error("Plans request failed");
    return { ok: false };
  }
}

export type Viewer = { signedIn: boolean; planId: string | null };

/* من يرى الصفحة: الزائر بلا كوكي لا يستدعي الخادم أصلًا. وفشل قراءة
   الحدود لا يُسقط الصفحة، فقط لا تُوسَم باقته الحالية. */
export async function getViewer(): Promise<Viewer> {
  const cookie = (await headers()).get("cookie");
  if (!cookie || !getSessionCookie(new Headers({ cookie }))) return { signedIn: false, planId: null };
  const allowance = await getAllowance();
  return { signedIn: true, planId: allowance.ok ? allowance.data.plan.id : null };
}
