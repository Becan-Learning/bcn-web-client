export const TOTP_LENGTH = 6;

export type SignInOutcome = "twoFactor" | "signedIn" | "unknown";

/* ماذا أعاد `signIn.email` بلا خطأ؟ الخادم يرد 200 في حالتين مختلفتين:
   حساب بتحقق بخطوتين (`twoFactorRedirect` وكوكي مؤقت بلا جلسة)، أو دخول كامل (مستخدم/رمز).
   أي شكل آخر لا نعامله نجاحًا كي لا نرتدّ إلى الصفحة بصمت. */
export function signInOutcome(data: unknown): SignInOutcome {
  if (typeof data !== "object" || data === null) return "unknown";
  const body = data as Record<string, unknown>;
  if (body.twoFactorRedirect === true) return "twoFactor";
  const user = body.user;
  const hasUser = typeof user === "object" && user !== null &&
    typeof (user as Record<string, unknown>).id === "string";
  const hasToken = typeof body.token === "string" && body.token !== "";
  return hasUser || hasToken ? "signedIn" : "unknown";
}

/* الأرقام الهندية (٠-٩) والفارسية (۰-۹) تتحوّل إلى ASCII؛ وما عداها غير الأرقام يُحذف. */
export function normalizeTotpCode(raw: string): string {
  return raw
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "")
    .slice(0, TOTP_LENGTH);
}
