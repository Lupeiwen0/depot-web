import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.baidu.com",
      },
      {
        protocol: "https",
        hostname: "*.vercel.app",
      },
    ],
  },
};

export default nextConfig;
