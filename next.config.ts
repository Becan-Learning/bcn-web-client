import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const backendUrl = process.env.BACKEND_URL?.trim().replace(/\/+$/, "");

if (process.env.NODE_ENV === "production" && !backendUrl) {
  throw new Error("BACKEND_URL is required in production");
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [{
      source: "/api/auth/:path*",
      destination: `${backendUrl || "http://localhost:3000"}/api/auth/:path*`,
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
