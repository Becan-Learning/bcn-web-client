const ERROR_KEYS = {
  USER_ALREADY_EXISTS: "emailTaken",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "emailTaken",
  INVALID_EMAIL_OR_PASSWORD: "invalidCredentials",
  EMAIL_NOT_VERIFIED: "emailNotVerified",
  /* رسالة الخادم الإنجليزية لهذا الرمز لا تُعرض أبدًا؛ نعرض نصّنا المترجم. */
  BANNED_USER: "accountBanned",
  PASSWORD_TOO_SHORT: "passwordTooShort",
  PASSWORD_TOO_LONG: "passwordTooLong",
  INVALID_EMAIL: "invalidEmail",
  INVALID_PASSWORD: "invalidPassword",
  INVALID_TOKEN: "invalidToken",
  TOKEN_EXPIRED: "invalidToken",
  TOO_MANY_REQUESTS: "tooManyRequests",
  INVALID_PHONE_NUMBER: "invalidPhoneNumber",
  PHONE_NUMBER_TAKEN: "phoneNumberTaken",
  INVALID_INSTITUTION: "invalidInstitution",
  INVALID_MAJOR: "invalidMajor",
  /* المشرف يدخل بكلمة المرور والتحقق بخطوتين فقط؛ الخادم يرفض Google له. */
  ADMIN_GOOGLE_FORBIDDEN: "adminGoogleForbidden",
  /* حذف الحساب بلا كلمة مرور يشترط جلسة طازجة (`SESSION_EXPIRED` في Better Auth). */
  SESSION_EXPIRED: "sessionNotFresh",
  /* رموز الرجوع من Google تصل في `?error=` بحروف صغيرة (oauth/errors في Better Auth).
     `signup_disabled` يعني أن بريد Google بلا حساب عندنا. */
  signup_disabled: "noAccountYet",
  access_denied: "googleCancelled",
  /* الخادم لا يثق بـGoogle وحده للربط: يلزم أن يكون بريد الحساب القائم مؤكَّدًا أيضًا. */
  account_not_linked: "googleAccountNotLinked",
  /* بريد Google غير مؤكَّد في تسجيل جديد: أُنشئ الحساب وأُرسل رابط التأكيد بلا جلسة. */
  email_not_verified: "googleEmailNotVerified",
} as const;

export type AuthErrorKey =
  | (typeof ERROR_KEYS)[keyof typeof ERROR_KEYS]
  | "googleFailed"
  | "generic";

export function authErrorKey(error: { code?: string; status?: number } | null | undefined): AuthErrorKey {
  if (error?.status === 429) return "tooManyRequests";
  const code = error?.code;
  return code && Object.hasOwn(ERROR_KEYS, code) ? ERROR_KEYS[code as keyof typeof ERROR_KEYS] : "generic";
}

/* رمز `?error=` العائد من Google: المعروف يُترجم، وأي رمز OAuth صغير الحروف غيره
   (`account_not_linked` · `state_mismatch` …) رسالة واحدة عن تعذّر Google بدل `generic`. */
export function oauthErrorKey(code: string | null | undefined): AuthErrorKey | null {
  if (!code) return null;
  const key = authErrorKey({ code });
  if (key !== "generic") return key;
  return /^[a-z][a-z0-9_]*$/.test(code) ? "googleFailed" : "generic";
}
