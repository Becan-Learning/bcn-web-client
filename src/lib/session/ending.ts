import { reachedAllowanceQuota } from "@/lib/allowance/presentation";
import type { Allowance } from "@/lib/allowance/schema";
import type { SessionState } from "./session-reducer";

export function sessionEndingQuota(
  state: Pick<SessionState, "ending" | "allowanceReached">,
  allowance: Allowance | null,
) {
  /* الإشارة تسبق انتهاء الميزانية؛ الاستخدام الحقيقي قد لا يبلغ الحدّ بعد. */
  return state.ending && state.allowanceReached && allowance
    ? reachedAllowanceQuota(allowance)
    : null;
}
