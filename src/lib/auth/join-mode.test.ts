import { describe, expect, it } from "vitest";
import { joinIssueTarget, joinStart, planJoinSubmit } from "./join-mode";

const institutions = [
  {
    id: "ksu",
    name: { ar: "جامعة الملك سعود", en: "King Saud University" },
    majors: [{ id: "ksu-cs", name: { ar: "علوم الحاسب", en: "Computer Science" } }],
  },
];
const empty = { name: "", email: "", password: "", phoneNumber: "", institutionId: "", majorId: "" };
const studyDetails = { phoneNumber: "0501234567", institutionId: "ksu", majorId: "ksu-cs" };

describe("join start state", () => {
  it("starts on step 1 with email, or on step 2 in Google mode", () => {
    expect(joinStart(false)).toEqual({ method: "email", step: 1 });
    expect(joinStart(true)).toEqual({ method: "google", step: 2 });
  });
});

describe("join submit plan in Google mode", () => {
  const state = joinStart(true);

  it("skips name, email and password entirely", () => {
    expect(planJoinSubmit(state, { ...empty, ...studyDetails }, institutions)).toEqual({ kind: "google" });
  });

  it("applies the same step-two validation as email sign-up", () => {
    expect(planJoinSubmit(state, { ...empty, ...studyDetails, phoneNumber: "12" }, institutions)).toEqual({
      kind: "issue", step: 2, issue: { field: "phoneNumber", key: "invalidPhoneNumber" },
    });
    expect(planJoinSubmit(state, { ...empty, ...studyDetails, institutionId: "" }, institutions)).toMatchObject({
      kind: "issue", issue: { field: "institutionId" },
    });
    expect(planJoinSubmit(state, { ...empty, ...studyDetails, majorId: "other" }, institutions)).toMatchObject({
      kind: "issue", issue: { field: "majorId", key: "invalidMajor" },
    });
  });
});

describe("join submit plan with email", () => {
  const email = { name: "Sara", email: "sara@example.com", password: "password1" };

  it("validates step one, then advances, then submits by email", () => {
    expect(planJoinSubmit(joinStart(false), empty, institutions)).toMatchObject({
      kind: "issue", step: 1, issue: { field: "name" },
    });
    expect(planJoinSubmit(joinStart(false), { ...empty, ...email }, institutions)).toEqual({ kind: "advance" });
    expect(planJoinSubmit({ method: "email", step: 2 }, { ...empty, ...email, ...studyDetails }, institutions))
      .toEqual({ kind: "email" });
  });

  it("sends the student back to step one when its fields went bad", () => {
    expect(planJoinSubmit({ method: "email", step: 2 }, { ...empty, ...studyDetails }, institutions))
      .toMatchObject({ kind: "issue", step: 1 });
  });
});

describe("where a returned error lands", () => {
  it("puts a taken phone number next to the phone field on step 2 in Google mode", () => {
    expect(joinIssueTarget("phoneNumberTaken", "google")).toEqual({ field: "phoneNumber", step: 2 });
    expect(joinIssueTarget("invalidInstitution", "google")).toEqual({ field: "institutionId", step: 2 });
    expect(joinIssueTarget("invalidMajor", "google")).toEqual({ field: "majorId", step: 2 });
  });

  it("shows form-level messages for Google failures, bans and Admin accounts", () => {
    for (const key of ["googleFailed", "googleCancelled", "accountBanned", "adminGoogleForbidden", "generic"] as const) {
      expect(joinIssueTarget(key, "google")).toEqual({ field: "form", step: 2 });
    }
  });

  it("never points Google mode at the hidden email and password fields", () => {
    expect(joinIssueTarget("emailTaken", "google")).toEqual({ field: "form", step: 2 });
    expect(joinIssueTarget("passwordTooShort", "google")).toEqual({ field: "form", step: 2 });
  });

  it("keeps email sign-up routing unchanged", () => {
    expect(joinIssueTarget("emailTaken", "email")).toEqual({ field: "email", step: 1 });
    expect(joinIssueTarget("passwordTooLong", "email")).toEqual({ field: "password", step: 1 });
    expect(joinIssueTarget("phoneNumberTaken", "email")).toEqual({ field: "phoneNumber", step: 2 });
    expect(joinIssueTarget("generic", "email")).toEqual({ field: "form", step: 2 });
  });
});
