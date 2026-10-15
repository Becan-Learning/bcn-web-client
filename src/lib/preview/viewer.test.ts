import { beforeEach, expect, it, vi } from "vitest";
import { viewerReadsPreview } from "./viewer";

vi.mock("server-only", () => ({}));
const backend = vi.hoisted(() => ({ account: vi.fn(), allowance: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getAccount: backend.account }));
vi.mock("@/lib/allowance/server", () => ({ getAllowance: backend.allowance }));

beforeEach(() => {
  vi.clearAllMocks();
  backend.account.mockResolvedValue({ user: { id: "u" } });
});

it("is false for a guest, without reading the allowance", async () => {
  backend.account.mockResolvedValue(null);
  expect(await viewerReadsPreview()).toBe(false);
  expect(backend.allowance).not.toHaveBeenCalled();
});
it("is true only for an unlimited account", async () => {
  backend.allowance.mockResolvedValue({ ok: true, data: { unlimited: true } });
  expect(await viewerReadsPreview()).toBe(true);
  backend.allowance.mockResolvedValue({ ok: true, data: { unlimited: false } });
  expect(await viewerReadsPreview()).toBe(false);
});
it("is false after an allowance failure", async () => {
  backend.allowance.mockResolvedValue({ ok: false, kind: "network" });
  expect(await viewerReadsPreview()).toBe(false);
});
