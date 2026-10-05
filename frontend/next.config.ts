import type { NextConfig } from "next";

const API = process.env.LEARNSQL_API_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API}/api/:path*` },
      { source: "/metrics", destination: `${API}/metrics` },
    ];
  },
};

export default nextConfig;
