import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // API Routes를 사용하므로 export 모드 비활성화
  // trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
