import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("server-only", () => ({}));

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfhXJdbMIef3r6LzlzSXe9ZuE__nLCA4_5fA-Amk6zVHv5_3Q/formResponse";

let ipCounter = 0;
const freshIp = () => `192.0.2.${++ipCounter}`;

function valid(overrides: Record<string, unknown> = {}) {
  return {
    topic: "course",
    contact: "student@example.com",
    message: "The chapter on limits is missing.",
    locale: "ar",
    website: "",
    startedAt: Date.now() - 10_000,
    ...overrides,
  };
}

function post(body: unknown, ip = freshIp()) {
  return POST(
    new Request("http://localhost/api/forms/contact", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `${ip}, 10.0.0.1` },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("field mapping", () => {
  it("posts the Arabic interface as 'Arabic' to the form endpoint", async () => {
    const res = await post(valid({ topic: "session", locale: "ar" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(FORM_URL);
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const fields = Object.fromEntries(new URLSearchParams(init.body.toString()));
    expect(fields).toEqual({
      "entry.941142573": "session",
      "entry.2035918014": "student@example.com",
      "entry.1876293115": "The chapter on limits is missing.",
      "entry.1748937113": "Arabic",
    });
  });

  it("posts the English interface as 'English'", async () => {
    await post(valid({ locale: "en" }));
    const fields = new URLSearchParams(fetchMock.mock.calls[0][1].body.toString());
    expect(fields.get("entry.1748937113")).toBe("English");
  });

  it.each(["course", "session", "account", "other"])("passes the topic id %s through", async (topic) => {
    await post(valid({ topic }));
    const fields = new URLSearchParams(fetchMock.mock.calls[0][1].body.toString());
    expect(fields.get("entry.941142573")).toBe(topic);
  });

  it("trims contact and message and accepts a spaced Saudi mobile as typed", async () => {
    await post(valid({ contact: "  0555 123-456  ", message: "  needs a longer text  " }));
    const fields = new URLSearchParams(fetchMock.mock.calls[0][1].body.toString());
    expect(fields.get("entry.2035918014")).toBe("0555 123-456");
    expect(fields.get("entry.1876293115")).toBe("needs a longer text");
  });
});

describe("spam guards", () => {
  it("answers a filled honeypot like success without calling Google", async () => {
    const res = await post(valid({ website: "https://spam.example" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers a form filled in under 3 seconds like success without calling Google", async () => {
    const res = await post(valid({ startedAt: Date.now() - 1_000 }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats a missing or future startedAt as a bot", async () => {
    expect((await post(valid({ startedAt: undefined }))).status).toBe(200);
    expect((await post(valid({ startedAt: Date.now() + 60_000 }))).status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rate limits the 6th submission from one IP", async () => {
    const ip = freshIp();
    for (let i = 0; i < 5; i++) expect((await post(valid(), ip)).status).toBe(200);
    expect((await post(valid(), ip)).status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect((await post(valid(), freshIp())).status).toBe(200);
  });
});

describe("failures", () => {
  it("answers 502 when Google rejects the submission", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 400 }));
    const res = await post(valid());
    expect(res.status).toBe(502);
  });

  it("answers 502 on timeout and never logs the message body", async () => {
    fetchMock.mockRejectedValue(new DOMException("timed out", "TimeoutError"));
    const res = await post(valid({ message: "private words nobody should log" }));
    expect(res.status).toBe(502);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("private words");
  });
});

describe("invalid input", () => {
  it.each([
    ["unknown topic", { topic: "billing" }],
    ["empty contact", { contact: "  " }],
    ["bad contact", { contact: "12345" }],
    ["short message", { message: "too short" }],
    ["unknown locale", { locale: "fr" }],
  ])("answers 400 for %s", async (_name, overrides) => {
    expect((await post(valid(overrides))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 400 for a body that is not a JSON object", async () => {
    expect((await post("not json")).status).toBe(400);
    expect((await post("[]")).status).toBe(400);
  });
});
