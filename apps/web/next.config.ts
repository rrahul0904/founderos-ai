import type { NextConfig } from "next";
const nextConfig: NextConfig = { output:"standalone", transpilePackages:["@founderos/agents","@founderos/build","@founderos/core","@founderos/db","@founderos/deployments","@founderos/github","@founderos/observability"] };
export default nextConfig;
