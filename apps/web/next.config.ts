import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@founderos/agents",
    "@founderos/core",
    "@founderos/observability"
  ]
};

export default nextConfig;
