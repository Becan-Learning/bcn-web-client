import { afterEach, expect, it, vi } from "vitest";
import { sendContact, type ContactPayload } from "./contact-client";

const payload: ContactPayload = {
  topic: "other",
  contact: "student@example.com",
  message: "A message of enough length.",
  locale: "en",
  website: "",
  startedAt: 1,
};

afterEach(() => vi.unstubAllGlobals());

function stub(impl: () => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

it("posts the payload as JSON to the web route, not to Google", async () => {
  const fetchMock = stub(async () => Response.json({ ok: true }));
  expect(await sendContact(payload)).toBe("sent");
  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe("/api/forms/contact");
  expect(JSON.parse(init.body as string)).toEqual(payload);
});

it("maps 429 to rate-limited and other failures to failed", async () => {
  stub(async () => new Response("", { status: 429 }));
  expect(await sendContact(payload)).toBe("rate-limited");
  stub(async () => new Response("", { status: 502 }));
  expect(await sendContact(payload)).toBe("failed");
  stub(async () => { throw new TypeError("offline"); });
  expect(await sendContact(payload)).toBe("failed");
});
