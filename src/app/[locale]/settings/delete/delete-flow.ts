import type { AuthErrorKey } from "@/lib/auth/errors";

/* `hasPassword`: `null` أثناء قراءة طرق الدخول. حساب Google وحده لا كلمة مرور له،
   فيُحذف بلا كلمة مرور ويشترط الخادم جلسة طازجة. */
export type DeletePlan =
  | { kind: "wait" }
  | { kind: "needPassword" }
  | { kind: "delete"; password: string | null };

export function planDelete(hasPassword: boolean | null, password: string): DeletePlan {
  if (hasPassword === null) return { kind: "wait" };
  if (!hasPassword) return { kind: "delete", password: null };
  return password ? { kind: "delete", password } : { kind: "needPassword" };
}

export type DeleteFailure =
  | { kind: "reauthenticate" }
  | { kind: "error"; field: "password" | "form" };

export function deleteFailure(hasPassword: boolean, key: AuthErrorKey): DeleteFailure {
  if (!hasPassword && key === "sessionNotFresh") return { kind: "reauthenticate" };
  return { kind: "error", field: hasPassword ? "password" : "form" };
}
