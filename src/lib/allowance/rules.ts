import type { Enrollment } from "@/lib/courses/schema";
import type { Allowance } from "./schema";

export function minutesLeft({ limits, usage }: Allowance): number | null {
  return limits.seconds === null ? null : Math.max(0, Math.floor(limits.seconds / 60) - Math.ceil(usage.seconds / 60));
}

export function usedUp({ limits, usage }: Allowance): boolean {
  return (limits.sessions !== null && usage.sessions >= limits.sessions)
    || (limits.seconds !== null && limits.seconds - usage.seconds < (limits.minStartSeconds ?? 1));
}

export function nearlyOut(allowance: Allowance): boolean {
  const remaining = minutesLeft(allowance);
  return !usedUp(allowance) && remaining !== null && remaining > 0 && remaining < 15;
}

export function slotsFull(allowance: Allowance | null, enrollments: Enrollment[], courseId: string): boolean {
  if (!allowance || enrollments.some((enrollment) => enrollment.course.id === courseId)) return false;
  const { limits, usage } = allowance;
  return limits.enrollments !== null && usage.enrollments >= limits.enrollments;
}
