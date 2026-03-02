import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is now default for dev in Next.js 16
  // Webpack config kept for build compatibility and WASM support
  webpack(config) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
};

export default nextConfig;
