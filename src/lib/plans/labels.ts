import type { PlanView } from "./view";

/* العبارات الظاهرة للباقة — تُبنى من أرقام `PlanView` بنصوص `PlanFacts` في
   `messages/`. الأرقام تُمرَّر نصًّا (`…Label`) كي تبقى لاتينية (0–9) في اللغتين. */

type FactKey =
  | "minutes"
  | "minutesUnlimited"
  | "hours"
  | "courses"
  | "coursesAll"
  | "sessions"
  | "sessionsUnlimited";

export type FactsTranslator = (key: FactKey, values?: Record<string, string | number>) => string;

export function minutesLabel(t: FactsTranslator, plan: PlanView): string {
  return plan.minutes === null ? t("minutesUnlimited") : t("minutes", { count: plan.minutes, countLabel: String(plan.minutes) });
}

/** ≈ 4 ساعات مذاكرة موجّهة — null حين لا ترجمة تفيد */
export function hoursLabel(t: FactsTranslator, plan: PlanView): string | null {
  return plan.hours === null ? null : t("hours", { count: plan.hours, countLabel: String(plan.hours) });
}

export function coursesLabel(t: FactsTranslator, plan: PlanView): string {
  return plan.courses === null ? t("coursesAll") : t("courses", { count: plan.courses, countLabel: String(plan.courses) });
}

export function sessionsLabel(t: FactsTranslator, plan: PlanView): string {
  return plan.sessions === null ? t("sessionsUnlimited") : t("sessions", { count: plan.sessions, countLabel: String(plan.sessions) });
}
