import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const backendUrl = process.env.BACKEND_URL?.trim().replace(/\/+$/, "");

if (process.env.NODE_ENV === "production" && !backendUrl) {
  throw new Error("BACKEND_URL is required in production");
}

const nextConfig: NextConfig = {
  async redirects() {
    /* مسودّات الدفع محجوبة بتحويل مؤقّت يسبق الوسيط، مع إبقاء بادئة الإنجليزية. */
    const parkedRoutes = [
      ["/plans", "/settings/subscription"],
      ["/checkout", "/settings/subscription"],
      ["/checkout/result", "/settings/subscription"],
      ["/settings/invoices", "/settings/subscription"],
      ["/settings/invoices/:id", "/settings/subscription"],
      ["/refunds", "/terms"],
    ];

    return ["", "/en"].flatMap((prefix) =>
      parkedRoutes.map(([source, destination]) => ({
        source: `${prefix}${source}`,
        destination: `${prefix}${destination}`,
        permanent: false,
      })),
    );
  },
  async rewrites() {
    return [{
      source: "/api/auth/:path*",
      destination: `${backendUrl || "http://localhost:3000"}/api/auth/:path*`,
    }, {
      source: "/api/v1/:path*",
      destination: `${backendUrl || "http://localhost:3000"}/api/v1/:path*`,
    }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "snd-zone.b-cdn.net", // Allows all Supabase storage domains
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
