import type { NextConfig } from "next";
import pkg from "./package.json" with { type: "json" };

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    APP_VERSION: pkg.version,
  },
};

export default nextConfig;
