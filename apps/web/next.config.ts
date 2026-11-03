import type { NextConfig } from "next";

// Static export: the prototype has no server (ADR 0001 D1). Host the `out/` folder anywhere.
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ["@finvora/domain", "@finvora/engine", "@finvora/sample-data"],
};
export default config;
