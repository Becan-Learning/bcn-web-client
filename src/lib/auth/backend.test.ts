import { afterEach, expect, it, vi } from "vitest";
import { backendUrl } from "./backend";

vi.mock("server-only", () => ({}));

afterEach(() => vi.unstubAllEnvs());

it("uses the local backend when no URL is configured", () => {
  vi.stubEnv("BACKEND_URL", undefined);
  expect(backendUrl()).toBe("http://localhost:3000");
});

it.each(["", "   ", " / "])("uses the local backend for an empty normalized URL: %s", (url) => {
  vi.stubEnv("BACKEND_URL", url);
  expect(backendUrl()).toBe("http://localhost:3000");
});

it("trims whitespace and trailing slashes from the configured backend URL", () => {
  vi.stubEnv("BACKEND_URL", "  https://backend.becan.test///  ");
  expect(backendUrl()).toBe("https://backend.becan.test");
});
