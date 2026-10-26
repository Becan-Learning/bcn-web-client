import { describe, expect, it } from "vitest";
import { getRedirectUrl, unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import nextConfig from "./next.config";

/* صفحات الأسعار والدفع التجريبي والفواتير والاسترجاع حيّة، فلا تحويل
   من الإعدادات يسبق الوسيط. */
describe("payment routes", () => {
  it.each(["", "/en"].flatMap((prefix) => [
    "/plans",
    "/checkout?plan=lite",
    "/checkout/result?s=success&plan=lite",
    "/settings/invoices",
    "/settings/invoices/inv-1",
    "/refunds",
    "/settings/subscription",
    "/terms",
  ].map((path) => prefix + path)))("leaves %s reachable without a config redirect", async (path) => {
    const response = await unstable_getResponseFromNextConfig({
      url: `https://becan.test${path}`,
      nextConfig,
    });

    expect(getRedirectUrl(response)).toBeNull();
  });
});
