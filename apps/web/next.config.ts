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
    root: resolve(appRoot, "../.."),
  },
  async headers() {
    return [
      {
        source: '/.well-known/stellar.toml',
        headers: [
          { key: 'Content-Type', value: 'text/plain' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const baseUrl = apiUrl.replace(/\/$/, '');
    return [
      {
        source: '/api/v1/wallet/challenge',
        destination: `${baseUrl}/api/v1/auth/wallet/challenge`,
      },
      {
        source: '/api/v1/:path*',
        destination: `${baseUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
