import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide Next.js "N" dev indicator (not shown in production builds anyway)
  devIndicators: false,
  // Allow phone/other devices on LAN to use Next dev (HMR, etc.)
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.0.107",
  ],
  // Raise body size limit for large audio (100MB) and multi-doc batch uploads
  experimental: {
    serverActions: {
      bodySizeLimit: "110mb",
    },
  },
};

export default nextConfig;
