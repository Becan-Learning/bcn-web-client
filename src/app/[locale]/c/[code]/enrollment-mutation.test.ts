import { afterEach, describe, expect, it, vi } from "vitest";
import { mutateEnrollment } from "./enrollment-mutation";

const enrollment = {
  enrolledAt: "2026-10-01T00:00:00Z",
  course: {
    id: "33333333-3333-4333-8333-333333333333", slug: "acct-101", code: "ACCT 101", name: { ar: "المحاسبة", en: "Accounting" },
    institution: { id: "university", name: { ar: "الجامعة", en: "University" } },
    icon: "book", tone: "purple", chapterCount: 3, publishedChapterCount: 2, status: "published",
  },
};
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function mockResponse(response: Response) {
  const request = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", request);
  vi.spyOn(console, "error").mockImplementation(() => {});
  return request;
}

describe("Enrollment mutations", () => {
  it("refreshes after a full-slot race without triggering the generic error path", async () => {
    const request = mockResponse(Response.json({ error: { message: "Slots full", code: "ENROLLMENT_LIMIT_REACHED" } }, { status: 409 }));
    const refresh = vi.fn();
    await expect(mutateEnrollment("33333333-3333-4333-8333-333333333333", "PUT", refresh)).resolves.toBeUndefined();
    expect(refresh).toHaveBeenCalledOnce();
    expect(console.error).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledWith("/api/v1/me/enrollments/33333333-3333-4333-8333-333333333333", { method: "PUT", cache: "no-store" });
  });
  it.each([200, 201])("accepts an enrolled course with status %i and refreshes", async (status) => {
    mockResponse(Response.json(enrollment, { status }));
    const refresh = vi.fn();
    await mutateEnrollment("33333333-3333-4333-8333-333333333333", "PUT", refresh);
    expect(refresh).toHaveBeenCalledOnce();
  });
  it("refreshes after un-enrolling so subsequent pages can read the freed slot", async () => {
    mockResponse(new Response(null, { status: 204 }));
    const refresh = vi.fn();
    await mutateEnrollment("33333333-3333-4333-8333-333333333333", "DELETE", refresh);
    expect(refresh).toHaveBeenCalledOnce();
  });
  it.each([
    ["PUT", 409, { error: { message: "Conflict", code: "OTHER_CONFLICT" } }],
    ["PUT", 403, { error: { message: "Forbidden", code: "ENROLLMENT_LIMIT_REACHED" } }],
    ["DELETE", 409, { error: { message: "Conflict", code: "ENROLLMENT_LIMIT_REACHED" } }],
    ["PUT", 409, { error: { code: "ENROLLMENT_LIMIT_REACHED" } }],
    ["PUT", 409, { error: { message: "Conflict" } }],
    ["PUT", 200, { ...enrollment, course: { ...enrollment.course, id: "another-course" } }],
    ["PUT", 200, {}],
    ["DELETE", 200, {}],
    ["PUT", 202, enrollment],
  ] as const)("rejects %s %i outside the exact race contract (%j)", async (method, status, body) => {
    mockResponse(Response.json(body, { status }));
    const refresh = vi.fn();
    await expect(mutateEnrollment("33333333-3333-4333-8333-333333333333", method, refresh)).rejects.toThrow();
    expect(refresh).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON", async () => {
    mockResponse(new Response("not JSON", { status: 409 }));
    const refresh = vi.fn();
    await expect(mutateEnrollment("33333333-3333-4333-8333-333333333333", "PUT", refresh)).rejects.toThrow();
    expect(refresh).not.toHaveBeenCalled();
  });
  it("preserves the network error path", async () => {
    const request = mockResponse(Response.json(enrollment));
    request.mockRejectedValue(new Error("Offline"));
    const refresh = vi.fn();
    await expect(mutateEnrollment("33333333-3333-4333-8333-333333333333", "PUT", refresh)).rejects.toThrow("Offline");
    expect(refresh).not.toHaveBeenCalled();
  });
});
