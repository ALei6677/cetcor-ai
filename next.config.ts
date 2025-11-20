import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 配置选项 */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.bytepluses.com',
      },
      {
        protocol: 'https',
        hostname: '**.volces.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.tos-ap-southeast-1.bytepluses.com',
      },
    ],
  },
};

export default nextConfig;
