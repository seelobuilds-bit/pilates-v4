import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // TODO: Fix all type errors and remove this
    ignoreBuildErrors: true,
  },
  eslint: {
    // TODO: Fix all lint errors and remove this
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
