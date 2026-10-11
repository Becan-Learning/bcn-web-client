import { describe, expect, it } from "vitest";
import { validateJoinStepOne, validateJoinStepTwo } from "./join-validation";

const institutions = [
  { id: "ksu", name: { ar: "جامعة الملك سعود", en: "King Saud University" }, majors: [{ id: "ksu-cs", name: { ar: "علوم الحاسب", en: "Computer Science" } }] },
  { id: "kau", name: { ar: "جامعة الملك عبدالعزيز", en: "King Abdulaziz University" }, majors: [{ id: "kau-cs", name: { ar: "علوم الحاسب", en: "Computer Science" } }] },
];

describe("Account sign-up steps", () => {
  it("requires a name before the student can continue", () => {
    expect(validateJoinStepOne({ name: "  ", email: "student@example.com", password: "password" }))
      .toEqual({ field: "name", key: "nameRequired" });
  });
  it.each(["", "student", "student@", "student @example.com"])("requires a valid email: %s", (email) => {
    expect(validateJoinStepOne({ name: "طالب", email, password: "password" }))
      .toEqual({ field: "email", key: "invalidEmail" });
  });
  it.each([["1234567", "passwordTooShort"], ["x".repeat(129), "passwordTooLong"]])(
    "rejects a password outside the backend length limits", (password, key) => {
      expect(validateJoinStepOne({ name: "طالب", email: "student@example.com", password }))
        .toEqual({ field: "password", key });
    },
  );
  it.each(["12345678", "x".repeat(128)])("accepts a complete first step", (password) => {
    expect(validateJoinStepOne({ name: " طالب ", email: " student@example.com ", password })).toBeNull();
  });
  it("requires a Saudi mobile before submitting an Account", () => {
    expect(validateJoinStepTwo({ phoneNumber: "0412345678", institutionId: "ksu", majorId: "cs" }, []))
      .toEqual({ field: "phoneNumber", key: "invalidPhoneNumber" });
  });
  it("rejects a university that is not in the backend catalog", () => {
    expect(validateJoinStepTwo({ phoneNumber: "0512345678", institutionId: "unknown", majorId: "cs" }, []))
      .toEqual({ field: "institutionId", key: "invalidInstitution" });
  });
  it.each(["", "unknown", "kau-cs"])("requires a major belonging to the chosen university: %s", (majorId) => {
    expect(validateJoinStepTwo({ phoneNumber: "0512345678", institutionId: "ksu", majorId }, institutions))
      .toEqual({ field: "majorId", key: "invalidMajor" });
  });
  it("accepts the student's Saudi mobile and matching study choices", () => {
    expect(validateJoinStepTwo({ phoneNumber: "05 1234-5678", institutionId: "ksu", majorId: "ksu-cs" }, institutions)).toBeNull();
  });
});
