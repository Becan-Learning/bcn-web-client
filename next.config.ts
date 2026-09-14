import type { NextConfig } from "next";

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

export default nextConfig;
