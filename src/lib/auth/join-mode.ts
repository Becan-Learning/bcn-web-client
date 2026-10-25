import type { Institution } from "./catalog";
import type { AuthErrorKey } from "./errors";
import { validateJoinStepOne, validateJoinStepTwo } from "./join-validation";

export type JoinField =
  | "name"
  | "email"
  | "password"
  | "phoneNumber"
  | "institutionId"
  | "majorId";
export type JoinIssue = {
  field: JoinField | "form";
  key: AuthErrorKey | "nameRequired";
};
export type JoinState = { method: "email" | "google"; step: 1 | 2 };

/* وضع Google يتخطّى الاسم والبريد وكلمة المرور (يأتي بها Google)، فيبدأ من الخطوة 2. */
export const joinStart = (google: boolean): JoinState =>
  google ? { method: "google", step: 2 } : { method: "email", step: 1 };

type JoinValues = {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  institutionId: string;
  majorId: string;
};

export type JoinSubmitPlan =
  | { kind: "issue"; step: 1 | 2; issue: JoinIssue }
  | { kind: "advance" }
  | { kind: "email" }
  | { kind: "google" };

export function planJoinSubmit(
  state: JoinState,
  values: JoinValues,
  institutions: Institution[],
): JoinSubmitPlan {
  if (state.method === "email") {
    const first = validateJoinStepOne(values);
    if (first) return { kind: "issue", step: 1, issue: first };
    if (state.step === 1) return { kind: "advance" };
  }
  const second = validateJoinStepTwo(values, institutions);
  if (second) return { kind: "issue", step: 2, issue: second };
  return { kind: state.method };
}

/* أين يُعرض خطأ عاد من الخادم أو من Google؟ بالبريد: خطأ البريد وكلمة المرور على الخطوة 1.
   بوضع Google لا حقل لهما، فيصبحان خطأ نموذج على الخطوة 2. */
export function joinIssueTarget(
  key: AuthErrorKey,
  method: JoinState["method"],
): { field: JoinIssue["field"]; step: 1 | 2 } {
  const field: JoinIssue["field"] =
    key === "emailTaken" || key === "invalidEmail" ? "email"
    : key === "passwordTooShort" || key === "passwordTooLong" || key === "invalidPassword" ? "password"
    : key === "invalidPhoneNumber" || key === "phoneNumberTaken" ? "phoneNumber"
    : key === "invalidInstitution" ? "institutionId"
    : key === "invalidMajor" ? "majorId"
    : "form";
  if (method === "google") {
    return { field: field === "email" || field === "password" ? "form" : field, step: 2 };
  }
  return { field, step: field === "email" || field === "password" ? 1 : 2 };
}
