import { z } from "zod";
import { toE164Saudi } from "./phone";
import type { Institution } from "./catalog";

export function validateJoinStepOne(values: { name: string; email: string; password: string }) {
  if (!values.name.trim()) return { field: "name", key: "nameRequired" } as const;
  if (!z.string().email().safeParse(values.email.trim()).success) return { field: "email", key: "invalidEmail" } as const;
  if (values.password.length < 8) return { field: "password", key: "passwordTooShort" } as const;
  if (values.password.length > 128) return { field: "password", key: "passwordTooLong" } as const;
  return null;
}

export function validateJoinStepTwo(
  values: { phoneNumber: string; institutionId: string; majorId: string },
  institutions: Institution[],
) {
  if (!toE164Saudi(values.phoneNumber)) return { field: "phoneNumber", key: "invalidPhoneNumber" } as const;
  const institution = institutions.find((item) => item.id === values.institutionId);
  if (!institution) return { field: "institutionId", key: "invalidInstitution" } as const;
  if (!institution.majors.some((major) => major.id === values.majorId)) return { field: "majorId", key: "invalidMajor" } as const;
  return null;
}
