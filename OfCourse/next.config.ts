import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Avatar uploads go through a Server Action; images are capped at 2 MB.
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
