import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  turbopack: {
    // Monorepo root so Turbopack resolves workspace packages correctly.
    root: resolve(appRoot, "../.."),
  },
  transpilePackages: ["@cryptopay/sdk", "@cryptopay/types"],
};

export default nextConfig;
