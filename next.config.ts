import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Prevent trailing slash redirects that break webhooks
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
