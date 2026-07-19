import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://shop-app-653d.onrender.com/api/:path*'
      }
    ]
  }
};

export default nextConfig;
