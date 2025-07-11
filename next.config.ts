import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Exclude test files from pdf-parse during build
    config.module.rules.push({
      test: /node_modules\/pdf-parse\/test\//,
      loader: 'ignore-loader'
    });
    
    return config;
  },
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
