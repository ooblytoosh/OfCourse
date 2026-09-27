import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Avatar uploads go through a Server Action. Photos are resized in the
      // browser first, so uploads stay under the 2 MB storage limit.
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
