import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const get = (filepath: string[]) => GET(new Request("http://localhost/api/fetch-bunny"), { params: Promise.resolve({ filepath }) });

beforeEach(() => {
  vi.stubEnv("BUNNY_STORAGE_PULL_ZONE_URL", "https://zone.example.com/");
  vi.stubEnv("BUNNY_STORAGE_API_KEY", "storage-key");
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("Bunny proxy", () => {
  it.each([
    ["courses", "becan-test", "ch_1", "slides.pdf"],
    ["courses", "becan-test", "ch_1", "lessons_list.json"],
    ["content", "2f0c", "v3", "slides.pdf"],
  ])("serves content paths from the backend: %j", async (...filepath) => {
    const upstream = vi.fn().mockResolvedValue(new Response("pdf", { headers: { "Content-Type": "application/pdf" } }));
    vi.stubGlobal("fetch", upstream);
    const res = await get(filepath);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(upstream).toHaveBeenCalledWith(`https://zone.example.com/${filepath.join("/")}`, expect.objectContaining({ headers: { AccessKey: "storage-key" } }));
  });

  it.each([
    [[]], [["courses", "..", "secret.json"]], [["..", "courses"]], [["courses", ".", "ch_1"]],
    [["courses", "", "ch_1"]], [["courses", "a\\b", "slides.pdf"]], [["courses", "a/b", "slides.pdf"]],
  ])("refuses traversal and malformed segments: %j", async (filepath) => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const res = await get(filepath);
    expect(res.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("answers 404 when the file is missing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("no", { status: 404 })));
    expect((await get(["courses", "x", "ch_1", "slides.pdf"])).status).toBe(404);
  });
});
