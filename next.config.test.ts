import { describe, expect, it } from "vitest";
import { getRedirectUrl, unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import nextConfig from "./next.config";

describe("parked payment routes", () => {
  const routes = [
    ["/plans", "/settings/subscription"],
    ["/checkout", "/settings/subscription"],
    ["/checkout/result", "/settings/subscription"],
    ["/settings/invoices", "/settings/subscription"],
    ["/settings/invoices/inv-1", "/settings/subscription"],
    ["/refunds", "/terms"],
  ];

  it.each(["", "/en"].flatMap((prefix) =>
    routes.map(([source, destination]) => [prefix + source, prefix + destination]),
  ))("temporarily redirects %s to %s", async (source, destination) => {
    const response = await unstable_getResponseFromNextConfig({
      url: `https://becan.test${source}?plan=pro&note=100%25`,
      nextConfig,
    });

    expect(response.status).toBe(307);
    expect(getRedirectUrl(response)).toBe(`https://becan.test${destination}?plan=pro&note=100%25`);
  });

  it.each(["/settings/subscription", "/en/settings/subscription", "/terms", "/en/terms", "/checkout-info"])(
    "leaves %s reachable without a config redirect", async (path) => {
      const response = await unstable_getResponseFromNextConfig({
        url: `https://becan.test${path}`,
        nextConfig,
      });

      expect(getRedirectUrl(response)).toBeNull();
    },
  );
});
