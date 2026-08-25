import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel bundles serverless functions itself and doesn't need this — it's
  // only for `docker build` / self-hosting (see Dockerfile). Forcing it on
  // Vercel adds an extra file-tracing/copy step that has been known to fail
  // the build with no useful error in the log.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
