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
  return !usedUp(allowance) && remaining !== null && remaining < 15;
}
