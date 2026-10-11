const ERROR_KEYS = {
  USER_ALREADY_EXISTS: "emailTaken",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "emailTaken",
  INVALID_EMAIL_OR_PASSWORD: "invalidCredentials",
  EMAIL_NOT_VERIFIED: "emailNotVerified",
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
} as const;

export type AuthErrorKey = (typeof ERROR_KEYS)[keyof typeof ERROR_KEYS] | "generic";

export function authErrorKey(error: { code?: string; status?: number } | null | undefined): AuthErrorKey {
  if (error?.status === 429) return "tooManyRequests";
  const code = error?.code;
  return code && Object.hasOwn(ERROR_KEYS, code) ? ERROR_KEYS[code as keyof typeof ERROR_KEYS] : "generic";
}
