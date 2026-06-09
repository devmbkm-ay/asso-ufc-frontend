import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  rewrites: async () => [
    { source: '/api/:path*', destination: 'https://api.assos.ricardomboukou.online/api/:path*' }
  ],
  allowedDevOrigins: ['192.168.1.155', 'localhost']
};

export default nextConfig;
