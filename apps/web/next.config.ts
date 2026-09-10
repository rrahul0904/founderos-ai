import type { NextConfig } from "next";
const nextConfig: NextConfig = { output:"standalone", transpilePackages:["@founderos/agents","@founderos/core","@founderos/db","@founderos/observability"] };
export default nextConfig;
