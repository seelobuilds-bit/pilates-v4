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
  // Prevent trailing slash redirects that break webhooks
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
