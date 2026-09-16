import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/clients", destination: "/receivables/clients", permanent: true },
      { source: "/clients/:path*", destination: "/receivables/clients/:path*", permanent: true },
      { source: "/reports/outstanding", destination: "/receivables/reports/outstanding", permanent: true },
    ];
  },
};

export default nextConfig;
