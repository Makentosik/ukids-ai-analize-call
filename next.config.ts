import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  webpack: (config, { isServer }) => {
    // Исправляем проблемы с MetaMask и другими браузерными расширениями
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Настройки для разработки
  reactStrictMode: true,
  
  // ESLint настройки для production
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  
  // TypeScript настройки для production
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  
  // Оптимизации размера
  output: 'standalone',
  
  // Оптимизация изображений
  images: {
    unoptimized: false, // Включить оптимизацию изображений
    formats: ['image/webp', 'image/avif'],
  },
  
  // Экспериментальные оптимизации
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

export default nextConfig;
