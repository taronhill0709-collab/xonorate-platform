import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions default to a 1MB request body, well under the case
    // photo upload's 5MB limit (case-photo-storage.ts) or the attorney
    // case-overview PDF's 15MB limit (case-overview-extraction.ts) — either
    // upload would get silently rejected before our code ever ran. 16mb
    // leaves room for multipart boundary overhead.
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
