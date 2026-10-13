/* قواعد نموذج التواصل — يشترك فيها العميل والمسار فلا تتباعد. */

export const CONTACT_TOPICS = ["course", "session", "account", "other"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const MESSAGE_MIN_LENGTH = 10;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAUDI_MOBILE = /^0\d{9}$/;

/** بريد أو جوال سعودي بصيغة 05xxxxxxxx (تُزال المسافات والشرطات). */
export function isValidContact(value: string): boolean {
  const v = value.trim();
  return EMAIL.test(v) || SAUDI_MOBILE.test(v.replace(/[\s-]/g, ""));
}

export function isValidMessage(value: string): boolean {
  return value.trim().length >= MESSAGE_MIN_LENGTH;
}
