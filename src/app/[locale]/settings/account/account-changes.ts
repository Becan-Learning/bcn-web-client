import type { Institution } from "@/lib/auth/catalog";
import type { Account } from "@/lib/auth/types";
import { toE164Saudi } from "@/lib/auth/phone";

export type SavedAccount = Pick<Account, "name" | "phoneNumber" | "institutionId" | "majorId">;
export type AccountChange =
  | { field: "name"; value: string }
  | { field: "phoneNumber"; value: string }
  | { field: "study"; institutionId: string; majorId: string };

export function planAccountChange(
  saved: SavedAccount,
  change: AccountChange,
  institutions: Institution[],
) {
  if (change.field === "name") {
    const name = change.value.trim();
    if (!name) return { kind: "invalid", field: "name", error: "nameRequired" } as const;
    if (name === saved.name) return { kind: "unchanged" } as const;
    return { kind: "save", values: { name } } as const;
  }
  if (change.field === "phoneNumber") {
    const phoneNumber = toE164Saudi(change.value);
    if (!phoneNumber) return { kind: "invalid", field: "phoneNumber", error: "invalidPhoneNumber" } as const;
    if (phoneNumber === saved.phoneNumber) return { kind: "unchanged" } as const;
    return { kind: "save", values: { phoneNumber } } as const;
  }
  if (change.field === "study" && change.majorId) {
    const institution = institutions.find((i) => i.id === change.institutionId);
    if (!institution?.majors.some((m) => m.id === change.majorId)) {
      return { kind: "invalid", field: "majorId", error: "invalidMajor" } as const;
    }
    if (change.institutionId === saved.institutionId && change.majorId === saved.majorId) {
      return { kind: "unchanged" } as const;
    }
    return { kind: "save", values: {
      institutionId: change.institutionId, majorId: change.majorId,
    } } as const;
  }
  return { kind: "incomplete" } as const;
}
