import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React Strict Mode to prevent double-mounting in development
  reactStrictMode: false,

  // You can add any other config options here as needed
  // e.g. output: "standalone", etc.
};

export default nextConfig;
