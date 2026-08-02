import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions default to a 1MB request body, well under the case
    // photo upload's own 5MB limit (case-photo-storage.ts) — almost any
    // real phone photo blew past 1MB and got silently rejected before our
    // code ever ran. 6mb leaves room for multipart boundary overhead.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
