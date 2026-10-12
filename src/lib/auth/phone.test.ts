import { describe, expect, it } from "vitest";
import { toE164Saudi, toLocalSaudi } from "./phone";

describe("Saudi mobile numbers", () => {
  it("sends a local number as E.164", () => {
    expect(toE164Saudi("0512345678")).toBe("+966512345678");
  });
  it.each(["512345678", "+966512345678", "00966512345678", " 05 1234-5678 ", "+966 51-234-5678"])(
    "accepts the agreed number format: %s",
    (input) => expect(toE164Saudi(input)).toBe("+966512345678"),
  );
  it.each(["", "123", "0412345678", "051234567", "05123456789", "+971512345678", "+9660512345678", "966512345678", "٠٥١٢٣٤٥٦٧٨", "05abc45678"])(
    "rejects a non-Saudi-mobile number: %s",
    (input) => expect(toE164Saudi(input)).toBeNull(),
  );
  it("shows a stored E.164 number in local format", () => {
    expect(toLocalSaudi("+966512345678")).toBe("0512345678");
  });
});
