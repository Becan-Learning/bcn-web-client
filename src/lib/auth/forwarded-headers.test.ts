import { expect, it } from "vitest";
import { studentHeaders } from "./forwarded-headers";

it("forwards cookies and the complete forwarded IP chain, without unrelated headers", () => {
  const incoming = new Headers({
    cookie: "session=student-session", "x-forwarded-for": "192.0.2.10, 192.0.2.20",
    authorization: "secret", host: "web.example.com", "x-extra": "private",
  });
  expect(Object.fromEntries(studentHeaders(incoming))).toEqual({
    cookie: "session=student-session", "x-forwarded-for": "192.0.2.10, 192.0.2.20",
  });
  expect(incoming.get("authorization")).toBe("secret");
});

it("omits missing and empty headers instead of fabricating an identity or IP", () => {
  expect(Object.fromEntries(studentHeaders(new Headers()))).toEqual({});
  expect(Object.fromEntries(studentHeaders(new Headers({ cookie: "", "x-forwarded-for": "" })))).toEqual({});
});
