import type { Locale } from "next-intl";
import { oauthErrorKey, type AuthErrorKey } from "./errors";
import { safeNext } from "./next-path";
import { toE164Saudi } from "./phone";

/* ما يُسلَّم لـBetter Auth يعيد التوجيه خارج next-intl، فبادئة اللغة هنا يدوية. */
const prefixed = (locale: Locale, path: string) =>
  locale === "en" ? `/en${path}` : path;

function signInErrorURL(locale: Locale, destination: string) {
  return prefixed(locale, `/sign-in?${new URLSearchParams({ next: destination })}`);
}

function joinErrorURL(locale: Locale, destination: string) {
  return prefixed(
    locale,
    `/join?${new URLSearchParams({ method: "google", next: destination })}`,
  );
}

/* الدخول: بلا `requestSignUp`، فبريد Google بلا حساب يعود بـ`signup_disabled`. */
export function googleSignInRequest(locale: Locale, next: string) {
  const destination = safeNext(next);
  return {
    provider: "google" as const,
    callbackURL: prefixed(locale, destination),
    errorCallbackURL: signInErrorURL(locale, destination),
  };
}

export type GoogleSignUpFields = {
  phoneNumber: string;
  institutionId: string;
  majorId: string;
};

/* التسجيل: الخادم يتحقّق من الحقول الثلاثة بقواعد التسجيل بالبريد نفسها. */
export function googleSignUpRequest(
  locale: Locale,
  next: string,
  fields: GoogleSignUpFields,
) {
  const phoneNumber = toE164Saudi(fields.phoneNumber);
  if (!phoneNumber) throw new Error("Invalid Saudi mobile number");
  const destination = safeNext(next);
  const callbackURL = prefixed(locale, destination);
  return {
    provider: "google" as const,
    requestSignUp: true,
    additionalData: {
      phoneNumber,
      institutionId: fields.institutionId,
      majorId: fields.majorId,
    },
    callbackURL,
    newUserCallbackURL: callbackURL,
    errorCallbackURL: joinErrorURL(locale, destination),
  };
}

/* إعادة المصادقة قبل حذف الحساب: يعود الطالب إلى صفحة الحذف نجح أم فشل. */
export function googleReauthRequest(locale: Locale) {
  const deletePage = prefixed(locale, "/settings/delete");
  return {
    provider: "google" as const,
    callbackURL: deletePage,
    errorCallbackURL: deletePage,
  };
}

export type SignInErrorRoute =
  | { kind: "none" }
  | { kind: "join"; query: { method: "google"; notice: "no-account"; next: string } }
  | { kind: "message"; key: AuthErrorKey };

/* `?error=` على صفحة الدخول بعد Google: بريد بلا حساب يُحوَّل إلى التسجيل
   بوضع Google، وغيره رسالة في النموذج. */
export function signInErrorRoute(
  code: string | null | undefined,
  next: string,
): SignInErrorRoute {
  const key = oauthErrorKey(code);
  if (!key) return { kind: "none" };
  if (key === "noAccountYet") {
    return {
      kind: "join",
      query: { method: "google", notice: "no-account", next: safeNext(next) },
    };
  }
  return { kind: "message", key };
}

/* الحساب بكلمة مرور له سجلّ مزوّد `credential`؛ حساب Google وحده لا. */
export function hasPasswordAccount(accounts: readonly { providerId: string }[]) {
  return accounts.some((account) => account.providerId === "credential");
}

/* مسودة خطوة الجامعة تنجو من رحلة Google كي لا يعيد الطالب اختيارها بعد خطأ.
   النجاح لا يعود إلى صفحة الانضمام (حساب جديد أو قائم يُربط، كلاهما يهبط على الوجهة)،
   فتُمسح المسودة حين يظهر حساب مسجَّل في أي شاشة (`useAccount`)، ولها عمر قصير احتياطًا. */
const DRAFT_KEY = "becan:join-google";
const DRAFT_TTL_MS = 10 * 60 * 1000;

export function saveGoogleJoinDraft(fields: GoogleSignUpFields, now = Date.now()) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...fields, savedAt: now }));
  } catch {
    /* منع التخزين لا يمنع التسجيل. */
  }
}

export function clearGoogleJoinDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* منع التخزين لا يمنع الدخول. */
  }
}

export function takeGoogleJoinDraft(now = Date.now()): GoogleSignUpFields | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    sessionStorage.removeItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const { phoneNumber, institutionId, majorId, savedAt } = parsed as Record<string, unknown>;
    if (typeof savedAt !== "number" || now - savedAt > DRAFT_TTL_MS) return null;
    return typeof phoneNumber === "string" && typeof institutionId === "string" &&
      typeof majorId === "string"
      ? { phoneNumber, institutionId, majorId }
      : null;
  } catch {
    return null;
  }
}
