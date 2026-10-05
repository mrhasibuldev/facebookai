import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', '192.168.0.114'],
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
};

export default nextConfig;
