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
  async redirects() {
    return [
      // /posts was retired in favor of /exonerated, which showcases
      // exonerated cases directly instead of AI-drafted news posts. Old
      // post slugs have no equivalent case slug, so every old post link
      // falls back to the new listing page rather than 404ing.
      { source: "/posts", destination: "/exonerated", permanent: true },
      { source: "/posts/:slug*", destination: "/exonerated", permanent: true },
    ];
  },
};

export default nextConfig;
