/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    esmExternals: 'loose',
  },
  transpilePackages: [
    "@supabase/supabase-js",
    "@supabase/auth-js",
    "@supabase/postgrest-js",
    "@supabase/storage-js",
    "@supabase/realtime-js",
    "@supabase/functions-js",
  ],
  webpack: (config, { dev, isServer }) => {
    // Handle ESM modules
    config.resolve.extensionAlias = {
      ".js": [".tsx", ".ts", ".jsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };

    // Optimize for static builds
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            enforce: true,
          },
        },
      };
    }

    return config;
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
