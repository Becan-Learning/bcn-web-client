import type { Enrollment } from "@/lib/courses/schema";
import type { Allowance } from "./schema";

export function minutesLeft({ limits, usage, unlimited }: Allowance): number | null {
  if (unlimited) return null;
  return limits.seconds === null ? null : Math.max(0, Math.floor(limits.seconds / 60) - Math.ceil(usage.seconds / 60));
}

export function usedUp({ limits, usage, unlimited }: Allowance): boolean {
  if (unlimited) return false;
  return (limits.sessions !== null && usage.sessions >= limits.sessions)
    || (limits.seconds !== null && limits.seconds - usage.seconds < (limits.minStartSeconds ?? 1));
}

export function nearlyOut(allowance: Allowance): boolean {
  const remaining = minutesLeft(allowance);
  return !usedUp(allowance) && remaining !== null && remaining > 0 && remaining < 15;
}

export function slotsFull(allowance: Allowance | null, enrollments: Enrollment[], courseId: string): boolean {
  if (!allowance || allowance.unlimited || enrollments.some((enrollment) => enrollment.course.id === courseId)) return false;
  const { limits, usage } = allowance;
  return limits.enrollments !== null && usage.enrollments >= limits.enrollments;
}

export type StartDecision =
  | { ok: true }
  | { ok: false; reason: "unpublished" | "not-enrolled" | "used-up" };

/* هل يبدأ هذا الحساب حصةً في هذا الفصل؟ القرار الوحيد للمنع بسبب النشر أو التسجيل أو الحدود.
   الحساب غير المحدود (مشرف بتحقق بخطوتين) لا يحتاج تسجيلًا ولا تحدّه الحدود، أما الفصل غير المنشور فيُرفض للجميع. */
export function startDecision({ allowance, enrolled, published }: {
  allowance: Allowance | null;
  enrolled: boolean;
  published: boolean;
}): StartDecision {
  if (!published) return { ok: false, reason: "unpublished" };
  if (allowance?.unlimited) return { ok: true };
  if (!enrolled) return { ok: false, reason: "not-enrolled" };
  if (allowance && usedUp(allowance)) return { ok: false, reason: "used-up" };
  return { ok: true };
}
