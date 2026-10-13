/* قواعد نموذج التواصل — يشترك فيها العميل والمسار فلا تتباعد. */

export const CONTACT_TOPICS = ["course", "session", "account", "other"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const MESSAGE_MIN_LENGTH = 10;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAUDI_MOBILE = /^0\d{9}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

/** جوال سعودي بصيغة 05xxxxxxxx (تُزال المسافات والشرطات). */
export function isValidSaudiMobile(value: string): boolean {
  return SAUDI_MOBILE.test(value.trim().replace(/[\s-]/g, ""));
}

/** بريد أو جوال سعودي. */
export function isValidContact(value: string): boolean {
  return isValidEmail(value) || isValidSaudiMobile(value);
}

export function isValidMessage(value: string): boolean {
  return value.trim().length >= MESSAGE_MIN_LENGTH;
}
