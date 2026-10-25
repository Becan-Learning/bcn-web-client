import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("server-only", () => ({}));

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeMGSFAoW63TmvUilYfsX7V6jF5D8SLUOEXor-QdqVwOEBYoQ/formResponse";

let ipCounter = 0;
const freshIp = () => `198.51.100.${++ipCounter}`;

function valid(overrides: Record<string, unknown> = {}) {
  return {
    university: "inst_ksu",
    universityOther: "",
    course: "ACCT 201",
    contact: "student@example.com",
    byEmail: true,
    locale: "ar",
    website: "",
    startedAt: Date.now() - 10_000,
    ...overrides,
  };
}

function post(body: unknown, ip = freshIp()) {
  return POST(
    new Request("http://localhost/api/forms/request", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `${ip}, 10.0.0.1` },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

let fetchMock: ReturnType<typeof vi.fn>;

const sentFields = () =>
  Object.fromEntries(new URLSearchParams(fetchMock.mock.calls[0][1].body.toString()));

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
  it("posts the chosen Institution's id, the course, and the email kind to the form endpoint", async () => {
    const res = await post(valid());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(FORM_URL);
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(sentFields()).toEqual({
      "entry.132584660": "inst_ksu",
      "entry.2026721195": "ACCT 201",
      "entry.739430397": "student@example.com",
      "entry.1510059797": "email",
      "entry.1256442018": "Arabic",
    });
  });

  it("posts the typed university name instead of 'other'", async () => {
    await post(valid({ university: "other", universityOther: "  Hail University  " }));
    expect(sentFields()["entry.132584660"]).toBe("Hail University");
  });

  it("ignores a stale typed name when an Institution is chosen", async () => {
    await post(valid({ universityOther: "Leftover" }));
    expect(sentFields()["entry.132584660"]).toBe("inst_ksu");
  });

  it("maps a phone contact to 'Phone' with the capital P", async () => {
    await post(valid({ byEmail: false, contact: "  0555 123-456  " }));
    const fields = sentFields();
    expect(fields["entry.1510059797"]).toBe("Phone");
    expect(fields["entry.739430397"]).toBe("0555 123-456");
  });

  it("maps the English interface to 'English'", async () => {
    await post(valid({ locale: "en" }));
    expect(sentFields()["entry.1256442018"]).toBe("English");
  });

  it("trims the course", async () => {
    await post(valid({ course: "  Accounting 2  " }));
    expect(sentFields()["entry.2026721195"]).toBe("Accounting 2");
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
    expect((await post(valid())).status).toBe(502);
  });

  it("answers 502 on timeout and never logs what the student typed", async () => {
    fetchMock.mockRejectedValue(new DOMException("timed out", "TimeoutError"));
    const res = await post(valid({ contact: "private@example.com" }));
    expect(res.status).toBe(502);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("private@");
  });
});

describe("invalid input", () => {
  it.each([
    ["missing university", { university: "  " }],
    ["'other' without a typed name", { university: "other", universityOther: "  " }],
    ["missing course", { course: "  " }],
    ["empty email", { contact: "  " }],
    ["bad email", { contact: "student@example" }],
    ["a phone while byEmail", { contact: "0555123456" }],
    ["an email while phone", { byEmail: false, contact: "student@example.com" }],
    ["a short phone", { byEmail: false, contact: "055512345" }],
    ["a phone not starting with 0", { byEmail: false, contact: "5551234567" }],
    ["non-boolean byEmail", { byEmail: "yes" }],
    ["unknown locale", { locale: "fr" }],
  ])("answers 400 for %s", async (_name, overrides) => {
    expect((await post(valid(overrides))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a phone with spaces and dashes", async () => {
    expect((await post(valid({ byEmail: false, contact: "055-512 3456" }))).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("answers 400 for a body that is not a JSON object", async () => {
    expect((await post("not json")).status).toBe(400);
    expect((await post("[]")).status).toBe(400);
  });
});
