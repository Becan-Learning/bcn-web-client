import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
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
