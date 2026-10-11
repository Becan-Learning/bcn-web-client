import { describe, expect, it } from "vitest";
import { planAccountChange } from "./account-changes";

const saved = {
  name: "عبدالله",
  phoneNumber: "+966512345678",
  institutionId: "ksu",
  majorId: "ksu-cs",
};
const institutions = [
  { id: "ksu", name: { ar: "الملك سعود", en: "King Saud" }, majors: [
    { id: "ksu-cs", name: { ar: "الحاسب", en: "Computing" } },
  ] },
  { id: "kau", name: { ar: "الملك عبدالعزيز", en: "King Abdulaziz" }, majors: [
    { id: "kau-law", name: { ar: "القانون", en: "Law" } },
  ] },
];

describe("Account auto-save", () => {
  it.each([
    { field: "name" as const, value: " عبدالله " },
    { field: "study" as const, institutionId: "ksu", majorId: "ksu-cs" },
  ])("does not save unchanged Account details: $field", (change) => {
    expect(planAccountChange(saved, change, institutions)).toEqual({ kind: "unchanged" });
  });
  it("rejects an empty Account name", () => {
    expect(planAccountChange(saved, {
      field: "name", value: "   ",
    }, institutions)).toEqual({ kind: "invalid", field: "name", error: "nameRequired" });
  });
  it("saves a trimmed Account name without other draft changes", () => {
    expect(planAccountChange(saved, {
      field: "name", value: "  نورة  ",
    }, institutions)).toEqual({ kind: "save", values: { name: "نورة" } });
  });
  it("does not save a different spelling of the same phone number", () => {
    expect(planAccountChange(saved, {
      field: "phoneNumber", value: "05 1234-5678",
    }, institutions)).toEqual({ kind: "unchanged" });
  });
  it("rejects an invalid phone without producing a save payload", () => {
    expect(planAccountChange(saved, {
      field: "phoneNumber", value: "0412345678",
    }, institutions)).toEqual({ kind: "invalid", field: "phoneNumber", error: "invalidPhoneNumber" });
  });
  it("normalizes a changed phone number before saving", () => {
    expect(planAccountChange(saved, {
      field: "phoneNumber", value: "05 8765-4321",
    }, institutions)).toEqual({ kind: "save", values: { phoneNumber: "+966587654321" } });
  });
  it("rejects a major belonging to another university", () => {
    expect(planAccountChange(saved, {
      field: "study", institutionId: "kau", majorId: "ksu-cs",
    }, institutions)).toEqual({ kind: "invalid", field: "majorId", error: "invalidMajor" });
  });
  it("saves a university and its chosen major together", () => {
    expect(planAccountChange(saved, {
      field: "study", institutionId: "kau", majorId: "kau-law",
    }, institutions)).toEqual({ kind: "save", values: {
      institutionId: "kau", majorId: "kau-law",
    } });
  });
  it("waits for a major before saving a changed university", () => {
    expect(planAccountChange(saved, {
      field: "study", institutionId: "kau", majorId: "",
    }, institutions)).toEqual({ kind: "incomplete" });
  });
});
