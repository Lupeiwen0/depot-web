import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.baidu.com",
      },
    ],
  },
};

export default nextConfig;
